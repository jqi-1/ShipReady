import type { RepoAnalysis } from "@/types/planner";

const D = "$";

export function generateCiWorkflow(analysis: RepoAnalysis): string {
  const pm = analysis.packageManager?.value ?? "npm";
  const nodeVersion = extractNodeVersion(analysis);

  const installCmd = pm === "npm" ? "npm ci" : `${pm} install --frozen-lockfile`;
  const cacheKey = pm === "npm" ? "npm" : pm === "pnpm" ? "pnpm" : "yarn";
  const lockFile =
    pm === "npm"
      ? "**/package-lock.json"
      : pm === "pnpm"
        ? "**/pnpm-lock.yaml"
        : "**/yarn.lock";

  return [
    `name: CI`,
    ``,
    `on:`,
    `  push:`,
    `    branches: [main]`,
    `  pull_request:`,
    `    branches: [main]`,
    ``,
    `jobs:`,
    `  ci:`,
    `    runs-on: ubuntu-latest`,
    `    strategy:`,
    `      matrix:`,
    `        node-version: [${nodeVersion}]`,
    ``,
    `    steps:`,
    `      - uses: actions/checkout@v4`,
    `      - name: Use Node.js ${D}{{ matrix.node-version }}`,
    `        uses: actions/setup-node@v4`,
    `        with:`,
    `          node-version: ${D}{{ matrix.node-version }}`,
    `          cache: "${cacheKey}"`,
    `      - run: ${installCmd}`,
    `      - run: ${pm} run lint`,
    `        continue-on-error: true`,
    `      - run: ${pm} run typecheck`,
    `        continue-on-error: true`,
    `      - run: ${pm} test`,
    `      - run: ${analysis.buildCommand?.value ?? `${pm} run build`}`,
    `      - name: Cache build output`,
    `        uses: actions/cache@v4`,
    `        with:`,
    `          path: ${D}{{ github.workspace }}/.next/cache`,
    `          key: ${D}{{ runner.os }}-${pm}-${D}{{ hashFiles('${lockFile}') }}`,
    `          restore-keys: ${D}{{ runner.os }}-${pm}-`
  ].join("\n");
}

function extractNodeVersion(analysis: RepoAnalysis): string {
  const runtime = analysis.runtime?.value ?? "";
  const match = runtime.match(/(\d+)/);
  if (match) {
    const v = parseInt(match[0], 10);
    if (v >= 18 && v <= 22) return String(v);
  }
  return "20";
}
