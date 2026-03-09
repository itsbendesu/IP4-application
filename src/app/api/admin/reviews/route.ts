import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reviewSchema = z.object({
  submissionId: z.string().min(1),
  curiosityVsEgo: z.number().min(1).max(5),
  participationVsSpectatorship: z.number().min(1).max(5),
  emotionalIntelligence: z.number().min(1).max(5),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const data = reviewSchema.parse(body);

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Upsert review (one per reviewer per submission)
    const review = await prisma.review.upsert({
      where: {
        submissionId_reviewerId: {
          submissionId: data.submissionId,
          reviewerId: auth.session.reviewerId!,
        },
      },
      update: {
        curiosityVsEgo: data.curiosityVsEgo,
        participationVsSpectatorship: data.participationVsSpectatorship,
        emotionalIntelligence: data.emotionalIntelligence,
        notes: data.notes,
      },
      create: {
        submissionId: data.submissionId,
        reviewerId: auth.session.reviewerId!,
        curiosityVsEgo: data.curiosityVsEgo,
        participationVsSpectatorship: data.participationVsSpectatorship,
        emotionalIntelligence: data.emotionalIntelligence,
        notes: data.notes,
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    // Sync review scores to IPHQ
    after(async () => {
      try {
        // Get applicant email from submission
        const submissionWithApplicant = await prisma.submission.findUnique({
          where: { id: data.submissionId },
          include: { applicant: { select: { email: true } } },
        });
        if (!submissionWithApplicant?.applicant?.email) return;

        // Get all reviews for this submission to calculate overall average
        const allReviews = await prisma.review.findMany({
          where: { submissionId: data.submissionId },
        });
        const overallAvg =
          allReviews.reduce(
            (sum, r) =>
              sum +
              (r.curiosityVsEgo +
                r.participationVsSpectatorship +
                r.emotionalIntelligence) /
                3,
            0
          ) / allReviews.length;

        const syncUrl = `${process.env.IP_BRAIN_URL || "https://ipevents.co"}/api/events/ip4/applications/sync-reviews`;
        await fetch(syncUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.WEBHOOK_SECRET || "",
          },
          body: JSON.stringify({
            email: submissionWithApplicant.applicant.email,
            scores: {
              curiosityVsEgo: data.curiosityVsEgo,
              participationVsSpectatorship: data.participationVsSpectatorship,
              emotionalIntelligence: data.emotionalIntelligence,
            },
            reviewer_name: review.reviewer.name,
            avg_score: Math.round(overallAvg * 100) / 100,
          }),
        });
      } catch {
        // Silently ignore sync errors
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
