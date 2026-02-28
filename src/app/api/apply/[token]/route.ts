import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailVerificationEnabled } from "@/lib/email-verification";

// GET - Get pending application details for upload page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const pending = await prisma.pendingApplication.findUnique({
      where: { token },
      include: {
        prompt: {
          select: { id: true, text: true },
        },
      },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if expired
    if (pending.expiresAt < new Date()) {
      await prisma.pendingApplication.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { error: "Application expired. Please start a new application." },
        { status: 410 }
      );
    }

    // Check if email verification is required but not completed
    if (isEmailVerificationEnabled() && !pending.emailVerified) {
      return NextResponse.json(
        {
          error: "Email not verified",
          requiresVerification: true,
          email: pending.email,
        },
        { status: 403 }
      );
    }

    // Fetch 3 random prompts for the interview
    const allPrompts = await prisma.prompt.findMany({
      where: { active: true },
      select: { id: true, text: true },
    });

    // Shuffle and take 3 (or all if fewer than 3)
    const shuffled = allPrompts.sort(() => Math.random() - 0.5);
    const prompts = shuffled.slice(0, 2);

    return NextResponse.json({
      id: pending.id,
      name: pending.name,
      email: pending.email,
      prompts, // Now returns array of prompts
      expiresAt: pending.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json(
      { error: "Failed to get application" },
      { status: 500 }
    );
  }
}
