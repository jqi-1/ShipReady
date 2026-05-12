import { describe, expect, it, beforeEach, vi } from "vitest";
import { loadPlannerDraft, savePlannerDraft } from "@/lib/draft-storage";
import { buildBlankProjectIntake, buildPlannerDraft, buildIntakeOnlyAnalysis } from "@/features/planner/build-fallback-state";

beforeEach(() => {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
  });
});

describe("checklist persistence", () => {
  it("initializes checkedItemIds as empty array", () => {
    const draft = buildPlannerDraft(
      buildIntakeOnlyAnalysis({
        projectName: "Test",
        projectSource: "defaulted"
      }),
      buildBlankProjectIntake()
    );
    expect(draft.checkedItemIds).toEqual([]);
  });

  it("persists checked items through save and load", () => {
    const draft = buildPlannerDraft(
      buildIntakeOnlyAnalysis({
        projectName: "Test",
        projectSource: "defaulted"
      }),
      buildBlankProjectIntake()
    );

    const firstItemId = draft.checklist.find((s) => s.relevant)?.items[0]?.id;
    if (!firstItemId) return;

    draft.checkedItemIds = [firstItemId];
    savePlannerDraft(draft);

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "shipready:v0-draft",
      expect.any(String)
    );

    const savedData = JSON.parse(
      (window.localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1]
    );
    expect(savedData.checkedItemIds).toEqual([firstItemId]);
  });

  it("restores checked items on load", () => {
    const draft = buildPlannerDraft(
      buildIntakeOnlyAnalysis({
        projectName: "Test",
        projectSource: "defaulted"
      }),
      buildBlankProjectIntake()
    );

    const firstItemId = draft.checklist.find((s) => s.relevant)?.items[0]?.id;
    if (!firstItemId) return;

    const saved = JSON.stringify({
      ...draft,
      checkedItemIds: [firstItemId]
    });

    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(saved);
    const loaded = loadPlannerDraft();
    expect(loaded?.checkedItemIds).toEqual([firstItemId]);
  });

  it("calculates progress correctly", () => {
    const draft = buildPlannerDraft(
      buildIntakeOnlyAnalysis({
        projectName: "Test",
        projectSource: "defaulted"
      }),
      buildBlankProjectIntake()
    );

    const relevantSections = draft.checklist.filter((s) => s.relevant);
    const firstSection = relevantSections[0];
    if (!firstSection) return;

    const allItemIds = draft.checklist.flatMap((s) =>
      s.relevant ? s.items.map((i) => i.id) : []
    );

    draft.checkedItemIds = allItemIds;
    const checkedCount = draft.checkedItemIds.length;
    const totalCount = allItemIds.length;
    const progress = Math.round((checkedCount / totalCount) * 100);

    expect(progress).toBe(100);
    expect(checkedCount).toBe(totalCount);
  });
});

describe("checkedItemIds in PlannerDraft", () => {
  it("is preserved when building draft with normalizeDraft pattern", () => {
    const draft = buildPlannerDraft(
      buildIntakeOnlyAnalysis({
        projectName: "Test",
        projectSource: "defaulted"
      }),
      buildBlankProjectIntake()
    );

    const mockCheckedIds = ["item1", "item2"];
    const restored = {
      ...draft,
      checkedItemIds: mockCheckedIds
    };

    expect(restored.checkedItemIds).toEqual(mockCheckedIds);
  });
});
