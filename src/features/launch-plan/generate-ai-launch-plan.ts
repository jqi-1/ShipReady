import {
  buildAiDraft,
  buildMarkdownFromAiSections,
  parseAiResponse
} from "@/features/launch-plan/ai-system-prompt";
import { callAi, getAiClientConfig } from "@/lib/ai-client";
import type { AiClientConfig, AiResponse } from "@/lib/ai-client";
import type { LaunchPlan, ProjectIntake, RepoAnalysis } from "@/types/planner";

type AiCaller = (
  messages: Parameters<typeof callAi>[0],
  config: AiClientConfig
) => Promise<AiResponse>;

export interface GeneratePlanWithAiResult {
  launchPlan: LaunchPlan;
  generationMode: LaunchPlan["generationMode"];
  message: string;
  model?: string;
}

export async function generateLaunchPlanWithAi(input: {
  analysis: RepoAnalysis;
  intake: ProjectIntake;
  fallbackPlan: LaunchPlan;
  aiConfig?: AiClientConfig | null;
  aiCaller?: AiCaller;
  log?: (message: string) => void;
}): Promise<GeneratePlanWithAiResult> {
  const aiConfig = input.aiConfig === undefined ? getAiClientConfig() : input.aiConfig;

  if (!aiConfig) {
    input.log?.(
      `[generate-plan] AI provider is not configured; deterministic fallback was used for ${input.analysis.projectName.value}`
    );
    return {
      launchPlan: input.fallbackPlan,
      generationMode: "deterministic",
      message: "AI provider is not configured; deterministic plan was used."
    };
  }

  const aiCaller = input.aiCaller ?? callAi;
  const prompt = buildAiDraft(input.analysis, input.intake);

  try {
    const response = await aiCaller(
      [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ],
      aiConfig
    );
    const aiResult = parseAiResponse(response.content);

    if (!aiResult) {
      input.log?.(
        `[generate-plan] AI returned unparseable content; deterministic fallback was used for ${input.analysis.projectName.value}`
      );
      return {
        launchPlan: input.fallbackPlan,
        generationMode: "deterministic",
        message: "AI response could not be parsed; deterministic plan was used."
      };
    }

    const launchPlan: LaunchPlan = {
      projectName: input.fallbackPlan.projectName,
      generatedAt: new Date().toISOString(),
      sections: aiResult.sections,
      markdown: buildMarkdownFromAiSections(aiResult.sections),
      generationMode: "ai"
    };

    input.log?.(
      `[generate-plan] AI plan generated using ${aiConfig.provider}/${response.model} for ${input.analysis.projectName.value}`
    );

    return {
      launchPlan,
      generationMode: "ai",
      message: "AI-generated plan created.",
      model: response.model
    };
  } catch (error) {
    input.log?.(
      `[generate-plan] AI call failed: ${
        error instanceof Error ? error.message : "unknown error"
      }; deterministic fallback was used for ${input.analysis.projectName.value}`
    );
    return {
      launchPlan: input.fallbackPlan,
      generationMode: "deterministic",
      message: "AI call failed or timed out; deterministic plan was used."
    };
  }
}
