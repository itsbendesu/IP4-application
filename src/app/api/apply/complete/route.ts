import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyUpload, deleteUpload, isR2Configured } from "@/lib/r2";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

const completeSchema = z.object({
  token: z.string().min(1),
  videoKey: z.string().min(1),
  videoUrl: z.string().min(1), // Accepts both full URLs and local paths like /uploads/x.webm
  videoDurationSec: z.number().min(1).max(120),
});

export async function POST(request: NextRequest) {
  let videoKey: string | null = null;

  try {
    const body = await request.json();
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

    // Check email verification
    if (isEmailVerificationEnabled() && !pending.emailVerified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
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

    // Check for duplicate email (race condition protection)
    const existingApplicant = await prisma.applicant.findUnique({
      where: { email: pending.email },
    });

    if (existingApplicant) {
      await prisma.pendingApplication.delete({ where: { id: pending.id } });
      if (videoKey && isR2Configured()) {
        await deleteUpload(videoKey).catch(() => {});
      }
      return NextResponse.json(
        { error: "An application with this email already exists" },
        { status: 400 }
      );
    }

    // Create applicant and submission in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create applicant
      const applicant = await tx.applicant.create({
        data: {
          name: pending.name,
          email: pending.email,
          phone: pending.phone,
          ticketType: pending.ticketType,
          address: pending.address ?? undefined,
          timezone: pending.timezone,
          roleCompany: pending.roleCompany,
          heardAbout: pending.heardAbout,
          priorEvents: pending.priorEvents ?? undefined,
          threeWords: pending.threeWords,
          bio: pending.bio,
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

    // Fire-and-forget: send to IP Brain
    const ipBrainUrl = process.env.IP_BRAIN_URL || "https://ip-brain.vercel.app";
    (async () => {
      try {
        // Fetch prompt text for context
        const prompt = await prisma.prompt.findUnique({ where: { id: pending.promptId } });
        await fetch(`${ipBrainUrl}/api/events/ip4/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pending.name,
            email: pending.email,
            phone: pending.phone,
            ticket_type: pending.ticketType,
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
            source_id: result.submission.id,
          }),
        });
      } catch {
        // Silently ignore — IP Brain being down shouldn't block the user
      }
    })();

    return NextResponse.json({
      success: true,
      submissionId: result.submission.id,
    });
  } catch (error) {
    // Clean up video on error
    if (videoKey && isR2Configured()) {
      await deleteUpload(videoKey).catch(() => {});
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error("Complete application error:", error);
    return NextResponse.json(
      { error: "Failed to complete application" },
      { status: 500 }
    );
  }
}
