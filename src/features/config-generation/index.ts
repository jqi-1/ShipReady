import type { RepoAnalysis } from "@/types/planner";
import { generateVercelJson } from "./generate-vercel-json";
import { generateDockerfile } from "./generate-dockerfile";
import { generateDockerignore } from "./generate-dockerignore";
import { generateRenderYaml } from "./generate-render-yaml";
import { generateRailwayJson } from "./generate-railway-json";
import { generateCiWorkflow } from "./generate-ci-workflow";

export interface GeneratedConfig {
  fileName: string;
  content: string;
}

export function generateConfigs(
  analysis: RepoAnalysis
): GeneratedConfig[] {
  const configs: GeneratedConfig[] = [];

  const framework = analysis.frontendFramework?.value ?? "";
  const runtime = analysis.runtime?.value ?? "";

  const isJsTs = /^node/i.test(runtime);
  const isPython = /^python/i.test(runtime);
  const hasDocker = (analysis.docker?.dockerfiles.length ?? 0) > 0;

  if (framework) {
    configs.push({
      fileName: "vercel.json",
      content: generateVercelJson(analysis)
    });
  }

  if (isJsTs || isPython) {
    configs.push({
      fileName: "Dockerfile",
      content: generateDockerfile(analysis)
    });
    configs.push({
      fileName: ".dockerignore",
      content: generateDockerignore()
    });
  }

  if (isJsTs || isPython || hasDocker) {
    configs.push({
      fileName: "render.yaml",
      content: generateRenderYaml(analysis)
    });
    configs.push({
      fileName: "railway.json",
      content: generateRailwayJson(analysis)
    });
  }

  configs.push({
    fileName: ".github/workflows/ci.yml",
    content: generateCiWorkflow(analysis)
  });

  return configs;
}
