import type { RepoFile } from "@/features/repo-analysis/repo-file";
import type {
  AnalysisIssue,
  DockerAnalysis,
  DockerComposeAnalysis,
  DockerComposeService,
  DockerfileAnalysis
} from "@/types/planner";

const COMPOSE_FILE_PATTERN = /(^|\/)(docker-compose|compose)\.ya?ml$/;

export function analyzeDockerFiles(files: RepoFile[]): DockerAnalysis | undefined {
  const dockerfiles = files
    .filter((file) => /^Dockerfile(?:\.|$)/.test(basename(file.path)))
    .map(parseDockerfile);
  const composeFiles = files
    .filter((file) => COMPOSE_FILE_PATTERN.test(file.path))
    .map(parseComposeFile);
  const hasDockerignore = files.some((file) => basename(file.path) === ".dockerignore");

  if (dockerfiles.length === 0 && composeFiles.length === 0 && !hasDockerignore) {
    return undefined;
  }

  const serviceDependencies = [
    ...new Set(
      composeFiles.flatMap((composeFile) => inferComposeDependencies(composeFile))
    )
  ];
  const needsProductionDocker = dockerfiles.some(needsDockerForProduction);
  const probablyLocalOnly =
    composeFiles.length > 0 &&
    serviceDependencies.length > 0 &&
    !dockerfiles.some((dockerfile) => dockerfile.likelyProduction);
  const risks = buildDockerRisks({
    dockerfiles,
    composeFiles,
    hasDockerignore,
    serviceDependencies
  });

  return {
    dockerfiles,
    composeFiles,
    hasDockerignore,
    serviceDependencies,
    needsProductionDocker,
    probablyLocalOnly,
    recommendation: buildDockerRecommendation({
      dockerfiles,
      composeFiles,
      serviceDependencies,
      needsProductionDocker,
      probablyLocalOnly
    }),
    suggestedDockerignore: hasDockerignore ? undefined : defaultDockerignore(),
    risks
  };
}

function parseDockerfile(file: RepoFile): DockerfileAnalysis {
  const lines = logicalDockerfileLines(file.content);
  const baseImages: string[] = [];
  const stages: string[] = [];
  const installSteps: string[] = [];
  const copyInstructions: string[] = [];
  const exposedPorts: string[] = [];
  const envVars: string[] = [];
  const buildArgs: string[] = [];
  let workdir: string | undefined;
  let user: string | undefined;
  let healthcheck: string | undefined;
  let startCommand: string | undefined;

  for (const line of lines) {
    const [instruction = "", ...rest] = line.split(/\s+/);
    const value = rest.join(" ").trim();
    const upperInstruction = instruction.toUpperCase();

    if (upperInstruction === "FROM") {
      const fromMatch = value.match(/^([^\s]+)(?:\s+AS\s+(.+))?/i);
      if (fromMatch) {
        baseImages.push(fromMatch[1]);
        if (fromMatch[2]) stages.push(fromMatch[2]);
      }
    }

    if (
      upperInstruction === "RUN" &&
      /\b(apt-get|apk|yum|dnf|pip|poetry|uv|npm|pnpm|yarn|bun|composer|bundle)\b/.test(
        value
      )
    ) {
      installSteps.push(value);
    }

    if (upperInstruction === "COPY" || upperInstruction === "ADD") {
      copyInstructions.push(value);
    }

    if (upperInstruction === "EXPOSE") {
      exposedPorts.push(...value.split(/\s+/).filter(Boolean));
    }

    if (upperInstruction === "WORKDIR") workdir = value;
    if (upperInstruction === "USER") user = value;
    if (upperInstruction === "HEALTHCHECK") healthcheck = value;

    if (upperInstruction === "ENV") {
      const name = value.match(/^([A-Z][A-Z0-9_]*)/)?.[1];
      if (name) envVars.push(name);
    }

    if (upperInstruction === "ARG") {
      const name = value.match(/^([A-Z][A-Z0-9_]*)/)?.[1];
      if (name) buildArgs.push(name);
    }

    if (upperInstruction === "CMD" || upperInstruction === "ENTRYPOINT") {
      startCommand = value;
    }
  }

  return {
    path: file.path,
    baseImages,
    stages,
    installSteps,
    copyInstructions,
    exposedPorts,
    workdir,
    user,
    envVars,
    buildArgs,
    healthcheck,
    startCommand,
    likelyProduction: isProductionDockerfile({ stages, startCommand })
  };
}

function parseComposeFile(file: RepoFile): DockerComposeAnalysis {
  const lines = file.content.split(/\r?\n/);
  const services: DockerComposeService[] = [];
  const namedVolumes: string[] = [];
  let section: "services" | "volumes" | undefined;
  let currentService: DockerComposeService | undefined;
  let currentListKey:
    | keyof Pick<
        DockerComposeService,
        "ports" | "volumes" | "envFiles" | "dependsOn" | "networks"
      >
    | undefined;
  let currentObjectKey: "build" | "healthcheck" | undefined;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) continue;

    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const trimmed = line.trim();

    if (indent === 0 && trimmed === "services:") {
      section = "services";
      currentService = undefined;
      continue;
    }

    if (indent === 0 && trimmed === "volumes:") {
      section = "volumes";
      currentService = undefined;
      continue;
    }

    if (section === "volumes" && indent === 2 && trimmed.endsWith(":")) {
      namedVolumes.push(trimmed.slice(0, -1));
      continue;
    }

    if (section !== "services") continue;

    if (indent === 2 && trimmed.endsWith(":")) {
      currentService = {
        name: trimmed.slice(0, -1),
        ports: [],
        volumes: [],
        envFiles: [],
        dependsOn: [],
        networks: []
      };
      services.push(currentService);
      currentListKey = undefined;
      currentObjectKey = undefined;
      continue;
    }

    if (!currentService || indent < 4) continue;

    if (trimmed.startsWith("- ")) {
      if (currentListKey) {
        currentService[currentListKey].push(unquote(trimmed.slice(2).trim()));
      }
      continue;
    }

    const keyMatch = trimmed.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!keyMatch) continue;

    const [, key, rawValue] = keyMatch;
    const value = unquote(rawValue.trim());
    currentListKey = undefined;

    if (key === "image") currentService.image = value;
    if (key === "ports") currentListKey = "ports";
    if (key === "volumes") currentListKey = "volumes";
    if (key === "env_file") currentListKey = "envFiles";
    if (key === "depends_on") currentListKey = "dependsOn";
    if (key === "networks") currentListKey = "networks";

    if (key === "build") {
      currentObjectKey = "build";
      if (value) currentService.buildContext = value;
      continue;
    }

    if (key === "healthcheck") {
      currentObjectKey = "healthcheck";
      currentService.healthcheck = "configured";
      continue;
    }

    if (currentObjectKey === "build" && key === "context") {
      currentService.buildContext = value;
    }

    if (currentObjectKey === "build" && key === "dockerfile") {
      currentService.dockerfile = value;
    }

    if (currentObjectKey === "healthcheck" && key === "test") {
      currentService.healthcheck = value;
    }
  }

  return {
    path: file.path,
    services,
    namedVolumes
  };
}

function inferComposeDependencies(composeFile: DockerComposeAnalysis) {
  const dependencies: string[] = [];

  for (const service of composeFile.services) {
    const text = `${service.name} ${service.image ?? ""}`.toLowerCase();

    if (/postgres|postgis/.test(text)) dependencies.push("Postgres");
    if (/mysql|mariadb/.test(text)) dependencies.push("MySQL");
    if (/redis|valkey/.test(text)) dependencies.push("Redis");
    if (/mongo/.test(text)) dependencies.push("MongoDB");
    if (/minio/.test(text)) dependencies.push("S3-compatible storage");
    if (/mailhog|mailpit|smtp/.test(text)) dependencies.push("Local SMTP");
    if (/rabbitmq/.test(text)) dependencies.push("RabbitMQ queue");
    if (/elastic|opensearch|meilisearch/.test(text)) dependencies.push("Search service");
  }

  return dependencies;
}

function needsDockerForProduction(dockerfile: DockerfileAnalysis) {
  const baseImages = dockerfile.baseImages.join(" ").toLowerCase();
  const installSteps = dockerfile.installSteps.join(" ").toLowerCase();

  return (
    dockerfile.likelyProduction &&
    (dockerfile.stages.length > 0 ||
      /python|ruby|php|golang|openjdk/.test(baseImages) ||
      /apt-get|apk|yum|dnf|pip|poetry|composer|bundle/.test(installSteps))
  );
}

function isProductionDockerfile(input: { stages: string[]; startCommand?: string }) {
  const command = input.startCommand?.toLowerCase() ?? "";

  if (/\b(dev|next dev|vite --host|npm run dev|pnpm dev|yarn dev)\b/.test(command)) {
    return false;
  }

  return input.stages.length > 0 || Boolean(command);
}

function buildDockerRisks(input: {
  dockerfiles: DockerfileAnalysis[];
  composeFiles: DockerComposeAnalysis[];
  hasDockerignore: boolean;
  serviceDependencies: string[];
}): AnalysisIssue[] {
  const risks: AnalysisIssue[] = [];

  for (const dockerfile of input.dockerfiles) {
    if (!input.hasDockerignore) {
      risks.push({
        id: `dockerignore-missing-${slug(dockerfile.path)}`,
        severity: "medium",
        title: "Missing .dockerignore",
        description:
          "Docker builds may copy local secrets, node_modules, caches, logs, or test output into the image.",
        evidence: [
          { path: dockerfile.path, detail: "Dockerfile exists without .dockerignore" }
        ]
      });
    }

    if (!dockerfile.user || dockerfile.user === "root") {
      risks.push({
        id: `docker-root-user-${slug(dockerfile.path)}`,
        severity: "medium",
        title: "Container runs as root",
        description:
          "No non-root runtime user was detected in the Dockerfile final stage.",
        evidence: [{ path: dockerfile.path, detail: "USER instruction missing or root" }]
      });
    }

    if (dockerfile.exposedPorts.length === 0) {
      risks.push({
        id: `docker-port-missing-${slug(dockerfile.path)}`,
        severity: "low",
        title: "Docker exposed port is ambiguous",
        description:
          "No EXPOSE instruction was found. The hosting provider may need an explicit port setting.",
        evidence: [{ path: dockerfile.path, detail: "EXPOSE instruction missing" }]
      });
    }

    if (!dockerfile.healthcheck) {
      risks.push({
        id: `docker-healthcheck-missing-${slug(dockerfile.path)}`,
        severity: "low",
        title: "Docker health check is missing",
        description:
          "No container health check was detected. Add one when the platform supports it.",
        evidence: [{ path: dockerfile.path, detail: "HEALTHCHECK instruction missing" }]
      });
    }

    if (dockerfile.startCommand && /\bdev\b/.test(dockerfile.startCommand)) {
      risks.push({
        id: `docker-dev-command-${slug(dockerfile.path)}`,
        severity: "high",
        title: "Dockerfile starts a dev server",
        description:
          "The final container command appears to use a development server. Do not use this for production.",
        evidence: [{ path: dockerfile.path, detail: dockerfile.startCommand }]
      });
    }
  }

  if (
    input.serviceDependencies.some((dependency) =>
      /Postgres|MySQL|MongoDB/.test(dependency)
    )
  ) {
    risks.push({
      id: "compose-database-production-risk",
      severity: "medium",
      title: "Compose database should be treated as local development",
      description:
        "A database service was detected in Docker Compose. Use a managed production database unless the user explicitly wants self-hosting.",
      evidence: input.composeFiles.map((composeFile) => ({
        path: composeFile.path,
        detail: "Database-like compose service detected"
      }))
    });
  }

  return risks;
}

function buildDockerRecommendation(input: {
  dockerfiles: DockerfileAnalysis[];
  composeFiles: DockerComposeAnalysis[];
  serviceDependencies: string[];
  needsProductionDocker: boolean;
  probablyLocalOnly: boolean;
}) {
  if (input.needsProductionDocker) {
    return "Docker can be a reasonable production path for this app. Prefer Render, Railway, or Fly.io, and use managed databases instead of database containers.";
  }

  if (input.probablyLocalOnly) {
    return "Docker Compose looks useful for local services, but it should not drive the primary production recommendation.";
  }

  if (input.dockerfiles.length > 0) {
    return "Docker is present, but provider framework defaults may still be simpler unless the Dockerfile captures required runtime behavior.";
  }

  if (input.composeFiles.length > 0 && input.serviceDependencies.length > 0) {
    return "Compose service dependencies should be translated into managed production services.";
  }

  return "No production Docker recommendation is needed.";
}

function logicalDockerfileLines(content: string) {
  const joined: string[] = [];
  let pending = "";

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.endsWith("\\")) {
      pending += `${line.slice(0, -1)} `;
    } else {
      joined.push(`${pending}${line}`.trim());
      pending = "";
    }
  }

  if (pending) joined.push(pending.trim());

  return joined;
}

function defaultDockerignore() {
  return [
    "node_modules",
    ".git",
    ".env",
    ".env.*",
    "!.env.example",
    ".next",
    "dist",
    "build",
    "coverage",
    "*.log",
    ".cache",
    ".turbo",
    "__pycache__",
    ".pytest_cache"
  ].join("\n");
}

function unquote(value: string) {
  return value.replace(/^["']|["']$/g, "");
}

function basename(path: string) {
  return path.split("/").at(-1) ?? path;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
