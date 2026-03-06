import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const friendsSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required").max(50),
  bio: z.string().min(3, "Tell us a little about yourself").max(500),
  links: z.array(z.string().url()).optional().default([]),
  ticketType: z.enum(["friends-hotel", "friends-local", "patron-hotel", "patron-local"]),
  amount: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = friendsSchema.parse(body);

    // Check for duplicate email
    const existing = await prisma.applicant.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Someone with this email has already registered" },
        { status: 400 }
      );
    }

    // Grab any active prompt (required FK on Submission)
    const prompt = await prisma.prompt.findFirst({
      where: { active: true },
    });
    if (!prompt) {
      return NextResponse.json(
        { error: "No active prompts configured" },
        { status: 500 }
      );
    }

    // Create applicant + submission in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const applicant = await tx.applicant.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          ticketType: data.ticketType,
          scholarshipAmount: `$${data.amount.toLocaleString("en-US")}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          roleCompany: "",
          heardAbout: "Friend of Andrew (invited)",
          threeWords: "",
          bio: data.bio,
          links: data.links.length > 0 ? data.links : undefined,
        },
      });

      const submission = await tx.submission.create({
        data: {
          applicantId: applicant.id,
          promptId: prompt.id,
          videoUrl: "friend-invite",
          videoDurationSec: 0,
          status: "SUBMITTED",
        },
      });

      return { applicant, submission };
    });

    // Fire webhook to IPHQ
    const ipBrainUrl = process.env.IP_BRAIN_URL || "https://ipevents.co";
    after(async () => {
      try {
        await fetch(`${ipBrainUrl}/api/events/ip4/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            ticket_type: data.ticketType,
            scholarship_amount: `$${data.amount.toLocaleString("en-US")}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            bio: data.bio,
            links: data.links,
            video_url: null,
            video_duration_sec: 0,
            prompt_text: null,
            source_id: result.submission.id,
            source: "friends-invite",
          }),
        });
      } catch {
        // IPHQ being down shouldn't block the user
      }
    });

    return NextResponse.json({
      success: true,
      submissionId: result.submission.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        { error: issue.message },
        { status: 400 }
      );
    }

    console.error("Friends registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
