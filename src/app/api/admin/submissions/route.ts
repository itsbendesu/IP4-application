import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import {
  calculateSubmissionScore,
  sortSubmissions,
  type SortOption,
  type ReviewScores,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const hasReview = searchParams.get("hasReview");
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const sortBy = (searchParams.get("sortBy") || "newest") as SortOption | "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: Prisma.SubmissionWhereInput = {};

    // Status filter
    if (status && status !== "all") {
      where.status = status as "SUBMITTED" | "ACCEPTED" | "WAITLIST" | "REJECTED";
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lte = endDate;
      }
    }

    // Has review filter
    if (hasReview === "true") {
      where.reviews = { some: {} };
    } else if (hasReview === "false") {
      where.reviews = { none: {} };
    }

    // Map sort options to a canonical SortOption
    let effectiveSortBy: SortOption;
    const sortByStr = sortBy as string;
    if (sortByStr === "createdAt" || sortByStr === "newest") {
      effectiveSortBy = sortOrder === "asc" ? "oldest" : "newest";
    } else if (sortByStr === "averageScore" || sortByStr === "highest_score") {
      effectiveSortBy = sortOrder === "asc" ? "lowest_score" : "highest_score";
    } else if (sortByStr === "lowest_score") {
      effectiveSortBy = "lowest_score";
    } else if (sortByStr === "needs_review") {
      effectiveSortBy = "needs_review";
    } else if (sortByStr === "oldest") {
      effectiveSortBy = "oldest";
    } else {
      effectiveSortBy = "newest";
    }

    // Determine if we need score-based operations (requires in-memory processing)
    const needsScoreSort = ["highest_score", "lowest_score"].includes(effectiveSortBy);
    const needsScoreFilter = !!(minScore || maxScore);
    const needsScoreProcessing = needsScoreSort || needsScoreFilter;

    const includeClause = {
      applicant: true as const,
      prompt: { select: { text: true } },
      reviews: {
        select: {
          id: true,
          curiosityVsEgo: true,
          participationVsSpectatorship: true,
          emotionalIntelligence: true,
          notes: true,
          createdAt: true,
          reviewer: { select: { id: true, name: true } },
        },
      },
    };

    if (needsScoreProcessing) {
      // Score-based sorting/filtering: fetch all, compute scores in memory, then paginate
      const allSubmissions = await prisma.submission.findMany({
        where,
        include: includeClause,
      });

      let processedSubmissions = allSubmissions.map((sub) => {
        const reviewScores: ReviewScores[] = sub.reviews.map((r) => ({
          curiosityVsEgo: r.curiosityVsEgo,
          participationVsSpectatorship: r.participationVsSpectatorship,
          emotionalIntelligence: r.emotionalIntelligence,
        }));
        const scoring = calculateSubmissionScore(reviewScores);
        return { ...sub, scoring, averageScore: scoring.averageScore };
      });

      // Apply score filters
      if (minScore) {
        const min = parseFloat(minScore);
        processedSubmissions = processedSubmissions.filter(
          (s) => s.scoring.averageScore !== null && s.scoring.averageScore >= min
        );
      }
      if (maxScore) {
        const max = parseFloat(maxScore);
        processedSubmissions = processedSubmissions.filter(
          (s) => s.scoring.averageScore !== null && s.scoring.averageScore <= max
        );
      }

      const sorted = sortSubmissions(processedSubmissions, effectiveSortBy);
      const total = sorted.length;
      const paginatedSubmissions = sorted.slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        submissions: paginatedSubmissions,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } else {
      // Database-level pagination for non-score sorting (newest, oldest, needs_review)
      let dbOrderBy: Prisma.SubmissionOrderByWithRelationInput | Prisma.SubmissionOrderByWithRelationInput[];
      switch (effectiveSortBy) {
        case "oldest":
          dbOrderBy = { createdAt: "asc" };
          break;
        case "needs_review":
          dbOrderBy = [{ reviews: { _count: "asc" } }, { createdAt: "desc" }];
          break;
        case "newest":
        default:
          dbOrderBy = { createdAt: "desc" };
          break;
      }

      const [submissions, total] = await Promise.all([
        prisma.submission.findMany({
          where,
          include: includeClause,
          orderBy: dbOrderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.submission.count({ where }),
      ]);

      // Compute scores only for the returned page
      const processedSubmissions = submissions.map((sub) => {
        const reviewScores: ReviewScores[] = sub.reviews.map((r) => ({
          curiosityVsEgo: r.curiosityVsEgo,
          participationVsSpectatorship: r.participationVsSpectatorship,
          emotionalIntelligence: r.emotionalIntelligence,
        }));
        const scoring = calculateSubmissionScore(reviewScores);
        return { ...sub, scoring, averageScore: scoring.averageScore };
      });

      return NextResponse.json({
        submissions: processedSubmissions,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
