import { describe, expect, it } from "vitest";
import { analyzeRepoFiles } from "./analyze-repo";
import { detectServiceUsage } from "./service-detection";

describe("detectServiceUsage", () => {
  it("detects common production services from package dependencies", () => {
    const services = detectServiceUsage([
      {
        path: "package.json",
        content: JSON.stringify({
          dependencies: {
            "@prisma/client": "latest",
            "next-auth": "latest",
            stripe: "latest",
            resend: "latest",
            "@aws-sdk/client-s3": "latest",
            bullmq: "latest",
            "socket.io": "latest",
            "posthog-js": "latest",
            "@sentry/nextjs": "latest"
          },
          devDependencies: {
            prisma: "latest"
          }
        })
      },
      {
        path: "prisma/migrations/001_init/migration.sql",
        content: "create table users(id serial primary key);"
      }
    ]);

    expect(services.map((service) => `${service.category}:${service.name}`)).toEqual(
      expect.arrayContaining([
        "database:Prisma",
        "auth:Auth.js",
        "payments:Stripe",
        "email:Resend",
        "storage:S3-compatible storage",
        "background_jobs:BullMQ",
        "realtime:Socket.IO",
        "analytics:PostHog",
        "monitoring:Sentry"
      ])
    );
  });

  it("detects services from source snippets across runtimes", () => {
    const services = detectServiceUsage([
      {
        path: "main.py",
        content: "from fastapi import FastAPI\nfrom sqlalchemy import create_engine\n"
      },
      {
        path: "app/api/stripe.ts",
        content:
          "stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)"
      },
      {
        path: "app/upload.ts",
        content: "await writeFile('/tmp/uploads/file.png', bytes)"
      },
      {
        path: ".github/workflows/cron.yml",
        content: "on:\n  schedule:\n    - cron: '0 0 * * *'\n"
      }
    ]);

    expect(services.map((service) => `${service.category}:${service.name}`)).toEqual(
      expect.arrayContaining([
        "database:SQLAlchemy",
        "payments:Stripe webhook signature verification",
        "storage:Local disk uploads",
        "background_jobs:Scheduled workflow"
      ])
    );
  });

  it("feeds detected services into repo analysis", () => {
    const analysis = analyzeRepoFiles([
      {
        path: "package.json",
        content: JSON.stringify({
          dependencies: {
            stripe: "latest",
            resend: "latest",
            "posthog-js": "latest"
          }
        })
      }
    ]);

    expect(analysis.services.map((service) => service.name)).toEqual(
      expect.arrayContaining(["Stripe", "Resend", "PostHog"])
    );
  });
});
