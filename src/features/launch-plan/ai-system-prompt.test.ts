import { describe, expect, it } from "vitest";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";
import {
  buildAiSystemPrompt,
  buildAiUserMessage,
  parseAiResponse,
  buildMarkdownFromAiSections,
  buildAiDraft
} from "./ai-system-prompt";
import { LAUNCH_PLAN_SECTION_TITLES } from "./sections";
import type { LaunchPlanSection } from "@/types/planner";

describe("buildAiSystemPrompt", () => {
  it("includes project name from analysis", () => {
    const prompt = buildAiSystemPrompt(demoProjectAnalysis, demoProjectIntake);
    expect(prompt).toContain(demoProjectAnalysis.projectName.value);
  });

  it("includes detected framework and package manager", () => {
    const prompt = buildAiSystemPrompt(demoProjectAnalysis, demoProjectIntake);
    expect(prompt).toContain("Next.js");
    expect(prompt).toContain("pnpm");
  });

  it("includes all 19 section headers", () => {
    const prompt = buildAiSystemPrompt(demoProjectAnalysis, demoProjectIntake);
    const sections = [
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
    ];
    for (const section of sections) {
      expect(prompt).toContain(section);
    }
  });

  it("includes user intake answers", () => {
    const prompt = buildAiSystemPrompt(demoProjectAnalysis, demoProjectIntake);
    expect(prompt).toContain("saas");
    expect(prompt).toContain("comfortable");
  });

  it("includes detected services when present", () => {
    const prompt = buildAiSystemPrompt(demoProjectAnalysis, demoProjectIntake);
    expect(prompt).toContain("Stripe");
    expect(prompt).toContain("PostHog");
  });

  it("includes env vars when present", () => {
    const prompt = buildAiSystemPrompt(demoProjectAnalysis, demoProjectIntake);
    expect(prompt).toContain("DATABASE_URL");
  });
});

describe("buildAiUserMessage", () => {
  it("includes project name", () => {
    const msg = buildAiUserMessage(demoProjectAnalysis);
    expect(msg).toContain(demoProjectAnalysis.projectName.value);
  });
});

describe("buildAiDraft", () => {
  it("returns system and user messages", () => {
    const draft = buildAiDraft(demoProjectAnalysis, demoProjectIntake);
    expect(draft.system).toContain("production deployment advisor");
    expect(draft.user).toContain(demoProjectAnalysis.projectName.value);
  });
});

describe("parseAiResponse", () => {
  it("parses valid JSON with sections", () => {
    const raw = JSON.stringify({
      sections: LAUNCH_PLAN_SECTION_TITLES.map((title) => ({
        title,
        body: `${title} content.`
      }))
    });
    const result = parseAiResponse(raw);
    expect(result).not.toBeNull();
    expect(result!.sections).toHaveLength(19);
  });

  it("extracts JSON from a fenced response", () => {
    const raw = `\`\`\`json\n${JSON.stringify({
      sections: LAUNCH_PLAN_SECTION_TITLES.map((title) => ({
        title,
        body: `${title} content.`
      }))
    })}\n\`\`\``;
    const result = parseAiResponse(raw);
    expect(result).not.toBeNull();
    expect(result!.sections[0].title).toBe("Project Summary");
  });

  it("returns null for invalid JSON", () => {
    const result = parseAiResponse("not json at all");
    expect(result).toBeNull();
  });

  it("returns null for missing sections array", () => {
    const result = parseAiResponse(JSON.stringify({ foo: "bar" }));
    expect(result).toBeNull();
  });

  it("returns null for incomplete sections array", () => {
    const result = parseAiResponse(JSON.stringify({ sections: [] }));
    expect(result).toBeNull();
  });

  it("returns null when sections lack title or body", () => {
    const result = parseAiResponse(
      JSON.stringify({
        sections: LAUNCH_PLAN_SECTION_TITLES.map((title, index) =>
          index === 0 ? { title } : { title, body: `${title} content.` }
        )
      })
    );
    expect(result).toBeNull();
  });

  it("returns null when section order is wrong", () => {
    const sections = LAUNCH_PLAN_SECTION_TITLES.map((title) => ({
      title,
      body: `${title} content.`
    }));
    const result = parseAiResponse(
      JSON.stringify({ sections: [sections[1], sections[0], ...sections.slice(2)] })
    );
    expect(result).toBeNull();
  });
});

describe("buildMarkdownFromAiSections", () => {
  it("converts sections to markdown with ## headers", () => {
    const sections: LaunchPlanSection[] = [
      { title: "Section One", body: "Body one." },
      { title: "Section Two", body: "Body two." }
    ];
    const md = buildMarkdownFromAiSections(sections);
    expect(md).toContain("## Section One");
    expect(md).toContain("Body one.");
    expect(md).toContain("## Section Two");
    expect(md).toContain("Body two.");
  });
});
