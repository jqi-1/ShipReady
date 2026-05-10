import { describe, expect, it } from "vitest";
import {
  buildBlankProjectIntake,
  buildIntakeOnlyAnalysis,
  buildPlannerDraft
} from "./build-fallback-state";

describe("buildPlannerDraft", () => {
  it("uses the supplied timestamp for generated plan output", () => {
    const generatedAt = "2026-05-10T22:50:32.000Z";
    const draft = buildPlannerDraft(
      buildIntakeOnlyAnalysis({
        projectName: "Hydration test",
        projectSource: "defaulted"
      }),
      buildBlankProjectIntake(),
      undefined,
      generatedAt
    );

    expect(draft.updatedAt).toBe(generatedAt);
    expect(draft.launchPlan.generatedAt).toBe(generatedAt);
    expect(draft.launchPlan.markdown).toContain(`Generated: ${generatedAt}`);
  });
});
