import { NextResponse } from "next/server";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { fetchPublicGitHubRepoFiles } from "@/features/repo-analysis/github-fetch";
import { buildPlannerDraft } from "@/features/planner/build-fallback-state";
import { buildBlankProjectIntake } from "@/features/planner/build-fallback-state";
import { exportLaunchPlanMarkdown } from "@/features/export/markdown";
import { parseGitHubRepoUrl } from "@/features/intake/validate-github-url";
import {
  getAiClientConfig,
  callAi
} from "@/lib/ai-client";
import {
  buildAiDraft,
  parseAiResponse,
  buildMarkdownFromAiSections
} from "@/features/launch-plan/ai-system-prompt";
import { checkRateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_SIZE = 50_240;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: "Rate limit exceeded. Try again later."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
          ),
          "X-RateLimit-Remaining": "0"
        }
      }
    );
  }

  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          message: "Request body too large. Maximum size is 50KB."
        },
        { status: 413 }
      );
    }

    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const repoUrl = parsedBody?.repoUrl;
    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { ok: false, message: "Repo URL is required." },
        { status: 400 }
      );
    }

    const intake = parsedBody?.intake as Record<string, unknown> | undefined;

    const parsed = parseGitHubRepoUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Use a valid GitHub repo URL like https://github.com/org/repo."
        },
        { status: 400 }
      );
    }

    const fetched = await fetchPublicGitHubRepoFiles(parsed.normalizedUrl);

    if (!fetched.ok) {
      return NextResponse.json(
        {
          ok: false,
          reason: fetched.reason,
          message: fetched.message
        },
        { status: fetched.status === 403 || fetched.status === 429 ? 429 : 422 }
      );
    }

    const analysis = analyzeRepoFiles(fetched.files, {
      repoUrl: fetched.repoUrl,
      defaultBranch: fetched.defaultBranch
    });

    const projectIntake = buildBlankProjectIntake(
      parsed.normalizedUrl,
      "user_provided"
    );

    if (intake) {
      const intakeAny = projectIntake as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(intake)) {
        if (key in intakeAny && value !== undefined) {
          intakeAny[key] = value;
        }
      }
    }

    const draft = buildPlannerDraft(analysis, projectIntake);
    let launchPlan = draft.launchPlan;
    let generationMode: "ai" | "deterministic" = "deterministic";

    const aiConfig = getAiClientConfig();
    if (aiConfig) {
      try {
        const prompt = buildAiDraft(analysis, projectIntake);
        const response = await callAi(
          [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user }
          ],
          aiConfig
        );

        const aiResult = parseAiResponse(response.content);
        if (aiResult && aiResult.sections.length > 0) {
          const aiMarkdown = buildMarkdownFromAiSections(aiResult.sections);
          launchPlan = {
            projectName: draft.launchPlan.projectName,
            generatedAt: draft.launchPlan.generatedAt,
            sections: aiResult.sections,
            markdown: aiMarkdown,
            generationMode: "ai"
          };
          generationMode = "ai";
          console.log(
            `[generate-plan] AI plan generated using ${aiConfig.provider}/${response.model} for ${parsed.normalizedUrl}`
          );
        } else {
          console.log(
            `[generate-plan] AI returned unparseable response, using deterministic fallback for ${parsed.normalizedUrl}`
          );
        }
      } catch (error) {
        console.log(
          `[generate-plan] AI call failed: ${error instanceof Error ? error.message : "unknown error"}, using deterministic fallback for ${parsed.normalizedUrl}`
        );
      }
    }

    const markdown = exportLaunchPlanMarkdown(launchPlan);

    return NextResponse.json({
      ok: true,
      repoUrl: parsed.normalizedUrl,
      projectName: analysis.projectName.value,
      generationMode,
      analysis: {
        framework: analysis.frontendFramework?.value ?? null,
        backend: analysis.backendFramework?.value ?? null,
        packageManager: analysis.packageManager?.value ?? null,
        buildCommand: analysis.buildCommand?.value ?? null,
        startCommand: analysis.startCommand?.value ?? null,
        runtime: analysis.runtime?.value ?? null,
        envVarCount: analysis.envVars.length,
        serviceCount: analysis.services.length,
        hasDocker: Boolean(analysis.docker)
      },
      riskCount: draft.risks.length,
      launchBlockerCount: draft.risks.filter((r) => r.launchBlocker).length,
      checklistSectionCount: draft.checklist.filter((s) => s.relevant).length,
      markdown
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `Plan generation error: ${error.message}`
            : "An unexpected error occurred during plan generation."
      },
      { status: 500 }
    );
  }
}
