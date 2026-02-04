import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Validation constants
export const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_DURATION_SEC = 120; // Hard cap
export const TARGET_DURATION_SEC = 90; // Soft target

// Initialize S3-compatible client for R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

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
  // Validate content type
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`);
  }

  // Validate file size
  if (contentLength > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique key
  const timestamp = Date.now();
  const sanitizedEmail = applicantEmail.replace(/[^a-zA-Z0-9]/g, "_");
  const ext = contentType === "video/mp4" ? "mp4" : contentType === "video/quicktime" ? "mov" : "webm";
  const key = `videos/${sanitizedEmail}/${timestamp}.${ext}`;

  // Create presigned PUT URL (valid for 30 minutes)
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  const expiresIn = 30 * 60; // 30 minutes
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

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
      Bucket: BUCKET,
      Key: key,
    });

    const response = await r2Client.send(command);

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
    Bucket: BUCKET,
    Key: key,
  });

  await r2Client.send(command);
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
