import { describe, expect, it } from "vitest";
import { analyzeRepoFiles } from "@/features/repo-analysis/analyze-repo";
import {
  simpleNextAppFiles,
  viteStaticAppFiles,
  dockerPythonApiFiles,
  expressApiFiles
} from "@/fixtures/repo-analysis-fixtures";
import { generateConfigs } from "./index";
import { generateVercelJson } from "./generate-vercel-json";
import { generateDockerfile } from "./generate-dockerfile";
import { generateDockerignore } from "./generate-dockerignore";
import { generateRenderYaml } from "./generate-render-yaml";
import { generateRailwayJson } from "./generate-railway-json";
import { generateCiWorkflow } from "./generate-ci-workflow";

describe("generateVercelJson", () => {
  it("generates config for Next.js app", () => {
    const analysis = analyzeRepoFiles(simpleNextAppFiles);
    const result = generateVercelJson(analysis);
    const parsed = JSON.parse(result);
    expect(parsed.framework).toBe("nextjs");
    expect(parsed.buildCommand).toContain("build");
  });

  it("generates config for Vite static app", () => {
    const analysis = analyzeRepoFiles(viteStaticAppFiles);
    const result = generateVercelJson(analysis);
    const parsed = JSON.parse(result);
    expect(parsed.framework).toBe("vite");
    expect(parsed.outputDirectory).toBe("dist");
  });
});

describe("generateDockerfile", () => {
  it("generates Node.js multi-stage Dockerfile", () => {
    const analysis = analyzeRepoFiles(simpleNextAppFiles);
    const result = generateDockerfile(analysis);
    expect(result).toContain("FROM node:20-alpine AS base");
    expect(result).toContain("WORKDIR /app");
    expect(result).toContain("HEALTHCHECK");
    expect(result).toContain("USER node");
  });

  it("generates Python Dockerfile for Python projects", () => {
    const analysis = analyzeRepoFiles([
      { path: "app.py", content: "print('hello')" },
      { path: "requirements.txt", content: "flask\n" },
      { path: ".python-version", content: "3.12" }
    ]);
    const result = generateDockerfile(analysis);
    expect(result).toContain("FROM python:3.12-slim AS base");
    expect(result).toContain("pip install");
  });
});

describe("generateDockerignore", () => {
  it("includes node_modules and .git", () => {
    const result = generateDockerignore();
    expect(result).toContain("node_modules");
    expect(result).toContain(".git");
    expect(result).toContain(".env");
  });
});

describe("generateRenderYaml", () => {
  it("generates valid Render config for Next.js app", () => {
    const analysis = analyzeRepoFiles(simpleNextAppFiles);
    const result = generateRenderYaml(analysis);
    expect(result).toContain("services:");
    expect(result).toContain("type: web");
    expect(result).toContain("env: node");
  });

  it("generates static env for framework-only projects", () => {
    const analysis = analyzeRepoFiles(viteStaticAppFiles);
    const result = generateRenderYaml(analysis);
    expect(result).toContain("env: static");
  });
});

describe("generateRailwayJson", () => {
  it("generates Railway config", () => {
    const analysis = analyzeRepoFiles(simpleNextAppFiles);
    const result = generateRailwayJson(analysis);
    const parsed = JSON.parse(result);
    expect(parsed.build).toBeDefined();
    expect(parsed.build.builder).toBe("NIXPACKS");
  });
});

describe("generateCiWorkflow", () => {
  it("generates CI workflow with detected package manager", () => {
    const analysis = analyzeRepoFiles(simpleNextAppFiles);
    const result = generateCiWorkflow(analysis);
    expect(result).toContain("name: CI");
    expect(result).toContain("actions/checkout@v4");
    expect(result).toContain('cache: "npm"');
  });

  it("includes lint, typecheck, test, and build steps", () => {
    const analysis = analyzeRepoFiles(expressApiFiles);
    const result = generateCiWorkflow(analysis);
    expect(result).toContain("run lint");
    expect(result).toContain("run typecheck");
    expect(result).toContain("npm test");
    expect(result).toContain("run build");
  });
});

describe("generateConfigs", () => {
  it("returns configs for Next.js app", () => {
    const analysis = analyzeRepoFiles(simpleNextAppFiles);
    const configs = generateConfigs(analysis);

    const fileNames = configs.map((c) => c.fileName);
    expect(fileNames).toContain("vercel.json");
    expect(fileNames).toContain("Dockerfile");
    expect(fileNames).toContain(".dockerignore");
    expect(fileNames).toContain("render.yaml");
    expect(fileNames).toContain("railway.json");
    expect(fileNames).toContain(".github/workflows/ci.yml");
  });

  it("returns configs for Python API with Docker", () => {
    const analysis = analyzeRepoFiles([
      { path: "app.py", content: "print('hello')" },
      { path: "requirements.txt", content: "flask\n" },
      { path: ".python-version", content: "3.12" },
      ...dockerPythonApiFiles
    ]);
    const configs = generateConfigs(analysis);

    const fileNames = configs.map((c) => c.fileName);
    expect(fileNames).toContain("Dockerfile");
    expect(fileNames).toContain("render.yaml");
  });

  it("does not generate Vercel config for non-framework projects", () => {
    const analysis = analyzeRepoFiles([
      { path: "README.md", content: "# Project" }
    ]);
    const configs = generateConfigs(analysis);
    const fileNames = configs.map((c) => c.fileName);
    expect(fileNames).not.toContain("vercel.json");
  });
});
