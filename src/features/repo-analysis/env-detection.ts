import type { EnvVariable, Evidence, FactSource } from "@/types/planner";

export interface RepoFile {
  path: string;
  content: string;
}

const ENV_PATTERNS: RegExp[] = [
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
  /Deno\.env\.get\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g,
  /os\.environ(?:\.get)?\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g,
  /os\.environ\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g,
  /ENV(?:\.fetch)?\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g,
  /ENV\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g,
  /getenv\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g
];

const EXAMPLE_ENV_FILE_PATTERN = /(?:^|\/)\.env\.(?:example|sample|template)$/;
const PUBLIC_PREFIXES = ["NEXT_PUBLIC_", "VITE_", "PUBLIC_", "NUXT_PUBLIC_"];

export function detectEnvironmentVariables(files: RepoFile[]): EnvVariable[] {
  const byName = new Map<string, EnvVariable>();

  for (const file of files) {
    if (EXAMPLE_ENV_FILE_PATTERN.test(file.path)) {
      collectFromEnvExample(file, byName);
    }

    collectFromSourceReferences(file, byName);
  }

  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function collectFromEnvExample(file: RepoFile, byName: Map<string, EnvVariable>) {
  const lines = file.content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const match = trimmed.match(/^([A-Z][A-Z0-9_]*)\s*=/);

    if (!match) {
      return;
    }

    upsertVariable(
      byName,
      match[1],
      {
        path: file.path,
        detail: `Declared in env example on line ${index + 1}`
      },
      "detected"
    );
  });
}

function collectFromSourceReferences(file: RepoFile, byName: Map<string, EnvVariable>) {
  for (const pattern of ENV_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of file.content.matchAll(pattern)) {
      const name = match[1];
      upsertVariable(
        byName,
        name,
        {
          path: file.path,
          detail: `Referenced as ${match[0]}`
        },
        "detected"
      );
    }
  }
}

function upsertVariable(
  byName: Map<string, EnvVariable>,
  name: string,
  evidence: Evidence,
  source: FactSource
) {
  const existing = byName.get(name);

  if (existing) {
    existing.evidence.push(evidence);
    existing.required = existing.required || isLikelyRequired(name);
    existing.confidence = existing.evidence.length > 1 ? "high" : existing.confidence;
    return;
  }

  byName.set(name, {
    name,
    required: isLikelyRequired(name),
    exposure: getExposure(name),
    description: describeVariable(name),
    source,
    confidence: "medium",
    evidence: [evidence]
  });
}

function getExposure(name: string): EnvVariable["exposure"] {
  return PUBLIC_PREFIXES.some((prefix) => name.startsWith(prefix)) ? "client" : "server";
}

export function isLikelySecret(name: string) {
  return /(SECRET|TOKEN|KEY|PASSWORD|PRIVATE|WEBHOOK)/i.test(name);
}

function isLikelyRequired(name: string) {
  return (
    name === "DATABASE_URL" ||
    name.endsWith("_URL") ||
    isLikelySecret(name) ||
    /(STRIPE|CLERK|SUPABASE|FIREBASE|RESEND|POSTMARK|SENDGRID|SENTRY)/i.test(name)
  );
}

function describeVariable(name: string) {
  if (name === "DATABASE_URL") {
    return "Production database connection string.";
  }

  if (/STRIPE/i.test(name)) {
    return "Stripe payment configuration.";
  }

  if (/RESEND|POSTMARK|SENDGRID|SMTP/i.test(name)) {
    return "Transactional email configuration.";
  }

  if (/AUTH|NEXTAUTH|SESSION/i.test(name)) {
    return "Authentication or session configuration.";
  }

  if (/SENTRY/i.test(name)) {
    return "Error monitoring configuration.";
  }

  return "Application configuration.";
}
