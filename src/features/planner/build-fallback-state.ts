import type { PlannerDraft } from "@/types/planner";
import { generateChecklist } from "@/features/checklist/generate-checklist";
import { estimateMonthlyCosts } from "@/features/cost-estimates/estimate-costs";
import { exportLaunchPlanMarkdown } from "@/features/export/markdown";
import { generateLaunchPlan } from "@/features/launch-plan/generate-launch-plan";
import {
  inferIntakeFromAnalysis,
  summarizeMissingInformation
} from "@/features/planner/missing-information";
import { buildRecommendationOptions } from "@/features/recommendations/recommend-stack";
import { reviewRisks } from "@/features/risk-review/review-risks";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";
import type { ProjectIntakeField } from "@/types/planner";

const INTAKE_FIELDS: ProjectIntakeField[] = [
  "repoUrl",
  "appType",
  "traffic",
  "budget",
  "comfort",
  "priority",
  "needsBackend",
  "needsAuth",
  "needsDatabase",
  "needsFileUploads",
  "needsEmail",
  "needsPayments",
  "needsBackgroundJobs",
  "needsRealtime",
  "needsCustomDomain",
  "storesPersonalData",
  "needsSeo",
  "compliance",
  "deploymentStatus",
  "domainStatus",
  "audience",
  "willingToCreateProviderAccounts"
];

export function buildFallbackPlannerState(): PlannerDraft {
  return buildPlannerDraft(demoProjectAnalysis, demoProjectIntake);
}

export function buildBlankProjectIntake(
  repoUrl = "",
  repoSource: PlannerDraft["intake"]["source"] = "defaulted"
): PlannerDraft["intake"] {
  return {
    repoUrl,
    appType: "not_sure",
    traffic: "prototype",
    budget: "0_20",
    comfort: "beginner",
    priority: "simplicity",
    needsBackend: "not_sure",
    needsAuth: "not_sure",
    needsDatabase: "not_sure",
    needsFileUploads: "not_sure",
    needsEmail: "not_sure",
    needsPayments: "not_sure",
    needsBackgroundJobs: "not_sure",
    needsRealtime: "not_sure",
    needsCustomDomain: "not_sure",
    storesPersonalData: "not_sure",
    needsSeo: "not_sure",
    compliance: "not_sure",
    deploymentStatus: "not_deployed",
    domainStatus: "not_sure",
    audience: "not_sure",
    willingToCreateProviderAccounts: "not_sure",
    source: repoSource,
    sources: Object.fromEntries(
      INTAKE_FIELDS.map((field) => [
        field,
        field === "repoUrl" ? repoSource : "defaulted"
      ])
    ) as PlannerDraft["intake"]["sources"]
  };
}

export function buildIntakeOnlyAnalysis(input: {
  repoUrl?: string;
  projectName: string;
  projectSource?: PlannerDraft["analysis"]["projectName"]["source"];
}): PlannerDraft["analysis"] {
  const projectSource = input.projectSource ?? "defaulted";

  return {
    projectName: {
      label: "Project",
      value: input.projectName,
      source: projectSource,
      confidence: projectSource === "user_provided" ? "high" : "low",
      evidence: [
        {
          path: input.repoUrl ? "repo URL input" : "manual intake",
          detail: input.repoUrl
            ? "Extracted from the user-provided GitHub URL"
            : "Repo inspection has not run for this manual project"
        }
      ]
    },
    repoUrl: input.repoUrl,
    appRoot: {
      label: "App root",
      value: ".",
      source: "defaulted",
      confidence: "low",
      evidence: [
        {
          path: "intake",
          detail: "Defaulted until Phase 2 repo inspection identifies the app root"
        }
      ]
    },
    envVars: [],
    services: [],
    facts: [
      {
        label: "Repo inspection status",
        value:
          "Repo inspection did not produce file evidence yet. This state uses intake answers and defaulted analysis placeholders.",
        source: "defaulted",
        confidence: "high"
      }
    ]
  };
}

export function buildPlannerDraft(
  analysis: PlannerDraft["analysis"],
  intake: PlannerDraft["intake"],
  selectedRecommendationId?: string,
  updatedAt?: string
): PlannerDraft {
  const draftUpdatedAt = updatedAt ?? new Date().toISOString();
  const inferredIntake = inferIntakeFromAnalysis(intake, analysis);
  const missingInformation = summarizeMissingInformation(analysis, inferredIntake);
  const recommendations = buildRecommendationOptions(analysis, inferredIntake);
  const selectedRecommendation =
    recommendations.find(
      (recommendation) => recommendation.id === selectedRecommendationId
    ) ?? recommendations[0];
  const risks = reviewRisks(analysis);
  const costs = estimateMonthlyCosts(selectedRecommendation);
  const checklist = generateChecklist(analysis, selectedRecommendation, risks);
  const launchPlan = generateLaunchPlan({
    analysis,
    intake: inferredIntake,
    recommendation: selectedRecommendation,
    alternatives: recommendations.slice(1),
    risks,
    costs,
    checklist,
    generatedAt: draftUpdatedAt
  });

  return {
    intake: inferredIntake,
    analysis,
    missingInformation,
    recommendations,
    selectedRecommendationId: selectedRecommendation.id,
    risks,
    costs,
    checklist,
    launchPlan: {
      ...launchPlan,
      markdown: exportLaunchPlanMarkdown(launchPlan)
    },
    checkedItemIds: [],
    updatedAt: draftUpdatedAt
  };
}
