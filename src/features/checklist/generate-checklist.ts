import type {
  ChecklistSection,
  RecommendationOption,
  RepoAnalysis,
  Risk
} from "@/types/planner";

export function generateChecklist(
  analysis: RepoAnalysis,
  recommendation: RecommendationOption,
  risks: Risk[]
): ChecklistSection[] {
  const envItems = analysis.envVars.map((envVar) => ({
    id: `env-${envVar.name.toLowerCase()}`,
    text: `${envVar.name} is set in the production hosting provider.`,
    requiredBeforeLaunch: envVar.required
  }));

  return [
    {
      title: "Build and Deploy",
      relevant: true,
      items: [
        {
          id: "build-command",
          text: `Build command is set to ${analysis.buildCommand?.value ?? "the detected production build command"}.`,
          requiredBeforeLaunch: true
        },
        {
          id: "start-command",
          text: `Start command is set to ${analysis.startCommand?.value ?? "the provider default for this framework"}.`,
          requiredBeforeLaunch: true
        },
        {
          id: "provider-import",
          text: `${recommendation.services.hosting} is connected to the GitHub repository.`,
          requiredBeforeLaunch: true
        }
      ]
    },
    {
      title: "Environment Variables",
      relevant: envItems.length > 0,
      items: envItems
    },
    {
      title: "Production Risks",
      relevant: risks.length > 0,
      items: risks.map((risk) => ({
        id: `risk-${risk.id}`,
        text: risk.fix,
        requiredBeforeLaunch: risk.launchBlocker
      }))
    },
    {
      title: "Monitoring and Analytics",
      relevant: true,
      items: [
        {
          id: "monitoring-test-event",
          text: "Error monitoring receives a production test event.",
          requiredBeforeLaunch: false
        },
        {
          id: "analytics-production-event",
          text: "Analytics records a production page view or product event.",
          requiredBeforeLaunch: false
        }
      ]
    },
    {
      title: "Rollback",
      relevant: true,
      items: [
        {
          id: "rollback-owner-access",
          text: "The owner can redeploy the previous production build or revert the launch commit.",
          requiredBeforeLaunch: true
        },
        {
          id: "migration-rollback",
          text: "Any database migration has a backup or reversible rollback path.",
          requiredBeforeLaunch: risks.some((risk) => risk.category === "database")
        }
      ]
    }
  ];
}
