import type {
  ChecklistSection,
  CostEstimate,
  LaunchPlan,
  ProjectIntake,
  RecommendationOption,
  RepoAnalysis,
  Risk
} from "@/types/planner";

export function generateLaunchPlan(input: {
  analysis: RepoAnalysis;
  intake?: ProjectIntake;
  recommendation: RecommendationOption;
  alternatives: RecommendationOption[];
  risks: Risk[];
  costs: CostEstimate;
  checklist: ChecklistSection[];
  generatedAt?: string;
}): LaunchPlan {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const sections = [
    {
      title: "Project Summary",
      body: `${input.analysis.projectName.value} is being prepared for a production deployment plan. Detected facts are labeled separately from inferred or defaulted guidance.`
    },
    {
      title: "Detected Stack",
      body: [
        `- App root: ${input.analysis.appRoot.value}`,
        `- Frontend framework: ${input.analysis.frontendFramework?.value ?? "Unknown"}`,
        `- Backend framework: ${input.analysis.backendFramework?.value ?? "Unknown"}`,
        `- Package manager: ${input.analysis.packageManager?.value ?? "Unknown"}`,
        `- Build command: ${input.analysis.buildCommand?.value ?? "Unknown"}`,
        `- Start command: ${input.analysis.startCommand?.value ?? "Unknown"}`
      ].join("\n")
    },
    {
      title: "Missing Information",
      body: input.intake
        ? renderMissingInformation(input.intake)
        : "Confirm launch traffic, budget, production domain, and any compliance or data residency requirements before treating the plan as final."
    },
    {
      title: "Recommended Stack",
      body: renderRecommendation(input.recommendation)
    },
    {
      title: "Alternative Stack Options",
      body: input.alternatives.map(renderRecommendation).join("\n\n")
    },
    {
      title: "Environment Variables",
      body:
        input.analysis.envVars.length > 0
          ? input.analysis.envVars
              .map((envVar) => `- ${envVar.name}: ${envVar.description}`)
              .join("\n")
          : "No environment variables were detected in the demo analysis."
    },
    {
      title: "Deployment Steps",
      body: [
        `1. Import the GitHub repository into ${input.recommendation.services.hosting}.`,
        `2. Set the app root to ${input.analysis.appRoot.value}.`,
        `3. Set the build command to ${input.analysis.buildCommand?.value ?? "the framework default"}.`,
        `4. Set the start command to ${input.analysis.startCommand?.value ?? "the provider default"}.`,
        "5. Add every required environment variable in the production provider dashboard.",
        "6. Deploy a preview build, test the core workflow, then promote to production."
      ].join("\n")
    },
    {
      title: "Cost Estimate",
      body: [
        input.costs.caveat,
        "",
        "| Usage tier | Monthly range | Assumption |",
        "| --- | --- | --- |",
        ...input.costs.tiers.map(
          (tier) =>
            `| ${tier.label} | ${tier.monthlyRange} | ${tier.assumptions.join(" ")} |`
        )
      ].join("\n")
    },
    {
      title: "Production Risks",
      body:
        input.risks.length > 0
          ? input.risks
              .map(
                (risk) => `- ${risk.severity.toUpperCase()}: ${risk.title}. ${risk.fix}`
              )
              .join("\n")
          : "No launch-blocking risks were detected in the current analysis."
    },
    {
      title: "Launch Checklist",
      body: input.checklist.map(renderChecklistSection).join("\n\n")
    },
    {
      title: "Rollback Plan",
      body: "Keep the previous production deployment available. If launch fails, redeploy the previous build or revert the launch commit, then restore the database from the latest backup if a migration caused data issues."
    },
    {
      title: "Next Actions",
      body: "Connect real repo inspection, confirm missing business inputs, and replace demo output with repo-specific evidence before V0 is considered complete."
    }
  ];

  const markdown = sections
    .map((section) => `## ${section.title}\n\n${section.body}`)
    .join("\n\n");

  return {
    projectName: input.analysis.projectName.value,
    generatedAt,
    sections,
    markdown
  };
}

function renderMissingInformation(intake: ProjectIntake) {
  const missing: string[] = [];

  if (intake.sources.appType !== "user_provided") {
    missing.push("app type");
  }

  if (intake.sources.traffic !== "user_provided") {
    missing.push("expected traffic");
  }

  if (intake.sources.budget !== "user_provided") {
    missing.push("monthly budget");
  }

  if (intake.sources.audience !== "user_provided") {
    missing.push("target audience");
  }

  if (intake.sources.comfort !== "user_provided") {
    missing.push("technical comfort level");
  }

  if (intake.sources.priority !== "user_provided") {
    missing.push("top priority");
  }

  if (intake.sources.deploymentStatus !== "user_provided") {
    missing.push("current deployment status");
  }

  if (intake.sources.domainStatus !== "user_provided") {
    missing.push("domain ownership");
  }

  if (intake.sources.compliance !== "user_provided") {
    missing.push("compliance or data residency requirements");
  }

  if (intake.sources.storesPersonalData !== "user_provided") {
    missing.push("whether personal data is stored");
  }

  if (intake.sources.needsSeo !== "user_provided") {
    missing.push("whether SEO-visible pages exist");
  }

  if (intake.sources.willingToCreateProviderAccounts !== "user_provided") {
    missing.push("willingness to create provider accounts");
  }

  if (intake.sources.needsBackend !== "user_provided") {
    missing.push("whether a backend or API is needed");
  }

  if (intake.sources.needsAuth !== "user_provided") {
    missing.push("whether authentication is needed");
  }

  if (intake.sources.needsDatabase !== "user_provided") {
    missing.push("whether a database is needed");
  }

  if (intake.sources.needsFileUploads !== "user_provided") {
    missing.push("whether file uploads are needed");
  }

  if (intake.sources.needsEmail !== "user_provided") {
    missing.push("whether email sending is needed");
  }

  if (intake.sources.needsPayments !== "user_provided") {
    missing.push("whether payments are needed");
  }

  if (intake.sources.needsBackgroundJobs !== "user_provided") {
    missing.push("whether background jobs are needed");
  }

  if (intake.sources.needsRealtime !== "user_provided") {
    missing.push("whether real-time features are needed");
  }

  if (intake.sources.needsCustomDomain !== "user_provided") {
    missing.push("whether a custom domain is needed");
  }

  if (missing.length === 0) {
    return "No critical intake questions are currently unanswered. Repo-derived facts still need live inspection before this plan is final.";
  }

  return `Confirm ${missing.join(", ")} before treating the plan as final.`;
}

function renderRecommendation(recommendation: RecommendationOption) {
  return [
    `### ${recommendation.label}`,
    recommendation.summary,
    "",
    `Why: ${recommendation.why}`,
    "",
    `Estimated monthly cost: ${recommendation.estimatedMonthlyCost}`,
    "",
    `When not to choose this: ${recommendation.whenNotToChoose}`
  ].join("\n");
}

function renderChecklistSection(section: ChecklistSection) {
  if (!section.relevant) {
    return `### ${section.title}\n\n_Not relevant for this detected project shape._`;
  }

  return [
    `### ${section.title}`,
    "",
    ...section.items.map((item) => `- [ ] ${item.text}`)
  ].join("\n");
}
