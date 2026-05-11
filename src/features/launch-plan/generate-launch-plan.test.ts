import { describe, expect, it } from "vitest";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";
import { dockerPythonApiFiles } from "@/fixtures/repo-analysis-fixtures";
import { generateChecklist } from "@/features/checklist/generate-checklist";
import { estimateMonthlyCosts } from "@/features/cost-estimates/estimate-costs";
import { buildBlankProjectIntake } from "@/features/planner/build-fallback-state";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { buildRecommendationOptions } from "@/features/recommendations/recommend-stack";
import { reviewRisks } from "@/features/risk-review/review-risks";
import { generateLaunchPlan } from "./generate-launch-plan";

describe("generateLaunchPlan", () => {
  it("generates the required 19-section launch plan structure", () => {
    const recommendations = buildRecommendationOptions(
      demoProjectAnalysis,
      demoProjectIntake
    );
    const recommendation = recommendations[0];
    const risks = reviewRisks(demoProjectAnalysis);
    const costs = estimateMonthlyCosts(recommendation);
    const checklist = generateChecklist(demoProjectAnalysis, recommendation, risks);
    const plan = generateLaunchPlan({
      analysis: demoProjectAnalysis,
      intake: demoProjectIntake,
      recommendation,
      alternatives: recommendations.slice(1),
      risks,
      costs,
      checklist,
      generatedAt: "2026-05-10T00:00:00.000Z"
    });

    expect(plan.sections.map((section) => section.title)).toEqual([
      "Project Summary",
      "Detected Stack",
      "Missing Information",
      "Recommended Stack",
      "Alternative Stack Options",
      "Required Accounts",
      "Environment Variables",
      "Deployment Steps",
      "Database Setup",
      "Auth Setup",
      "Email Setup",
      "Payments Setup",
      "Domain and DNS Setup",
      "Monitoring and Analytics",
      "Cost Estimate",
      "Production Risks",
      "Launch Checklist",
      "Rollback Plan",
      "Next Actions"
    ]);
    expect(plan.markdown).toContain("Set the build command to `pnpm build`");
    expect(plan.markdown).toContain("Configure the production webhook endpoint");
    expect(plan.markdown).toContain("Do not launch until these are fixed");
  });

  it("includes Docker settings and commands when Docker is recommended", () => {
    const analysis = analyzeRepoFiles([
      {
        path: "requirements.txt",
        content: "fastapi\nuvicorn\n"
      },
      ...dockerPythonApiFiles
    ]);
    const intake = {
      ...buildBlankProjectIntake(),
      appType: "api" as const
    };
    const recommendations = buildRecommendationOptions(analysis, intake);
    const recommendation = recommendations[0];
    const risks = reviewRisks(analysis);
    const costs = estimateMonthlyCosts(recommendation);
    const checklist = generateChecklist(analysis, recommendation, risks);
    const plan = generateLaunchPlan({
      analysis,
      intake,
      recommendation,
      alternatives: recommendations.slice(1),
      risks,
      costs,
      checklist
    });

    expect(plan.markdown).toContain("Dockerfile path: `Dockerfile`");
    expect(plan.markdown).toContain("docker build -f Dockerfile");
    expect(plan.markdown).toContain("Exposed port: `8000`");
  });
});
