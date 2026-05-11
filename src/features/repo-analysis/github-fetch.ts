import { parseGitHubRepoUrl } from "@/features/intake/validate-github-url";
import type { RepoFile } from "@/features/repo-analysis/repo-file";

export const GITHUB_APP_PRIVATE_REPO_ENV = [
  "GITHUB_APP_ID",
  "GITHUB_APP_PRIVATE_KEY",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_WEBHOOK_SECRET"
];

interface GitHubTreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

interface GitHubRepoResponse {
  default_branch?: string;
  message?: string;
}

interface GitHubTreeResponse {
  tree?: GitHubTreeEntry[];
  truncated?: boolean;
  message?: string;
}

export type GitHubRepoFetchResult =
  | {
      ok: true;
      repoUrl: string;
      defaultBranch: string;
      files: RepoFile[];
      truncated: boolean;
    }
  | {
      ok: false;
      reason: "invalid_url" | "private_or_missing" | "rate_limited" | "unreachable";
      message: string;
      status?: number;
    };

const MAX_FILE_COUNT = 160;
const MAX_FILE_BYTES = 120_000;

const IMPORTANT_FILE_NAMES = new Set([
  ".dockerignore",
  ".env.example",
  ".env.sample",
  ".env.template",
  ".gitlab-ci.yml",
  ".gitlab-ci.yaml",
  ".node-version",
  ".nvmrc",
  ".python-version",
  ".ruby-version",
  "Gemfile",
  "Makefile",
  "Procfile",
  "README.md",
  "angular.json",
  "app.yaml",
  "astro.config.mjs",
  "bun.lock",
  "bun.lockb",
  "compose.yaml",
  "compose.yml",
  "composer.json",
  "composer.lock",
  "docker-compose.yaml",
  "docker-compose.yml",
  "fly.toml",
  "gatsby-config.js",
  "go.mod",
  "netlify.toml",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "poetry.lock",
  "pyproject.toml",
  "railway.json",
  "render.yaml",
  "render.yml",
  "requirements.txt",
  "runtime.txt",
  "svelte.config.js",
  "turbo.json",
  "uv.lock",
  "vercel.json",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "yarn.lock"
]);

const SOURCE_EXTENSIONS = [
  ".cjs",
  ".go",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".php",
  ".py",
  ".rb",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml"
];

export async function fetchPublicGitHubRepoFiles(
  repoUrl: string
): Promise<GitHubRepoFetchResult> {
  const parsed = parseGitHubRepoUrl(repoUrl);

  if (!parsed) {
    return {
      ok: false,
      reason: "invalid_url",
      message: "Use a GitHub repo URL like https://github.com/org/repo."
    };
  }

  try {
    const repoResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      {
        headers: {
          Accept: "application/vnd.github+json"
        }
      }
    );

    if (!repoResponse.ok) {
      return mapGitHubFailure(repoResponse.status);
    }

    const repo = (await repoResponse.json()) as GitHubRepoResponse;
    const defaultBranch = repo.default_branch ?? "main";
    const treeResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          Accept: "application/vnd.github+json"
        }
      }
    );

    if (!treeResponse.ok) {
      return mapGitHubFailure(treeResponse.status);
    }

    const tree = (await treeResponse.json()) as GitHubTreeResponse;
    const entries = (tree.tree ?? [])
      .filter((entry) => entry.type === "blob")
      .filter((entry) => (entry.size ?? 0) <= MAX_FILE_BYTES)
      .filter((entry) => shouldInspectPath(entry.path))
      .slice(0, MAX_FILE_COUNT);

    const files = await Promise.all(
      entries.map(async (entry) => ({
        path: entry.path,
        content: await fetchRawFile(parsed.owner, parsed.repo, defaultBranch, entry.path)
      }))
    );

    return {
      ok: true,
      repoUrl: parsed.normalizedUrl,
      defaultBranch,
      files: files.filter((file) => file.content.length > 0),
      truncated: Boolean(tree.truncated) || entries.length >= MAX_FILE_COUNT
    };
  } catch {
    return {
      ok: false,
      reason: "unreachable",
      message:
        "GitHub could not be reached from this environment. Continue with manual intake or try again later."
    };
  }
}

function mapGitHubFailure(status: number): GitHubRepoFetchResult {
  if (status === 403 || status === 429) {
    return {
      ok: false,
      reason: "rate_limited",
      status,
      message:
        "GitHub rate-limited this repo fetch. Add GitHub App credentials for private or higher-limit inspection."
    };
  }

  if (status === 401 || status === 404) {
    return {
      ok: false,
      reason: "private_or_missing",
      status,
      message:
        "This repo is private, missing, or unavailable. V0 can inspect public repos now; private repos need GitHub App installation credentials."
    };
  }

  return {
    ok: false,
    reason: "unreachable",
    status,
    message: "GitHub returned an unexpected error while fetching the repository."
  };
}

function shouldInspectPath(path: string) {
  const fileName = path.split("/").at(-1) ?? path;

  if (fileName.startsWith("Dockerfile")) {
    return true;
  }

  return (
    IMPORTANT_FILE_NAMES.has(fileName) ||
    path.startsWith(".github/workflows/") ||
    SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension))
  );
}

async function fetchRawFile(owner: string, repo: string, branch: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${encodedPath}`
  );

  if (!response.ok) {
    return "";
  }

  return response.text();
}
