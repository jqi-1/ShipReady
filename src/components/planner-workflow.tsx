"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clipboard,
  Cpu,
  Download,
  FileCode,
  FileText,
  Github,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Terminal
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { TextInput } from "@/components/ui/text-input";
import { parseGitHubRepoUrl } from "@/features/intake/validate-github-url";
import {
  buildBlankProjectIntake,
  buildFallbackPlannerState,
  buildIntakeOnlyAnalysis,
  buildPlannerDraft
} from "@/features/planner/build-fallback-state";
import {
  clearPlannerDraft,
  loadPlannerDraft,
  savePlannerDraft
} from "@/lib/draft-storage";
import type { RuntimeConfigStatus } from "@/lib/runtime-config";
import type {
  AppAudience,
  AppType,
  BudgetRange,
  ComplianceNeed,
  DeploymentStatus,
  DomainStatus,
  FactSource,
  PlannerDraft,
  ProductPriority,
  ProjectIntake,
  ProjectIntakeField,
  ProviderAccountWillingness,
  RecommendationOption,
  TechnicalComfort,
  TrafficRange
} from "@/types/planner";
import { placeholderFor } from "@/features/repo-analysis/env-detection";
import {
  exportChecklistMarkdown,
  exportDockerfilesMarkdown,
  exportEnvExampleSuggestion,
  exportMetadataMarkdown
} from "@/features/export/markdown";
import { generateConfigs } from "@/features/config-generation";
import { installCommandFor, slug } from "@/lib/commands";

const stages = [
  "Intake",
  "Analysis",
  "Questions",
  "Recommendation",
  "Launch Plan",
  "Export"
];

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

type BooleanAnswer = "true" | "false" | "not_sure";

const appTypeOptions: SelectOption<AppType>[] = [
  { value: "not_sure", label: "Not sure" },
  { value: "saas", label: "SaaS" },
  { value: "landing_page", label: "Landing page" },
  { value: "marketplace", label: "Marketplace" },
  { value: "internal_tool", label: "Internal tool" },
  { value: "api", label: "API" },
  { value: "mobile_backend", label: "Mobile backend" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "content_site", label: "Content site" },
  { value: "other", label: "Other" }
];

const trafficOptions: SelectOption<TrafficRange>[] = [
  { value: "prototype", label: "Prototype / zero users" },
  { value: "1k_mau", label: "Up to 1,000 MAU" },
  { value: "10k_mau", label: "Up to 10,000 MAU" },
  { value: "100k_mau", label: "Up to 100,000 MAU" }
];

const budgetOptions: SelectOption<BudgetRange>[] = [
  { value: "0_20", label: "$0-20/mo" },
  { value: "20_100", label: "$20-100/mo" },
  { value: "100_500", label: "$100-500/mo" },
  { value: "500_plus", label: "$500+/mo" }
];

const comfortOptions: SelectOption<TechnicalComfort>[] = [
  { value: "beginner", label: "Beginner" },
  { value: "comfortable", label: "Comfortable" },
  { value: "developer", label: "Developer" }
];

const priorityOptions: SelectOption<ProductPriority>[] = [
  { value: "simplicity", label: "Simplicity" },
  { value: "speed", label: "Speed" },
  { value: "cost", label: "Cost" },
  { value: "scalability", label: "Scalability" }
];

const deploymentStatusOptions: SelectOption<DeploymentStatus>[] = [
  { value: "not_deployed", label: "Not deployed" },
  { value: "preview_deployed", label: "Preview/staging exists" },
  { value: "production_deployed", label: "Production exists" },
  { value: "not_sure", label: "Not sure" }
];

const domainStatusOptions: SelectOption<DomainStatus>[] = [
  { value: "not_sure", label: "Not sure" },
  { value: "owns_domain", label: "Owns a domain" },
  { value: "needs_domain", label: "Needs to buy one" },
  { value: "using_platform_subdomain", label: "Use provider subdomain first" }
];

const audienceOptions: SelectOption<AppAudience>[] = [
  { value: "not_sure", label: "Not sure" },
  { value: "public_users", label: "Public users" },
  { value: "internal_users", label: "Internal users" },
  { value: "both", label: "Both" }
];

const complianceOptions: SelectOption<ComplianceNeed>[] = [
  { value: "not_sure", label: "Not sure" },
  { value: "none", label: "No known requirements" },
  { value: "gdpr", label: "GDPR/privacy requirements" },
  { value: "hipaa", label: "HIPAA/health data" },
  { value: "soc2", label: "SOC 2 customer expectations" },
  { value: "data_residency", label: "Data residency requirement" }
];

const providerAccountOptions: SelectOption<ProviderAccountWillingness>[] = [
  { value: "not_sure", label: "Not sure" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" }
];

const booleanOptions: SelectOption<BooleanAnswer>[] = [
  { value: "not_sure", label: "Not sure" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" }
];

const HYDRATION_SAFE_TIMESTAMP = "1970-01-01T00:00:00.000Z";

interface PlannerWorkflowProps {
  configStatus: RuntimeConfigStatus;
}

type WorkflowStageStatus =
  | "idle"
  | "queued"
  | "fetching"
  | "analyzing"
  | "needs_input"
  | "generating"
  | "completed"
  | "failed";

export function PlannerWorkflow({ configStatus }: PlannerWorkflowProps) {
  const [draft, setDraft] = useState<PlannerDraft>(() =>
    buildManualPlannerState(HYDRATION_SAFE_TIMESTAMP)
  );
  const [repoUrl, setRepoUrl] = useState(draft.intake.repoUrl);
  const [repoError, setRepoError] = useState("");
  const [repoStatus, setRepoStatus] = useState("");
  const [copied, setCopied] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const [expandedPlanSections, setExpandedPlanSections] = useState<Set<string>>(
    () => new Set(["Project Summary"])
  );
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStageStatus>("idle");
  const [planMessage, setPlanMessage] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const storedDraft = loadPlannerDraft();

    if (storedDraft) {
      const normalizedDraft = normalizeDraft(storedDraft);
      setDraft(normalizedDraft);
      setRepoUrl(normalizedDraft.intake.repoUrl);
    } else {
      const manualDraft = buildManualPlannerState();
      setDraft(manualDraft);
      setRepoUrl(manualDraft.intake.repoUrl);
    }

    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;

    savePlannerDraft(draft);
  }, [draft, draftLoaded]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const selectedRecommendation = useMemo(
    () =>
      draft.recommendations.find(
        (recommendation) => recommendation.id === draft.selectedRecommendationId
      ) ??
      draft.recommendations[0] ??
      null,
    [draft.recommendations, draft.selectedRecommendationId]
  );
  const launchBlockerCount = draft.risks.filter((risk) => risk.launchBlocker).length;
  const checklistProgress = useMemo(() => calculateChecklistProgress(draft), [draft]);

  async function analyzeRepo() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const parsed = parseGitHubRepoUrl(repoUrl);

    if (!parsed) {
      setRepoError("Use a GitHub repo URL like https://github.com/org/repo.");
      return;
    }

    const intake = buildBlankProjectIntake(parsed.normalizedUrl, "user_provided");

    setRepoError("");
    setRepoUrl(parsed.normalizedUrl);
    setCopied("");
    setWorkflowStatus("queued");
    setRepoStatus("Queued for repo inspection...");

    setWorkflowStatus("fetching");
    setRepoStatus("Fetching public GitHub repo and reading deployment files...");

    try {
      const response = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ repoUrl: parsed.normalizedUrl }),
        signal: controller.signal
      });
      const body = (await response.json()) as {
        ok: boolean;
        message?: string;
        analysis?: PlannerDraft["analysis"];
        truncated?: boolean;
      };

      if (controller.signal.aborted) return;

      if (!response.ok || !body.ok || !body.analysis) {
        const analysis = buildIntakeOnlyAnalysis({
          repoUrl: parsed.normalizedUrl,
          projectName: parsed.repo,
          projectSource: "user_provided"
        });

        setRepoError(
          body.message ??
            "Repo inspection failed. Continue manually and confirm detected facts later."
        );
        setRepoStatus("Using intake-only fallback until repo inspection succeeds.");
        setWorkflowStatus("failed");
        setDraft(buildPlannerDraft(analysis, intake));
        return;
      }

      setWorkflowStatus("analyzing");
      setRepoStatus(
        body.truncated
          ? "Repo inspected. Large repo results were truncated to deployment-relevant files."
          : "Repo inspected from public GitHub files."
      );
      setDraft(buildPlannerDraft(body.analysis, intake));
      setWorkflowStatus("completed");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const analysis = buildIntakeOnlyAnalysis({
        repoUrl: parsed.normalizedUrl,
        projectName: parsed.repo,
        projectSource: "user_provided"
      });

      setRepoError(
        "Repo inspection could not reach the analysis route. Continue manually or try again."
      );
      setRepoStatus("Using intake-only fallback until repo inspection succeeds.");
      setWorkflowStatus("failed");
      setDraft(buildPlannerDraft(analysis, intake));
    }
  }

  function startManually() {
    abortRef.current?.abort();
    clearPlannerDraft();
    const manualDraft = buildManualPlannerState();
    setRepoUrl("");
    setRepoError("");
    setRepoStatus("");
    setCopied("");
    setDraft(manualDraft);
  }

  function startOver() {
    abortRef.current?.abort();
    clearPlannerDraft();
    const blankDraft = buildManualPlannerState();
    setDraft(blankDraft);
    setRepoUrl("");
    setRepoError("");
    setRepoStatus("");
    setCopied("");
    setWorkflowStatus("idle");
    setExpandedEvidence(null);
  }

  function resetDemo() {
    abortRef.current?.abort();
    clearPlannerDraft();
    const fallbackDraft = buildFallbackPlannerState();
    setDraft(fallbackDraft);
    setRepoUrl(fallbackDraft.intake.repoUrl);
    setRepoError("");
    setRepoStatus("");
    setCopied("");
    setWorkflowStatus("idle");
    setExpandedEvidence(null);
  }

  function updateIntake(
    field: ProjectIntakeField,
    value: ProjectIntake[ProjectIntakeField]
  ) {
    setDraft((prev) => {
      const nextIntake = {
        ...prev.intake,
        [field]: value,
        source: "user_provided",
        sources: {
          ...prev.intake.sources,
          [field]: "user_provided"
        }
      } as ProjectIntake;

      return preserveCheckedItems(
        prev,
        buildPlannerDraft(prev.analysis, nextIntake, prev.selectedRecommendationId)
      );
    });
    setPlanMessage("");
  }

  async function copyText(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(""), 1600);
  }

  async function generatePlan() {
    setPlanMessage("");
    setWorkflowStatus("generating");

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          analysis: draft.analysis,
          intake: draft.intake,
          selectedRecommendationId: draft.selectedRecommendationId
        })
      });
      const body = (await response.json()) as {
        ok: boolean;
        message?: string;
        launchPlan?: PlannerDraft["launchPlan"];
        generationMode?: PlannerDraft["launchPlan"]["generationMode"];
      };

      if (!response.ok || !body.ok || !body.launchPlan) {
        setWorkflowStatus("failed");
        setPlanMessage(
          body.message ??
            "Launch plan generation failed. The current deterministic plan is still available."
        );
        return;
      }

      setDraft((prev) => ({
        ...prev,
        launchPlan: body.launchPlan!,
        updatedAt: body.launchPlan!.generatedAt
      }));
      setWorkflowStatus("completed");
      setPlanMessage(
        body.message ??
          `Generated ${body.generationMode ?? body.launchPlan.generationMode} plan.`
      );
    } catch {
      setWorkflowStatus("failed");
      setPlanMessage(
        "Launch plan generation could not reach the API route. The current deterministic plan is still available."
      );
    }
  }

  function togglePlanSection(title: string) {
    setExpandedPlanSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-fog text-ink">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <Panel className="h-full">
            <div className="grid h-full content-between gap-6">
              <div className="grid gap-5">
                <div>
                  <p className="text-sm font-semibold text-signal">ShipReady</p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    Turn a GitHub repo into a production launch plan
                  </h1>
                </div>
                <nav className="grid gap-2" aria-label="Planner stages">
                  {stages.map((stage, index) => {
                    const stageStatus = stageStatusFor(stage, workflowStatus, draft);
                    return (
                      <a
                        key={stage}
                        href={`#${stage.toLowerCase().replaceAll(" ", "-")}`}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-steel hover:bg-fog hover:text-ink"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded text-xs ${
                            stageStatus === "active"
                              ? "bg-signal text-white"
                              : stageStatus === "done"
                                ? "bg-green-100 text-green-800"
                                : "bg-white text-ink"
                          }`}
                        >
                          {stageStatus === "done" ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            index + 1
                          )}
                        </span>
                        {stage}
                      </a>
                    );
                  })}
                </nav>
                <div className="rounded-md border border-line bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">
                      Checklist progress
                    </span>
                    <span className="text-xs font-semibold text-steel">
                      {checklistProgress.percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-fog">
                    <div
                      className="h-full rounded-full bg-signal transition-all"
                      style={{ width: `${checklistProgress.percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-steel">
                    {checklistProgress.checked}/{checklistProgress.total} items done.
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <Button variant="secondary" onClick={startOver}>
                  <RotateCcw size={16} aria-hidden="true" />
                  Start over
                </Button>
                <Button variant="secondary" onClick={resetDemo}>
                  <RefreshCw size={16} aria-hidden="true" />
                  Load demo
                </Button>
              </div>
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
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={startManually}>
                  Start manually
                </Button>
                <Badge
                  tone={
                    draft.intake.sources.repoUrl === "user_provided" ? "good" : "neutral"
                  }
                >
                  Repo URL: {draft.intake.sources.repoUrl ?? draft.intake.source}
                </Badge>
              </div>
              {repoError ? (
                <div role="alert">
                  <Alert tone="danger">{repoError}</Alert>
                </div>
              ) : null}
              {repoStatus ? <Alert>{repoStatus}</Alert> : null}
              {configStatus.githubAuthState === "not_installed" ? (
                <Alert tone="warn" role="alert">
                  GitHub App credentials are present but the app is not yet installed on
                  any repositories. Install the app on your GitHub org or account to
                  inspect private repos. Public repo inspection still works.
                </Alert>
              ) : configStatus.githubAuthState === "missing_keys" &&
                !configStatus.githubReady ? (
                <Alert tone="warn" role="alert">
                  GitHub App credentials are not fully configured. Public repos can be
                  inspected; private repos need {configStatus.missingGitHub.join(", ")}{" "}
                  set. The deterministic fallback remains available.
                </Alert>
              ) : null}
              {!configStatus.aiReady ? (
                <Alert tone="warn" role="alert">
                  AI generation is not configured. Missing:{" "}
                  {configStatus.missingAi.join(", ")}. The deterministic fallback will be
                  used for all planning.
                </Alert>
              ) : null}
            </section>
          </Panel>

          <Panel>
            <section id="analysis" className="grid gap-4">
              <SectionHeader eyebrow="Analysis" title="Detected facts" />
              {workflowStatus === "fetching" || workflowStatus === "analyzing" ? (
                <Alert>
                  {workflowStatus === "fetching"
                    ? "Fetching repo files from GitHub..."
                    : "Analyzing detected files and services..."}
                </Alert>
              ) : workflowStatus === "failed" && draft.analysis.envVars.length === 0 ? (
                <Alert>
                  Repo inspection failed. Fill in the deployment questions below to
                  continue with manual planning.
                </Alert>
              ) : null}
              {draft.analysis.facts.length > 0 ||
              draft.analysis.frontendFramework ||
              draft.analysis.packageManager ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Fact
                      label="Project"
                      value={draft.analysis.projectName.value}
                      source={draft.analysis.projectName.source}
                      evidence={draft.analysis.projectName.evidence}
                      expanded={expandedEvidence}
                      onToggle={setExpandedEvidence}
                    />
                    <Fact
                      label="Framework"
                      value={draft.analysis.frontendFramework?.value ?? "Unknown"}
                      source={draft.analysis.frontendFramework?.source ?? "unknown"}
                      evidence={draft.analysis.frontendFramework?.evidence}
                      expanded={expandedEvidence}
                      onToggle={setExpandedEvidence}
                    />
                    <Fact
                      label="Package manager"
                      value={draft.analysis.packageManager?.value ?? "Unknown"}
                      source={draft.analysis.packageManager?.source ?? "unknown"}
                      evidence={draft.analysis.packageManager?.evidence}
                      expanded={expandedEvidence}
                      onToggle={setExpandedEvidence}
                    />
                    <Fact
                      label="Build"
                      value={draft.analysis.buildCommand?.value ?? "Unknown"}
                      source={draft.analysis.buildCommand?.source ?? "unknown"}
                      evidence={draft.analysis.buildCommand?.evidence}
                      expanded={expandedEvidence}
                      onToggle={setExpandedEvidence}
                    />
                  </div>
                  {draft.analysis.candidateAppRoots &&
                  draft.analysis.candidateAppRoots.length > 0 ? (
                    <div className="rounded-md border border-line bg-[#fbfcfd] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold">App root candidates</h3>
                        <span className="text-xs text-steel">Top 3 by score</span>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {draft.analysis.candidateAppRoots.slice(0, 3).map((root) => (
                          <div
                            key={root.path}
                            className="flex flex-wrap items-center justify-between gap-2 rounded border border-line bg-white px-3 py-2 text-sm"
                          >
                            <span className="font-mono text-xs">{root.path}</span>
                            <span className="flex items-center gap-2">
                              {typeof root.score === "number" ? (
                                <span className="text-xs text-steel">
                                  score {root.score}
                                </span>
                              ) : null}
                              <ConfidenceBadge confidence={root.confidence} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-0 border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-line text-steel">
                          <th className="py-2 pr-2 md:pr-3">Env var</th>
                          <th className="py-2 pr-2 md:pr-3">Exposure</th>
                          <th className="py-2 pr-2 md:pr-3">Required</th>
                          <th className="py-2 pr-2 md:pr-3">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draft.analysis.envVars.map((envVar) => (
                          <tr key={envVar.name} className="border-b border-line">
                            <td className="max-w-[160px] truncate py-3 pr-2 font-mono text-xs md:max-w-none md:pr-3">
                              {envVar.name}
                            </td>
                            <td className="py-3 pr-2 md:pr-3">{envVar.exposure}</td>
                            <td className="py-3 pr-2 md:pr-3">
                              {envVar.required ? "Yes" : "No"}
                            </td>
                            <td className="py-3 pr-2 md:pr-3">
                              <ConfidenceBadge confidence={envVar.confidence} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <Alert>
                  No repo analysis data yet. Use the intake form above to enter a GitHub
                  URL, or start manually with the &quot;Start manually&quot; button.
                </Alert>
              )}
            </section>
          </Panel>

          <Panel>
            <section id="questions" className="grid gap-4">
              <SectionHeader eyebrow="Questions" title="Deployment inputs" />
              <div className="grid gap-3 lg:grid-cols-3">
                <SummaryList
                  title="Detected with high confidence"
                  items={draft.missingInformation.highConfidence}
                  empty="No high-confidence repo facts yet."
                />
                <SummaryList
                  title="Needs confirmation"
                  items={draft.missingInformation.needsConfirmation}
                  empty="No inferred facts need confirmation yet."
                />
                <SummaryList
                  title="Unknown"
                  items={draft.missingInformation.unknowns}
                  empty="No core deployment unknowns."
                />
              </div>
              {draft.missingInformation.questions.length > 0 ? (
                <div className="rounded-md border border-line bg-[#fbfcfd] p-4">
                  <h3 className="text-base font-bold">Priority follow-ups</h3>
                  <ul className="mt-3 grid gap-2 text-sm text-steel">
                    {draft.missingInformation.questions.map((question) => (
                      <li key={question.id}>
                        <span className="font-semibold text-ink">
                          {question.question}
                        </span>{" "}
                        {question.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <QuestionGroup title="Project shape">
                <SelectQuestion
                  field="appType"
                  label="App type"
                  value={draft.intake.appType}
                  options={appTypeOptions}
                  source={sourceFor(draft.intake, "appType")}
                  onChange={updateIntake}
                />
                <SelectQuestion
                  field="audience"
                  label="Who will use it?"
                  value={draft.intake.audience}
                  options={audienceOptions}
                  source={sourceFor(draft.intake, "audience")}
                  onChange={updateIntake}
                />
                <SelectQuestion
                  field="traffic"
                  label="First 3 months traffic"
                  value={draft.intake.traffic}
                  options={trafficOptions}
                  source={sourceFor(draft.intake, "traffic")}
                  onChange={updateIntake}
                />
                <SelectQuestion
                  field="budget"
                  label="Monthly budget"
                  value={draft.intake.budget}
                  options={budgetOptions}
                  source={sourceFor(draft.intake, "budget")}
                  onChange={updateIntake}
                />
                <SelectQuestion
                  field="comfort"
                  label="Technical comfort"
                  value={draft.intake.comfort}
                  options={comfortOptions}
                  source={sourceFor(draft.intake, "comfort")}
                  onChange={updateIntake}
                />
                <SelectQuestion
                  field="priority"
                  label="Top priority"
                  value={draft.intake.priority}
                  options={priorityOptions}
                  source={sourceFor(draft.intake, "priority")}
                  onChange={updateIntake}
                />
              </QuestionGroup>

              <QuestionGroup title="Services needed">
                <BooleanQuestion
                  field="needsBackend"
                  label="Backend/API"
                  value={draft.intake.needsBackend}
                  source={sourceFor(draft.intake, "needsBackend")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsAuth"
                  label="Authentication"
                  value={draft.intake.needsAuth}
                  source={sourceFor(draft.intake, "needsAuth")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsDatabase"
                  label="Database"
                  value={draft.intake.needsDatabase}
                  source={sourceFor(draft.intake, "needsDatabase")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsFileUploads"
                  label="File uploads"
                  value={draft.intake.needsFileUploads}
                  source={sourceFor(draft.intake, "needsFileUploads")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsEmail"
                  label="Email sending"
                  value={draft.intake.needsEmail}
                  source={sourceFor(draft.intake, "needsEmail")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsPayments"
                  label="Payments"
                  value={draft.intake.needsPayments}
                  source={sourceFor(draft.intake, "needsPayments")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsBackgroundJobs"
                  label="Jobs or schedules"
                  value={draft.intake.needsBackgroundJobs}
                  source={sourceFor(draft.intake, "needsBackgroundJobs")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsRealtime"
                  label="Real-time features"
                  value={draft.intake.needsRealtime}
                  source={sourceFor(draft.intake, "needsRealtime")}
                  onChange={updateIntake}
                />
              </QuestionGroup>

              <QuestionGroup title="Launch constraints">
                <SelectQuestion
                  field="deploymentStatus"
                  label="Current deployment"
                  value={draft.intake.deploymentStatus}
                  options={deploymentStatusOptions}
                  source={sourceFor(draft.intake, "deploymentStatus")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsCustomDomain"
                  label="Custom domain"
                  value={draft.intake.needsCustomDomain}
                  source={sourceFor(draft.intake, "needsCustomDomain")}
                  onChange={updateIntake}
                />
                <SelectQuestion
                  field="domainStatus"
                  label="Domain status"
                  value={draft.intake.domainStatus}
                  options={domainStatusOptions}
                  source={sourceFor(draft.intake, "domainStatus")}
                  onChange={updateIntake}
                />
                <SelectQuestion
                  field="compliance"
                  label="Compliance"
                  value={draft.intake.compliance}
                  options={complianceOptions}
                  source={sourceFor(draft.intake, "compliance")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="storesPersonalData"
                  label="Stores personal data"
                  value={draft.intake.storesPersonalData}
                  source={sourceFor(draft.intake, "storesPersonalData")}
                  onChange={updateIntake}
                />
                <BooleanQuestion
                  field="needsSeo"
                  label="SEO-visible pages"
                  value={draft.intake.needsSeo}
                  source={sourceFor(draft.intake, "needsSeo")}
                  onChange={updateIntake}
                />
                <SelectQuestion
                  field="willingToCreateProviderAccounts"
                  label="Can create provider accounts?"
                  value={draft.intake.willingToCreateProviderAccounts}
                  options={providerAccountOptions}
                  source={sourceFor(draft.intake, "willingToCreateProviderAccounts")}
                  onChange={updateIntake}
                />
              </QuestionGroup>
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
                      setDraft((prev) =>
                        preserveCheckedItems(
                          prev,
                          buildPlannerDraft(prev.analysis, prev.intake, recommendation.id)
                        )
                      )
                    }
                  />
                ))}
              </div>
            </section>
          </Panel>

          <Panel>
            <section id="launch-plan" className="grid gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionHeader eyebrow="Launch Plan" title="Generated output" />
                <div className="flex flex-wrap items-center gap-2">
                  {draft.launchPlan.generationMode === "ai" ? (
                    <Badge tone="good">
                      <Sparkles size={12} className="mr-1" aria-hidden="true" />
                      AI-generated
                    </Badge>
                  ) : (
                    <Badge tone="neutral">
                      <Cpu size={12} className="mr-1" aria-hidden="true" />
                      Deterministic
                    </Badge>
                  )}
                  <Button
                    variant="secondary"
                    onClick={generatePlan}
                    disabled={workflowStatus === "generating"}
                  >
                    {workflowStatus === "generating" ? (
                      <RefreshCw size={16} aria-hidden="true" />
                    ) : configStatus.aiReady ? (
                      <Sparkles size={16} aria-hidden="true" />
                    ) : (
                      <Cpu size={16} aria-hidden="true" />
                    )}
                    {workflowStatus === "generating"
                      ? "Generating..."
                      : configStatus.aiReady
                        ? "Generate with AI"
                        : "Refresh fallback"}
                  </Button>
                </div>
              </div>
              {planMessage ? (
                <Alert tone={workflowStatus === "failed" ? "warn" : "info"}>
                  {planMessage}
                </Alert>
              ) : null}
              {launchBlockerCount > 0 ? (
                <Alert tone="warn">
                  <span className="inline-flex items-center gap-2">
                    <ShieldAlert size={16} aria-hidden="true" />
                    {launchBlockerCount} launch blockers need attention.
                  </span>
                </Alert>
              ) : null}
              {draft.launchPlan.sections.length > 0 ? (
                <div className="grid gap-2">
                  {draft.launchPlan.sections.map((section) => {
                    const expanded = expandedPlanSections.has(section.title);
                    return (
                      <div
                        key={section.title}
                        className="overflow-hidden rounded-md border border-line bg-[#fbfcfd]"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-ink hover:bg-white"
                          onClick={() => togglePlanSection(section.title)}
                          aria-expanded={expanded}
                        >
                          <span>{section.title}</span>
                          {expanded ? (
                            <ChevronDown size={16} aria-hidden="true" />
                          ) : (
                            <ChevronRight size={16} aria-hidden="true" />
                          )}
                        </button>
                        {expanded ? (
                          <pre className="border-t border-line p-4 text-sm leading-6 text-ink whitespace-pre-wrap">
                            {section.body}
                          </pre>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  No launch plan generated yet. Complete the intake and analysis steps
                  above.
                </Alert>
              )}
            </section>
          </Panel>

          <Panel>
            <section id="checklist" className="grid gap-4">
              <SectionHeader eyebrow="Checklist" title="Production readiness" />
              <Alert tone={checklistProgress.requiredRemaining > 0 ? "warn" : "info"}>
                {checklistProgress.requiredRemaining > 0
                  ? `${checklistProgress.requiredRemaining} required-before-launch checklist items remain.`
                  : "All required-before-launch checklist items are checked."}
              </Alert>
              {draft.checklist
                .filter((section) => section.relevant)
                .map((section) => {
                  const total = section.items.length;
                  const checked = section.items.filter((item) =>
                    draft.checkedItemIds.includes(item.id)
                  ).length;
                  const progressPct = total > 0 ? Math.round((checked / total) * 100) : 0;
                  return (
                    <div key={section.title} className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">
                          {section.title}
                        </span>
                        <span className="text-xs text-steel">
                          {checked}/{total} complete
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-fog">
                        <div
                          className="h-full rounded-full bg-signal transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="grid gap-1">
                        {section.items.map((item) => {
                          const isChecked = draft.checkedItemIds.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className={`flex cursor-pointer items-start gap-2 rounded px-2 py-1 text-sm ${
                                item.requiredBeforeLaunch
                                  ? "font-medium text-ink"
                                  : "text-steel"
                              } ${isChecked ? "opacity-60 line-through" : ""}`}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-steel accent-signal"
                                checked={isChecked}
                                onChange={() => {
                                  setDraft((prev) => {
                                    const ids = prev.checkedItemIds.includes(item.id)
                                      ? prev.checkedItemIds.filter((id) => id !== item.id)
                                      : [...prev.checkedItemIds, item.id];
                                    return { ...prev, checkedItemIds: ids };
                                  });
                                }}
                              />
                              <span className="flex-1">{item.text}</span>
                              {item.requiredBeforeLaunch && !isChecked ? (
                                <span className="shrink-0 text-xs font-semibold text-danger">
                                  Required
                                </span>
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </section>
          </Panel>

          <Panel>
            <section id="export" className="grid gap-4">
              <SectionHeader eyebrow="Export" title="Copy and export" />
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
                      "commands",
                      [
                        `# Install dependencies`,
                        `${installCommandFor(draft.analysis.packageManager?.value)}`,
                        ``,
                        `# Build`,
                        `${draft.analysis.buildCommand?.value ?? "npm run build"}`,
                        ``,
                        `# Start`,
                        `${draft.analysis.startCommand?.value ?? "npm start"}`
                      ].join("\n")
                    )
                  }
                >
                  <Terminal size={16} aria-hidden="true" />
                  Copy commands
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    copyText("checklist", exportChecklistMarkdown(draft.checklist))
                  }
                >
                  <FileText size={16} aria-hidden="true" />
                  Copy checklist
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    copyText(
                      "env",
                      draft.analysis.envVars
                        .map(
                          (envVar) =>
                            `# ${envVar.description}${envVar.required ? " Required." : " Optional."}\n${envVar.name}=${placeholderFor(envVar)}`
                        )
                        .join("\n\n")
                    )
                  }
                >
                  <Clipboard size={16} aria-hidden="true" />
                  Copy env
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    copyText(
                      "env-example",
                      exportEnvExampleSuggestion(draft.analysis.envVars)
                    )
                  }
                >
                  <FileCode size={16} aria-hidden="true" />
                  Copy .env.example
                </Button>
                {(() => {
                  const dockerMd = exportDockerfilesMarkdown(draft.analysis);
                  return dockerMd ? (
                    <Button
                      variant="secondary"
                      onClick={() => copyText("docker", dockerMd ?? "")}
                    >
                      <FileCode size={16} aria-hidden="true" />
                      Copy Docker config
                    </Button>
                  ) : null;
                })()}
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadText(
                      `${exportMetadataMarkdown(draft.launchPlan, draft.analysis.repoUrl)}\n\n${draft.launchPlan.markdown}`,
                      `${slug(draft.analysis.projectName.value)}-launch-plan.md`
                    )
                  }
                >
                  <Download size={16} aria-hidden="true" />
                  Download .md
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

              <div className="mt-6 grid gap-3">
                <p className="text-sm font-semibold uppercase text-steel">Config Files</p>
                {(() => {
                  const configs = generateConfigs(draft.analysis);
                  return configs.length > 0 ? (
                    <div className="grid gap-3">
                      {configs.map((config) => (
                        <details
                          key={config.fileName}
                          className="rounded-md border border-line bg-[#fbfcfd]"
                        >
                          <summary className="cursor-pointer border-b border-line px-3 py-2 text-sm font-medium text-ink">
                            {config.fileName}
                          </summary>
                          <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                            <span className="text-sm font-medium text-ink">Preview</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="text-xs text-steel hover:text-ink"
                                onClick={() => copyText(config.fileName, config.content)}
                              >
                                Copy
                              </button>
                              <button
                                type="button"
                                className="text-xs text-steel hover:text-ink"
                                onClick={() =>
                                  downloadText(config.content, config.fileName)
                                }
                              >
                                Download
                              </button>
                            </div>
                          </div>
                          <pre className="max-h-40 overflow-auto p-3 text-xs leading-5 text-ink">
                            {config.content}
                          </pre>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-steel">
                      No config files available for this project shape.
                    </p>
                  );
                })()}
              </div>
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

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const tone =
    confidence === "high" ? "good" : confidence === "medium" ? "warn" : "danger";
  return <Badge tone={tone}>{confidence}</Badge>;
}

function Fact({
  label,
  value,
  source,
  evidence,
  expanded,
  onToggle
}: {
  label: string;
  value: string;
  source: string;
  evidence?: { path: string; detail: string }[];
  expanded?: string | null;
  onToggle?: (id: string | null) => void;
}) {
  const hasEvidence = evidence && evidence.length > 0;
  const isExpanded = expanded === label;

  return (
    <div className="rounded-md border border-line bg-[#fbfcfd] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-steel">{label}</p>
          <p className="mt-1 font-semibold">{value}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={source === "detected" ? "good" : "neutral"}>{source}</Badge>
          {hasEvidence ? (
            <button
              className="text-xs text-signal underline underline-offset-2"
              onClick={() => onToggle?.(isExpanded ? null : label)}
              aria-expanded={isExpanded}
            >
              {isExpanded
                ? "Hide"
                : evidence!.length > 1
                  ? `${evidence!.length} sources`
                  : "Source"}
            </button>
          ) : null}
        </div>
      </div>
      {hasEvidence && isExpanded ? (
        <ul className="mt-3 grid gap-1.5 border-t border-line pt-3 text-xs text-steel">
          {evidence!.map((item, index) => (
            <li key={index} className="truncate">
              <span className="font-mono">{item.path}</span>: {item.detail}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function QuestionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3">
      <h3 className="text-base font-bold">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  );
}

function SummaryList({
  title,
  items,
  empty
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="rounded-md border border-line bg-[#fbfcfd] p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 grid gap-2 text-sm text-steel">
          {items.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-steel">{empty}</p>
      )}
    </div>
  );
}

function SelectQuestion<T extends string>({
  field,
  label,
  value,
  options,
  source,
  onChange
}: {
  field: ProjectIntakeField;
  label: string;
  value: T;
  options: SelectOption<T>[];
  source: FactSource;
  onChange: (field: ProjectIntakeField, value: ProjectIntake[ProjectIntakeField]) => void;
}) {
  return (
    <label className="grid gap-2 rounded-md border border-line bg-[#fbfcfd] p-4 text-sm font-semibold text-ink">
      <span className="flex items-start justify-between gap-3">
        {label}
        <Badge tone={source === "user_provided" ? "good" : "neutral"}>{source}</Badge>
      </span>
      <select
        className="h-10 rounded-md border border-line bg-white px-3 text-sm font-normal text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-teal-100"
        value={value}
        onChange={(event) =>
          onChange(field, event.target.value as ProjectIntake[ProjectIntakeField])
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BooleanQuestion({
  field,
  label,
  value,
  source,
  onChange
}: {
  field: ProjectIntakeField;
  label: string;
  value: boolean | "not_sure";
  source: FactSource;
  onChange: (field: ProjectIntakeField, value: ProjectIntake[ProjectIntakeField]) => void;
}) {
  const selectValue = value === true ? "true" : value === false ? "false" : "not_sure";

  return (
    <SelectQuestion
      field={field}
      label={label}
      value={selectValue}
      options={booleanOptions}
      source={source}
      onChange={(nextField, nextValue) =>
        onChange(nextField, parseBooleanAnswer(nextValue as BooleanAnswer))
      }
    />
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

function sourceFor(intake: ProjectIntake, field: ProjectIntakeField): FactSource {
  return intake.sources[field] ?? intake.source;
}

function parseBooleanAnswer(value: BooleanAnswer): boolean | "not_sure" {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return "not_sure";
}

function buildManualPlannerState(updatedAt?: string) {
  const intake = buildBlankProjectIntake();
  const analysis = buildIntakeOnlyAnalysis({
    projectName: "Manual project",
    projectSource: "defaulted"
  });

  return buildPlannerDraft(analysis, intake, undefined, updatedAt);
}

function stageStatusFor(
  stage: string,
  workflowStatus: WorkflowStageStatus,
  draft: PlannerDraft
): "idle" | "active" | "done" {
  if (stage === "Intake") return "done";

  const hasAnalysis =
    draft.analysis.envVars.length > 0 || draft.analysis.services.length > 0;
  const hasQuestions = draft.missingInformation.questions.length > 0;
  const hasRecommendations = draft.recommendations.length > 0;
  const hasPlan = draft.launchPlan.markdown.length > 0;

  if (stage === "Analysis") {
    if (workflowStatus === "fetching" || workflowStatus === "analyzing") return "active";
    return hasAnalysis ? "done" : "active";
  }

  if (stage === "Questions") {
    if (!hasAnalysis) return "idle";
    return !hasQuestions ? "done" : "active";
  }

  if (stage === "Recommendation") {
    if (hasQuestions) return "idle";
    return hasRecommendations ? "done" : "active";
  }

  if (stage === "Launch Plan") {
    if (!hasRecommendations) return "idle";
    return hasPlan ? "done" : "active";
  }

  if (stage === "Export") {
    return hasPlan ? "done" : "idle";
  }

  return "idle";
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function normalizeDraft(draft: PlannerDraft) {
  const fallback = buildManualPlannerState();
  const intake = {
    ...fallback.intake,
    ...draft.intake,
    sources: {
      ...fallback.intake.sources,
      ...draft.intake.sources
    }
  };

  const result = buildPlannerDraft(
    {
      ...fallback.analysis,
      ...draft.analysis
    },
    intake,
    draft.selectedRecommendationId,
    draft.updatedAt
  );

  if (draft.checkedItemIds) {
    result.checkedItemIds = draft.checkedItemIds;
  }

  return result;
}

function calculateChecklistProgress(draft: PlannerDraft) {
  const items = draft.checklist
    .filter((section) => section.relevant)
    .flatMap((section) => section.items);
  const checked = new Set(draft.checkedItemIds);
  const checkedCount = items.filter((item) => checked.has(item.id)).length;
  const requiredRemaining = items.filter(
    (item) => item.requiredBeforeLaunch && !checked.has(item.id)
  ).length;

  return {
    total: items.length,
    checked: checkedCount,
    requiredRemaining,
    percent: items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0
  };
}

function preserveCheckedItems(prev: PlannerDraft, next: PlannerDraft) {
  const nextItemIds = new Set(
    next.checklist.flatMap((section) => section.items.map((item) => item.id))
  );

  return {
    ...next,
    checkedItemIds: prev.checkedItemIds.filter((id) => nextItemIds.has(id))
  };
}
