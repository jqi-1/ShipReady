import type { RepoAnalysis, ProjectIntake, LaunchPlanSection } from "@/types/planner";
import { LAUNCH_PLAN_SECTION_TITLES } from "@/features/launch-plan/sections";

export function buildAiSystemPrompt(
  analysis: RepoAnalysis,
  intake: ProjectIntake
): string {
  return `You are a production deployment advisor. Given a repo analysis and user-provided project details, generate a deployment plan.

Generate a JSON object with a "sections" array containing exactly 19 objects, each with "title" and "body". The sections must appear in this exact order:

${LAUNCH_PLAN_SECTION_TITLES.map((title, i) => `${i + 1}. ${title}`).join("\n")}

Rules:
- Use the repo analysis facts and user intake answers below to generate specific, actionable steps.
- Be practical and opinionated. Prefer simple managed infrastructure. Do not recommend Kubernetes or overengineered setups.
- Every section must have a body string. Use markdown formatting in bodies.
- Flag specific risks, missing items, and dangerous omissions.
- Generate concrete checklist items with requiredBeforeLaunch flag.
- Estimate costs at prototype, 1k, 10k, and 100k MAU tiers.
- The final output must be valid JSON with exactly this structure:
{
  "sections": [
    { "title": "Project Summary", "body": "..." },
    { "title": "Detected Stack", "body": "..." }
  ],
  "risks": [
    { "title": "...", "severity": "high|medium|low", "description": "...", "fix": "...", "launchBlocker": true|false }
  ],
  "checklist": [
    { "section": "...", "items": [{ "text": "...", "requiredBeforeLaunch": true|false }] }
  ],
  "costEstimate": {
    "caveat": "...",
    "tiers": [
      { "tier": "prototype|1k_mau|10k_mau|100k_mau", "label": "...", "monthlyRange": "...", "assumptions": ["..."], "categories": {} }
    ],
    "upgradeTriggers": [
      { "service": "...", "limit": "...", "consequence": "..." }
    ]
  }
}

Repo Analysis:
- Project name: ${analysis.projectName.value}
- App root: ${analysis.appRoot.value} (${analysis.appRoot.confidence})
- Package manager: ${analysis.packageManager?.value ?? "unknown"}
- Frontend framework: ${analysis.frontendFramework?.value ?? "unknown"}
- Backend framework: ${analysis.backendFramework?.value ?? "none detected"}
- Build command: ${analysis.buildCommand?.value ?? "unknown"}
- Start command: ${analysis.startCommand?.value ?? "unknown"}
- Runtime: ${analysis.runtime?.value ?? "unknown"}
- Monorepo: ${analysis.isMonorepo?.value ?? "unknown"}
- Environment variables found: ${analysis.envVars.map((e) => e.name).join(", ") || "none"}
- Services detected: ${analysis.services.map((s) => `${s.name} (${s.category})`).join(", ") || "none"}
- Has Docker: ${analysis.docker ? "yes" : "no"}
${analysis.docker ? `- Docker recommendation: ${analysis.docker.recommendation}` : ""}

User Intake:
- App type: ${intake.appType}
- Expected traffic: ${intake.traffic}
- Monthly budget: ${intake.budget}
- Technical comfort: ${intake.comfort}
- Top priority: ${intake.priority}
- Needs backend: ${intake.needsBackend}
- Needs auth: ${intake.needsAuth}
- Needs database: ${intake.needsDatabase}
- Needs file uploads: ${intake.needsFileUploads}
- Needs email: ${intake.needsEmail}
- Needs payments: ${intake.needsPayments}
- Needs background jobs: ${intake.needsBackgroundJobs}
- Needs real-time: ${intake.needsRealtime}
- Needs custom domain: ${intake.needsCustomDomain}
- Stores personal data: ${intake.storesPersonalData}
- Needs SEO: ${intake.needsSeo}
- Compliance: ${intake.compliance}
- Deployment status: ${intake.deploymentStatus}
- Domain status: ${intake.domainStatus}
- Audience: ${intake.audience}`;
}

export function buildAiUserMessage(analysis: RepoAnalysis): string {
  return `Generate a production deployment plan for ${analysis.projectName.value} using the repo analysis and intake details above. Return valid JSON with the "sections" array, "risks", "checklist", and "costEstimate" fields as specified.`;
}

export interface AiPlanResponse {
  sections: LaunchPlanSection[];
  risks?: Array<{
    title: string;
    severity: string;
    description: string;
    fix: string;
    launchBlocker: boolean;
  }>;
  checklist?: Array<{
    section: string;
    items: Array<{ text: string; requiredBeforeLaunch: boolean }>;
  }>;
  costEstimate?: {
    caveat: string;
    tiers: Array<{
      tier: string;
      label: string;
      monthlyRange: string;
      assumptions: string[];
      categories: Record<string, string>;
    }>;
    upgradeTriggers: Array<{
      service: string;
      limit: string;
      consequence: string;
    }>;
  };
}

export function parseAiResponse(raw: string): AiPlanResponse | null {
  try {
    const parsed = JSON.parse(extractJsonObject(raw));
    if (
      !parsed.sections ||
      !Array.isArray(parsed.sections) ||
      parsed.sections.length !== LAUNCH_PLAN_SECTION_TITLES.length
    ) {
      return null;
    }
    for (const [index, section] of parsed.sections.entries()) {
      if (
        section.title !== LAUNCH_PLAN_SECTION_TITLES[index] ||
        typeof section.body !== "string" ||
        section.body.trim().length === 0
      ) {
        return null;
      }
    }
    return parsed as AiPlanResponse;
  } catch {
    return null;
  }
}

export function buildMarkdownFromAiSections(sections: LaunchPlanSection[]): string {
  return sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
}

export function buildAiDraft(
  analysis: RepoAnalysis,
  intake: ProjectIntake
): { system: string; user: string } {
  return {
    system: buildAiSystemPrompt(analysis, intake),
    user: buildAiUserMessage(analysis)
  };
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return trimmed;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}
