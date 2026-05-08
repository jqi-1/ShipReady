import type { LaunchPlan } from "@/types/planner";

export function exportLaunchPlanMarkdown(plan: LaunchPlan) {
  return [
    `# ${plan.projectName} Launch Plan`,
    "",
    `Generated: ${plan.generatedAt}`,
    "",
    plan.markdown
  ].join("\n");
}
