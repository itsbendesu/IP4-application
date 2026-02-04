import { describe, it, expect } from "vitest";
import {
  calculateReviewAverage,
  calculateDimensionAverage,
  calculateOverallAverage,
  getConfidenceLevel,
  calculateSubmissionScore,
  sortSubmissions,
  formatScore,
  getScoreColorClass,
  getConfidenceBadge,
  type ReviewScores,
  type SortableSubmission,
} from "../scoring";

describe("calculateReviewAverage", () => {
  it("calculates average of a single review", () => {
    const review: ReviewScores = {
      curiosityVsEgo: 4,
      participationVsSpectatorship: 3,
      emotionalIntelligence: 5,
    };
    expect(calculateReviewAverage(review)).toBe(4);
  });

  it("handles all same scores", () => {
    const review: ReviewScores = {
      curiosityVsEgo: 3,
      participationVsSpectatorship: 3,
      emotionalIntelligence: 3,
    };
    expect(calculateReviewAverage(review)).toBe(3);
  });

  it("handles decimal results", () => {
    const review: ReviewScores = {
      curiosityVsEgo: 4,
      participationVsSpectatorship: 4,
      emotionalIntelligence: 5,
    };
    expect(calculateReviewAverage(review)).toBeCloseTo(4.33, 2);
  });
});

describe("calculateDimensionAverage", () => {
  it("returns null for empty reviews", () => {
    expect(calculateDimensionAverage([], "curiosityVsEgo")).toBeNull();
  });

  it("calculates average for single review", () => {
    const reviews: ReviewScores[] = [
      { curiosityVsEgo: 4, participationVsSpectatorship: 3, emotionalIntelligence: 5 },
    ];
    expect(calculateDimensionAverage(reviews, "curiosityVsEgo")).toBe(4);
  });

  it("calculates average across multiple reviews", () => {
    const reviews: ReviewScores[] = [
      { curiosityVsEgo: 4, participationVsSpectatorship: 3, emotionalIntelligence: 5 },
      { curiosityVsEgo: 2, participationVsSpectatorship: 4, emotionalIntelligence: 3 },
    ];
    expect(calculateDimensionAverage(reviews, "curiosityVsEgo")).toBe(3); // (4+2)/2
    expect(calculateDimensionAverage(reviews, "participationVsSpectatorship")).toBe(3.5); // (3+4)/2
    expect(calculateDimensionAverage(reviews, "emotionalIntelligence")).toBe(4); // (5+3)/2
  });
});

describe("calculateOverallAverage", () => {
  it("returns null for empty reviews", () => {
    expect(calculateOverallAverage([])).toBeNull();
  });

  it("calculates overall average for single review", () => {
    const reviews: ReviewScores[] = [
      { curiosityVsEgo: 3, participationVsSpectatorship: 3, emotionalIntelligence: 3 },
    ];
    expect(calculateOverallAverage(reviews)).toBe(3);
  });

  it("calculates overall average across multiple reviews", () => {
    const reviews: ReviewScores[] = [
      { curiosityVsEgo: 4, participationVsSpectatorship: 4, emotionalIntelligence: 4 },
      { curiosityVsEgo: 2, participationVsSpectatorship: 2, emotionalIntelligence: 2 },
    ];
    // Total: (4+4+4+2+2+2) = 18, count = 6
    expect(calculateOverallAverage(reviews)).toBe(3);
  });

  it("handles mixed scores correctly", () => {
    const reviews: ReviewScores[] = [
      { curiosityVsEgo: 5, participationVsSpectatorship: 4, emotionalIntelligence: 3 },
      { curiosityVsEgo: 4, participationVsSpectatorship: 3, emotionalIntelligence: 5 },
      { curiosityVsEgo: 3, participationVsSpectatorship: 5, emotionalIntelligence: 4 },
    ];
    // Total: (5+4+3) + (4+3+5) + (3+5+4) = 12 + 12 + 12 = 36, count = 9
    expect(calculateOverallAverage(reviews)).toBe(4);
  });
});

describe("getConfidenceLevel", () => {
  it("returns 'none' for 0 reviews", () => {
    expect(getConfidenceLevel(0)).toBe("none");
  });

  it("returns 'low' for 1 review", () => {
    expect(getConfidenceLevel(1)).toBe("low");
  });

  it("returns 'medium' for 2 reviews", () => {
    expect(getConfidenceLevel(2)).toBe("medium");
  });

  it("returns 'high' for 3+ reviews", () => {
    expect(getConfidenceLevel(3)).toBe("high");
    expect(getConfidenceLevel(5)).toBe("high");
    expect(getConfidenceLevel(10)).toBe("high");
  });
});

describe("calculateSubmissionScore", () => {
  it("handles submission with no reviews", () => {
    const result = calculateSubmissionScore([]);
    expect(result).toEqual({
      averageScore: null,
      reviewCount: 0,
      confidence: "none",
      breakdown: {
        curiosityVsEgo: null,
        participationVsSpectatorship: null,
        emotionalIntelligence: null,
      },
    });
  });

  it("calculates complete scoring result for single review", () => {
    const reviews: ReviewScores[] = [
      { curiosityVsEgo: 4, participationVsSpectatorship: 3, emotionalIntelligence: 5 },
    ];
    const result = calculateSubmissionScore(reviews);
    expect(result.averageScore).toBe(4);
    expect(result.reviewCount).toBe(1);
    expect(result.confidence).toBe("low");
    expect(result.breakdown.curiosityVsEgo).toBe(4);
    expect(result.breakdown.participationVsSpectatorship).toBe(3);
    expect(result.breakdown.emotionalIntelligence).toBe(5);
  });

  it("calculates complete scoring result for multiple reviews", () => {
    const reviews: ReviewScores[] = [
      { curiosityVsEgo: 4, participationVsSpectatorship: 4, emotionalIntelligence: 4 },
      { curiosityVsEgo: 2, participationVsSpectatorship: 2, emotionalIntelligence: 2 },
      { curiosityVsEgo: 3, participationVsSpectatorship: 3, emotionalIntelligence: 3 },
    ];
    const result = calculateSubmissionScore(reviews);
    expect(result.averageScore).toBe(3);
    expect(result.reviewCount).toBe(3);
    expect(result.confidence).toBe("high");
    expect(result.breakdown.curiosityVsEgo).toBe(3);
    expect(result.breakdown.participationVsSpectatorship).toBe(3);
    expect(result.breakdown.emotionalIntelligence).toBe(3);
  });
});

describe("sortSubmissions", () => {
  const createSubmission = (
    createdAt: string,
    averageScore: number | null,
    reviewCount: number
  ): SortableSubmission => ({
    createdAt,
    scoring: {
      averageScore,
      reviewCount,
      confidence: getConfidenceLevel(reviewCount),
      breakdown: { curiosityVsEgo: null, participationVsSpectatorship: null, emotionalIntelligence: null },
    },
  });

  const submissions: SortableSubmission[] = [
    createSubmission("2024-01-01", 3.5, 2),
    createSubmission("2024-01-03", 4.5, 3),
    createSubmission("2024-01-02", null, 0),
    createSubmission("2024-01-04", 2.5, 1),
  ];

  it("sorts by newest first", () => {
    const sorted = sortSubmissions(submissions, "newest");
    expect(sorted[0].createdAt).toBe("2024-01-04");
    expect(sorted[1].createdAt).toBe("2024-01-03");
    expect(sorted[2].createdAt).toBe("2024-01-02");
    expect(sorted[3].createdAt).toBe("2024-01-01");
  });

  it("sorts by oldest first", () => {
    const sorted = sortSubmissions(submissions, "oldest");
    expect(sorted[0].createdAt).toBe("2024-01-01");
    expect(sorted[1].createdAt).toBe("2024-01-02");
    expect(sorted[2].createdAt).toBe("2024-01-03");
    expect(sorted[3].createdAt).toBe("2024-01-04");
  });

  it("sorts by highest score first", () => {
    const sorted = sortSubmissions(submissions, "highest_score");
    expect(sorted[0].scoring.averageScore).toBe(4.5);
    expect(sorted[1].scoring.averageScore).toBe(3.5);
    expect(sorted[2].scoring.averageScore).toBe(2.5);
    expect(sorted[3].scoring.averageScore).toBeNull(); // null scores at end
  });

  it("sorts by lowest score first", () => {
    const sorted = sortSubmissions(submissions, "lowest_score");
    expect(sorted[0].scoring.averageScore).toBe(2.5);
    expect(sorted[1].scoring.averageScore).toBe(3.5);
    expect(sorted[2].scoring.averageScore).toBe(4.5);
    expect(sorted[3].scoring.averageScore).toBeNull(); // null scores at end
  });

  it("sorts by needs review first (fewest reviews)", () => {
    const sorted = sortSubmissions(submissions, "needs_review");
    expect(sorted[0].scoring.reviewCount).toBe(0);
    expect(sorted[1].scoring.reviewCount).toBe(1);
    expect(sorted[2].scoring.reviewCount).toBe(2);
    expect(sorted[3].scoring.reviewCount).toBe(3);
  });

  it("does not mutate original array", () => {
    const original = [...submissions];
    sortSubmissions(submissions, "newest");
    expect(submissions).toEqual(original);
  });
});

describe("formatScore", () => {
  it("returns dash for null", () => {
    expect(formatScore(null)).toBe("-");
  });

  it("formats whole numbers with decimal", () => {
    expect(formatScore(4)).toBe("4.0");
  });

  it("formats decimals to one place", () => {
    expect(formatScore(3.5)).toBe("3.5");
    expect(formatScore(3.33)).toBe("3.3");
    expect(formatScore(3.67)).toBe("3.7");
  });
});

describe("getScoreColorClass", () => {
  it("returns gray for null", () => {
    expect(getScoreColorClass(null)).toBe("text-gray-400");
  });

  it("returns green for high scores", () => {
    expect(getScoreColorClass(4)).toBe("text-green-600");
    expect(getScoreColorClass(5)).toBe("text-green-600");
    expect(getScoreColorClass(4.5)).toBe("text-green-600");
  });

  it("returns gray for medium scores", () => {
    expect(getScoreColorClass(3)).toBe("text-gray-900");
    expect(getScoreColorClass(3.9)).toBe("text-gray-900");
  });

  it("returns yellow for low-medium scores", () => {
    expect(getScoreColorClass(2)).toBe("text-yellow-600");
    expect(getScoreColorClass(2.9)).toBe("text-yellow-600");
  });

  it("returns red for low scores", () => {
    expect(getScoreColorClass(1)).toBe("text-red-600");
    expect(getScoreColorClass(1.9)).toBe("text-red-600");
  });
});

describe("getConfidenceBadge", () => {
  it("returns correct badge for each confidence level", () => {
    expect(getConfidenceBadge("none")).toEqual({
      text: "No reviews",
      className: "bg-gray-100 text-gray-600",
    });
    expect(getConfidenceBadge("low")).toEqual({
      text: "Low confidence",
      className: "bg-yellow-100 text-yellow-700",
    });
    expect(getConfidenceBadge("medium")).toEqual({
      text: "Medium confidence",
      className: "bg-blue-100 text-blue-700",
    });
    expect(getConfidenceBadge("high")).toEqual({
      text: "High confidence",
      className: "bg-green-100 text-green-700",
    });
  });
});
