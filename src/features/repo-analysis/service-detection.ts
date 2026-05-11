import type { RepoFile } from "@/features/repo-analysis/repo-file";
import type { Evidence, ServiceCategory, ServiceDetection } from "@/types/planner";

interface ServiceRule {
  category: ServiceCategory;
  name: string;
  dependencies?: string[];
  sourcePatterns?: RegExp[];
  configPatterns?: RegExp[];
}

const SERVICE_RULES: ServiceRule[] = [
  {
    category: "database",
    name: "Prisma",
    dependencies: ["prisma", "@prisma/client"],
    configPatterns: [/^prisma\/schema\.prisma$/, /^prisma\/migrations\//]
  },
  {
    category: "database",
    name: "Drizzle",
    dependencies: ["drizzle-orm", "drizzle-kit"],
    configPatterns: [/^drizzle\.config\./]
  },
  {
    category: "database",
    name: "Supabase Postgres",
    dependencies: ["@supabase/supabase-js", "@supabase/ssr"],
    sourcePatterns: [/createClient\(.+supabase/i]
  },
  {
    category: "database",
    name: "Neon Postgres",
    dependencies: ["@neondatabase/serverless"],
    sourcePatterns: [/neon\(/i]
  },
  {
    category: "database",
    name: "MongoDB",
    dependencies: ["mongodb", "mongoose"],
    sourcePatterns: [/mongodb\+srv:|mongoose\.connect|MongoClient/]
  },
  {
    category: "database",
    name: "Firebase Firestore",
    dependencies: ["firebase", "firebase-admin"],
    sourcePatterns: [/getFirestore|Firestore/]
  },
  {
    category: "database",
    name: "SQLAlchemy",
    dependencies: ["sqlalchemy"],
    sourcePatterns: [/from sqlalchemy|create_engine\(/i]
  },
  {
    category: "database",
    name: "Django ORM",
    dependencies: ["django"],
    sourcePatterns: [/django\.db|INSTALLED_APPS/]
  },
  {
    category: "auth",
    name: "Auth.js",
    dependencies: ["next-auth", "@auth/core", "@auth/nextjs"],
    sourcePatterns: [/NextAuth|auth\(/]
  },
  {
    category: "auth",
    name: "Clerk",
    dependencies: ["@clerk/nextjs", "@clerk/clerk-react"],
    sourcePatterns: [/ClerkProvider|clerkMiddleware/]
  },
  {
    category: "auth",
    name: "Supabase Auth",
    dependencies: ["@supabase/supabase-js"],
    sourcePatterns: [/auth\.signIn|auth\.getUser|supabase\.auth/]
  },
  {
    category: "auth",
    name: "Firebase Auth",
    dependencies: ["firebase", "firebase-admin"],
    sourcePatterns: [/getAuth|signInWith/]
  },
  {
    category: "auth",
    name: "Passport",
    dependencies: ["passport", "passport-jwt"],
    sourcePatterns: [/passport\.use|passport\.authenticate/]
  },
  {
    category: "payments",
    name: "Stripe",
    dependencies: ["stripe", "@stripe/stripe-js"],
    sourcePatterns: [/new Stripe|stripe\.checkout|checkout\.sessions|billingPortal/]
  },
  {
    category: "payments",
    name: "Stripe webhook signature verification",
    sourcePatterns: [/stripe\.webhooks\.constructEvent|constructEventAsync/]
  },
  {
    category: "email",
    name: "Resend",
    dependencies: ["resend"],
    sourcePatterns: [/new Resend|resend\.emails\.send/]
  },
  {
    category: "email",
    name: "Postmark",
    dependencies: ["postmark"],
    sourcePatterns: [/ServerClient|postmark/i]
  },
  {
    category: "email",
    name: "SendGrid",
    dependencies: ["@sendgrid/mail", "sendgrid"],
    sourcePatterns: [/sendgrid|sgMail/i]
  },
  {
    category: "email",
    name: "Nodemailer or SMTP",
    dependencies: ["nodemailer"],
    sourcePatterns: [/createTransport|SMTP_HOST|SMTP_USER/]
  },
  {
    category: "storage",
    name: "S3-compatible storage",
    dependencies: ["@aws-sdk/client-s3", "aws-sdk"],
    sourcePatterns: [/S3Client|PutObjectCommand|AWS\.S3/]
  },
  {
    category: "storage",
    name: "Cloudinary",
    dependencies: ["cloudinary"],
    sourcePatterns: [/cloudinary\.uploader|CLOUDINARY_URL/]
  },
  {
    category: "storage",
    name: "UploadThing",
    dependencies: ["uploadthing"],
    sourcePatterns: [/createUploadthing|uploadthing/]
  },
  {
    category: "storage",
    name: "Local disk uploads",
    dependencies: ["multer"],
    sourcePatterns: [/diskStorage|writeFile\(|fs\.createWriteStream|uploads\//]
  },
  {
    category: "background_jobs",
    name: "BullMQ",
    dependencies: ["bullmq", "bull"],
    sourcePatterns: [/new Queue|QueueScheduler|Worker\(/]
  },
  {
    category: "background_jobs",
    name: "Celery",
    dependencies: ["celery"],
    sourcePatterns: [/from celery|Celery\(/]
  },
  {
    category: "background_jobs",
    name: "Inngest",
    dependencies: ["inngest"],
    sourcePatterns: [/inngest\.createFunction/]
  },
  {
    category: "background_jobs",
    name: "QStash",
    dependencies: ["@upstash/qstash"],
    sourcePatterns: [/qstash|QStash/]
  },
  {
    category: "background_jobs",
    name: "Scheduled workflow",
    configPatterns: [/^\.github\/workflows\/.+\.ya?ml$/],
    sourcePatterns: [/cron:/]
  },
  {
    category: "realtime",
    name: "Socket.IO",
    dependencies: ["socket.io", "socket.io-client"],
    sourcePatterns: [/socket\.on|io\(/]
  },
  {
    category: "realtime",
    name: "WebSockets",
    dependencies: ["ws"],
    sourcePatterns: [/new WebSocket|WebSocketServer|EventSource\(/]
  },
  {
    category: "realtime",
    name: "Pusher",
    dependencies: ["pusher", "pusher-js"],
    sourcePatterns: [/new Pusher|pusher\.trigger/]
  },
  {
    category: "realtime",
    name: "Ably",
    dependencies: ["ably"],
    sourcePatterns: [/new Ably|ably\.channels/]
  },
  {
    category: "analytics",
    name: "PostHog",
    dependencies: ["posthog-js", "posthog-node"],
    sourcePatterns: [/posthog\.capture|PostHogProvider/]
  },
  {
    category: "analytics",
    name: "Vercel Analytics",
    dependencies: ["@vercel/analytics"],
    sourcePatterns: [/<Analytics/]
  },
  {
    category: "analytics",
    name: "Plausible",
    dependencies: ["plausible-tracker"],
    sourcePatterns: [/plausible/i]
  },
  {
    category: "monitoring",
    name: "Sentry",
    dependencies: ["@sentry/nextjs", "@sentry/node", "@sentry/react"],
    sourcePatterns: [/Sentry\.init|captureException/],
    configPatterns: [/sentry\.(?:client|server|edge)\.config\./]
  },
  {
    category: "monitoring",
    name: "OpenTelemetry",
    dependencies: ["@opentelemetry/api", "@opentelemetry/sdk-node"],
    sourcePatterns: [/opentelemetry|trace\.getTracer/]
  },
  {
    category: "monitoring",
    name: "Datadog",
    dependencies: ["dd-trace", "@datadog/browser-rum"],
    sourcePatterns: [/datadogRum|dd-trace/]
  }
];

const PYTHON_DEPENDENCY_FILES = [/requirements.*\.txt$/, /pyproject\.toml$/];
const RUBY_DEPENDENCY_FILES = [/Gemfile$/];
const PHP_DEPENDENCY_FILES = [/composer\.json$/];

export function detectServiceUsage(files: RepoFile[]): ServiceDetection[] {
  const dependencies = collectDependencies(files);
  const detections = new Map<string, ServiceDetection>();

  for (const rule of SERVICE_RULES) {
    const evidence: Evidence[] = [];

    for (const dependency of rule.dependencies ?? []) {
      const match = dependencies.get(dependency.toLowerCase());
      if (match) {
        evidence.push(match);
      }
    }

    for (const file of files) {
      if (rule.configPatterns?.some((pattern) => pattern.test(file.path))) {
        evidence.push({
          path: file.path,
          detail: `${rule.name} config or migration file detected`
        });
      }

      if (rule.sourcePatterns?.some((pattern) => pattern.test(file.content))) {
        evidence.push({
          path: file.path,
          detail: `${rule.name} source usage detected`
        });
      }
    }

    if (evidence.length > 0) {
      upsertDetection(detections, {
        category: rule.category,
        name: rule.name,
        source: "detected",
        confidence: evidence.length > 1 ? "high" : "medium",
        evidence: dedupeEvidence(evidence)
      });
    }
  }

  return [...detections.values()].sort((left, right) =>
    `${left.category}:${left.name}`.localeCompare(`${right.category}:${right.name}`)
  );
}

export function mergeServiceDetections(services: ServiceDetection[]): ServiceDetection[] {
  const merged = new Map<string, ServiceDetection>();

  for (const service of services) {
    upsertDetection(merged, service);
  }

  return [...merged.values()].sort((left, right) =>
    `${left.category}:${left.name}`.localeCompare(`${right.category}:${right.name}`)
  );
}

function collectDependencies(files: RepoFile[]) {
  const dependencies = new Map<string, Evidence>();

  for (const file of files) {
    if (file.path.endsWith("package.json")) {
      collectPackageDependencies(file, dependencies);
    }

    if (PYTHON_DEPENDENCY_FILES.some((pattern) => pattern.test(file.path))) {
      collectLineDependencies(file, dependencies);
    }

    if (RUBY_DEPENDENCY_FILES.some((pattern) => pattern.test(file.path))) {
      for (const match of file.content.matchAll(/gem ["']([^"']+)["']/g)) {
        dependencies.set(match[1].toLowerCase(), {
          path: file.path,
          detail: `Ruby gem ${match[1]} detected`
        });
      }
    }

    if (PHP_DEPENDENCY_FILES.some((pattern) => pattern.test(file.path))) {
      collectComposerDependencies(file, dependencies);
    }
  }

  return dependencies;
}

function collectPackageDependencies(file: RepoFile, dependencies: Map<string, Evidence>) {
  try {
    const manifest = JSON.parse(file.content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    for (const dependency of [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {})
    ]) {
      dependencies.set(dependency.toLowerCase(), {
        path: file.path,
        detail: `npm dependency ${dependency} detected`
      });
    }
  } catch {
    // Invalid package.json should not stop repo analysis.
  }
}

function collectLineDependencies(file: RepoFile, dependencies: Map<string, Evidence>) {
  for (const line of file.content.split(/\r?\n/)) {
    const name = line
      .trim()
      .replace(/^["']|["']$/g, "")
      .match(/^([A-Za-z0-9_.-]+)/)?.[1];

    if (!name || ["dependencies", "project", "tool"].includes(name)) {
      continue;
    }

    dependencies.set(name.toLowerCase(), {
      path: file.path,
      detail: `Python dependency ${name} detected`
    });
  }
}

function collectComposerDependencies(
  file: RepoFile,
  dependencies: Map<string, Evidence>
) {
  try {
    const manifest = JSON.parse(file.content) as {
      require?: Record<string, string>;
      "require-dev"?: Record<string, string>;
    };

    for (const dependency of [
      ...Object.keys(manifest.require ?? {}),
      ...Object.keys(manifest["require-dev"] ?? {})
    ]) {
      dependencies.set(dependency.toLowerCase(), {
        path: file.path,
        detail: `Composer package ${dependency} detected`
      });
    }
  } catch {
    // Invalid composer.json should not stop repo analysis.
  }
}

function upsertDetection(
  detections: Map<string, ServiceDetection>,
  service: ServiceDetection
) {
  const key = `${service.category}:${service.name}`;
  const existing = detections.get(key);

  if (!existing) {
    detections.set(key, service);
    return;
  }

  existing.evidence = dedupeEvidence([...existing.evidence, ...service.evidence]);
  existing.confidence =
    existing.confidence === "high" || service.confidence === "high" ? "high" : "medium";
}

function dedupeEvidence(evidence: Evidence[]) {
  const seen = new Set<string>();

  return evidence.filter((item) => {
    const key = `${item.path}:${item.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
