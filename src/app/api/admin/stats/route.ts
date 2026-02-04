import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    // Get counts by status
    const [submitted, accepted, waitlist, rejected, totalReviews] = await Promise.all([
      prisma.submission.count({ where: { status: "SUBMITTED" } }),
      prisma.submission.count({ where: { status: "ACCEPTED" } }),
      prisma.submission.count({ where: { status: "WAITLIST" } }),
      prisma.submission.count({ where: { status: "REJECTED" } }),
      prisma.review.count(),
    ]);

    // Get submissions needing review (no reviews yet)
    const needsReview = await prisma.submission.count({
      where: {
        status: "SUBMITTED",
        reviews: { none: {} },
      },
    });

    // Get average scores for reviewed submissions
    const reviewedSubmissions = await prisma.submission.findMany({
      where: {
        reviews: { some: {} },
      },
      include: {
        reviews: {
          select: {
            curiosityVsEgo: true,
            participationVsSpectatorship: true,
            emotionalIntelligence: true,
          },
        },
      },
    });

    // Calculate overall average score
    let totalScore = 0;
    let scoreCount = 0;
    for (const sub of reviewedSubmissions) {
      for (const review of sub.reviews) {
        totalScore +=
          (review.curiosityVsEgo +
            review.participationVsSpectatorship +
            review.emotionalIntelligence) /
          3;
        scoreCount++;
      }
    }

    const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

    return NextResponse.json({
      counts: {
        submitted,
        accepted,
        waitlist,
        rejected,
        total: submitted + accepted + waitlist + rejected,
      },
      needsReview,
      totalReviews,
      averageScore: averageScore.toFixed(2),
      acceptedCap: 150,
      spotsRemaining: Math.max(0, 150 - accepted),
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
