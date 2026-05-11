"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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

export function PlannerWorkflow({ configStatus }: PlannerWorkflowProps) {
  const [draft, setDraft] = useState<PlannerDraft>(() =>
    buildManualPlannerState(HYDRATION_SAFE_TIMESTAMP)
  );
  const [repoUrl, setRepoUrl] = useState(draft.intake.repoUrl);
  const [repoError, setRepoError] = useState("");
  const [repoStatus, setRepoStatus] = useState("");
  const [copied, setCopied] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  async function analyzeRepo() {
    const parsed = parseGitHubRepoUrl(repoUrl);

    if (!parsed) {
      setRepoError("Use a GitHub repo URL like https://github.com/org/repo.");
      return;
    }

    const intake = buildBlankProjectIntake(parsed.normalizedUrl, "user_provided");

    setRepoError("");
    setRepoUrl(parsed.normalizedUrl);
    setCopied("");
    setRepoStatus("Fetching public GitHub repo and reading deployment files...");

    try {
      const response = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ repoUrl: parsed.normalizedUrl })
      });
      const body = (await response.json()) as {
        ok: boolean;
        message?: string;
        analysis?: PlannerDraft["analysis"];
        truncated?: boolean;
      };

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
        setDraft(buildPlannerDraft(analysis, intake));
        return;
      }

      setRepoStatus(
        body.truncated
          ? "Repo inspected. Large repo results were truncated to deployment-relevant files."
          : "Repo inspected from public GitHub files."
      );
      setDraft(buildPlannerDraft(body.analysis, intake));
    } catch {
      const analysis = buildIntakeOnlyAnalysis({
        repoUrl: parsed.normalizedUrl,
        projectName: parsed.repo,
        projectSource: "user_provided"
      });

      setRepoError(
        "Repo inspection could not reach the analysis route. Continue manually or try again."
      );
      setRepoStatus("Using intake-only fallback until repo inspection succeeds.");
      setDraft(buildPlannerDraft(analysis, intake));
    }
  }

  function startManually() {
    const manualDraft = buildManualPlannerState();
    setRepoUrl("");
    setRepoError("");
    setRepoStatus("");
    setCopied("");
    setDraft(manualDraft);
  }

  function resetDemo() {
    clearPlannerDraft();
    const fallbackDraft = buildFallbackPlannerState();
    setDraft(fallbackDraft);
    setRepoUrl(fallbackDraft.intake.repoUrl);
    setRepoError("");
    setRepoStatus("");
    setCopied("");
  }

  function updateIntake(
    field: ProjectIntakeField,
    value: ProjectIntake[ProjectIntakeField]
  ) {
    const nextIntake = {
      ...draft.intake,
      [field]: value,
      source: "user_provided",
      sources: {
        ...draft.intake.sources,
        [field]: "user_provided"
      }
    } as ProjectIntake;

    setDraft(
      buildPlannerDraft(draft.analysis, nextIntake, draft.selectedRecommendationId)
    );
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
                Load demo
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
              {!configStatus.githubReady || !configStatus.aiReady ? (
                <Alert tone="warn" role="alert">
                  Live repo inspection or AI generation is not fully configured. Missing:{" "}
                  {[...configStatus.missingGitHub, ...configStatus.missingAi].join(", ")}.
                  The deterministic fallback remains available.
                </Alert>
              ) : null}
              <Alert>
                Public GitHub repos can be inspected now. Private repo inspection uses the
                GitHub App credential path and falls back to manual intake when
                unavailable.
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
                      setDraft(
                        buildPlannerDraft(draft.analysis, draft.intake, recommendation.id)
                      )
                    }
                  />
                ))}
              </div>
            </section>
          </Panel>

          <Panel>
            <section id="launch-plan" className="grid gap-4">
              <SectionHeader eyebrow="Launch Plan" title="Generated output" />
              {launchBlockerCount > 0 ? (
                <Alert tone="warn">
                  <span className="inline-flex items-center gap-2">
                    <ShieldAlert size={16} aria-hidden="true" />
                    {launchBlockerCount} launch blockers need attention.
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

  return buildPlannerDraft(
    {
      ...fallback.analysis,
      ...draft.analysis
    },
    intake,
    draft.selectedRecommendationId,
    draft.updatedAt
  );
}
