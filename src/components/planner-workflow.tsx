"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clipboard,
  Download,
  Github,
  RefreshCw,
  ShieldAlert
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { TextInput } from "@/components/ui/text-input";
import { parseGitHubRepoUrl } from "@/features/intake/validate-github-url";
import { buildFallbackPlannerState } from "@/features/planner/build-fallback-state";
import {
  clearPlannerDraft,
  loadPlannerDraft,
  savePlannerDraft
} from "@/lib/draft-storage";
import type { RuntimeConfigStatus } from "@/lib/runtime-config";
import type { PlannerDraft, RecommendationOption } from "@/types/planner";

const stages = [
  "Intake",
  "Analysis",
  "Questions",
  "Recommendation",
  "Launch Plan",
  "Export"
];

interface PlannerWorkflowProps {
  configStatus: RuntimeConfigStatus;
}

export function PlannerWorkflow({ configStatus }: PlannerWorkflowProps) {
  const [draft, setDraft] = useState<PlannerDraft>(() => buildFallbackPlannerState());
  const [repoUrl, setRepoUrl] = useState(draft.intake.repoUrl);
  const [repoError, setRepoError] = useState("");
  const [copied, setCopied] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedDraft = loadPlannerDraft();

    if (storedDraft) {
      setDraft(storedDraft);
      setRepoUrl(storedDraft.intake.repoUrl);
    }
  }, []);

  useEffect(() => {
    savePlannerDraft(draft);
  }, [draft]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const selectedRecommendation = useMemo(
    () =>
      draft.recommendations.find(
        (recommendation) => recommendation.id === draft.selectedRecommendationId
      ) ?? draft.recommendations[0] ?? null,
    [draft.recommendations, draft.selectedRecommendationId]
  );

  function analyzeRepo() {
    const parsed = parseGitHubRepoUrl(repoUrl);

    if (!parsed) {
      setRepoError("Use a GitHub repo URL like https://github.com/org/repo.");
      return;
    }

    const fallbackDraft = buildFallbackPlannerState();

    setRepoError("");
    setDraft({
      ...fallbackDraft,
      intake: {
        ...fallbackDraft.intake,
        repoUrl: parsed.normalizedUrl,
        source: "user_provided"
      },
      analysis: {
        ...fallbackDraft.analysis,
        repoUrl: parsed.normalizedUrl,
        projectName: {
          label: "Project",
          value: parsed.repo,
          source: "user_provided",
          confidence: "high",
          evidence: [{ path: "repo URL input", detail: "Extracted from user-provided GitHub URL" }]
        }
      },
      updatedAt: new Date().toISOString()
    });
  }

  function resetDemo() {
    clearPlannerDraft();
    const fallbackDraft = buildFallbackPlannerState();
    setDraft(fallbackDraft);
    setRepoUrl(fallbackDraft.intake.repoUrl);
    setRepoError("");
    setCopied("");
  }

  async function copyText(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(""), 1600);
  }

  return (
    <main className="min-h-screen bg-fog text-ink">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <Panel className="h-full">
            <div className="grid h-full content-between gap-6">
              <div className="grid gap-5">
                <div>
                  <p className="text-sm font-semibold text-signal">Launch Architect</p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    Prototype to production plan
                  </h1>
                </div>
                <nav className="grid gap-2" aria-label="Planner stages">
                  {stages.map((stage, index) => (
                    <a
                      key={stage}
                      href={`#${stage.toLowerCase().replaceAll(" ", "-")}`}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-steel hover:bg-fog hover:text-ink"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded bg-white text-xs text-ink">
                        {index + 1}
                      </span>
                      {stage}
                    </a>
                  ))}
                </nav>
              </div>
              <Button variant="secondary" onClick={resetDemo}>
                <RefreshCw size={16} aria-hidden="true" />
                Demo
              </Button>
            </div>
          </Panel>
        </aside>

        <div className="grid gap-5">
          <Panel>
            <section id="intake" className="grid gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-steel">Intake</p>
                <h2 className="mt-2 text-2xl font-bold">Enter a GitHub repo</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <TextInput
                  label="GitHub repository"
                  value={repoUrl}
                  placeholder="https://github.com/org/repo"
                  onChange={(event) => setRepoUrl(event.target.value)}
                />
                <Button onClick={analyzeRepo}>
                  <Github size={16} aria-hidden="true" />
                  Analyze
                </Button>
              </div>
              {repoError ? <div role="alert"><Alert tone="danger">{repoError}</Alert></div> : null}
              {!configStatus.githubReady || !configStatus.aiReady ? (
                <Alert tone="warn" role="alert">
                  Live repo inspection or AI generation is not fully configured. Missing:{" "}
                  {[...configStatus.missingGitHub, ...configStatus.missingAi].join(", ")}.
                  The deterministic fallback remains available.
                </Alert>
              ) : null}
              <Alert>
                Repo fetching is scaffolded for V0. Until GitHub App access is connected,
                this workflow uses deterministic demo analysis and labels it clearly.
              </Alert>
            </section>
          </Panel>

          <Panel>
            <section id="analysis" className="grid gap-4">
              <SectionHeader eyebrow="Analysis" title="Detected facts" />
              <div className="grid gap-3 md:grid-cols-2">
                <Fact
                  label="Project"
                  value={draft.analysis.projectName.value}
                  source={draft.analysis.projectName.source}
                />
                <Fact
                  label="Framework"
                  value={draft.analysis.frontendFramework?.value ?? "Unknown"}
                  source={draft.analysis.frontendFramework?.source ?? "unknown"}
                />
                <Fact
                  label="Package manager"
                  value={draft.analysis.packageManager?.value ?? "Unknown"}
                  source={draft.analysis.packageManager?.source ?? "unknown"}
                />
                <Fact
                  label="Build"
                  value={draft.analysis.buildCommand?.value ?? "Unknown"}
                  source={draft.analysis.buildCommand?.source ?? "unknown"}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-steel">
                      <th className="py-2 pr-3">Env var</th>
                      <th className="py-2 pr-3">Exposure</th>
                      <th className="py-2 pr-3">Required</th>
                      <th className="py-2 pr-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.analysis.envVars.map((envVar) => (
                      <tr key={envVar.name} className="border-b border-line">
                        <td className="py-3 pr-3 font-mono text-xs">{envVar.name}</td>
                        <td className="py-3 pr-3">{envVar.exposure}</td>
                        <td className="py-3 pr-3">{envVar.required ? "Yes" : "No"}</td>
                        <td className="py-3 pr-3">{envVar.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </Panel>

          <Panel>
            <section id="questions" className="grid gap-4">
              <SectionHeader eyebrow="Questions" title="Missing inputs" />
              <div className="grid gap-3 md:grid-cols-2">
                <Question
                  label="First 3 months traffic"
                  value="Confirm expected usage before final pricing."
                />
                <Question
                  label="Monthly budget"
                  value="Confirm whether speed or cost wins if there is a tradeoff."
                />
                <Question
                  label="Production domain"
                  value="Confirm domain ownership and DNS provider."
                />
                <Question
                  label="Compliance"
                  value="Confirm any data residency or regulated-data requirements."
                />
              </div>
            </section>
          </Panel>

          <Panel>
            <section id="recommendation" className="grid gap-4">
              <SectionHeader eyebrow="Recommendation" title="Stack options" />
              <div className="grid gap-3 xl:grid-cols-3">
                {draft.recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    selected={recommendation.id === selectedRecommendation?.id}
                    onSelect={() =>
                      setDraft({
                        ...draft,
                        selectedRecommendationId: recommendation.id,
                        updatedAt: new Date().toISOString()
                      })
                    }
                  />
                ))}
              </div>
            </section>
          </Panel>

          <Panel>
            <section id="launch-plan" className="grid gap-4">
              <SectionHeader eyebrow="Launch Plan" title="Generated output" />
              {draft.risks.length > 0 ? (
                <Alert tone="warn">
                  <span className="inline-flex items-center gap-2">
                    <ShieldAlert size={16} aria-hidden="true" />
                    {draft.risks.filter((risk) => risk.launchBlocker).length} launch
                    blockers need attention.
                  </span>
                </Alert>
              ) : null}
              <div className="max-h-[520px] overflow-auto rounded-md border border-line bg-[#fbfcfd] p-4">
                <pre className="whitespace-pre-wrap text-sm leading-6 text-ink">
                  {draft.launchPlan.markdown}
                </pre>
              </div>
            </section>
          </Panel>

          <Panel>
            <section id="export" className="grid gap-4">
              <SectionHeader eyebrow="Export" title="Copy and export placeholders" />
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => copyText("plan", draft.launchPlan.markdown)}
                >
                  <Clipboard size={16} aria-hidden="true" />
                  Copy plan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    copyText(
                      "env",
                      draft.analysis.envVars.map((envVar) => `${envVar.name}=`).join("\n")
                    )
                  }
                >
                  <Clipboard size={16} aria-hidden="true" />
                  Copy env
                </Button>
                <Button
                  variant="secondary"
                  disabled
                  title="Markdown file export is a V0 placeholder"
                >
                  <Download size={16} aria-hidden="true" />
                  Markdown
                </Button>
              </div>
              {copied ? (
                <Alert>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    Copied {copied}.
                  </span>
                </Alert>
              ) : null}
            </section>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase text-steel">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
    </div>
  );
}

function Fact({
  label,
  value,
  source
}: {
  label: string;
  value: string;
  source: string;
}) {
  return (
    <div className="rounded-md border border-line bg-[#fbfcfd] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-steel">{label}</p>
          <p className="mt-1 font-semibold">{value}</p>
        </div>
        <Badge tone={source === "detected" ? "good" : "neutral"}>{source}</Badge>
      </div>
    </div>
  );
}

function Question({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#fbfcfd] p-4">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-sm text-steel">{value}</p>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  selected,
  onSelect
}: {
  recommendation: RecommendationOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`grid min-h-[340px] gap-4 rounded-lg border p-4 text-left transition ${
        selected
          ? "border-signal bg-signal/5"
          : "border-line bg-[#fbfcfd] hover:border-steel"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{recommendation.label}</h3>
          <p className="mt-2 text-sm text-steel">{recommendation.summary}</p>
        </div>
        {selected ? <Badge tone="good">Primary</Badge> : null}
      </div>
      <dl className="grid gap-2 text-sm">
        <Service label="Hosting" value={recommendation.services.hosting} />
        <Service label="Database" value={recommendation.services.database} />
        <Service label="Auth" value={recommendation.services.auth} />
        <Service label="Monitoring" value={recommendation.services.monitoring} />
      </dl>
      <p className="self-end text-sm font-semibold">
        {recommendation.estimatedMonthlyCost}
      </p>
    </button>
  );
}

function Service({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[86px_1fr] gap-2">
      <dt className="text-steel">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
