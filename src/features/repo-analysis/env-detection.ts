import type { EnvVariable, Evidence, FactSource } from "@/types/planner";
import type { RepoFile } from "./repo-file";

export interface HardcodedSecretFinding {
  name: string;
  valuePreview: string;
  evidence: Evidence;
}

const ENV_PATTERNS: RegExp[] = [
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g,
  /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
  /import\.meta\.env\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g,
  /Deno\.env\.get\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g,
  /os\.getenv\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g,
  /os\.environ(?:\.get)?\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g,
  /os\.environ\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g,
  /ENV(?:\.fetch)?\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g,
  /ENV\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g,
  /getenv\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g,
  /\$_(?:ENV|SERVER)\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g,
  /\benv\(["'`]([A-Z][A-Z0-9_]*)["'`]\)/g
];

const EXAMPLE_ENV_FILE_PATTERN = /(?:^|\/)\.env\.(?:example|sample|template)$/;
const DOC_FILE_PATTERN = /\.(?:md|mdx|txt|ya?ml|toml)$/;
const PUBLIC_PREFIXES = ["NEXT_PUBLIC_", "VITE_", "PUBLIC_", "NUXT_PUBLIC_"];
const IGNORED_DOC_TOKENS = new Set([
  "API",
  "CLI",
  "CPU",
  "CSS",
  "DNS",
  "FAQ",
  "GPU",
  "HTML",
  "HTTP",
  "HTTPS",
  "JSON",
  "JWT",
  "SDK",
  "SQL",
  "SSH",
  "URL",
  "UUID",
  "XML",
  "YAML"
]);

export function detectEnvironmentVariables(files: RepoFile[]): EnvVariable[] {
  const byName = new Map<string, EnvVariable>();

  for (const file of files) {
    if (EXAMPLE_ENV_FILE_PATTERN.test(file.path)) {
      collectFromEnvExample(file, byName);
    }

    if (DOC_FILE_PATTERN.test(file.path)) {
      collectFromDocs(file, byName);
    }

    collectFromSourceReferences(file, byName);
  }

  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function collectFromEnvExample(file: RepoFile, byName: Map<string, EnvVariable>) {
  const lines = file.content.split(/\r?\n/);
  let nextRequired: boolean | undefined;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    if (trimmed.startsWith("#")) {
      if (/\b(optional|not required)\b/i.test(trimmed)) {
        nextRequired = false;
      } else if (/\b(required|must set|production)\b/i.test(trimmed)) {
        nextRequired = true;
      }
      return;
    }

    const match = trimmed.match(/^([A-Z][A-Z0-9_]*)\s*=/);

    if (!match) {
      return;
    }

    const inlineRequired = parseRequirementHint(trimmed);
    upsertVariable(
      byName,
      match[1],
      {
        path: file.path,
        detail: `Declared in env example on line ${index + 1}`
      },
      "detected",
      {
        required: inlineRequired ?? nextRequired,
        confidence: "high"
      }
    );
    nextRequired = undefined;
  });
}

function collectFromDocs(file: RepoFile, byName: Map<string, EnvVariable>) {
  const lines = file.content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (
      !/\b(env|environment|variable|secret|token|key|required|optional)\b/i.test(line)
    ) {
      return;
    }

    const matches = [
      ...line.matchAll(/`([A-Z][A-Z0-9_]{2,})`/g),
      ...line.matchAll(/\b([A-Z][A-Z0-9_]{2,})=/g)
    ];

    for (const match of matches) {
      const name = match[1];
      if (IGNORED_DOC_TOKENS.has(name)) continue;

      upsertVariable(
        byName,
        name,
        {
          path: file.path,
          detail: `Mentioned in docs on line ${index + 1}`
        },
        "detected",
        {
          required: parseRequirementHint(line),
          confidence: "medium"
        }
      );
    }
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
        "detected",
        {
          confidence: isSourceFile(file.path) ? "medium" : "low"
        }
      );
    }
  }
}

function upsertVariable(
  byName: Map<string, EnvVariable>,
  name: string,
  evidence: Evidence,
  source: FactSource,
  options: { required?: boolean; confidence?: EnvVariable["confidence"] } = {}
) {
  const existing = byName.get(name);
  const required = options.required ?? isLikelyRequired(name);

  if (existing) {
    existing.evidence.push(evidence);
    existing.required = existing.required || required;
    existing.confidence = existing.evidence.length > 1 ? "high" : existing.confidence;
    return;
  }

  byName.set(name, {
    name,
    required,
    exposure: getExposure(name),
    description: describeVariable(name),
    source,
    confidence: options.confidence ?? "medium",
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

export function detectHardcodedSecrets(files: RepoFile[]): HardcodedSecretFinding[] {
  const findings: HardcodedSecretFinding[] = [];
  const secretPattern =
    /\b([A-Za-z0-9_]*(?:SECRET|TOKEN|API[_-]?KEY|PASSWORD|PRIVATE[_-]?KEY|WEBHOOK)[A-Za-z0-9_]*)\b\s*[:=]\s*["'`]([^"'`]{16,})["'`]/gi;

  for (const file of files) {
    if (
      EXAMPLE_ENV_FILE_PATTERN.test(file.path) ||
      /\.(?:md|test\.[jt]sx?)$/.test(file.path)
    ) {
      continue;
    }

    for (const match of file.content.matchAll(secretPattern)) {
      const value = match[2];
      if (looksLikePlaceholder(value)) continue;

      findings.push({
        name: match[1],
        valuePreview: `${value.slice(0, 4)}...${value.slice(-4)}`,
        evidence: {
          path: file.path,
          detail: `Hardcoded secret-looking value assigned to ${match[1]}`
        }
      });
    }
  }

  return findings;
}

export function generateEnvExampleSuggestion(
  envVars: EnvVariable[],
  existingContent = ""
) {
  const existingNames = new Set(
    [...existingContent.matchAll(/^([A-Z][A-Z0-9_]*)\s*=/gm)].map((match) => match[1])
  );
  const blocks = [existingContent.trim()].filter(Boolean);
  const missingVars = envVars.filter((envVar) => !existingNames.has(envVar.name));

  if (missingVars.length > 0) {
    blocks.push(
      missingVars
        .map((envVar) =>
          [
            `# ${envVar.description}${envVar.required ? " Required in production." : " Optional."}`,
            `${envVar.name}=${placeholderFor(envVar)}`
          ].join("\n")
        )
        .join("\n\n")
    );
  }

  return `${blocks.join("\n\n")}\n`;
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

function parseRequirementHint(text: string) {
  if (/\b(optional|not required)\b/i.test(text)) return false;
  if (/\b(required|must set|production|secret|database|webhook)\b/i.test(text))
    return true;
  return undefined;
}

function isSourceFile(path: string) {
  return /\.(?:cjs|js|jsx|mjs|ts|tsx|py|rb|php|go)$/.test(path);
}

function looksLikePlaceholder(value: string) {
  return /^(?:changeme|example|placeholder|replace|test|todo|xxx|your-|your_|sk_test_|pk_test_|whsec_test)/i.test(
    value
  );
}

function placeholderFor(envVar: EnvVariable) {
  if (envVar.exposure === "client") return "replace-with-public-value";
  if (/URL$/.test(envVar.name)) return "https://replace-with-production-url.example";
  if (isLikelySecret(envVar.name)) return "replace-with-production-secret";
  return "replace-with-production-value";
}
