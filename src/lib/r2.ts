import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Validation constants
export const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_DURATION_SEC = 120; // Hard cap
export const TARGET_DURATION_SEC = 90; // Soft target

// Lazy-initialize S3-compatible client for R2 (avoids crash on import when env vars aren't set)
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_r2Client) {
    if (!isR2Configured()) {
      throw new Error(
        "R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL."
      );
    }
    _r2Client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      requestHandler: { requestTimeout: 10_000 },
    });
  }
  return _r2Client;
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME!;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresAt: Date;
}

/**
 * Generate a presigned URL for direct upload to R2
 */
export async function createPresignedUpload(
  contentType: string,
  contentLength: number,
  applicantEmail: string
): Promise<PresignedUploadResult> {
  // Validate content type (strip codec params like ";codecs=vp9,opus")
  const baseType = contentType.split(";")[0].trim();
  if (!ALLOWED_TYPES.includes(baseType)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`);
  }

  // Validate file size (skip if contentLength not provided — R2 will enforce)
  if (contentLength && contentLength > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique key
  const timestamp = Date.now();
  const sanitizedEmail = applicantEmail.replace(/[^a-zA-Z0-9]/g, "_");
  const ext = baseType === "video/mp4" ? "mp4" : baseType === "video/quicktime" ? "mov" : "webm";
  const key = `videos/${sanitizedEmail}/${timestamp}.${ext}`;

  // Create presigned PUT URL (valid for 30 minutes)
  // Note: ContentLength omitted from signing — R2 enforces exact match
  // which breaks if recorded blob size differs from estimate
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });

  const expiresIn = 2 * 60 * 60; // 2 hours — accommodate slow mobile connections
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn });

  // Public URL for accessing the video after upload
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

/**
 * Verify an upload exists and get its metadata
 */
export async function verifyUpload(key: string): Promise<{
  exists: boolean;
  size?: number;
  contentType?: string;
}> {
  try {
    const command = new HeadObjectCommand({
      Bucket: getBucket(),
      Key: key,
    });

    const response = await getR2Client().send(command);

    return {
      exists: true,
      size: response.ContentLength,
      contentType: response.ContentType,
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "NotFound") {
      return { exists: false };
    }
    throw error;
  }
}

/**
 * Delete an uploaded file (for cleanup on failed submissions)
 */
export async function deleteUpload(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  await getR2Client().send(command);
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}
