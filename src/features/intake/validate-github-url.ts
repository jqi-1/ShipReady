export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
  normalizedUrl: string;
}

const GITHUB_REPO_PART_PATTERN = /^[A-Za-z0-9_.-]+$/;

export function parseGitHubRepoUrl(input: string): ParsedGitHubRepo | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const repoPath = withoutProtocol.toLowerCase().startsWith("github.com/")
    ? withoutProtocol.slice("github.com/".length)
    : withoutProtocol;
  const parts = repoPath.replace(/\/$/, "").split("/");

  if (parts.length !== 2) {
    return null;
  }

  const [owner, rawRepo] = parts;
  const repo = rawRepo.endsWith(".git") ? rawRepo.slice(0, -4) : rawRepo;

  if (
    !owner ||
    !repo ||
    !GITHUB_REPO_PART_PATTERN.test(owner) ||
    !GITHUB_REPO_PART_PATTERN.test(repo)
  ) {
    return null;
  }

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`
  };
}
