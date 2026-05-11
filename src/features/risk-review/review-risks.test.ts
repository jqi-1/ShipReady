import { describe, expect, it } from "vitest";
import type { DockerfileAnalysis, RepoAnalysis, EnvVariable, ServiceDetection } from "@/types/planner";
import { demoProjectAnalysis } from "@/fixtures/demo-project";
import { reviewRisks } from "./review-risks";

function envVar(overrides: Partial<EnvVariable> & { name: string }): EnvVariable {
  return {
    required: false,
    exposure: "server",
    description: "Test env var.",
    source: "detected",
    confidence: "high",
    evidence: [],
    ...overrides
  };
}

function service(overrides: Partial<ServiceDetection> & { category: ServiceDetection["category"]; name: string }): ServiceDetection {
  return {
    source: "detected",
    confidence: "high",
    evidence: [],
    ...overrides
  };
}

describe("reviewRisks", () => {
  it("flags payment webhook verification when Stripe is detected without a webhook secret", () => {
    const risks = reviewRisks(demoProjectAnalysis);

    expect(risks.some((risk) => risk.id === "missing-stripe-webhook-secret")).toBe(true);
  });

  it("flags client-side secret exposure", () => {
    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      envVars: [
        envVar({
          name: "NEXT_PUBLIC_STRIPE_SECRET_KEY",
          required: true,
          exposure: "client"
        })
      ],
      services: []
    };

    const risks = reviewRisks(analysis);

    expect(risks[0]).toMatchObject({
      severity: "high",
      category: "security"
    });
  });

  it("flags missing required environment variables", () => {
    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      envVars: [
        envVar({
          name: "DATABASE_URL",
          required: true,
          description: "Database connection string."
        })
      ],
      services: [service({ category: "database", name: "Prisma" })]
    };

    const risks = reviewRisks(analysis);

    expect(risks.some((risk) => risk.id === "missing-required-env-vars")).toBe(true);
  });

  it("flags missing database migration strategy", () => {
    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      services: [service({ category: "database", name: "Prisma" })],
      envVars: [
        envVar({
          name: "DATABASE_URL",
          required: true,
          description: "Database URL."
        })
      ]
    };

    const risks = reviewRisks(analysis);

    expect(risks.some((risk) => risk.id === "missing-migration-strategy")).toBe(true);
  });

  it("flags missing email authentication when email service is detected", () => {
    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      services: [
        service({ category: "email", name: "Resend" })
      ],
      envVars: []
    };

    const risks = reviewRisks(analysis);

    expect(risks.some((risk) => risk.id === "missing-email-authentication")).toBe(true);
  });

  it("flags Docker risks when Docker analysis is present", () => {
    const dockerfile: DockerfileAnalysis = {
      path: "Dockerfile",
      baseImages: ["node:20-alpine"],
      stages: ["base", "production"],
      installSteps: ["npm ci"],
      copyInstructions: ["COPY . ."],
      exposedPorts: [],
      workdir: "/app",
      user: "root",
      buildArgs: [],
      envVars: [],
      likelyProduction: true
    };

    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      docker: {
        dockerfiles: [dockerfile],
        composeFiles: [],
        hasDockerignore: false,
        serviceDependencies: [],
        needsProductionDocker: true,
        probablyLocalOnly: false,
        recommendation: "Use Docker-based deployment.",
        risks: []
      }
    };

    const risks = reviewRisks(analysis);

    expect(risks.some((risk) => risk.id === "docker-missing-dockerignore")).toBe(true);
    expect(risks.some((risk) => risk.id === `docker-ambiguous-port-${dockerfile.path}`)).toBe(true);
    expect(risks.some((risk) => risk.id === `docker-root-user-${dockerfile.path}`)).toBe(true);
  });

  it("flags missing terms of service for apps with payments", () => {
    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      services: [
        service({ category: "payments", name: "Stripe" })
      ],
      envVars: []
    };

    const risks = reviewRisks(analysis);

    expect(risks.some((risk) => risk.id === "missing-terms-of-service")).toBe(true);
  });

  it("flags missing privacy policy for apps with user accounts", () => {
    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      services: [
        service({ category: "auth", name: "Auth.js" })
      ],
      envVars: [
        envVar({
          name: "AUTH_SECRET",
          required: true,
          description: "Auth secret."
        })
      ]
    };

    const risks = reviewRisks(analysis);

    expect(risks.some((risk) => risk.id === "missing-privacy-policy")).toBe(true);
  });

  it("de-duplicates risks with the same ID", () => {
    const analysis: RepoAnalysis = {
      ...demoProjectAnalysis,
      envVars: [
        envVar({
          name: "NEXT_PUBLIC_STRIPE_KEY",
          required: true,
          exposure: "client",
          description: "Stripe key."
        })
      ],
      services: []
    };

    const risks = reviewRisks(analysis);

    const clientSecrets = risks.filter((r) => r.id.startsWith("client-secret-"));
    expect(clientSecrets).toHaveLength(1);
  });
});
