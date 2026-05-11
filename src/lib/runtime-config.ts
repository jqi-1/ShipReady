export interface RuntimeConfigStatus {
  githubReady: boolean;
  aiReady: boolean;
  missingGitHub: string[];
  missingAi: string[];
  githubAppInstalled: boolean;
  githubAuthState: "configured" | "missing_keys" | "not_installed";
}

const GITHUB_ENV_VARS = [
  "GITHUB_APP_ID",
  "GITHUB_APP_PRIVATE_KEY",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_WEBHOOK_SECRET"
];

const AI_ENV_VARS = ["AI_PROVIDER", "AI_API_KEY"];

export function getRuntimeConfigStatus(): RuntimeConfigStatus {
  const missingGitHub = missingEnvVars(GITHUB_ENV_VARS);
  const missingAi = missingEnvVars(AI_ENV_VARS);
  const githubReady = missingGitHub.length === 0;
  const aiReady = missingAi.length === 0;

  let githubAuthState: RuntimeConfigStatus["githubAuthState"];
  if (!githubReady) {
    githubAuthState = "missing_keys";
  } else if (!process.env.GITHUB_APP_INSTALLED) {
    githubAuthState = "not_installed";
  } else {
    githubAuthState = "configured";
  }

  return {
    githubReady,
    aiReady,
    missingGitHub,
    missingAi,
    githubAppInstalled: githubAuthState === "configured",
    githubAuthState
  };
}

function missingEnvVars(names: string[]) {
  return names.filter((name) => !process.env[name]);
}
