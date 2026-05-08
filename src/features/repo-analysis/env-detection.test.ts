import { describe, expect, it } from "vitest";
import { detectEnvironmentVariables } from "./env-detection";

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
});
