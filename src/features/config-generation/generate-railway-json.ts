import type { RepoAnalysis } from "@/types/planner";

interface RailwayJson {
  $schema: string;
  build?: {
    builder: "NIXPACKS" | "DOCKERFILE";
    buildCommand?: string;
    startCommand?: string;
    watchPatterns?: string[];
  };
  deploy?: {
    numReplicas?: number;
    restartPolicyMaxRetries?: number;
    healthcheckPath?: string;
    healthcheckTimeout?: number;
  };
}

export function generateRailwayJson(analysis: RepoAnalysis): string {
  const config: RailwayJson = {
    $schema: "https://railway.app/railway.schema.json"
  };

  const hasDocker = analysis.docker?.dockerfiles.length ?? 0 > 0;

  config.build = {
    builder: hasDocker ? "DOCKERFILE" : "NIXPACKS"
  };

  if (analysis.buildCommand?.value) {
    config.build.buildCommand = analysis.buildCommand.value;
  }

  if (analysis.startCommand?.value) {
    config.build.startCommand = analysis.startCommand.value;
  }

  const hasBackend = Boolean(analysis.backendFramework?.value);
  if (hasBackend) {
    config.deploy = {
      healthcheckPath: "/health",
      healthcheckTimeout: 300,
      restartPolicyMaxRetries: 3
    };
  }

  return JSON.stringify(config, null, 2);
}
