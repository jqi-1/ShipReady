import type { RepoAnalysis } from "@/types/planner";

interface RenderService {
  type: "web" | "worker" | "cron";
  name: string;
  env: "static" | "node" | "python" | "docker";
  buildCommand?: string;
  startCommand?: string;
  healthCheckPath?: string;
  envVars?: Array<{ key: string; value: string }>;
}

interface RenderYaml {
  services: RenderService[];
}

export function generateRenderYaml(analysis: RepoAnalysis): string {
  const config: RenderYaml = {
    services: []
  };

  const env = detectEnv(analysis);
  const service: RenderService = {
    type: "web",
    name: "web",
    env
  };

  if (analysis.buildCommand?.value) {
    service.buildCommand = analysis.buildCommand.value;
  }

  if (analysis.startCommand?.value) {
    service.startCommand = analysis.startCommand.value;
  }

  if (env !== "static") {
    service.healthCheckPath = "/health";
  }

  const requiredVars = analysis.envVars
    .filter((v) => v.required)
    .slice(0, 10);
  if (requiredVars.length > 0) {
    service.envVars = requiredVars.map((v) => ({
      key: v.name,
      value: v.exposure === "client" ? "public" : "sync"
    }));
  }

  config.services.push(service);

  return `# Render deployment configuration\n# https://render.com/docs/\n${yamlStringify(config)}`;
}

function detectEnv(analysis: RepoAnalysis): RenderService["env"] {
  const runtime = (analysis.runtime?.value ?? "").toLowerCase();
  if (runtime.includes("python")) return "python";
  if (analysis.docker?.dockerfiles.length) return "docker";
  if (runtime.includes("node")) return "node";
  if (!analysis.backendFramework?.value) return "static";
  return "node";
}

function yamlStringify(config: RenderYaml): string {
  const lines: string[] = [];
  lines.push("services:");
  for (const service of config.services) {
    lines.push(`  - type: ${service.type}`);
    lines.push(`    name: ${service.name}`);
    lines.push(`    env: ${service.env}`);
    if (service.buildCommand) {
      lines.push(`    buildCommand: "${service.buildCommand}"`);
    }
    if (service.startCommand) {
      lines.push(`    startCommand: "${service.startCommand}"`);
    }
    if (service.healthCheckPath) {
      lines.push(`    healthCheckPath: ${service.healthCheckPath}`);
    }
    if (service.envVars && service.envVars.length > 0) {
      lines.push("    envVars:");
      for (const v of service.envVars) {
        lines.push(`      - key: ${v.key}`);
        lines.push(`        value: ${v.value}`);
      }
    }
  }
  return lines.join("\n");
}
