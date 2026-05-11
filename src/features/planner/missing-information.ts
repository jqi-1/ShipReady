import { hasService } from "@/lib/service-utils";
import type {
  MissingInformationQuestion,
  MissingInformationSummary,
  ProjectIntake,
  ProjectIntakeField,
  RepoAnalysis
} from "@/types/planner";

const MAX_NORMAL_QUESTIONS = 11;

export function inferIntakeFromAnalysis(
  intake: ProjectIntake,
  analysis: RepoAnalysis
): ProjectIntake {
  const next: ProjectIntake = {
    ...intake,
    sources: {
      ...intake.sources
    }
  };

  inferField(next, "needsBackend", hasBackend(analysis));
  inferField(next, "needsDatabase", hasService(analysis, "database"));
  inferField(next, "needsAuth", hasService(analysis, "auth"));
  inferField(next, "needsPayments", hasService(analysis, "payments"));
  inferField(next, "needsEmail", hasService(analysis, "email"));
  inferField(next, "needsFileUploads", hasService(analysis, "storage"));
  inferField(next, "needsBackgroundJobs", hasService(analysis, "background_jobs"));
  inferField(next, "needsRealtime", hasService(analysis, "realtime"));

  if (
    next.appType === "not_sure" &&
    next.sources.appType !== "user_provided" &&
    analysis.backendFramework &&
    !analysis.frontendFramework
  ) {
    next.appType = "api";
    next.sources.appType = "inferred";
  }

  return next;
}

export function summarizeMissingInformation(
  analysis: RepoAnalysis,
  intake: ProjectIntake
): MissingInformationSummary {
  const highConfidence = summarizeHighConfidence(analysis);
  const needsConfirmation = summarizeNeedsConfirmation(analysis, intake);
  const unknowns = summarizeUnknowns(analysis);
  const questions = buildQuestions(analysis, intake).slice(0, MAX_NORMAL_QUESTIONS);

  return {
    highConfidence,
    needsConfirmation,
    unknowns,
    questions
  };
}

function inferField(intake: ProjectIntake, field: ProjectIntakeField, value: boolean) {
  if (intake.sources[field] === "user_provided") {
    return;
  }

  if (value) {
    (intake as unknown as Record<ProjectIntakeField, boolean | "not_sure">)[field] = true;
    intake.sources[field] = "inferred";
  }
}

function summarizeHighConfidence(analysis: RepoAnalysis) {
  const facts = [
    analysis.frontendFramework,
    analysis.backendFramework,
    analysis.packageManager,
    analysis.buildCommand,
    analysis.startCommand,
    analysis.runtime
  ]
    .filter(Boolean)
    .filter((fact) => fact?.confidence === "high")
    .map((fact) => `${fact?.label}: ${fact?.value}`);

  return [
    ...facts,
    ...analysis.services
      .filter((service) => service.confidence === "high")
      .map((service) => `${service.category}: ${service.name}`)
  ];
}

function summarizeNeedsConfirmation(analysis: RepoAnalysis, intake: ProjectIntake) {
  const confirmations: string[] = [];

  if (analysis.candidateAppRoots && analysis.candidateAppRoots.length > 1) {
    confirmations.push(
      `Confirm app root. Detected candidates: ${analysis.candidateAppRoots
        .map((root) => root.path)
        .join(", ")}.`
    );
  }

  for (const fact of [
    analysis.frontendFramework,
    analysis.backendFramework,
    analysis.packageManager,
    analysis.buildCommand,
    analysis.startCommand
  ]) {
    if (fact && fact.confidence !== "high") {
      confirmations.push(`Confirm ${fact.label.toLowerCase()}: ${fact.value}.`);
    }
  }

  for (const [field, label] of [
    ["needsBackend", "backend/API"],
    ["needsAuth", "authentication"],
    ["needsDatabase", "database"],
    ["needsFileUploads", "file uploads"],
    ["needsEmail", "email"],
    ["needsPayments", "payments"],
    ["needsBackgroundJobs", "background jobs"],
    ["needsRealtime", "real-time features"]
  ] as const) {
    if (intake.sources[field] === "inferred") {
      confirmations.push(`Confirm inferred need for ${label}.`);
    }
  }

  return confirmations;
}

function summarizeUnknowns(analysis: RepoAnalysis) {
  const unknowns: string[] = [];

  if (!analysis.frontendFramework) unknowns.push("Frontend framework");
  if (!analysis.backendFramework) unknowns.push("Backend framework");
  if (!analysis.packageManager) unknowns.push("Package manager");
  if (!analysis.buildCommand) unknowns.push("Build command");
  if (!analysis.startCommand && analysis.backendFramework) unknowns.push("Start command");
  if (analysis.envVars.length === 0) unknowns.push("Production environment variables");

  return unknowns;
}

function buildQuestions(
  analysis: RepoAnalysis,
  intake: ProjectIntake
): MissingInformationQuestion[] {
  const questions: MissingInformationQuestion[] = [];

  addQuestion(questions, intake, "appType", {
    question: "What type of app is this?",
    reason: "App type changes whether SEO, auth, payments, and backend defaults matter."
  });
  addQuestion(questions, intake, "traffic", {
    question: "What traffic do you expect in the first 3 months?",
    reason: "Traffic affects free tier risk, database size, and hosting choice."
  });
  addQuestion(questions, intake, "budget", {
    question: "What monthly budget should the plan respect?",
    reason: "Budget decides whether the cheapest or fastest managed stack should win."
  });
  addQuestion(questions, intake, "priority", {
    question: "Is speed, cost, scalability, or simplicity most important?",
    reason: "This decides which stack option should be primary."
  });
  addQuestion(questions, intake, "comfort", {
    question: "How technical should the setup instructions assume you are?",
    reason: "Comfort level changes how much provider detail the plan should include."
  });

  if (
    intake.storesPersonalData === "not_sure" ||
    intake.sources.storesPersonalData !== "user_provided"
  ) {
    addQuestion(questions, intake, "storesPersonalData", {
      question: "Will this store personal user data?",
      reason: "Personal data changes legal, security, backup, and monitoring checks."
    });
  }

  if (
    intake.needsCustomDomain === "not_sure" ||
    intake.sources.needsCustomDomain !== "user_provided"
  ) {
    addQuestion(questions, intake, "needsCustomDomain", {
      question: "Does launch require a custom domain?",
      reason: "Domain status changes DNS, callback URL, email, and payment webhook setup."
    });
  }

  for (const serviceQuestion of serviceQuestions(analysis, intake)) {
    addQuestion(questions, intake, serviceQuestion.id, serviceQuestion);
  }

  return questions;
}

function serviceQuestions(
  analysis: RepoAnalysis,
  intake: ProjectIntake
): MissingInformationQuestion[] {
  const questions: MissingInformationQuestion[] = [];

  if (!hasService(analysis, "database") && intake.needsDatabase === "not_sure") {
    questions.push({
      id: "needsDatabase",
      question: "Does the app need a production database?",
      reason: "A database changes hosting, backup, migration, and cost guidance."
    });
  }

  if (!hasService(analysis, "auth") && intake.needsAuth === "not_sure") {
    questions.push({
      id: "needsAuth",
      question: "Does the app need user accounts or authentication?",
      reason: "Auth changes required secrets and callback URL setup."
    });
  }

  if (!hasService(analysis, "payments") && intake.needsPayments === "not_sure") {
    questions.push({
      id: "needsPayments",
      question: "Will this app accept payments?",
      reason:
        "Payments require live keys, webhook verification, legal pages, and test purchases."
    });
  }

  if (!hasService(analysis, "email") && intake.needsEmail === "not_sure") {
    questions.push({
      id: "needsEmail",
      question: "Will the app send transactional email?",
      reason: "Email requires domain authentication and deliverability checks."
    });
  }

  return questions;
}

function addQuestion(
  questions: MissingInformationQuestion[],
  intake: ProjectIntake,
  id: ProjectIntakeField,
  content: Omit<MissingInformationQuestion, "id">
) {
  if (intake.sources[id] === "user_provided") {
    return;
  }

  if (questions.some((question) => question.id === id)) {
    return;
  }

  questions.push({
    id,
    ...content
  });
}

function hasBackend(analysis: RepoAnalysis) {
  return (
    Boolean(analysis.backendFramework) ||
    analysis.services.some((service) =>
      [
        "database",
        "auth",
        "payments",
        "email",
        "storage",
        "background_jobs",
        "realtime"
      ].includes(service.category)
    )
  );
}
