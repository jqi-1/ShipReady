export interface RuntimeConfigStatus {
  githubReady: boolean;
  aiReady: boolean;
  missingGitHub: string[];
  missingAi: string[];
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

  return {
    githubReady: missingGitHub.length === 0,
    aiReady: missingAi.length === 0,
    missingGitHub,
    missingAi
  };
}

function missingEnvVars(names: string[]) {
  return names.filter((name) => !process.env[name]);
}
