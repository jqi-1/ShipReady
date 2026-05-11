import { describe, expect, it } from "vitest";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";
import { dockerNodeAppFiles } from "@/fixtures/repo-analysis-fixtures";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { buildRecommendationOptions } from "@/features/recommendations/recommend-stack";
import { reviewRisks } from "@/features/risk-review/review-risks";
import { generateChecklist } from "./generate-checklist";

describe("generateChecklist", () => {
  it("generates concrete production-readiness sections for service-backed apps", () => {
    const [recommendation] = buildRecommendationOptions(
      demoProjectAnalysis,
      demoProjectIntake
    );
    const risks = reviewRisks(demoProjectAnalysis);
    const checklist = generateChecklist(demoProjectAnalysis, recommendation, risks);

    expect(checklist.map((section) => section.title)).toEqual([
      "Must Complete Before Launch",
      "Build and Deploy",
      "Docker",
      "Environment Variables",
      "Authentication",
      "Database",
      "Payments",
      "Email",
      "File Storage",
      "Security",
      "Monitoring",
      "Analytics",
      "SEO",
      "Legal Pages",
      "Backups",
      "Performance",
      "Rollback",
      "Launch Testing"
    ]);
    expect(
      checklist
        .find((section) => section.title === "Environment Variables")
        ?.items.some(
          (item) =>
            item.text === "`AUTH_SECRET` is set in the production hosting provider."
        )
    ).toBe(true);
    expect(
      checklist
        .find((section) => section.title === "Payments")
        ?.items.some((item) => item.text.includes("Webhook signature verification"))
    ).toBe(true);
    expect(
      checklist.find((section) => section.title === "Must Complete Before Launch")
        ?.relevant
    ).toBe(true);
  });

  it("marks irrelevant sections and includes Docker checks when relevant", () => {
    const analysis = analyzeRepoFiles([
      {
        path: "package.json",
        content: JSON.stringify({
          scripts: {
            build: "next build",
            start: "next start"
          },
          dependencies: {
            next: "latest",
            react: "latest"
          }
        })
      },
      ...dockerNodeAppFiles
    ]);
    const [recommendation] = buildRecommendationOptions(analysis, {
      needsBackend: false
    });
    const checklist = generateChecklist(analysis, recommendation, reviewRisks(analysis));

    expect(checklist.find((section) => section.title === "Docker")?.relevant).toBe(true);
    expect(
      checklist
        .find((section) => section.title === "Docker")
        ?.items.map((item) => item.id)
    ).toEqual(
      expect.arrayContaining([
        "dockerfile-path",
        "docker-port",
        "dockerignore",
        "docker-non-root"
      ])
    );
    expect(checklist.find((section) => section.title === "Payments")?.relevant).toBe(
      false
    );
  });
});
