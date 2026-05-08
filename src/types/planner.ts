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
  source: FactSource;
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

export interface RepoAnalysis {
  projectName: DeploymentFact;
  repoUrl?: string;
  appRoot: DeploymentFact;
  packageManager?: DeploymentFact;
  frontendFramework?: DeploymentFact;
  backendFramework?: DeploymentFact;
  buildCommand?: DeploymentFact;
  startCommand?: DeploymentFact;
  runtime?: DeploymentFact;
  envVars: EnvVariable[];
  services: ServiceDetection[];
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
  recommendations: RecommendationOption[];
  selectedRecommendationId: string;
  risks: Risk[];
  costs: CostEstimate;
  checklist: ChecklistSection[];
  launchPlan: LaunchPlan;
  updatedAt: string;
}
