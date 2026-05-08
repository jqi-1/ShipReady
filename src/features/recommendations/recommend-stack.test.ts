import { describe, expect, it } from "vitest";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";
import { buildRecommendationOptions } from "./recommend-stack";

describe("buildRecommendationOptions", () => {
  it("generates a fastest managed option for the demo SaaS", () => {
    const options = buildRecommendationOptions(demoProjectAnalysis, demoProjectIntake);

    expect(options).toHaveLength(3);
    expect(options[0].label).toBe("Fastest to Ship");
    expect(options[0].services.hosting).toBe("Vercel");
    expect(options[0].services.payments).toBe("Stripe");
  });
});
