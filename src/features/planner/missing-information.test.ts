import { describe, expect, it } from "vitest";
import { demoProjectIntake } from "@/fixtures/demo-project";
import { simpleNextAppFiles } from "@/fixtures/repo-analysis-fixtures";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { buildBlankProjectIntake } from "./build-fallback-state";
import {
  inferIntakeFromAnalysis,
  summarizeMissingInformation
} from "./missing-information";

describe("missing information flow", () => {
  it("infers technical service needs without overwriting user-provided answers", () => {
    const analysis = analyzeRepoFiles([
      ...simpleNextAppFiles,
      {
        path: "package.json",
        content: JSON.stringify({
          dependencies: {
            "next-auth": "latest",
            stripe: "latest"
          }
        })
      }
    ]);
    const intake = {
      ...buildBlankProjectIntake(),
      needsPayments: false,
      sources: {
        ...buildBlankProjectIntake().sources,
        needsPayments: "user_provided" as const
      }
    };

    const inferred = inferIntakeFromAnalysis(intake, analysis);

    expect(inferred.needsAuth).toBe(true);
    expect(inferred.sources.needsAuth).toBe("inferred");
    expect(inferred.needsPayments).toBe(false);
    expect(inferred.sources.needsPayments).toBe("user_provided");
  });

  it("groups facts and asks fewer than eight normal follow-up questions", () => {
    const analysis = analyzeRepoFiles(simpleNextAppFiles);
    const intake = inferIntakeFromAnalysis(buildBlankProjectIntake(), analysis);
    const summary = summarizeMissingInformation(analysis, intake);

    expect(summary.highConfidence).toEqual(
      expect.arrayContaining([
        "Frontend framework: Next.js",
        "Package manager: npm",
        "Build command: npm run build"
      ])
    );
    expect(summary.questions.length).toBeLessThanOrEqual(11);
    expect(summary.questions.map((question) => question.id)).toEqual(
      expect.arrayContaining(["appType", "traffic", "budget", "priority"])
    );
  });

  it("does not ask questions already answered by the user", () => {
    const intake = {
      ...demoProjectIntake,
      sources: {
        ...demoProjectIntake.sources,
        budget: "user_provided" as const,
        traffic: "user_provided" as const
      }
    };
    const summary = summarizeMissingInformation(
      analyzeRepoFiles(simpleNextAppFiles),
      intake
    );

    expect(summary.questions.map((question) => question.id)).not.toContain("budget");
    expect(summary.questions.map((question) => question.id)).not.toContain("traffic");
  });
});
