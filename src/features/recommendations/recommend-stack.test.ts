import { describe, expect, it } from "vitest";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";
import {
  dockerPythonApiFiles,
  viteStaticAppFiles
} from "@/fixtures/repo-analysis-fixtures";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { buildBlankProjectIntake } from "@/features/planner/build-fallback-state";
import { buildRecommendationOptions } from "./recommend-stack";

describe("buildRecommendationOptions", () => {
  it("generates a fastest managed option for the demo SaaS", () => {
    const options = buildRecommendationOptions(demoProjectAnalysis, demoProjectIntake);

    expect(options).toHaveLength(3);
    expect(options[0].label).toBe("Fastest to Ship");
    expect(options[0].services.hosting).toBe("Vercel");
    expect(options[0].services.payments).toBe("Stripe");
  });

  it("generates three static options and explains scalable static hosting", () => {
    const analysis = analyzeRepoFiles(viteStaticAppFiles);
    const options = buildRecommendationOptions(analysis, {
      ...buildBlankProjectIntake(),
      needsBackend: false
    });

    expect(options).toHaveLength(3);
    expect(options.map((option) => option.priority)).toEqual([
      "fastest",
      "cheapest",
      "scalable"
    ]);
    expect(options[2].why).toContain(
      "static site does not need a separate scalable backend"
    );
  });

  it("promotes cheapest option when cost is the top priority", () => {
    const options = buildRecommendationOptions(demoProjectAnalysis, {
      ...demoProjectIntake,
      priority: "cost"
    });

    expect(options[0].priority).toBe("cheapest");
  });

  it("recommends container-friendly hosting for Docker-backed APIs", () => {
    const analysis = analyzeRepoFiles([
      {
        path: "requirements.txt",
        content: "fastapi\nuvicorn\n"
      },
      ...dockerPythonApiFiles
    ]);
    const options = buildRecommendationOptions(analysis, {
      ...buildBlankProjectIntake(),
      appType: "api"
    });

    expect(options[0].services.hosting).toContain("Docker");
    expect(options[2].services.backend).toContain("health check");
  });
});
