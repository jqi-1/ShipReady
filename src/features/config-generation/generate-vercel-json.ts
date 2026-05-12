import type { RepoAnalysis } from "@/types/planner";

interface VercelJson {
  framework?: string;
  installCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
}

const FRAMEWORK_MAP: Record<string, string> = {
  "Next.js": "nextjs",
  "Nuxt": "nuxtjs",
  "SvelteKit": "sveltekit",
  "Astro": "astro",
  "Remix": "remix",
  "Vite": "vite",
  "Gatsby": "gatsby",
  "Hugo": "hugo",
  "Jekyll": "jekyll"
};

const OUTPUT_DIR_MAP: Record<string, string> = {
  "Vite": "dist",
  "Astro": "dist",
  "Gatsby": "public",
  "Hugo": "public",
  "Jekyll": "_site"
};

export function generateVercelJson(analysis: RepoAnalysis): string {
  const config: VercelJson = {};

  const framework = analysis.frontendFramework?.value;
  if (framework) {
    config.framework = FRAMEWORK_MAP[framework] ?? undefined;
  }

  const pm = analysis.packageManager?.value;
  if (pm) {
    config.installCommand = pm === "npm" ? "npm install" : `${pm} install`;
  }

  if (analysis.buildCommand?.value) {
    config.buildCommand = analysis.buildCommand.value;
  }

  if (framework && OUTPUT_DIR_MAP[framework]) {
    config.outputDirectory = OUTPUT_DIR_MAP[framework];
  }

  const runtime = analysis.runtime?.value;
  if (runtime && /^node/i.test(runtime)) {
    const versionMatch = runtime.match(/(\d+)/);
    if (versionMatch) {
      config.nodeVersion = versionMatch[0];
    }
  }

  return JSON.stringify(config, null, 2);
}
