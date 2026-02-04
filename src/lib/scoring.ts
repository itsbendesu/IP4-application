/**
 * Scoring and ranking utilities for submission reviews.
 *
 * Each review has 3 rubric scores (1-5):
 * - curiosityVsEgo
 * - participationVsSpectatorship
 * - emotionalIntelligence
 */

export interface ReviewScores {
  curiosityVsEgo: number;
  participationVsSpectatorship: number;
  emotionalIntelligence: number;
}

export type ConfidenceLevel = "none" | "low" | "medium" | "high";

export interface ScoringResult {
  averageScore: number | null;
  reviewCount: number;
  confidence: ConfidenceLevel;
  breakdown: {
    curiosityVsEgo: number | null;
    participationVsSpectatorship: number | null;
    emotionalIntelligence: number | null;
  };
}

/**
 * Calculate the average of a single review's rubric scores.
 */
export function calculateReviewAverage(review: ReviewScores): number {
  const { curiosityVsEgo, participationVsSpectatorship, emotionalIntelligence } = review;
  return (curiosityVsEgo + participationVsSpectatorship + emotionalIntelligence) / 3;
}

/**
 * Calculate the average score for a single rubric dimension across multiple reviews.
 */
export function calculateDimensionAverage(
  reviews: ReviewScores[],
  dimension: keyof ReviewScores
): number | null {
  if (reviews.length === 0) return null;

  const sum = reviews.reduce((acc, review) => acc + review[dimension], 0);
  return sum / reviews.length;
}

/**
 * Calculate the overall average score across all reviews and all dimensions.
 * This is the mean of all individual rubric scores.
 */
export function calculateOverallAverage(reviews: ReviewScores[]): number | null {
  if (reviews.length === 0) return null;

  let totalSum = 0;
  const totalCount = reviews.length * 3; // 3 dimensions per review

  for (const review of reviews) {
    totalSum +=
      review.curiosityVsEgo +
      review.participationVsSpectatorship +
      review.emotionalIntelligence;
  }

  return totalSum / totalCount;
}

/**
 * Determine confidence level based on number of reviews.
 * - 0 reviews: none
 * - 1 review: low
 * - 2 reviews: medium
 * - 3+ reviews: high
 */
export function getConfidenceLevel(reviewCount: number): ConfidenceLevel {
  if (reviewCount === 0) return "none";
  if (reviewCount === 1) return "low";
  if (reviewCount === 2) return "medium";
  return "high";
}

/**
 * Calculate complete scoring result for a submission.
 */
export function calculateSubmissionScore(reviews: ReviewScores[]): ScoringResult {
  const reviewCount = reviews.length;
  const confidence = getConfidenceLevel(reviewCount);
  const averageScore = calculateOverallAverage(reviews);

  return {
    averageScore,
    reviewCount,
    confidence,
    breakdown: {
      curiosityVsEgo: calculateDimensionAverage(reviews, "curiosityVsEgo"),
      participationVsSpectatorship: calculateDimensionAverage(reviews, "participationVsSpectatorship"),
      emotionalIntelligence: calculateDimensionAverage(reviews, "emotionalIntelligence"),
    },
  };
}

/**
 * Sort submissions by various criteria.
 */
export type SortOption = "newest" | "oldest" | "highest_score" | "lowest_score" | "needs_review";

export interface SortableSubmission {
  createdAt: Date | string;
  scoring: ScoringResult;
}

export function sortSubmissions<T extends SortableSubmission>(
  submissions: T[],
  sortBy: SortOption
): T[] {
  const sorted = [...submissions];

  switch (sortBy) {
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    case "highest_score":
      return sorted.sort((a, b) => {
        // Submissions without scores go to the end
        if (a.scoring.averageScore === null && b.scoring.averageScore === null) return 0;
        if (a.scoring.averageScore === null) return 1;
        if (b.scoring.averageScore === null) return -1;
        return b.scoring.averageScore - a.scoring.averageScore;
      });

    case "lowest_score":
      return sorted.sort((a, b) => {
        // Submissions without scores go to the end
        if (a.scoring.averageScore === null && b.scoring.averageScore === null) return 0;
        if (a.scoring.averageScore === null) return 1;
        if (b.scoring.averageScore === null) return -1;
        return a.scoring.averageScore - b.scoring.averageScore;
      });

    case "needs_review":
      return sorted.sort((a, b) => {
        // Sort by review count ascending (0 reviews first), then by date descending
        if (a.scoring.reviewCount !== b.scoring.reviewCount) {
          return a.scoring.reviewCount - b.scoring.reviewCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    default:
      return sorted;
  }
}

/**
 * Format score for display (1 decimal place).
 */
export function formatScore(score: number | null): string {
  if (score === null) return "-";
  return score.toFixed(1);
}

/**
 * Get color class based on score value.
 */
export function getScoreColorClass(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 4) return "text-green-600";
  if (score >= 3) return "text-gray-900";
  if (score >= 2) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get confidence badge styling.
 */
export function getConfidenceBadge(confidence: ConfidenceLevel): {
  text: string;
  className: string;
} {
  switch (confidence) {
    case "none":
      return { text: "No reviews", className: "bg-gray-100 text-gray-600" };
    case "low":
      return { text: "Low confidence", className: "bg-yellow-100 text-yellow-700" };
    case "medium":
      return { text: "Medium confidence", className: "bg-blue-100 text-blue-700" };
    case "high":
      return { text: "High confidence", className: "bg-green-100 text-green-700" };
  }
}
