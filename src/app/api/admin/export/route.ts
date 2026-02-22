import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { calculateSubmissionScore, type ReviewScores } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/**
 * Escape a value for CSV - handles commas, quotes, and newlines.
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export submissions as CSV.
 * Query params:
 * - status: "ACCEPTED" | "WAITLIST" | "all" (default: "ACCEPTED,WAITLIST")
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "ACCEPTED,WAITLIST";

    // Parse status filter
    const statuses = statusParam.split(",").filter((s) =>
      ["ACCEPTED", "WAITLIST", "REJECTED", "SUBMITTED"].includes(s)
    );

    if (statuses.length === 0) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    // Fetch submissions with applicant data
    const submissions = await prisma.submission.findMany({
      where: {
        status: { in: statuses as ("ACCEPTED" | "WAITLIST" | "REJECTED" | "SUBMITTED")[] },
      },
      include: {
        applicant: true,
        prompt: { select: { text: true } },
        reviews: {
          select: {
            curiosityVsEgo: true,
            participationVsSpectatorship: true,
            emotionalIntelligence: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate scores and build CSV
    const rows: string[][] = [];

    // Header row
    rows.push([
      "Status",
      "Name",
      "Email",
      "Phone",
      "Ticket Type",
      "Address",
      "Timezone",
      "Bio",
      "Links",
      "Average Score",
      "Review Count",
      "Confidence",
      "Curiosity Score",
      "Participation Score",
      "EQ Score",
      "Applied Date",
      "Prompt",
    ]);

    // Data rows
    for (const sub of submissions) {
      const reviewScores: ReviewScores[] = sub.reviews.map((r) => ({
        curiosityVsEgo: r.curiosityVsEgo,
        participationVsSpectatorship: r.participationVsSpectatorship,
        emotionalIntelligence: r.emotionalIntelligence,
      }));

      const scoring = calculateSubmissionScore(reviewScores);
      const links = Array.isArray(sub.applicant.links)
        ? (sub.applicant.links as string[]).join("; ")
        : "";

      rows.push([
        sub.status,
        sub.applicant.name,
        sub.applicant.email,
        sub.applicant.phone,
        sub.applicant.ticketType,
        sub.applicant.address ?? "",
        sub.applicant.timezone,
        sub.applicant.bio,
        links,
        scoring.averageScore !== null ? scoring.averageScore.toFixed(2) : "",
        String(scoring.reviewCount),
        scoring.confidence,
        scoring.breakdown.curiosityVsEgo !== null
          ? scoring.breakdown.curiosityVsEgo.toFixed(2)
          : "",
        scoring.breakdown.participationVsSpectatorship !== null
          ? scoring.breakdown.participationVsSpectatorship.toFixed(2)
          : "",
        scoring.breakdown.emotionalIntelligence !== null
          ? scoring.breakdown.emotionalIntelligence.toFixed(2)
          : "",
        sub.createdAt.toISOString().split("T")[0],
        sub.prompt.text,
      ]);
    }

    // Convert to CSV string
    const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");

    // Return as downloadable file
    const filename = `applicants-${statuses.join("-").toLowerCase()}-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
