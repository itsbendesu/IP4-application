import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyUpload, deleteUpload, isR2Configured, MAX_DURATION_SEC } from "@/lib/r2";

const finalizeSchema = z.object({
  key: z.string().min(1),
  publicUrl: z.string().url(),
  durationSec: z.number().min(1).max(MAX_DURATION_SEC),
  applicant: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    location: z.string().min(1),
    timezone: z.string().min(1),
    bio: z.string().min(10).max(500),
    links: z.array(z.string().url()).optional(),
  }),
  promptId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let uploadKey: string | null = null;

  try {
    // Check if R2 is configured
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const data = finalizeSchema.parse(body);
    uploadKey = data.key;

    // Verify the upload exists in R2
    const uploadStatus = await verifyUpload(data.key);

    if (!uploadStatus.exists) {
      return NextResponse.json(
        { error: "Upload not found. Please try uploading again." },
        { status: 404 }
      );
    }

    // Check for existing application with this email
    const existingApplicant = await prisma.applicant.findUnique({
      where: { email: data.applicant.email },
    });

    if (existingApplicant) {
      // Clean up the uploaded file since we can't use it
      await deleteUpload(data.key);
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
      await deleteUpload(data.key);
      return NextResponse.json(
        { error: "Invalid prompt selected" },
        { status: 400 }
      );
    }

    // Create applicant and submission in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const applicant = await tx.applicant.create({
        data: {
          name: data.applicant.name,
          email: data.applicant.email,
          location: data.applicant.location,
          timezone: data.applicant.timezone,
          bio: data.applicant.bio,
          links: data.applicant.links ?? undefined,
        },
      });

      const submission = await tx.submission.create({
        data: {
          applicantId: applicant.id,
          promptId: data.promptId,
          videoUrl: data.publicUrl,
          videoDurationSec: Math.round(data.durationSec),
          status: "SUBMITTED",
        },
      });

      return { applicant, submission };
    });

    return NextResponse.json(
      {
        success: true,
        submissionId: result.submission.id,
        message: "Application submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    // Clean up uploaded file on error
    if (uploadKey) {
      try {
        await deleteUpload(uploadKey);
      } catch {
        console.error("Failed to clean up upload:", uploadKey);
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error("Finalize error:", error);
    return NextResponse.json(
      { error: "Failed to complete application" },
      { status: 500 }
    );
  }
}
