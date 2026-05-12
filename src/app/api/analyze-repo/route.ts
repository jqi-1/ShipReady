import { NextResponse } from "next/server";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import { fetchPublicGitHubRepoFiles } from "@/features/repo-analysis/github-fetch";
import { parseGitHubRepoUrl } from "@/features/intake/validate-github-url";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/analysis-cache";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_SIZE = 10_240;
const TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30_000;

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

  const contentLength = parseInt(
    request.headers.get("content-length") ?? "0",
    10
  );
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json(
      {
        ok: false,
        message: "Request body too large. Maximum size is 10KB."
      },
      { status: 413 }
    );
  }

  let body: { repoUrl?: string } | null = null;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          message: "Request body too large. Maximum size is 10KB."
        },
        { status: 413 }
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid JSON in request body."
      },
      { status: 400 }
    );
  }

  if (!body || !body.repoUrl || typeof body.repoUrl !== "string") {
    return NextResponse.json(
      {
        ok: false,
        message: "Repo URL is required."
      },
      { status: 400 }
    );
  }

  const parsed = parseGitHubRepoUrl(body.repoUrl);
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

  const cacheKey = `${parsed.owner}/${parsed.repo}`;
  const cached = getCachedAnalysis(cacheKey);
  if (cached) {
    console.log(`[analyze-repo] Cache hit for ${cacheKey}`);
    return NextResponse.json({
      ok: true,
      analysis: cached.analysis,
      truncated: cached.truncated,
      cached: true
    });
  }

  console.log(`[analyze-repo] Cache miss for ${cacheKey}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const fetched = await fetchPublicGitHubRepoFiles(parsed.normalizedUrl, {
      signal: controller.signal
    });

    if (!fetched.ok) {
      return NextResponse.json(
        {
          ok: false,
          reason: fetched.reason,
          message: fetched.message
        },
        {
          status: fetched.status === 403 || fetched.status === 429 ? 429 : 422
        }
      );
    }

    const analysis = analyzeRepoFiles(fetched.files, {
      repoUrl: fetched.repoUrl,
      defaultBranch: fetched.defaultBranch
    });

    setCachedAnalysis(cacheKey, analysis, fetched.truncated);

    return NextResponse.json({
      ok: true,
      analysis,
      truncated: fetched.truncated,
      cached: false
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Request timed out. The repo may be too large or GitHub is slow."
        },
        { status: 504 }
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
