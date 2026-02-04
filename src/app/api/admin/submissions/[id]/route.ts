import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { calculateSubmissionScore, type ReviewScores } from "@/lib/scoring";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        applicant: true,
        prompt: true,
        reviews: {
          include: { reviewer: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Calculate scoring using the utility
    const reviewScores: ReviewScores[] = submission.reviews.map((r) => ({
      curiosityVsEgo: r.curiosityVsEgo,
      participationVsSpectatorship: r.participationVsSpectatorship,
      emotionalIntelligence: r.emotionalIntelligence,
    }));

    const scoring = calculateSubmissionScore(reviewScores);

    return NextResponse.json({
      ...submission,
      scoring,
      // Keep for backward compatibility
      averageScore: scoring.averageScore,
    });
  } catch (error) {
    console.error("Failed to fetch submission:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only admins can change status
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const { status } = await request.json();

    const validStatuses = ["SUBMITTED", "ACCEPTED", "WAITLIST", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check acceptance cap before accepting
    if (status === "ACCEPTED") {
      const acceptedCount = await prisma.submission.count({
        where: { status: "ACCEPTED" },
      });

      if (acceptedCount >= 150) {
        return NextResponse.json(
          { error: "Acceptance cap reached (150). Consider waitlisting instead." },
          { status: 400 }
        );
      }
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: { status },
      include: {
        applicant: true,
        prompt: true,
        reviews: {
          include: { reviewer: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    // Calculate scoring
    const reviewScores: ReviewScores[] = submission.reviews.map((r) => ({
      curiosityVsEgo: r.curiosityVsEgo,
      participationVsSpectatorship: r.participationVsSpectatorship,
      emotionalIntelligence: r.emotionalIntelligence,
    }));

    const scoring = calculateSubmissionScore(reviewScores);

    return NextResponse.json({
      ...submission,
      scoring,
      averageScore: scoring.averageScore,
    });
  } catch (error) {
    console.error("Failed to update submission:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}
