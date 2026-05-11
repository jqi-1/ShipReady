import { describe, expect, it } from "vitest";
import {
  expressApiFiles,
  monorepoAppFiles,
  pythonApiFiles,
  simpleNextAppFiles,
  viteStaticAppFiles
} from "@/fixtures/repo-analysis-fixtures";
import { analyzeRepoFiles } from "./analyze-repo";

describe("analyzeRepoFiles", () => {
  it("detects a simple Next.js app", () => {
    const analysis = analyzeRepoFiles(simpleNextAppFiles, {
      repoUrl: "https://github.com/acme/simple-next-app"
    });

    expect(analysis.projectName.value).toBe("simple-next-app");
    expect(analysis.frontendFramework?.value).toBe("Next.js");
    expect(analysis.packageManager?.value).toBe("npm");
    expect(analysis.buildCommand?.value).toBe("npm run build");
    expect(analysis.startCommand?.value).toBe("npm start");
    expect(analysis.runtime?.value).toBe("Node.js >=20");
    expect(analysis.envVars.map((envVar) => envVar.name)).toEqual([
      "AUTH_SECRET",
      "NEXT_PUBLIC_APP_URL"
    ]);
  });

  it("detects a Vite static frontend", () => {
    const analysis = analyzeRepoFiles(viteStaticAppFiles);

    expect(analysis.frontendFramework?.value).toBe("Vite");
    expect(analysis.backendFramework).toBeUndefined();
    expect(analysis.packageManager?.value).toBe("pnpm");
    expect(analysis.buildCommand?.value).toBe("pnpm build");
  });

  it("detects an Express API start command", () => {
    const analysis = analyzeRepoFiles(expressApiFiles);

    expect(analysis.backendFramework?.value).toBe("Express");
    expect(analysis.startCommand?.value).toBe("npm start");
    expect(analysis.envVars.map((envVar) => envVar.name)).toContain("DATABASE_URL");
  });

  it("detects a Python FastAPI project", () => {
    const analysis = analyzeRepoFiles(pythonApiFiles);

    expect(analysis.backendFramework?.value).toBe("FastAPI");
    expect(analysis.runtime?.value).toBe("Runtime python-3.12");
    expect(analysis.packageManager?.value).toBe("pip");
  });

  it("detects monorepo app roots and blockers", () => {
    const analysis = analyzeRepoFiles(monorepoAppFiles);

    expect(analysis.isMonorepo?.value).toBe(true);
    expect(analysis.candidateAppRoots?.map((root) => root.path)).toEqual([
      ".",
      "apps/api",
      "apps/web"
    ]);
    expect(
      analysis.deploymentBlockers?.some((blocker) => blocker.id === "ambiguous-app-root")
    ).toBe(true);
  });
});
