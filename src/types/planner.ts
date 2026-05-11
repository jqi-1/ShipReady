export type FactSource =
  | "detected"
  | "inferred"
  | "user_provided"
  | "defaulted"
  | "unknown";

export type Confidence = "high" | "medium" | "low";

export type RiskSeverity = "high" | "medium" | "low" | "info";

export type RiskCategory =
  | "env"
  | "auth"
  | "database"
  | "payments"
  | "email"
  | "storage"
  | "security"
  | "monitoring"
  | "legal"
  | "deployment"
  | "operations";

export type AppType =
  | "saas"
  | "landing_page"
  | "marketplace"
  | "internal_tool"
  | "api"
  | "mobile_backend"
  | "ecommerce"
  | "content_site"
  | "other"
  | "not_sure";

export type TrafficRange = "prototype" | "1k_mau" | "10k_mau" | "100k_mau";

export type BudgetRange = "0_20" | "20_100" | "100_500" | "500_plus";

export type TechnicalComfort = "beginner" | "comfortable" | "developer";

export type ProductPriority = "speed" | "cost" | "scalability" | "simplicity";

export type ComplianceNeed =
  | "none"
  | "gdpr"
  | "hipaa"
  | "soc2"
  | "data_residency"
  | "not_sure";

export type DeploymentStatus =
  | "not_deployed"
  | "preview_deployed"
  | "production_deployed"
  | "not_sure";

export type DomainStatus =
  | "owns_domain"
  | "needs_domain"
  | "using_platform_subdomain"
  | "not_sure";

export type AppAudience = "public_users" | "internal_users" | "both" | "not_sure";

export type ProviderAccountWillingness = "yes" | "no" | "not_sure";

export type ServiceCategory =
  | "database"
  | "auth"
  | "payments"
  | "email"
  | "storage"
  | "background_jobs"
  | "realtime"
  | "analytics"
  | "monitoring"
  | "docker"
  | "ci_cd"
  | "deployment";

export type ProjectIntakeField =
  | "repoUrl"
  | "appType"
  | "traffic"
  | "budget"
  | "comfort"
  | "priority"
  | "needsBackend"
  | "needsAuth"
  | "needsDatabase"
  | "needsFileUploads"
  | "needsEmail"
  | "needsPayments"
  | "needsBackgroundJobs"
  | "needsRealtime"
  | "needsCustomDomain"
  | "storesPersonalData"
  | "needsSeo"
  | "compliance"
  | "deploymentStatus"
  | "domainStatus"
  | "audience"
  | "willingToCreateProviderAccounts";

export type ProjectIntakeSources = Partial<Record<ProjectIntakeField, FactSource>>;

export interface Evidence {
  path: string;
  detail: string;
}

export interface DeploymentFact<T = string> {
  label: string;
  value: T;
  source: FactSource;
  confidence: Confidence;
  evidence?: Evidence[];
}

export interface ProjectIntake {
  repoUrl: string;
  appType: AppType;
  traffic: TrafficRange;
  budget: BudgetRange;
  comfort: TechnicalComfort;
  priority: ProductPriority;
  needsBackend: boolean | "not_sure";
  needsAuth: boolean | "not_sure";
  needsDatabase: boolean | "not_sure";
  needsFileUploads: boolean | "not_sure";
  needsEmail: boolean | "not_sure";
  needsPayments: boolean | "not_sure";
  needsBackgroundJobs: boolean | "not_sure";
  needsRealtime: boolean | "not_sure";
  needsCustomDomain: boolean | "not_sure";
  storesPersonalData: boolean | "not_sure";
  needsSeo: boolean | "not_sure";
  compliance: ComplianceNeed;
  deploymentStatus: DeploymentStatus;
  domainStatus: DomainStatus;
  audience: AppAudience;
  willingToCreateProviderAccounts: ProviderAccountWillingness;
  source: FactSource;
  sources: ProjectIntakeSources;
}

export interface EnvVariable {
  name: string;
  required: boolean;
  exposure: "server" | "client" | "unknown";
  description: string;
  source: FactSource;
  confidence: Confidence;
  evidence: Evidence[];
}

export interface ServiceDetection {
  category: ServiceCategory;
  name: string;
  source: FactSource;
  confidence: Confidence;
  evidence: Evidence[];
}

export interface AnalysisIssue {
  id: string;
  severity: RiskSeverity;
  title: string;
  description: string;
  evidence?: Evidence[];
}

export interface CandidateAppRoot {
  path: string;
  reason: string;
  confidence: Confidence;
}

export interface RepoFetchStatus {
  status: "not_started" | "fetched" | "failed";
  source: "public_github" | "github_app" | "uploaded_files" | "demo" | "manual";
  message: string;
  defaultBranch?: string;
  fileCount?: number;
}

export interface DockerfileAnalysis {
  path: string;
  baseImages: string[];
  stages: string[];
  installSteps: string[];
  copyInstructions: string[];
  exposedPorts: string[];
  workdir?: string;
  user?: string;
  envVars: string[];
  buildArgs: string[];
  healthcheck?: string;
  startCommand?: string;
  likelyProduction: boolean;
}

export interface DockerComposeService {
  name: string;
  image?: string;
  buildContext?: string;
  dockerfile?: string;
  ports: string[];
  volumes: string[];
  envFiles: string[];
  dependsOn: string[];
  networks: string[];
  healthcheck?: string;
}

export interface DockerComposeAnalysis {
  path: string;
  services: DockerComposeService[];
  namedVolumes: string[];
}

export interface DockerAnalysis {
  dockerfiles: DockerfileAnalysis[];
  composeFiles: DockerComposeAnalysis[];
  hasDockerignore: boolean;
  serviceDependencies: string[];
  needsProductionDocker: boolean;
  probablyLocalOnly: boolean;
  recommendation: string;
  suggestedDockerignore?: string;
  risks: AnalysisIssue[];
}

export interface MissingInformationQuestion {
  id: ProjectIntakeField;
  question: string;
  reason: string;
}

export interface MissingInformationSummary {
  highConfidence: string[];
  needsConfirmation: string[];
  unknowns: string[];
  questions: MissingInformationQuestion[];
}

export interface RepoAnalysis {
  projectName: DeploymentFact;
  repoUrl?: string;
  fetchStatus?: RepoFetchStatus;
  appRoot: DeploymentFact;
  candidateAppRoots?: CandidateAppRoot[];
  isMonorepo?: DeploymentFact<boolean>;
  packageManager?: DeploymentFact;
  frontendFramework?: DeploymentFact;
  backendFramework?: DeploymentFact;
  buildCommand?: DeploymentFact;
  startCommand?: DeploymentFact;
  runtime?: DeploymentFact;
  envVars: EnvVariable[];
  services: ServiceDetection[];
  docker?: DockerAnalysis;
  deploymentBlockers?: AnalysisIssue[];
  facts: DeploymentFact[];
}

export interface StackServices {
  hosting: string;
  backend: string;
  database: string;
  auth: string;
  storage: string;
  email: string;
  payments: string;
  analytics: string;
  monitoring: string;
  ciCd: string;
  dns: string;
}

export interface RecommendationOption {
  id: string;
  label: string;
  priority: "fastest" | "cheapest" | "scalable";
  summary: string;
  why: string;
  services: StackServices;
  estimatedMonthlyCost: string;
  tradeoffs: string[];
  whenNotToChoose: string;
}

export interface CostTier {
  tier: TrafficRange;
  label: string;
  monthlyRange: string;
  assumptions: string[];
  categories: Record<string, string>;
}

export interface CostEstimate {
  stackId: string;
  caveat: string;
  tiers: CostTier[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  requiredBeforeLaunch: boolean;
}

export interface ChecklistSection {
  title: string;
  relevant: boolean;
  items: ChecklistItem[];
}

export interface Risk {
  id: string;
  severity: RiskSeverity;
  category: RiskCategory;
  title: string;
  description: string;
  fix: string;
  source: FactSource;
  confidence: Confidence;
  evidence?: Evidence[];
  launchBlocker: boolean;
}

export interface LaunchPlanSection {
  title: string;
  body: string;
}

export interface LaunchPlan {
  projectName: string;
  generatedAt: string;
  sections: LaunchPlanSection[];
  markdown: string;
}

export interface PlannerDraft {
  intake: ProjectIntake;
  analysis: RepoAnalysis;
  missingInformation: MissingInformationSummary;
  recommendations: RecommendationOption[];
  selectedRecommendationId: string;
  risks: Risk[];
  costs: CostEstimate;
  checklist: ChecklistSection[];
  launchPlan: LaunchPlan;
  updatedAt: string;
}
