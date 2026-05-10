import type { ProjectIntake, RepoAnalysis } from "@/types/planner";

export const demoProjectIntake: ProjectIntake = {
  repoUrl: "https://github.com/example/ai-saas-prototype",
  appType: "saas",
  traffic: "1k_mau",
  budget: "20_100",
  comfort: "comfortable",
  priority: "speed",
  needsBackend: true,
  needsAuth: true,
  needsDatabase: true,
  needsFileUploads: "not_sure",
  needsEmail: true,
  needsPayments: true,
  needsBackgroundJobs: false,
  needsRealtime: false,
  needsCustomDomain: true,
  storesPersonalData: true,
  needsSeo: true,
  compliance: "none",
  deploymentStatus: "not_deployed",
  domainStatus: "owns_domain",
  audience: "public_users",
  willingToCreateProviderAccounts: "yes",
  source: "defaulted",
  sources: {
    repoUrl: "defaulted",
    appType: "defaulted",
    traffic: "defaulted",
    budget: "defaulted",
    comfort: "defaulted",
    priority: "defaulted",
    needsBackend: "defaulted",
    needsAuth: "defaulted",
    needsDatabase: "defaulted",
    needsFileUploads: "defaulted",
    needsEmail: "defaulted",
    needsPayments: "defaulted",
    needsBackgroundJobs: "defaulted",
    needsRealtime: "defaulted",
    needsCustomDomain: "defaulted",
    storesPersonalData: "defaulted",
    needsSeo: "defaulted",
    compliance: "defaulted",
    deploymentStatus: "defaulted",
    domainStatus: "defaulted",
    audience: "defaulted",
    willingToCreateProviderAccounts: "defaulted"
  }
};

export const demoProjectAnalysis: RepoAnalysis = {
  projectName: {
    label: "Project",
    value: "AI SaaS Prototype",
    source: "defaulted",
    confidence: "medium",
    evidence: [
      {
        path: "package.json",
        detail: "Derived from package.json name and repository context"
      }
    ]
  },
  repoUrl: demoProjectIntake.repoUrl,
  appRoot: {
    label: "App root",
    value: ".",
    source: "detected",
    confidence: "high",
    evidence: [{ path: "package.json", detail: "Found at repository root" }]
  },
  packageManager: {
    label: "Package manager",
    value: "pnpm",
    source: "detected",
    confidence: "high",
    evidence: [{ path: "pnpm-lock.yaml", detail: "Lockfile detected" }]
  },
  frontendFramework: {
    label: "Frontend framework",
    value: "Next.js",
    source: "detected",
    confidence: "high",
    evidence: [{ path: "package.json", detail: "Dependency next detected" }]
  },
  backendFramework: {
    label: "Backend framework",
    value: "Next.js route handlers",
    source: "inferred",
    confidence: "medium",
    evidence: [{ path: "app/api", detail: "API route folder detected" }]
  },
  buildCommand: {
    label: "Build command",
    value: "pnpm build",
    source: "detected",
    confidence: "high",
    evidence: [{ path: "package.json", detail: "scripts.build" }]
  },
  startCommand: {
    label: "Start command",
    value: "pnpm start",
    source: "detected",
    confidence: "high",
    evidence: [{ path: "package.json", detail: "scripts.start" }]
  },
  runtime: {
    label: "Runtime",
    value: "Node.js 20",
    source: "detected",
    confidence: "medium",
    evidence: [{ path: "package.json", detail: "engines.node" }]
  },
  envVars: [
    {
      name: "DATABASE_URL",
      required: true,
      exposure: "server",
      description: "Production Postgres connection string.",
      source: "detected",
      confidence: "high",
      evidence: [{ path: ".env.example", detail: "Declared in env example" }]
    },
    {
      name: "AUTH_SECRET",
      required: true,
      exposure: "server",
      description: "Auth session signing secret.",
      source: "detected",
      confidence: "high",
      evidence: [{ path: ".env.example", detail: "Declared in env example" }]
    },
    {
      name: "STRIPE_SECRET_KEY",
      required: true,
      exposure: "server",
      description: "Stripe server-side API key.",
      source: "detected",
      confidence: "high",
      evidence: [{ path: "lib/billing.ts", detail: "Referenced in server code" }]
    },
    {
      name: "RESEND_API_KEY",
      required: true,
      exposure: "server",
      description: "Resend transactional email API key.",
      source: "detected",
      confidence: "high",
      evidence: [{ path: "lib/email.ts", detail: "Referenced in server code" }]
    },
    {
      name: "NEXT_PUBLIC_POSTHOG_KEY",
      required: false,
      exposure: "client",
      description: "PostHog public project key.",
      source: "detected",
      confidence: "medium",
      evidence: [{ path: "app/providers.tsx", detail: "Referenced in client analytics" }]
    }
  ],
  services: [
    {
      category: "database",
      name: "Supabase Postgres",
      source: "detected",
      confidence: "medium",
      evidence: [
        { path: "package.json", detail: "Dependency @supabase/supabase-js detected" }
      ]
    },
    {
      category: "auth",
      name: "Auth.js",
      source: "detected",
      confidence: "high",
      evidence: [{ path: "package.json", detail: "Dependency next-auth detected" }]
    },
    {
      category: "payments",
      name: "Stripe",
      source: "detected",
      confidence: "high",
      evidence: [{ path: "package.json", detail: "Dependency stripe detected" }]
    },
    {
      category: "email",
      name: "Resend",
      source: "detected",
      confidence: "high",
      evidence: [{ path: "package.json", detail: "Dependency resend detected" }]
    },
    {
      category: "analytics",
      name: "PostHog",
      source: "detected",
      confidence: "medium",
      evidence: [{ path: "package.json", detail: "Dependency posthog-js detected" }]
    }
  ],
  facts: [
    {
      label: "Accuracy promise",
      value:
        "Detected, inferred, defaulted, unknown, and user-provided facts are labeled before recommendation.",
      source: "defaulted",
      confidence: "high"
    }
  ]
};
