import { slug } from "@/lib/commands";
import {
  detectEnvironmentVariables,
  detectHardcodedSecrets
} from "@/features/repo-analysis/env-detection";
import { analyzeDockerFiles } from "@/features/repo-analysis/docker-analysis";
import type { RepoFile } from "@/features/repo-analysis/repo-file";
import {
  detectServiceUsage,
  mergeServiceDetections
} from "@/features/repo-analysis/service-detection";
import type {
  AnalysisIssue,
  CandidateAppRoot,
  DeploymentFact,
  Evidence,
  RepoAnalysis,
  ServiceDetection
} from "@/types/planner";

interface AnalyzeRepoOptions {
  repoUrl?: string;
  defaultBranch?: string;
}

interface PackageManifest {
  name?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
}

const ROOT_MARKER_FILES = new Set([
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "Gemfile",
  "composer.json"
]);

const DEPLOY_CONFIG_FILES = [
  "vercel.json",
  "netlify.toml",
  "render.yaml",
  "render.yml",
  "railway.json",
  "fly.toml",
  "app.yaml"
];

const CI_CONFIG_PATTERNS = [
  /^\.github\/workflows\/[^/]+\.ya?ml$/,
  /^\.gitlab-ci\.ya?ml$/,
  /^\.circleci\/config\.ya?ml$/
];

export function analyzeRepoFiles(
  inputFiles: RepoFile[],
  options: AnalyzeRepoOptions = {}
): RepoAnalysis {
  const files = normalizeFiles(inputFiles);
  const fileMap = new Map(files.map((file) => [file.path, file]));
  const candidateAppRoots = detectCandidateAppRoots(files);
  const selectedRoot = selectAppRoot(candidateAppRoots);
  const packageJson = readPackageJson(fileMap, joinPath(selectedRoot, "package.json"));
  const dependencies = collectPackageDependencies(packageJson);
  const projectName = detectProjectName(packageJson, options.repoUrl);
  const packageManager = detectPackageManager(files, selectedRoot);
  const frontendFramework = detectFrontendFramework(files, selectedRoot, dependencies);
  const backendFramework = detectBackendFramework(files, selectedRoot, dependencies);
  const buildCommand = detectBuildCommand(packageJson, packageManager?.value);
  const startCommand = detectStartCommand(
    packageJson,
    packageManager?.value,
    frontendFramework?.value,
    backendFramework?.value
  );
  const runtime = detectRuntime(files, selectedRoot, packageJson);
  const isMonorepo = detectMonorepo(files, packageJson, candidateAppRoots);
  const docker = analyzeDockerFiles(files);
  const hardcodedSecrets = detectHardcodedSecrets(files);
  const services = mergeServiceDetections([
    ...detectServiceUsage(files),
    ...detectInfrastructureServices(files)
  ]);
  const deploymentBlockers = detectDeploymentBlockers({
    packageJson,
    buildCommand,
    startCommand,
    frontendFramework,
    backendFramework,
    selectedRoot,
    candidateAppRoots
  }).concat(
    hardcodedSecrets.map((secret) => ({
      id: `hardcoded-secret-${slug(secret.evidence.path)}-${secret.name.toLowerCase()}`,
      severity: "high" as const,
      title: `Possible hardcoded secret: ${secret.name}`,
      description:
        "A secret-looking value is committed in source or config. Move it to a server-side environment variable before launch.",
      evidence: [secret.evidence]
    }))
  );
  const facts = [
    ...detectCiFacts(files),
    ...detectDeploymentConfigFacts(files),
    ...detectDockerFacts(docker),
    ...deploymentBlockers.map(blockerToFact),
    {
      label: "Repo analysis summary",
      value: buildAnalysisSummary({
        frontendFramework,
        backendFramework,
        packageManager,
        buildCommand,
        startCommand,
        isMonorepo: isMonorepo.value
      }),
      source: "detected",
      confidence: "high"
    } satisfies DeploymentFact
  ];

  return {
    projectName,
    repoUrl: options.repoUrl,
    fetchStatus: {
      status: "fetched",
      source: "public_github",
      message: `Analyzed ${files.length} repository files.`,
      defaultBranch: options.defaultBranch,
      fileCount: files.length
    },
    appRoot: {
      label: "App root",
      value: selectedRoot,
      source: "detected",
      confidence: candidateAppRoots.length > 1 ? "medium" : "high",
      evidence: [
        {
          path: selectedRoot === "." ? "repository root" : selectedRoot,
          detail:
            candidateAppRoots.length > 1
              ? "Selected the strongest candidate app root"
              : "Only one candidate app root was detected"
        }
      ]
    },
    candidateAppRoots,
    isMonorepo,
    packageManager,
    frontendFramework,
    backendFramework,
    buildCommand,
    startCommand,
    runtime,
    envVars: detectEnvironmentVariables(files),
    services,
    docker,
    deploymentBlockers,
    facts
  };
}

function normalizeFiles(files: RepoFile[]) {
  return files.map((file) => ({
    path: normalizePath(file.path),
    content: file.content
  }));
}

function normalizePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

const FRAMEWORK_CONFIG_SCORES: Record<string, number> = {
  "next.config.js": 30,
  "next.config.mjs": 30,
  "next.config.ts": 30,
  "vite.config.js": 25,
  "vite.config.mjs": 25,
  "vite.config.ts": 25,
  "astro.config.mjs": 25,
  "svelte.config.js": 25,
  "nuxt.config.ts": 25,
  "remix.config.js": 25,
  "gatsby-config.js": 25,
  "angular.json": 20
};

function scoreAppRoot(
  root: string,
  files: RepoFile[],
  isWorkspaceMember: boolean
): number {
  let score = isWorkspaceMember ? 10 : 0;

  const rootNormalized = root === "." ? "" : root + "/";

  for (const file of files) {
    if (!file.path.startsWith(rootNormalized)) continue;

    const fileName = basename(file.path);
    const relPath = root === "." ? file.path : file.path.slice(rootNormalized.length);

    if (relPath === "package.json") {
      try {
        const pkg = JSON.parse(file.content);
        if (pkg.scripts?.build) score += 15;
        if (pkg.scripts?.start) score += 15;
        if (pkg.scripts?.dev) score += 5;
        if (pkg.name) score += 5;
      } catch {
        score += 5;
      }
    }

    if (FRAMEWORK_CONFIG_SCORES[fileName]) {
      score += FRAMEWORK_CONFIG_SCORES[fileName];
    }
  }

  return score;
}

function detectCandidateAppRoots(files: RepoFile[]): CandidateAppRoot[] {
  const candidates = new Map<string, CandidateAppRoot>();
  const workspaceMemberRoots = detectWorkspaceMemberRoots(files);

  for (const file of files) {
    const fileName = basename(file.path);

    if (!ROOT_MARKER_FILES.has(fileName)) {
      continue;
    }

    const root = dirname(file.path);
    const existing = candidates.get(root);
    const reason = `${fileName} found`;

    if (existing) {
      existing.reason = `${existing.reason}, ${reason}`;
      existing.confidence = "high";
    } else {
      candidates.set(root, {
        path: root,
        reason,
        confidence: fileName === "package.json" ? "high" : "medium"
      });
    }
  }

  if (
    candidates.size === 0 &&
    files.some((file) => basename(file.path) === "index.html")
  ) {
    candidates.set(".", {
      path: ".",
      reason: "index.html found",
      confidence: "medium"
    });
  }

  return [...candidates.values()]
    .map((candidate) => ({
      ...candidate,
      score: scoreAppRoot(
        candidate.path,
        files,
        workspaceMemberRoots.has(candidate.path)
      ),
      confidence: candidate.confidence as "high" | "medium" | "low"
    }))
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0));
}

function detectWorkspaceMemberRoots(files: RepoFile[]) {
  const patterns = collectWorkspacePatterns(files);
  const memberRoots = new Set<string>();

  if (patterns.length === 0) return memberRoots;

  for (const file of files) {
    if (basename(file.path) !== "package.json") continue;
    const root = dirname(file.path);
    if (root === ".") continue;

    if (patterns.some((pattern) => matchesWorkspacePattern(root, pattern))) {
      memberRoots.add(root);
    }
  }

  return memberRoots;
}

function collectWorkspacePatterns(files: RepoFile[]) {
  const patterns: string[] = [];

  for (const file of files) {
    if (basename(file.path) === "package.json") {
      try {
        const pkg = JSON.parse(file.content) as PackageManifest;
        const workspaces = Array.isArray(pkg.workspaces)
          ? pkg.workspaces
          : pkg.workspaces?.packages;
        if (workspaces) patterns.push(...workspaces);
      } catch {}
    }

    if (basename(file.path) === "pnpm-workspace.yaml") {
      const matches = [...file.content.matchAll(/-\s+["']?([^"'\n]+)["']?/g)];
      patterns.push(...matches.map((match) => match[1].trim()));
    }
  }

  return patterns;
}

function matchesWorkspacePattern(root: string, pattern: string) {
  const normalized = pattern.replaceAll("\\", "/").replace(/\/+$/, "");
  if (!normalized.includes("*")) return root === normalized;

  const [prefix, suffix = ""] = normalized.split("*");
  return root.startsWith(prefix) && root.endsWith(suffix);
}

function selectAppRoot(candidates: CandidateAppRoot[]) {
  return candidates[0]?.path ?? ".";
}

function readPackageJson(fileMap: Map<string, RepoFile>, path: string) {
  const file = fileMap.get(path);

  if (!file) {
    return undefined;
  }

  try {
    return JSON.parse(file.content) as PackageManifest;
  } catch {
    return undefined;
  }
}

function collectPackageDependencies(packageJson?: PackageManifest) {
  return new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {})
  ]);
}

function detectProjectName(
  packageJson: PackageManifest | undefined,
  repoUrl: string | undefined
): DeploymentFact {
  const repoName = repoUrl?.split("/").filter(Boolean).at(-1);

  return {
    label: "Project",
    value: packageJson?.name ?? repoName ?? "Unknown project",
    source: packageJson?.name ? "detected" : repoName ? "user_provided" : "unknown",
    confidence: packageJson?.name || repoName ? "high" : "low",
    evidence: packageJson?.name
      ? [{ path: "package.json", detail: "name field" }]
      : repoName
        ? [{ path: "repo URL input", detail: "Derived from repository name" }]
        : undefined
  };
}

function detectPackageManager(
  files: RepoFile[],
  root: string
): DeploymentFact | undefined {
  const checks = [
    ["pnpm", "pnpm-lock.yaml"],
    ["yarn", "yarn.lock"],
    ["bun", "bun.lockb"],
    ["bun", "bun.lock"],
    ["npm", "package-lock.json"],
    ["npm", "npm-shrinkwrap.json"],
    ["uv", "uv.lock"],
    ["poetry", "poetry.lock"],
    ["pip", "requirements.txt"],
    ["cargo", "Cargo.lock"],
    ["go", "go.mod"],
    ["bundler", "Gemfile.lock"],
    ["composer", "composer.lock"]
  ] as const;

  for (const [manager, fileName] of checks) {
    const exactPath = joinPath(root, fileName);
    const file = files.find(
      (candidate) => candidate.path === exactPath || candidate.path === fileName
    );

    if (file) {
      return fact("Package manager", manager, file.path, `${fileName} detected`, "high");
    }
  }

  if (files.some((file) => file.path === joinPath(root, "package.json"))) {
    return fact(
      "Package manager",
      "npm",
      joinPath(root, "package.json"),
      "package.json detected without a lockfile",
      "low"
    );
  }

  return undefined;
}

function detectFrontendFramework(
  files: RepoFile[],
  root: string,
  dependencies: Set<string>
): DeploymentFact | undefined {
  const checks = [
    {
      name: "Next.js",
      matched:
        dependencies.has("next") ||
        hasAnyFile(files, root, ["next.config.js", "next.config.mjs", "next.config.ts"])
    },
    {
      name: "Nuxt",
      matched: dependencies.has("nuxt") || hasAnyFile(files, root, ["nuxt.config.ts"])
    },
    {
      name: "SvelteKit",
      matched:
        dependencies.has("@sveltejs/kit") || hasAnyFile(files, root, ["svelte.config.js"])
    },
    {
      name: "Astro",
      matched: dependencies.has("astro") || hasAnyFile(files, root, ["astro.config.mjs"])
    },
    {
      name: "Remix",
      matched: dependencies.has("@remix-run/react") || dependencies.has("@remix-run/node")
    },
    {
      name: "Angular",
      matched:
        dependencies.has("@angular/core") || hasAnyFile(files, root, ["angular.json"])
    },
    {
      name: "Vite",
      matched:
        dependencies.has("vite") ||
        hasAnyFile(files, root, ["vite.config.ts", "vite.config.js", "vite.config.mjs"])
    },
    {
      name: "Vue",
      matched: dependencies.has("vue")
    },
    {
      name: "React",
      matched: dependencies.has("react")
    },
    {
      name: "Static HTML",
      matched: files.some((file) => file.path === joinPath(root, "index.html"))
    },
    {
      name: "Gatsby",
      matched: dependencies.has("gatsby") || hasAnyFile(files, root, ["gatsby-config.js"])
    },
    {
      name: "Eleventy",
      matched:
        dependencies.has("@11ty/eleventy") || hasAnyFile(files, root, [".eleventy.js"])
    }
  ];

  const match = checks.find((check) => check.matched);

  if (!match) {
    return undefined;
  }

  return fact(
    "Frontend framework",
    match.name,
    joinPath(root, "package.json"),
    `${match.name} dependency or config detected`,
    match.name === "Static HTML" ? "medium" : "high"
  );
}

function detectBackendFramework(
  files: RepoFile[],
  root: string,
  dependencies: Set<string>
): DeploymentFact | undefined {
  const pythonText = files
    .filter((file) => /\.(txt|toml|py)$/.test(file.path))
    .map((file) => file.content)
    .join("\n")
    .toLowerCase();
  const composerText =
    files.find((file) => file.path === joinPath(root, "composer.json"))?.content ?? "";
  const gemText =
    files.find((file) => file.path === joinPath(root, "Gemfile"))?.content ?? "";

  const checks = [
    {
      name: "Next.js route handlers",
      matched: files.some((file) => /(^|\/)(app|pages)\/api\//.test(file.path))
    },
    { name: "Express", matched: dependencies.has("express") },
    { name: "Fastify", matched: dependencies.has("fastify") },
    { name: "NestJS", matched: dependencies.has("@nestjs/core") },
    { name: "Hono", matched: dependencies.has("hono") },
    { name: "Django", matched: /\bdjango\b/.test(pythonText) },
    { name: "Flask", matched: /\bflask\b/.test(pythonText) },
    { name: "FastAPI", matched: /\bfastapi\b/.test(pythonText) },
    { name: "Rails", matched: /gem ["']rails["']/.test(gemText) },
    { name: "Laravel", matched: /laravel\/framework/.test(composerText) },
    {
      name: "Go HTTP service",
      matched: files.some(
        (file) =>
          file.path.endsWith(".go") && /net\/http|http\.ListenAndServe/.test(file.content)
      )
    }
  ];

  const match = checks.find((check) => check.matched);

  if (!match) {
    return undefined;
  }

  return fact(
    "Backend framework",
    match.name,
    match.name.includes("Python") ? "requirements.txt" : joinPath(root, "package.json"),
    `${match.name} evidence detected`,
    "high"
  );
}

function detectBuildCommand(
  packageJson: PackageManifest | undefined,
  packageManager?: string
): DeploymentFact | undefined {
  if (packageJson?.scripts?.build) {
    return fact(
      "Build command",
      commandForScript(packageManager, "build"),
      "package.json",
      "scripts.build",
      "high"
    );
  }

  return undefined;
}

function detectStartCommand(
  packageJson: PackageManifest | undefined,
  packageManager?: string,
  frontendFramework?: string,
  backendFramework?: string
): DeploymentFact | undefined {
  const startScript = packageJson?.scripts?.start;

  if (startScript && !/\bdev\b/.test(startScript)) {
    return fact(
      "Start command",
      commandForScript(packageManager, "start"),
      "package.json",
      "scripts.start",
      "high"
    );
  }

  if (frontendFramework === "Next.js") {
    return fact(
      "Start command",
      commandForScript(packageManager, "start"),
      "package.json",
      "Next.js production default",
      "medium"
    );
  }

  if (backendFramework && packageJson?.main) {
    return fact(
      "Start command",
      `node ${packageJson.main}`,
      "package.json",
      "main field",
      "medium"
    );
  }

  return undefined;
}

function detectRuntime(
  files: RepoFile[],
  root: string,
  packageJson?: PackageManifest
): DeploymentFact | undefined {
  const checks = [
    [".nvmrc", "Node.js"],
    [".node-version", "Node.js"],
    [".python-version", "Python"],
    ["runtime.txt", "Runtime"],
    [".ruby-version", "Ruby"]
  ] as const;

  for (const [fileName, label] of checks) {
    const file = files.find(
      (candidate) =>
        candidate.path === joinPath(root, fileName) || candidate.path === fileName
    );

    if (file) {
      return fact(
        "Runtime",
        `${label} ${file.content.trim()}`,
        file.path,
        fileName,
        "high"
      );
    }
  }

  if (packageJson?.engines?.node) {
    return fact(
      "Runtime",
      `Node.js ${packageJson.engines.node}`,
      "package.json",
      "engines.node",
      "high"
    );
  }

  const goMod = files.find((file) => file.path === joinPath(root, "go.mod"));
  const goVersion = goMod?.content.match(/^go\s+(.+)$/m)?.[1];

  if (goVersion) {
    return fact("Runtime", `Go ${goVersion}`, goMod.path, "go directive", "high");
  }

  return undefined;
}

function detectMonorepo(
  files: RepoFile[],
  packageJson: PackageManifest | undefined,
  candidates: CandidateAppRoot[]
): DeploymentFact<boolean> {
  const workspaceConfig = files.find((file) =>
    ["pnpm-workspace.yaml", "turbo.json", "nx.json", "lerna.json"].includes(file.path)
  );
  const hasWorkspaceField = Boolean(packageJson?.workspaces);
  const value = candidates.length > 1 || hasWorkspaceField || Boolean(workspaceConfig);

  return {
    label: "Monorepo",
    value,
    source: value ? "detected" : "inferred",
    confidence: value ? "high" : "medium",
    evidence: workspaceConfig
      ? [{ path: workspaceConfig.path, detail: "Workspace configuration detected" }]
      : hasWorkspaceField
        ? [{ path: "package.json", detail: "workspaces field detected" }]
        : [
            {
              path: "candidate app roots",
              detail: `${candidates.length} app root candidate(s)`
            }
          ]
  };
}

function detectInfrastructureServices(files: RepoFile[]): ServiceDetection[] {
  const services: ServiceDetection[] = [];
  const dockerFile = files.find((file) =>
    /^Dockerfile(?:\.|$)/.test(basename(file.path))
  );
  const composeFile = files.find((file) =>
    /(^|\/)(docker-compose|compose)\.ya?ml$/.test(file.path)
  );
  const ciFile = files.find((file) =>
    CI_CONFIG_PATTERNS.some((pattern) => pattern.test(file.path))
  );
  const deployFile = files.find((file) =>
    DEPLOY_CONFIG_FILES.includes(basename(file.path))
  );

  if (dockerFile || composeFile) {
    services.push({
      category: "docker",
      name: composeFile ? "Docker Compose" : "Dockerfile",
      source: "detected",
      confidence: "high",
      evidence: [
        dockerFile ? { path: dockerFile.path, detail: "Dockerfile detected" } : undefined,
        composeFile
          ? { path: composeFile.path, detail: "Compose file detected" }
          : undefined
      ].filter(Boolean) as Evidence[]
    });
  }

  if (ciFile) {
    services.push({
      category: "ci_cd",
      name: ciFile.path.startsWith(".github") ? "GitHub Actions" : "CI configuration",
      source: "detected",
      confidence: "high",
      evidence: [{ path: ciFile.path, detail: "CI/CD config detected" }]
    });
  }

  if (deployFile) {
    services.push({
      category: "deployment",
      name: deploymentProviderName(deployFile.path),
      source: "detected",
      confidence: "high",
      evidence: [{ path: deployFile.path, detail: "Deployment config detected" }]
    });
  }

  return services;
}

function detectCiFacts(files: RepoFile[]): DeploymentFact[] {
  return files
    .filter((file) => CI_CONFIG_PATTERNS.some((pattern) => pattern.test(file.path)))
    .map((file) =>
      fact("CI/CD configuration", file.path, file.path, "CI workflow detected", "high")
    );
}

function detectDeploymentConfigFacts(files: RepoFile[]): DeploymentFact[] {
  return files
    .filter((file) => DEPLOY_CONFIG_FILES.includes(basename(file.path)))
    .map((file) =>
      fact(
        "Existing deployment configuration",
        deploymentProviderName(file.path),
        file.path,
        "Provider config detected",
        "high"
      )
    );
}

function detectDockerFacts(
  docker: ReturnType<typeof analyzeDockerFiles>
): DeploymentFact[] {
  if (!docker) {
    return [];
  }

  const facts: DeploymentFact[] = [
    {
      label: "Docker recommendation",
      value: docker.recommendation,
      source: "detected",
      confidence: docker.dockerfiles.length > 0 ? "high" : "medium",
      evidence: [
        ...docker.dockerfiles.map((dockerfile) => ({
          path: dockerfile.path,
          detail: "Dockerfile parsed"
        })),
        ...docker.composeFiles.map((composeFile) => ({
          path: composeFile.path,
          detail: "Docker Compose parsed"
        }))
      ]
    }
  ];

  if (docker.serviceDependencies.length > 0) {
    facts.push({
      label: "Docker service dependencies",
      value: docker.serviceDependencies.join(", "),
      source: "detected",
      confidence: "high",
      evidence: docker.composeFiles.map((composeFile) => ({
        path: composeFile.path,
        detail: "Service dependency inferred from compose service names or images"
      }))
    });
  }

  return facts;
}

function detectDeploymentBlockers(input: {
  packageJson?: PackageManifest;
  buildCommand?: DeploymentFact;
  startCommand?: DeploymentFact;
  frontendFramework?: DeploymentFact;
  backendFramework?: DeploymentFact;
  selectedRoot: string;
  candidateAppRoots: CandidateAppRoot[];
}): AnalysisIssue[] {
  const blockers: AnalysisIssue[] = [];

  if (input.candidateAppRoots.length > 1) {
    blockers.push({
      id: "ambiguous-app-root",
      severity: "medium",
      title: "Multiple app roots detected",
      description:
        "This looks like a monorepo. Confirm the production app root before deploying.",
      evidence: input.candidateAppRoots.map((candidate) => ({
        path: candidate.path,
        detail: candidate.reason
      }))
    });
  }

  if (input.packageJson && !input.buildCommand && input.frontendFramework) {
    blockers.push({
      id: "missing-build-script",
      severity: "high",
      title: "Missing build script",
      description:
        "A frontend framework was detected, but package.json does not define scripts.build.",
      evidence: [
        { path: joinPath(input.selectedRoot, "package.json"), detail: "No scripts.build" }
      ]
    });
  }

  if (input.backendFramework && !input.startCommand) {
    blockers.push({
      id: "missing-start-script",
      severity: "high",
      title: "Missing production start command",
      description: "A backend was detected, but no production start command was found.",
      evidence: [
        {
          path: joinPath(input.selectedRoot, "package.json"),
          detail: "No usable scripts.start"
        }
      ]
    });
  }

  return blockers;
}

function blockerToFact(blocker: AnalysisIssue): DeploymentFact {
  return {
    label: "Deployment blocker",
    value: `${blocker.title}: ${blocker.description}`,
    source: "detected",
    confidence: blocker.severity === "high" ? "high" : "medium",
    evidence: blocker.evidence
  };
}

function buildAnalysisSummary(input: {
  frontendFramework?: DeploymentFact;
  backendFramework?: DeploymentFact;
  packageManager?: DeploymentFact;
  buildCommand?: DeploymentFact;
  startCommand?: DeploymentFact;
  isMonorepo: boolean;
}) {
  return [
    input.isMonorepo ? "Monorepo detected." : "Single app structure likely.",
    `Frontend: ${input.frontendFramework?.value ?? "unknown"}.`,
    `Backend: ${input.backendFramework?.value ?? "unknown"}.`,
    `Package manager: ${input.packageManager?.value ?? "unknown"}.`,
    `Build: ${input.buildCommand?.value ?? "unknown"}.`,
    `Start: ${input.startCommand?.value ?? "unknown"}.`
  ].join(" ");
}

function deploymentProviderName(path: string) {
  const fileName = basename(path);

  if (fileName === "vercel.json") return "Vercel";
  if (fileName === "netlify.toml") return "Netlify";
  if (fileName.startsWith("render.")) return "Render";
  if (fileName === "railway.json") return "Railway";
  if (fileName === "fly.toml") return "Fly.io";
  if (fileName === "app.yaml") return "Google App Engine";
  return "Deployment config";
}

function commandForScript(packageManager = "npm", script: "build" | "start") {
  if (packageManager === "pnpm") return `pnpm ${script}`;
  if (packageManager === "yarn") return `yarn ${script}`;
  if (packageManager === "bun") return script === "start" ? "bun start" : "bun run build";
  return script === "start" ? "npm start" : "npm run build";
}

function hasAnyFile(files: RepoFile[], root: string, fileNames: string[]) {
  return fileNames.some((fileName) =>
    files.some((file) => file.path === joinPath(root, fileName))
  );
}

function fact(
  label: string,
  value: string,
  path: string,
  detail: string,
  confidence: DeploymentFact["confidence"]
): DeploymentFact {
  return {
    label,
    value,
    source: "detected",
    confidence,
    evidence: [{ path, detail }]
  };
}

function joinPath(root: string, fileName: string) {
  return root === "." ? fileName : `${root}/${fileName}`;
}

function dirname(path: string) {
  const parts = path.split("/");
  parts.pop();
  return parts.length === 0 ? "." : parts.join("/") || ".";
}

function basename(path: string) {
  return path.split("/").at(-1) ?? path;
}
