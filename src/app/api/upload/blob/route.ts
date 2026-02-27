import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function PUT(request: NextRequest) {
  try {
    const filename = request.headers.get("x-filename") || "recording.webm";
    const contentType = request.headers.get("content-type") || "video/webm";

    if (!request.body) {
      return NextResponse.json({ error: "No body" }, { status: 400 });
    }

    const blob = await put(filename, request.body, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });

    return NextResponse.json({
      key: blob.pathname,
      url: blob.url,
    });
  } catch (error) {
    console.error("Blob upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
