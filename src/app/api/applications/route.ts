import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const applicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  ticketType: z.enum(["local", "regular", "vip"]).optional(),
  address: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio must be under 500 characters"),
  links: z.array(z.string().url()).optional(),
  promptId: z.string().min(1, "Prompt selection is required"),
  videoUrl: z.string().min(1, "Video is required"),
  videoDurationSec: z.number().min(1).max(90, "Video must be 90 seconds or less"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = applicationSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.applicant.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An application with this email already exists" },
        { status: 400 }
      );
    }

    // Verify prompt exists and is active
    const prompt = await prisma.prompt.findUnique({
      where: { id: data.promptId },
    });

    if (!prompt || !prompt.active) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // Create applicant and submission in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const applicant = await tx.applicant.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone ?? "",
          ticketType: data.ticketType ?? "",
          address: data.address ?? undefined,
          timezone: data.timezone,
          bio: data.bio,
          links: data.links ?? undefined,
        },
      });

      const submission = await tx.submission.create({
        data: {
          applicantId: applicant.id,
          promptId: data.promptId,
          videoUrl: data.videoUrl,
          videoDurationSec: data.videoDurationSec,
          status: "SUBMITTED",
        },
      });

      return { applicant, submission };
    });

    return NextResponse.json({ success: true, id: result.submission.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Application error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
