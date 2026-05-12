import { describe, expect, it, beforeEach } from "vitest";
import {
  getCachedAnalysis,
  setCachedAnalysis,
  invalidateCache
} from "./analysis-cache";
import type { RepoAnalysis } from "@/types/planner";

const mockAnalysis: RepoAnalysis = {
  projectName: {
    label: "Project",
    value: "Test",
    source: "detected",
    confidence: "high"
  },
  appRoot: {
    label: "Root",
    value: ".",
    source: "detected",
    confidence: "high"
  },
  envVars: [],
  services: [],
  facts: []
};

describe("analysis cache", () => {
  beforeEach(() => {
    invalidateCache("test-key");
  });

  it("returns null for missing cache key", () => {
    const result = getCachedAnalysis("nonexistent");
    expect(result).toBeNull();
  });

  it("stores and retrieves analysis", () => {
    setCachedAnalysis("test-key", mockAnalysis, false);
    const result = getCachedAnalysis("test-key");
    expect(result).not.toBeNull();
    expect(result!.analysis.projectName.value).toBe("Test");
    expect(result!.truncated).toBe(false);
  });

  it("stores and retrieves truncated flag", () => {
    setCachedAnalysis("test-key", mockAnalysis, true);
    const result = getCachedAnalysis("test-key");
    expect(result!.truncated).toBe(true);
  });

  it("returns null after invalidation", () => {
    setCachedAnalysis("test-key", mockAnalysis, false);
    invalidateCache("test-key");
    const result = getCachedAnalysis("test-key");
    expect(result).toBeNull();
  });
});
