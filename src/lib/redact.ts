const SECRET_PATTERNS = [
  /(SECRET|TOKEN|KEY|PASSWORD|PRIVATE\s*KEY|WEBHOOK\s*SECRET)\s*[:=]\s*["'`]?[^"'`\s]{8,}/gi,
  /(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/g,
  /sk_live_[A-Za-z0-9]{24,}/g,
  /rk_live_[A-Za-z0-9]{24,}/g,
  /whsec_[A-Za-z0-9]{16,}/g,
  /xox[abpr]-[A-Za-z0-9-]{24,}/g,
  /AI[A-Za-z0-9_-]{20,}/g
];

const SECRET_FIELD_NAMES = [
  "SECRET",
  "TOKEN",
  "KEY",
  "PRIVATE_KEY",
  "PASSWORD",
  "WEBHOOK_SECRET",
  "API_KEY"
];

export function redactSecrets(value: string): string {
  let redacted = value;

  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    redacted = redacted.replace(pattern, (match) => {
      const colonIndex = match.indexOf(":");
      const eqIndex = match.indexOf("=");
      const sepIndex = colonIndex >= 0 ? colonIndex : eqIndex;
      return match.slice(0, sepIndex + 1) + " [REDACTED]";
    });
  }

  return redacted;
}

export function redactSecretsFromEnv(record: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};

  for (const [key, value] of Object.entries(record)) {
    if (SECRET_FIELD_NAMES.some((name) => key.includes(name))) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export function redactSecretsFromHeaders(headers: Record<string, string>): Record<string, string> {
  const sensitiveHeaders = new Set([
    "authorization",
    "x-github-token",
    "x-webhook-signature",
    "x-hub-signature",
    "x-hub-signature-256",
    "cookie",
    "set-cookie"
  ]);

  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = sensitiveHeaders.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return redacted;
}
