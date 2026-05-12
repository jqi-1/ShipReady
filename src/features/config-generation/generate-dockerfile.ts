import type { RepoAnalysis } from "@/types/planner";

export function generateDockerfile(analysis: RepoAnalysis): string {
  const runtime = (analysis.runtime?.value ?? "").toLowerCase();
  const pm = analysis.packageManager?.value ?? "npm";
  const installCmd = pm === "npm" ? "npm ci --omit=dev" : `${pm} install --frozen-lockfile`;
  const buildCmd = analysis.buildCommand?.value ?? "npm run build";
  const startCmd = analysis.startCommand?.value ?? "npm start";
  const port = detectPort(analysis);

  if (runtime.includes("python")) {
    return generatePythonDockerfile(port);
  }

  return generateNodeDockerfile(installCmd, buildCmd, startCmd, port, pm);
}

function detectPort(analysis: RepoAnalysis): string {
  if (analysis.docker?.dockerfiles[0]?.exposedPorts[0]) {
    return analysis.docker.dockerfiles[0].exposedPorts[0];
  }
  const framework = analysis.frontendFramework?.value ?? "";
  if (framework === "Next.js") return "3000";
  if (framework === "Vite") return "5173";
  if (framework === "Astro") return "4321";
  if (framework === "SvelteKit") return "5173";
  if (framework === "Nuxt") return "3000";
  return "3000";
}

function generateNodeDockerfile(
  installCmd: string,
  buildCmd: string,
  startCmd: string,
  port: string,
  pm: string
): string {
  return [
    `FROM node:20-alpine AS base`,
    `WORKDIR /app`,
    ``,
    `FROM base AS deps`,
    `COPY package*.json ${pm === "pnpm" ? "pnpm-lock.yaml" : ""} ${pm === "yarn" ? "yarn.lock" : ""} ./`,
    `RUN ${installCmd}`,
    ``,
    `FROM base AS runner`,
    `COPY --from=deps /app/node_modules ./node_modules`,
    `COPY . .`,
    ``,
    `ENV NODE_ENV=production`,
    `EXPOSE ${port}`,
    ``,
    `USER node`,
    `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\`,
    `  CMD wget --no-verbose --tries=1 --spider http://localhost:${port}/ || exit 1`,
    ``,
    `CMD ["${startCmd.startsWith("npx ") ? startCmd.slice(4) : startCmd}"]`
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function generatePythonDockerfile(port: string): string {
  return [
    `FROM python:3.12-slim AS base`,
    `WORKDIR /app`,
    ``,
    `ENV PYTHONDONTWRITEBYTECODE=1`,
    `ENV PYTHONUNBUFFERED=1`,
    ``,
    `FROM base AS deps`,
    `COPY requirements.txt .`,
    `RUN pip install --no-cache-dir -r requirements.txt`,
    ``,
    `FROM base AS runner`,
    `COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages`,
    `COPY . .`,
    ``,
    `ENV NODE_ENV=production`,
    `EXPOSE ${port}`,
    ``,
    `USER nobody`,
    `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\`,
    `  CMD wget --no-verbose --tries=1 --spider http://localhost:${port}/ || exit 1`,
    ``,
    `CMD ["python", "app.py"]`
  ].join("\n");
}
