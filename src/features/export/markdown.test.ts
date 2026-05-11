import { describe, expect, it } from "vitest";
import type { ChecklistSection, EnvVariable, LaunchPlan } from "@/types/planner";
import {
  exportChecklistMarkdown,
  exportDockerfilesMarkdown,
  exportEnvExampleSuggestion,
  exportLaunchPlanMarkdown,
  exportMetadataMarkdown
} from "./markdown";

describe("exportLaunchPlanMarkdown", () => {
  it("wraps the plan with header and metadata", () => {
    const plan: LaunchPlan = {
      projectName: "TestApp",
      generatedAt: "2025-01-01T00:00:00.000Z",
      sections: [],
      markdown: "## Project Summary\n\nTest content."
    };

    const result = exportLaunchPlanMarkdown(plan);

    expect(result).toContain("# TestApp Launch Plan");
    expect(result).toContain("Test content.");
    expect(result).toContain("2025-01-01T00:00:00.000Z");
  });
});

describe("exportEnvExampleSuggestion", () => {
  it("includes all env vars with descriptions and placeholders", () => {
    const envVars: EnvVariable[] = [
      {
        name: "DATABASE_URL",
        required: true,
        exposure: "server",
        description: "Database connection.",
        source: "detected",
        confidence: "high",
        evidence: []
      },
      {
        name: "NEXT_PUBLIC_KEY",
        required: false,
        exposure: "client",
        description: "Public key.",
        source: "detected",
        confidence: "high",
        evidence: []
      }
    ];

    const result = exportEnvExampleSuggestion(envVars);

    expect(result).toContain("DATABASE_URL=");
    expect(result).toContain("replace-with-production-url");
    expect(result).toContain("NEXT_PUBLIC_KEY=");
    expect(result).toContain("replace-with-public-value");
  });
});

describe("exportChecklistMarkdown", () => {
  it("only includes relevant sections", () => {
    const checklist: ChecklistSection[] = [
      {
        title: "Security",
        relevant: true,
        items: [{ id: "https", text: "HTTPS is active.", requiredBeforeLaunch: true }]
      },
      {
        title: "SEO",
        relevant: false,
        items: [{ id: "sitemap", text: "Sitemap exists.", requiredBeforeLaunch: false }]
      }
    ];

    const result = exportChecklistMarkdown(checklist);

    expect(result).toContain("## Security");
    expect(result).toContain("HTTPS is active.");
    expect(result).not.toContain("## SEO");
    expect(result).not.toContain("Sitemap exists.");
  });

  it("preserves checkboxes", () => {
    const checklist: ChecklistSection[] = [
      {
        title: "Database",
        relevant: true,
        items: [
          { id: "backups", text: "Database backups enabled.", requiredBeforeLaunch: true }
        ]
      }
    ];

    const result = exportChecklistMarkdown(checklist);

    expect(result).toContain("- [ ] Database backups enabled.");
  });
});

describe("exportMetadataMarkdown", () => {
  it("includes project name, repo, and timestamp", () => {
    const plan: LaunchPlan = {
      projectName: "MyApp",
      generatedAt: "2025-06-01T12:00:00.000Z",
      sections: [],
      markdown: ""
    };

    const result = exportMetadataMarkdown(plan, "https://github.com/org/repo");

    expect(result).toContain("project: MyApp");
    expect(result).toContain("repo: https://github.com/org/repo");
    expect(result).toContain("version: shipready-v0");
  });
});

describe("exportDockerfilesMarkdown", () => {
  it("returns null when no Docker is detected", () => {
    const analysis = {
      projectName: { label: "Project", value: "Test", source: "detected" as const, confidence: "high" as const },
      appRoot: { label: "Root", value: ".", source: "detected" as const, confidence: "high" as const },
      envVars: [],
      services: [],
      facts: []
    };

    const result = exportDockerfilesMarkdown(analysis as never);

    expect(result).toBeNull();
  });
});
