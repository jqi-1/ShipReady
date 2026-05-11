import { NextResponse } from "next/server";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { fetchPublicGitHubRepoFiles } from "@/features/repo-analysis/github-fetch";
import { buildPlannerDraft } from "@/features/planner/build-fallback-state";
import { buildBlankProjectIntake } from "@/features/planner/build-fallback-state";
import { exportLaunchPlanMarkdown } from "@/features/export/markdown";
import { parseGitHubRepoUrl } from "@/features/intake/validate-github-url";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      repoUrl?: string;
      intake?: Record<string, unknown>;
    } | null;

    if (!body?.repoUrl) {
      return NextResponse.json(
        { ok: false, message: "Repo URL is required." },
        { status: 400 }
      );
    }

    const parsed = parseGitHubRepoUrl(body.repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { ok: false, message: "Use a valid GitHub repo URL like https://github.com/org/repo." },
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

    const intake = buildBlankProjectIntake(
      parsed.normalizedUrl,
      "user_provided"
    );

    if (body.intake) {
      const intakeAny = intake as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(body.intake)) {
        if (key in intakeAny && value !== undefined) {
          intakeAny[key] = value;
        }
      }
    }

    const draft = buildPlannerDraft(analysis, intake);
    const markdown = exportLaunchPlanMarkdown(draft.launchPlan);

    const aiProvider = process.env.AI_PROVIDER;
    const aiKey = process.env.AI_API_KEY;

    if (aiProvider && aiKey) {
      console.log(
        `[generate-plan] AI provider ${aiProvider} is configured. Deterministic fallback plan generated for ${parsed.normalizedUrl} (key: ${aiKey.slice(0, 4)}...[REDACTED])`
      );
    }

    return NextResponse.json({
      ok: true,
      repoUrl: parsed.normalizedUrl,
      projectName: analysis.projectName.value,
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
        message: error instanceof Error
          ? `Plan generation error: ${error.message}`
          : "An unexpected error occurred during plan generation."
      },
      { status: 500 }
    );
  }
}
