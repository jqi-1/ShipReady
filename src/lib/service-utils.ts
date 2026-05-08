import type { RepoAnalysis, ServiceCategory } from "@/types/planner";

export function hasService(analysis: RepoAnalysis, category: ServiceCategory) {
  return analysis.services.some((service) => service.category === category);
}

export function serviceName(
  analysis: RepoAnalysis,
  category: ServiceCategory,
  fallback: string
) {
  return (
    analysis.services.find((service) => service.category === category)?.name ?? fallback
  );
}
