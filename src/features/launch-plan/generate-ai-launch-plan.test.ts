import { describe, expect, it, vi } from "vitest";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";
import type { AiClientConfig } from "@/lib/ai-client";
import type { LaunchPlan } from "@/types/planner";
import { LAUNCH_PLAN_SECTION_TITLES } from "./sections";
import { generateLaunchPlanWithAi } from "./generate-ai-launch-plan";

const fallbackPlan: LaunchPlan = {
  projectName: "AI SaaS Prototype",
  generatedAt: "2026-05-10T00:00:00.000Z",
  sections: LAUNCH_PLAN_SECTION_TITLES.map((title) => ({
    title,
    body: `Deterministic ${title}`
  })),
  markdown: "deterministic markdown",
  generationMode: "deterministic"
};

const config: AiClientConfig = {
  provider: "openai",
  apiKey: "sk-test",
  model: "gpt-4o-mini",
  timeoutMs: 5000
};

describe("generateLaunchPlanWithAi", () => {
  it("uses the deterministic fallback when AI is not configured", async () => {
    const result = await generateLaunchPlanWithAi({
      analysis: demoProjectAnalysis,
      intake: demoProjectIntake,
      fallbackPlan,
      aiConfig: null
    });

    expect(result.generationMode).toBe("deterministic");
    expect(result.launchPlan).toBe(fallbackPlan);
  });

  it("returns an AI launch plan for valid structured JSON", async () => {
    const aiCaller = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        sections: LAUNCH_PLAN_SECTION_TITLES.map((title) => ({
          title,
          body: `AI ${title}`
        }))
      }),
      model: "gpt-4o-mini"
    });

    const result = await generateLaunchPlanWithAi({
      analysis: demoProjectAnalysis,
      intake: demoProjectIntake,
      fallbackPlan,
      aiConfig: config,
      aiCaller
    });

    expect(result.generationMode).toBe("ai");
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.launchPlan.generationMode).toBe("ai");
    expect(result.launchPlan.sections[0].body).toBe("AI Project Summary");
    expect(result.launchPlan.markdown).toContain("## Project Summary");
    expect(aiCaller).toHaveBeenCalledOnce();
  });

  it("falls back when the AI returns malformed JSON", async () => {
    const aiCaller = vi.fn().mockResolvedValue({
      content: "not json",
      model: "gpt-4o-mini"
    });

    const result = await generateLaunchPlanWithAi({
      analysis: demoProjectAnalysis,
      intake: demoProjectIntake,
      fallbackPlan,
      aiConfig: config,
      aiCaller
    });

    expect(result.generationMode).toBe("deterministic");
    expect(result.launchPlan).toBe(fallbackPlan);
  });

  it("falls back when the AI call fails", async () => {
    const aiCaller = vi.fn().mockRejectedValue(new Error("timeout"));

    const result = await generateLaunchPlanWithAi({
      analysis: demoProjectAnalysis,
      intake: demoProjectIntake,
      fallbackPlan,
      aiConfig: config,
      aiCaller
    });

    expect(result.generationMode).toBe("deterministic");
    expect(result.launchPlan).toBe(fallbackPlan);
  });
});
