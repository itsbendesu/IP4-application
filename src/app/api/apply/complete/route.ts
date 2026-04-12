import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyUpload, deleteUpload, isR2Configured } from "@/lib/r2";
import { sendEmail, applicationConfirmationEmail } from "@/lib/email";

const completeSchema = z.object({
  token: z.string().min(1),
  videoKey: z.string().min(1),
  videoUrl: z.string().min(1), // Accepts both full URLs and local paths like /uploads/x.webm
  videoDurationSec: z.number().min(1).max(120).optional().default(1),
});

export async function POST(request: NextRequest) {
  let videoKey: string | null = null;

  try {
    const body = await request.json();

    // Coerce videoDurationSec to a number with fallback
    if (body.videoDurationSec === undefined || body.videoDurationSec === null) {
      body.videoDurationSec = 1;
    } else {
      const parsed = Number(body.videoDurationSec);
      body.videoDurationSec = Number.isFinite(parsed) ? parsed : 1;
    }

    const data = completeSchema.parse(body);
    videoKey = data.videoKey;

    // Find pending application
    const pending = await prisma.pendingApplication.findUnique({
      where: { token: data.token },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Application not found or expired" },
        { status: 404 }
      );
    }

    // Check if expired
    if (pending.expiresAt < new Date()) {
      await prisma.pendingApplication.delete({ where: { id: pending.id } });
      if (videoKey && isR2Configured()) {
        await deleteUpload(videoKey).catch(() => {});
      }
      return NextResponse.json(
        { error: "Application expired. Please start a new application." },
        { status: 410 }
      );
    }

    // Verify video exists in R2 (skip for Vercel Blob URLs)
    const isBlobUrl = data.videoUrl.includes(".vercel-storage.com") || data.videoUrl.includes(".blob.vercel-storage.com");
    if (isR2Configured() && !isBlobUrl) {
      const uploadStatus = await verifyUpload(data.videoKey);
      if (!uploadStatus.exists) {
        return NextResponse.json(
          { error: "Video upload not found. Please try recording again." },
          { status: 404 }
        );
      }
    }

    // Create applicant and submission in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check for duplicate email INSIDE the transaction (prevents TOCTOU race)
      const existingApplicant = await tx.applicant.findUnique({
        where: { email: pending.email },
      });
      if (existingApplicant) {
        throw new Error("DUPLICATE_EMAIL");
      }

      // Create applicant
      const applicant = await tx.applicant.create({
        data: {
          name: pending.name,
          email: pending.email,
          phone: pending.phone,
          ticketType: pending.ticketType,
          scholarshipAmount: pending.scholarshipAmount ?? undefined,
          address: pending.address ?? undefined,
          timezone: pending.timezone,
          roleCompany: pending.roleCompany,
          heardAbout: pending.heardAbout,
          priorEvents: pending.priorEvents ?? undefined,
          threeWords: pending.threeWords,
          bio: pending.bio,
          teachSkill: pending.teachSkill ?? undefined,
          links: pending.links ?? undefined,
        },
      });

      // Create submission
      const submission = await tx.submission.create({
        data: {
          applicantId: applicant.id,
          promptId: pending.promptId,
          videoUrl: data.videoUrl,
          videoDurationSec: Math.round(data.videoDurationSec),
          status: "SUBMITTED",
        },
      });

      // Delete pending application
      await tx.pendingApplication.delete({
        where: { id: pending.id },
      });

      return { applicant, submission };
    });

    // Send to IPHQ after response is sent (keeps function alive on Vercel)
    const ipBrainUrl = process.env.IP_BRAIN_URL || "https://ipevents.co";
    after(async () => {
      try {
        const [prompt, allActivePrompts] = await Promise.all([
          prisma.prompt.findUnique({ where: { id: pending.promptId } }),
          prisma.prompt.findMany({ where: { active: true }, select: { text: true } }),
        ]);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (process.env.WEBHOOK_SECRET) headers["x-webhook-secret"] = process.env.WEBHOOK_SECRET;
        await fetch(`${ipBrainUrl}/api/events/ip4/applications`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: pending.name,
            email: pending.email,
            phone: pending.phone,
            ticket_type: pending.ticketType,
            scholarship_amount: pending.scholarshipAmount,
            address: pending.address,
            timezone: pending.timezone,
            bio: pending.bio,
            three_words: pending.threeWords,
            heard_about: pending.heardAbout,
            prior_events: pending.priorEvents,
            role_company: pending.roleCompany,
            links: pending.links,
            video_url: data.videoUrl,
            video_duration_sec: Math.round(data.videoDurationSec),
            prompt_text: prompt?.text || null,
            prompt_texts: allActivePrompts.map((p) => p.text),
            source_id: result.submission.id,
            teach_skill: pending.teachSkill || null,
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (err) {
        console.warn("IPHQ webhook failed:", err instanceof Error ? err.message : "unknown");
      }

      // Send confirmation email to applicant
      try {
        const confirmation = applicationConfirmationEmail(pending.name);
        await sendEmail({
          to: pending.email,
          subject: confirmation.subject,
          html: confirmation.html,
        });
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }
    });

    return NextResponse.json({
      success: true,
      submissionId: result.submission.id,
    });
  } catch (error) {
    // Handle duplicate email from inside the transaction
    if (error instanceof Error && error.message === "DUPLICATE_EMAIL") {
      if (videoKey && isR2Configured()) {
        await deleteUpload(videoKey).catch(() => {});
      }
      return NextResponse.json(
        { error: "Unable to process your application. Please contact hello@interestingpeople.com if you need help." },
        { status: 400 }
      );
    }

    // Clean up video on error
    if (videoKey && isR2Configured()) {
      await deleteUpload(videoKey).catch(() => {});
    }

    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const field = issue.path.join(".");
      console.error("Complete validation error: " + error.issues.length + " issues");
      return NextResponse.json(
        { error: `${field ? field + ": " : ""}${issue.message}` },
        { status: 400 }
      );
    }

    console.error("Complete application error:", error);
    return NextResponse.json(
      { error: "Failed to complete application" },
      { status: 500 }
    );
  }
}
