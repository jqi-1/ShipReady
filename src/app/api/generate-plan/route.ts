import { NextResponse } from "next/server";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { fetchPublicGitHubRepoFiles } from "@/features/repo-analysis/github-fetch";
import { buildPlannerDraft } from "@/features/planner/build-fallback-state";
import { buildBlankProjectIntake } from "@/features/planner/build-fallback-state";
import { exportLaunchPlanMarkdown } from "@/features/export/markdown";
import { parseGitHubRepoUrl } from "@/features/intake/validate-github-url";
import { generateLaunchPlanWithAi } from "@/features/launch-plan/generate-ai-launch-plan";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { ProjectIntake, ProjectIntakeField, RepoAnalysis } from "@/types/planner";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_SIZE = 250_000;

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
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
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
          message: "Request body too large. Maximum size is 250KB."
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

    const resolved = await resolvePlanningInput(parsedBody);
    if (!resolved.ok) {
      return NextResponse.json(
        { ok: false, message: resolved.message },
        { status: resolved.status }
      );
    }

    const draft = buildPlannerDraft(
      resolved.analysis,
      resolved.intake,
      resolved.selectedRecommendationId
    );
    const generated = await generateLaunchPlanWithAi({
      analysis: resolved.analysis,
      intake: draft.intake,
      fallbackPlan: draft.launchPlan,
      log: console.log
    });
    const launchPlan =
      generated.launchPlan.generationMode === "ai"
        ? {
            ...generated.launchPlan,
            markdown: exportLaunchPlanMarkdown(generated.launchPlan)
          }
        : generated.launchPlan;

    return NextResponse.json({
      ok: true,
      repoUrl: resolved.analysis.repoUrl ?? resolved.intake.repoUrl,
      projectName: resolved.analysis.projectName.value,
      generationMode: generated.generationMode,
      message: generated.message,
      model: generated.model,
      launchPlan,
      analysis: {
        framework: resolved.analysis.frontendFramework?.value ?? null,
        backend: resolved.analysis.backendFramework?.value ?? null,
        packageManager: resolved.analysis.packageManager?.value ?? null,
        buildCommand: resolved.analysis.buildCommand?.value ?? null,
        startCommand: resolved.analysis.startCommand?.value ?? null,
        runtime: resolved.analysis.runtime?.value ?? null,
        envVarCount: resolved.analysis.envVars.length,
        serviceCount: resolved.analysis.services.length,
        hasDocker: Boolean(resolved.analysis.docker)
      },
      riskCount: draft.risks.length,
      launchBlockerCount: draft.risks.filter((r) => r.launchBlocker).length,
      checklistSectionCount: draft.checklist.filter((s) => s.relevant).length,
      markdown: launchPlan.markdown
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

async function resolvePlanningInput(body: Record<string, unknown> | null): Promise<
  | {
      ok: true;
      analysis: RepoAnalysis;
      intake: ProjectIntake;
      selectedRecommendationId?: string;
    }
  | { ok: false; message: string; status: number }
> {
  if (isRepoAnalysis(body?.analysis)) {
    const analysis = body.analysis;
    return {
      ok: true,
      analysis,
      intake: mergeIntake(
        analysis.repoUrl ?? "",
        body?.intake as Record<string, unknown> | undefined
      ),
      selectedRecommendationId:
        typeof body?.selectedRecommendationId === "string"
          ? body.selectedRecommendationId
          : undefined
    };
  }

  const repoUrl = body?.repoUrl;
  if (!repoUrl || typeof repoUrl !== "string") {
    return { ok: false, message: "Repo URL or repo analysis is required.", status: 400 };
  }

  const parsed = parseGitHubRepoUrl(repoUrl);
  if (!parsed) {
    return {
      ok: false,
      message: "Use a valid GitHub repo URL like https://github.com/org/repo.",
      status: 400
    };
  }

  const fetched = await fetchPublicGitHubRepoFiles(parsed.normalizedUrl);

  if (!fetched.ok) {
    return {
      ok: false,
      message: fetched.message,
      status: fetched.status === 403 || fetched.status === 429 ? 429 : 422
    };
  }

  const analysis = analyzeRepoFiles(fetched.files, {
    repoUrl: fetched.repoUrl,
    defaultBranch: fetched.defaultBranch
  });

  return {
    ok: true,
    analysis,
    intake: mergeIntake(parsed.normalizedUrl, body?.intake as Record<string, unknown>),
    selectedRecommendationId:
      typeof body?.selectedRecommendationId === "string"
        ? body.selectedRecommendationId
        : undefined
  };
}

function mergeIntake(repoUrl: string, intake?: Record<string, unknown>): ProjectIntake {
  const base = buildBlankProjectIntake(repoUrl, repoUrl ? "user_provided" : "defaulted");

  if (!intake) return base;

  const next = { ...base };
  for (const [key, value] of Object.entries(intake)) {
    if (key === "sources" || key === "source") continue;
    if (key in next && value !== undefined) {
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  }

  next.sources = {
    ...base.sources,
    ...(typeof intake.sources === "object" && intake.sources !== null
      ? (intake.sources as ProjectIntake["sources"])
      : {})
  };

  if (typeof intake.source === "string") {
    next.source = intake.source as ProjectIntake["source"];
  }

  for (const field of Object.keys(next.sources) as ProjectIntakeField[]) {
    if (next.sources[field] === undefined) {
      next.sources[field] =
        field === "repoUrl" && repoUrl ? "user_provided" : "defaulted";
    }
  }

  return next;
}

function isRepoAnalysis(value: unknown): value is RepoAnalysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RepoAnalysis>;

  return Boolean(
    candidate.projectName &&
    typeof candidate.projectName.value === "string" &&
    candidate.appRoot &&
    typeof candidate.appRoot.value === "string" &&
    Array.isArray(candidate.envVars) &&
    Array.isArray(candidate.services) &&
    Array.isArray(candidate.facts)
  );
}
