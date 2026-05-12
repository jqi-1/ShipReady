import { describe, expect, it } from "vitest";
import {
  astroStaticFiles,
  djangoApiFiles,
  expressApiFiles,
  fastifyApiFiles,
  flaskApiFiles,
  goHttpServiceFiles,
  honoApiFiles,
  laravelApiFiles,
  monorepoAppFiles,
  nestJsApiFiles,
  nuxtAppFiles,
  pythonApiFiles,
  railsApiFiles,
  remixAppFiles,
  simpleNextAppFiles,
  staticHtmlFiles,
  svelteKitAppFiles,
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
    const paths = analysis.candidateAppRoots?.map((root) => root.path) ?? [];
    expect(paths[0]).toBe(".");
    expect(paths).toContain("apps/api");
    expect(paths).toContain("apps/web");
    expect(
      analysis.deploymentBlockers?.some((blocker) => blocker.id === "ambiguous-app-root")
    ).toBe(true);
  });

  it("detects Astro static frontend", () => {
    const analysis = analyzeRepoFiles(astroStaticFiles);

    expect(analysis.frontendFramework?.value).toBe("Astro");
    expect(analysis.packageManager?.value).toBe("npm");
    expect(analysis.buildCommand?.value).toBe("npm run build");
  });

  it("detects SvelteKit frontend", () => {
    const analysis = analyzeRepoFiles(svelteKitAppFiles);

    expect(analysis.frontendFramework?.value).toBe("SvelteKit");
    expect(analysis.packageManager?.value).toBe("npm");
  });

  it("detects Remix frontend", () => {
    const analysis = analyzeRepoFiles(remixAppFiles);

    expect(analysis.frontendFramework?.value).toBe("Remix");
    expect(analysis.buildCommand?.value).toBe("npm run build");
    expect(analysis.startCommand?.value).toBe("npm start");
  });

  it("detects Nuxt frontend", () => {
    const analysis = analyzeRepoFiles(nuxtAppFiles);

    expect(analysis.frontendFramework?.value).toBe("Nuxt");
    expect(analysis.buildCommand?.value).toBe("npm run build");
    expect(analysis.startCommand?.value).toBe("npm start");
  });

  it("detects Static HTML frontend", () => {
    const analysis = analyzeRepoFiles(staticHtmlFiles);

    expect(analysis.frontendFramework?.value).toBe("Static HTML");
    expect(analysis.buildCommand).toBeUndefined();
  });

  it("detects Fastify backend", () => {
    const analysis = analyzeRepoFiles(fastifyApiFiles);

    expect(analysis.backendFramework?.value).toBe("Fastify");
    expect(analysis.startCommand?.value).toBe("npm start");
  });

  it("detects NestJS backend", () => {
    const analysis = analyzeRepoFiles(nestJsApiFiles);

    expect(analysis.backendFramework?.value).toBe("NestJS");
    expect(analysis.buildCommand?.value).toBe("npm run build");
    expect(analysis.startCommand?.value).toBe("npm start");
  });

  it("detects Hono backend", () => {
    const analysis = analyzeRepoFiles(honoApiFiles);

    expect(analysis.backendFramework?.value).toBe("Hono");
  });

  it("detects Flask backend from Python dependencies", () => {
    const analysis = analyzeRepoFiles(flaskApiFiles);

    expect(analysis.backendFramework?.value).toBe("Flask");
    expect(analysis.packageManager?.value).toBe("pip");
  });

  it("detects Django backend from Python dependencies", () => {
    const analysis = analyzeRepoFiles(djangoApiFiles);

    expect(analysis.backendFramework?.value).toBe("Django");
    expect(analysis.packageManager?.value).toBe("pip");
  });

  it("detects Rails backend from Gemfile", () => {
    const analysis = analyzeRepoFiles(railsApiFiles);

    expect(analysis.backendFramework?.value).toBe("Rails");
  });

  it("detects Laravel backend from composer.json", () => {
    const analysis = analyzeRepoFiles(laravelApiFiles);

    expect(analysis.backendFramework?.value).toBe("Laravel");
  });

  it("detects Go HTTP service from source patterns", () => {
    const analysis = analyzeRepoFiles(goHttpServiceFiles);

    expect(analysis.backendFramework?.value).toBe("Go HTTP service");
    expect(analysis.runtime?.value).toContain("Go");
  });
});
