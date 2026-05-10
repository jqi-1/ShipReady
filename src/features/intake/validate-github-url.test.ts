import { describe, expect, it } from "vitest";
import { parseGitHubRepoUrl } from "./validate-github-url";

describe("parseGitHubRepoUrl", () => {
  it.each([
    ["https://github.com/acme/launch-app", "acme", "launch-app"],
    ["http://github.com/acme/launch-app", "acme", "launch-app"],
    ["github.com/acme/launch-app", "acme", "launch-app"],
    ["acme/launch-app", "acme", "launch-app"],
    ["https://github.com/acme/launch-app.git", "acme", "launch-app"],
    ["acme/launch-app.git", "acme", "launch-app"],
    ["https://github.com/acme/launch-app/", "acme", "launch-app"],
    ["HTTP://GITHUB.COM/ORG/REPO", "ORG", "REPO"],
    ["Https://GitHub.com/Acme/Repo", "Acme", "Repo"]
  ])("normalizes %s", (input, owner, repo) => {
    expect(parseGitHubRepoUrl(input)).toEqual({
      owner,
      repo,
      normalizedUrl: `https://github.com/${owner}/${repo}`
    });
  });

  it.each([
    "",
    "https://gitlab.com/acme/launch-app",
    "https://github.com/acme",
    "github.com/acme",
    "https://github.com/acme/launch-app/issues",
    "acme/launch-app/settings",
    "https://github.com/acme/launch app",
    "https://github.com/acme/launch-app?tab=readme"
  ])("rejects unsupported input %s", (input) => {
    expect(parseGitHubRepoUrl(input)).toBeNull();
  });
});
