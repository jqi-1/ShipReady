import { NextResponse } from "next/server";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { fetchPublicGitHubRepoFiles } from "@/features/repo-analysis/github-fetch";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { repoUrl?: string } | null;
  const repoUrl = body?.repoUrl;

  if (!repoUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "Repo URL is required."
      },
      { status: 400 }
    );
  }

  const fetched = await fetchPublicGitHubRepoFiles(repoUrl);

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

  return NextResponse.json({
    ok: true,
    analysis: analyzeRepoFiles(fetched.files, {
      repoUrl: fetched.repoUrl,
      defaultBranch: fetched.defaultBranch
    }),
    truncated: fetched.truncated
  });
}
