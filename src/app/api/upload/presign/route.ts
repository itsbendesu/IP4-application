import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createPresignedUpload,
  isR2Configured,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  MAX_DURATION_SEC,
} from "@/lib/r2";

const presignSchema = z.object({
  contentType: z.string().refine((t) => ALLOWED_TYPES.includes(t), {
    message: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
  }),
  contentLength: z.number().min(1).max(MAX_FILE_SIZE, {
    message: `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
  }),
  fileName: z.string().min(1),
  email: z.string().email(),
  durationSec: z.number().min(1).max(MAX_DURATION_SEC, {
    message: `Video too long. Maximum: ${MAX_DURATION_SEC} seconds`,
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Check if R2 is configured - if not, try alternatives
    if (!isR2Configured()) {
      // Vercel Blob configured?
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({
          blobMode: true,
          uploadUrl: "/api/upload/blob",
          constraints: {
            maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
            maxDurationSec: MAX_DURATION_SEC,
            allowedTypes: ALLOWED_TYPES,
          },
        });
      }
      // In development, allow local uploads
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({
          localMode: true,
          uploadUrl: "/api/upload/local",
          constraints: {
            maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
            maxDurationSec: MAX_DURATION_SEC,
            allowedTypes: ALLOWED_TYPES,
          },
        });
      }
      return NextResponse.json(
        { error: "Storage not configured. Please contact support." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const data = presignSchema.parse(body);

    // Generate presigned upload URL
    const result = await createPresignedUpload(
      data.contentType,
      data.contentLength,
      data.email
    );

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
      expiresAt: result.expiresAt.toISOString(),
      constraints: {
        maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
        maxDurationSec: MAX_DURATION_SEC,
        allowedTypes: ALLOWED_TYPES,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
