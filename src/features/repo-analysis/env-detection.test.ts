import { describe, expect, it } from "vitest";
import {
  detectEnvironmentVariables,
  detectHardcodedSecrets,
  generateEnvExampleSuggestion
} from "./env-detection";

describe("detectEnvironmentVariables", () => {
  it("detects env vars from source and env examples", () => {
    const envVars = detectEnvironmentVariables([
      {
        path: ".env.example",
        content: "DATABASE_URL=\nAUTH_SECRET=\n"
      },
      {
        path: "src/billing.ts",
        content: "const stripe = process.env.STRIPE_SECRET_KEY;"
      },
      {
        path: "app/providers.tsx",
        content: "const key = import.meta.env.VITE_PUBLIC_ANALYTICS_KEY;"
      }
    ]);

    expect(envVars.map((envVar) => envVar.name)).toEqual([
      "AUTH_SECRET",
      "DATABASE_URL",
      "STRIPE_SECRET_KEY",
      "VITE_PUBLIC_ANALYTICS_KEY"
    ]);
    expect(envVars.find((envVar) => envVar.name === "DATABASE_URL")?.required).toBe(true);
    expect(
      envVars.find((envVar) => envVar.name === "VITE_PUBLIC_ANALYTICS_KEY")?.exposure
    ).toBe("client");
  });

  it("detects env vars across common language helpers and docs", () => {
    const envVars = detectEnvironmentVariables([
      {
        path: "README.md",
        content: "Set required `STRIPE_WEBHOOK_SECRET` and optional `SENTRY_DSN`."
      },
      {
        path: "src/config.ts",
        content: "const url = process.env['DATABASE_URL'];"
      },
      {
        path: "main.py",
        content: "import os\napi_key = os.getenv('OPENAI_API_KEY')"
      },
      {
        path: "config/initializers/auth.rb",
        content: "secret = ENV.fetch('AUTH_SECRET')"
      },
      {
        path: "public/index.php",
        content: "$key = $_ENV['RESEND_API_KEY']; $fallback = getenv('APP_URL');"
      },
      {
        path: ".env.example",
        content:
          "# Optional analytics\nPOSTHOG_KEY=\n# Required in production\nAPP_URL=\n"
      }
    ]);

    expect(envVars.map((envVar) => envVar.name)).toEqual([
      "APP_URL",
      "AUTH_SECRET",
      "DATABASE_URL",
      "OPENAI_API_KEY",
      "POSTHOG_KEY",
      "RESEND_API_KEY",
      "SENTRY_DSN",
      "STRIPE_WEBHOOK_SECRET"
    ]);
    expect(envVars.find((envVar) => envVar.name === "POSTHOG_KEY")?.required).toBe(false);
    expect(envVars.find((envVar) => envVar.name === "APP_URL")?.required).toBe(true);
  });

  it("flags hardcoded secret-looking values while ignoring placeholders", () => {
    const findings = detectHardcodedSecrets([
      {
        path: "src/billing.ts",
        content:
          "const STRIPE_SECRET_KEY = 'fake_secret_value_1234567890abcdefghijklmnop'; const example = 'replace-with-secret';"
      },
      {
        path: ".env.example",
        content: "AUTH_SECRET=replace-with-production-secret"
      }
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      name: "STRIPE_SECRET_KEY",
      valuePreview: "fake...mnop"
    });
  });

  it("generates env example suggestions without replacing existing variables", () => {
    const envVars = detectEnvironmentVariables([
      {
        path: ".env.example",
        content: "DATABASE_URL=\n"
      },
      {
        path: "src/auth.ts",
        content: "const secret = process.env.AUTH_SECRET;"
      }
    ]);

    const suggestion = generateEnvExampleSuggestion(envVars, "DATABASE_URL=\n");

    expect(suggestion).toContain("DATABASE_URL=");
    expect(suggestion.match(/DATABASE_URL=/g)).toHaveLength(1);
    expect(suggestion).toContain("# Authentication or session configuration.");
    expect(suggestion).toContain("AUTH_SECRET=replace-with-production-secret");
  });
});
