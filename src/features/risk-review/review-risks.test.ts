import { describe, expect, it } from "vitest";
import type { RepoAnalysis } from "@/types/planner";
import { demoProjectAnalysis } from "@/fixtures/demo-project";
import { reviewRisks } from "./review-risks";

describe("reviewRisks", () => {
  it("flags payment webhook verification when Stripe is detected without a webhook secret", () => {
    const risks = reviewRisks(demoProjectAnalysis);

    expect(risks.some((risk) => risk.id === "missing-stripe-webhook-secret")).toBe(true);
  });

  it("flags client-side secret exposure", () => {
    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      envVars: [
        {
          name: "NEXT_PUBLIC_STRIPE_SECRET_KEY",
          required: true,
          exposure: "client",
          description: "Bad client-side secret.",
          source: "detected",
          confidence: "high",
          evidence: [{ path: "app/page.tsx", detail: "Referenced in client code" }]
        }
      ],
      services: []
    };

    const risks = reviewRisks(analysis);

    expect(risks[0]).toMatchObject({
      severity: "high",
      category: "security"
    });
  });
});
