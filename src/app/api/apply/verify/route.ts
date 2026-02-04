import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyCode, createVerificationCode, isEmailVerificationEnabled } from "@/lib/email-verification";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

const verifySchema = z.object({
  token: z.string().min(1),
  code: z.string().length(6, "Code must be 6 digits"),
});

const resendSchema = z.object({
  token: z.string().min(1),
});

// POST - Verify email code
export async function POST(request: NextRequest) {
  try {
    if (!isEmailVerificationEnabled()) {
      return NextResponse.json(
        { error: "Email verification is not enabled" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = verifySchema.parse(body);

    // Find pending application
    const pending = await prisma.pendingApplication.findUnique({
      where: { token: data.token },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (pending.expiresAt < new Date()) {
      await prisma.pendingApplication.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { error: "Application expired. Please start over." },
        { status: 410 }
      );
    }

    if (pending.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // Verify the code
    const isValid = verifyCode(pending.email, data.code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
    }

    // Mark as verified
    await prisma.pendingApplication.update({
      where: { id: pending.id },
      data: { emailVerified: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

// PUT - Resend verification code
export async function PUT(request: NextRequest) {
  try {
    if (!isEmailVerificationEnabled()) {
      return NextResponse.json(
        { error: "Email verification is not enabled" },
        { status: 400 }
      );
    }

    // Rate limit resends
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = checkRateLimit(`resend:${identifier}`, RATE_LIMITS.emailVerification);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before requesting another code." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = resendSchema.parse(body);

    // Find pending application
    const pending = await prisma.pendingApplication.findUnique({
      where: { token: data.token },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (pending.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // Send new code
    await createVerificationCode(pending.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error("Resend error:", error);
    return NextResponse.json(
      { error: "Failed to resend code" },
      { status: 500 }
    );
  }
}
