import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import { createVerificationCode, isEmailVerificationEnabled } from "@/lib/email-verification";

const startApplicationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  location: z.string().min(1, "Location is required").max(100),
  timezone: z.string().min(1, "Timezone is required"),
  roleCompany: z.string().max(150).optional(),
  heardAbout: z.string().min(1, "Please tell us how you heard about IP").max(200),
  priorEvents: z.string().max(300).optional(),
  threeWords: z.string().min(1, "Please describe yourself in 3 words").max(100),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio must be under 500 characters"),
  links: z.array(z.string().url()).max(5).optional(),
  // Honeypot field - should be empty
  website: z.string().max(0, "Invalid submission").optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = checkRateLimit(`apply:${identifier}`, RATE_LIMITS.application);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many applications. Please try again later.",
          retryAfter: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = startApplicationSchema.parse(body);

    // Honeypot check - if website field is filled, it's likely a bot
    if (data.website && data.website.length > 0) {
      // Silently accept but don't process
      return NextResponse.json({
        success: true,
        token: "fake-token",
        requiresVerification: false,
      });
    }

    // Check if email already has a completed application
    const existingApplicant = await prisma.applicant.findUnique({
      where: { email: data.email },
    });

    if (existingApplicant) {
      return NextResponse.json(
        { error: "An application with this email already exists" },
        { status: 400 }
      );
    }

    // Check if there's already a pending application
    const existingPending = await prisma.pendingApplication.findUnique({
      where: { email: data.email },
    });

    if (existingPending) {
      // If it's expired, delete it
      if (existingPending.expiresAt < new Date()) {
        await prisma.pendingApplication.delete({
          where: { id: existingPending.id },
        });
      } else {
        // Return existing pending application
        return NextResponse.json({
          success: true,
          token: existingPending.token,
          requiresVerification: isEmailVerificationEnabled() && !existingPending.emailVerified,
        });
      }
    }

    // Get a random active prompt
    const prompts = await prisma.prompt.findMany({
      where: { active: true },
      select: { id: true },
    });

    if (prompts.length === 0) {
      return NextResponse.json(
        { error: "No prompts available. Please try again later." },
        { status: 503 }
      );
    }

    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    // Create pending application (expires in 24 hours)
    const pendingApplication = await prisma.pendingApplication.create({
      data: {
        name: data.name,
        email: data.email,
        location: data.location,
        timezone: data.timezone,
        roleCompany: data.roleCompany ?? "",
        heardAbout: data.heardAbout,
        priorEvents: data.priorEvents ?? undefined,
        threeWords: data.threeWords,
        bio: data.bio,
        links: data.links ?? undefined,
        promptId: randomPrompt.id,
        emailVerified: !isEmailVerificationEnabled(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification code if enabled
    if (isEmailVerificationEnabled()) {
      await createVerificationCode(data.email);
    }

    return NextResponse.json({
      success: true,
      token: pendingApplication.token,
      requiresVerification: isEmailVerificationEnabled(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error("Start application error:", error);
    return NextResponse.json(
      { error: "Failed to start application" },
      { status: 500 }
    );
  }
}
