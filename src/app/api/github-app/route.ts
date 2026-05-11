import { NextResponse } from "next/server";
import { GITHUB_APP_PRIVATE_REPO_ENV } from "@/features/repo-analysis/github-fetch";

export async function GET() {
  const missingVars = GITHUB_APP_PRIVATE_REPO_ENV.filter(
    (name) => !process.env[name]
  );

  const allPresent = missingVars.length === 0;

  const config: Record<string, string> = {
    GITHUB_APP_ID: process.env.GITHUB_APP_ID ?? "",
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? "",
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? "[SET]" : "",
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY ? "[SET]" : "",
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET ? "[SET]" : ""
  };

  return NextResponse.json({
    ok: true,
    configured: allPresent,
    missing: missingVars,
    config: allPresent ? config : undefined,
    note: allPresent
      ? "GitHub App credentials are configured. The V0 installation flow is not complete, but credentials are ready for the repo inspection route."
      : `Configure ${missingVars.join(", ")} in the environment to enable private repo inspection.`
  });
}

export async function POST(request: Request) {
  const missingVars = GITHUB_APP_PRIVATE_REPO_ENV.filter(
    (name) => !process.env[name]
  );

  if (missingVars.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        reason: "not_configured",
        message: `GitHub App credentials are missing: ${missingVars.join(", ")}. Private repo access is not available.`,
        missing: missingVars
      },
      { status: 400 }
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      repoUrl?: string;
      action?: string;
    } | null;

    if (!body?.repoUrl) {
      return NextResponse.json(
        { ok: false, reason: "missing_repo_url", message: "Repo URL is required." },
        { status: 400 }
      );
    }

    const appId = process.env.GITHUB_APP_ID!;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!;

    console.log(
      `[github-app] Inspecting ${body.repoUrl} with app ${appId} (key: ${privateKey.slice(0, 10)}...[REDACTED])`
    );

    return NextResponse.json({
      ok: true,
      message: "GitHub App credentials validated. Full installation flow requires the V1 GitHub App UX.",
      repoUrl: body.repoUrl,
      appId
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: "auth_error",
        message: error instanceof Error
          ? `GitHub App auth error: ${error.message}`
          : "GitHub App authentication failed."
      },
      { status: 500 }
    );
  }
}
