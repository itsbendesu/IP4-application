import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { isR2Configured } from "@/lib/r2";

// Only allow local uploads in development when R2 is not configured
export async function POST(request: NextRequest) {
  // Block in production or when R2 is configured
  if (process.env.NODE_ENV === "production" || isR2Configured()) {
    return NextResponse.json(
      { error: "Local uploads not available" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: MP4, MOV, WebM" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.type === "video/mp4" ? "mp4" : file.type === "video/quicktime" ? "mov" : "webm";
    const filename = `${timestamp}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Return local URL
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      key: filename,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Local upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
