import type { PlannerDraft } from "@/types/planner";
import { generateChecklist } from "@/features/checklist/generate-checklist";
import { estimateMonthlyCosts } from "@/features/cost-estimates/estimate-costs";
import { exportLaunchPlanMarkdown } from "@/features/export/markdown";
import { generateLaunchPlan } from "@/features/launch-plan/generate-launch-plan";
import { buildRecommendationOptions } from "@/features/recommendations/recommend-stack";
import { reviewRisks } from "@/features/risk-review/review-risks";
import { demoProjectAnalysis, demoProjectIntake } from "@/fixtures/demo-project";

export function buildFallbackPlannerState(): PlannerDraft {
  const recommendations = buildRecommendationOptions(
    demoProjectAnalysis,
    demoProjectIntake
  );
  const selectedRecommendation = recommendations[0];
  const risks = reviewRisks(demoProjectAnalysis);
  const costs = estimateMonthlyCosts(selectedRecommendation);
  const checklist = generateChecklist(demoProjectAnalysis, selectedRecommendation, risks);
  const launchPlan = generateLaunchPlan({
    analysis: demoProjectAnalysis,
    recommendation: selectedRecommendation,
    alternatives: recommendations.slice(1),
    risks,
    costs,
    checklist
  });

  return {
    intake: demoProjectIntake,
    analysis: demoProjectAnalysis,
    recommendations,
    selectedRecommendationId: selectedRecommendation.id,
    risks,
    costs,
    checklist,
    launchPlan: {
      ...launchPlan,
      markdown: exportLaunchPlanMarkdown(launchPlan)
    },
    updatedAt: new Date().toISOString()
  };
}
