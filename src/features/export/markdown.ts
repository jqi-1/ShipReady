import { placeholderFor } from "@/features/repo-analysis/env-detection";
import type {
  ChecklistSection,
  EnvVariable,
  LaunchPlan,
  RepoAnalysis
} from "@/types/planner";

export function exportLaunchPlanMarkdown(plan: LaunchPlan) {
  return [
    `# ${plan.projectName} Launch Plan`,
    "",
    `Generated: ${plan.generatedAt}`,
    "",
    plan.markdown
  ].join("\n");
}

export function exportEnvExampleSuggestion(
  envVars: EnvVariable[],
  existingContent?: string
) {
  const blocks: string[] = [];

  if (existingContent) {
    blocks.push(existingContent.trim());
  }

  const existingNames = existingContent
    ? new Set(
        [...existingContent.matchAll(/^([A-Z][A-Z0-9_]*)\s*=/gm)].map((m) => m[1])
      )
    : new Set<string>();
  const missingVars = existingContent
    ? envVars.filter((envVar) => !existingNames.has(envVar.name))
    : envVars;

  if (missingVars.length > 0) {
    blocks.push(
      missingVars
        .map(
          (envVar) =>
            `# ${envVar.description}${envVar.required ? " Required in production." : " Optional."}\n${envVar.name}=${placeholderFor(envVar)}`
        )
        .join("\n\n")
    );
  }

  if (blocks.length === 0) return "";
  return `${blocks.join("\n\n")}\n`;
}

export function exportChecklistMarkdown(checklist: ChecklistSection[]) {
  return checklist
    .filter((section) => section.relevant)
    .map(
      (section) =>
        `## ${section.title}\n\n${section.items.map((item) => `- [ ] ${item.text}`).join("\n")}`
    )
    .join("\n\n");
}

export function exportDockerfilesMarkdown(analysis: RepoAnalysis) {
  const docker = analysis.docker;
  if (!docker) return null;

  const sections: string[] = [];

  if (!docker.hasDockerignore) {
    sections.push(
      `## Suggested .dockerignore\n\n\`\`\`\nnode_modules\n.git\n.env\n.env.local\n.env.*.local\n.next\ndist\nbuild\n*.log\n.cache\ntest\ncoverage\n.nyc_output\n*.tsbuildinfo\nnext-env.d.ts\n\`\`\``
    );
  }

  const dockerfile = docker.dockerfiles[0];
  const isNodeRuntime =
    analysis.runtime?.value && /^node/i.test(analysis.runtime.value);
  if (dockerfile && isNodeRuntime) {
    sections.push(
      `## Suggested Dockerfile improvements\n\`\`\`dockerfile\nFROM node:20-alpine AS base\nWORKDIR /app\n\nFROM base AS deps\nCOPY package*.json ./\nRUN npm ci --omit=dev\n\nFROM base AS runner\nCOPY --from=deps /app/node_modules ./node_modules\nCOPY . .\n\nENV NODE_ENV=production\nEXPOSE 3000\n\nUSER node\nHEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\\\n  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1\n\nCMD ["node", "server.js"]\n\`\`\``
    );
  }

  return sections.length > 0 ? sections.join("\n\n") : null;
}

export function exportMetadataMarkdown(plan: LaunchPlan, repoUrl?: string) {
  return [
    "---",
    `project: ${plan.projectName}`,
    repoUrl ? `repo: ${repoUrl}` : null,
    `generated: ${plan.generatedAt}`,
    `mode: ${plan.generationMode}`,
    "version: shipready-v0",
    "---"
  ]
    .filter(Boolean)
    .join("\n");
}


