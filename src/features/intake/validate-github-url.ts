export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
  normalizedUrl: string;
}

const GITHUB_REPO_PATTERN =
  /^(?:https?:\/\/)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

export function parseGitHubRepoUrl(input: string): ParsedGitHubRepo | null {
  const trimmed = input.trim();
  const match = trimmed.match(GITHUB_REPO_PATTERN);

  if (!match) {
    return null;
  }

  const [, owner, repo] = match;

  if (!owner || !repo) {
    return null;
  }

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`
  };
}
