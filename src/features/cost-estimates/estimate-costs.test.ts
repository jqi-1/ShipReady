import { describe, expect, it } from "vitest";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";
import { buildRecommendationOptions } from "@/features/recommendations/recommend-stack";
import { estimateMonthlyCosts } from "./estimate-costs";

describe("estimateMonthlyCosts", () => {
  it("includes required cost categories for each usage tier", () => {
    const [recommendation] = buildRecommendationOptions(
      demoProjectAnalysis,
      demoProjectIntake
    );
    const estimate = estimateMonthlyCosts(recommendation);

    expect(estimate.tiers).toHaveLength(4);
    for (const tier of estimate.tiers) {
      expect(Object.keys(tier.categories)).toEqual(
        expect.arrayContaining([
          "hosting",
          "database",
          "storage",
          "bandwidth",
          "email",
          "auth",
          "monitoring",
          "analytics",
          "backgroundJobs",
          "serverlessUsage"
        ])
      );
    }
  });
});
