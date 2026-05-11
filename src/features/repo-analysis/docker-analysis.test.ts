import { describe, expect, it } from "vitest";
import {
  composeWithPostgresFiles,
  composeWithRedisFiles,
  dockerNodeAppFiles,
  dockerPythonApiFiles
} from "@/fixtures/repo-analysis-fixtures";
import { analyzeRepoFiles } from "./analyze-repo";
import { analyzeDockerFiles } from "./docker-analysis";

describe("analyzeDockerFiles", () => {
  it("parses a multi-stage Node Dockerfile", () => {
    const docker = analyzeDockerFiles(dockerNodeAppFiles);

    expect(docker?.dockerfiles[0]).toMatchObject({
      baseImages: ["node:20-alpine", "node:20-alpine"],
      stages: ["deps", "runner"],
      exposedPorts: ["3000"],
      user: "node",
      likelyProduction: true
    });
    expect(docker?.hasDockerignore).toBe(true);
    expect(docker?.risks.some((risk) => risk.id.includes("docker-root-user"))).toBe(
      false
    );
  });

  it("flags missing Docker production defaults", () => {
    const docker = analyzeDockerFiles(dockerPythonApiFiles);

    expect(docker?.needsProductionDocker).toBe(true);
    expect(docker?.risks.map((risk) => risk.title)).toEqual(
      expect.arrayContaining([
        "Missing .dockerignore",
        "Container runs as root",
        "Docker health check is missing"
      ])
    );
  });

  it("parses compose services and treats database containers as local defaults", () => {
    const docker = analyzeDockerFiles(composeWithPostgresFiles);

    expect(docker?.composeFiles[0].services.map((service) => service.name)).toEqual([
      "web",
      "db"
    ]);
    expect(docker?.serviceDependencies).toEqual(["Postgres"]);
    expect(docker?.probablyLocalOnly).toBe(true);
    expect(
      docker?.risks.some((risk) => risk.id === "compose-database-production-risk")
    ).toBe(true);
  });

  it("feeds Docker findings into repo analysis facts", () => {
    const analysis = analyzeRepoFiles(composeWithRedisFiles);

    expect(analysis.docker?.serviceDependencies).toEqual(["Redis"]);
    expect(analysis.services.some((service) => service.category === "docker")).toBe(true);
    expect(analysis.facts.some((fact) => fact.label === "Docker recommendation")).toBe(
      true
    );
  });
});
