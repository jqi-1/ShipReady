import type {
  CostEstimate,
  CostTier,
  RecommendationOption,
  TrafficRange
} from "@/types/planner";

const TIER_LABELS: Record<TrafficRange, string> = {
  prototype: "Prototype / zero users",
  "1k_mau": "1,000 monthly active users",
  "10k_mau": "10,000 monthly active users",
  "100k_mau": "100,000 monthly active users"
};

export function estimateMonthlyCosts(recommendation: RecommendationOption): CostEstimate {
  return {
    stackId: recommendation.id,
    caveat:
      "Costs are rough planning ranges, not quotes. Verify provider pricing before purchase because limits and included usage change.",
    tiers: [
      buildTier(
        "prototype",
        "$0-25",
        "Minimal traffic, demo usage, small database, low email volume."
      ),
      buildTier(
        "1k_mau",
        "$20-100",
        "Light production usage, modest database size, basic monitoring, hundreds to low thousands of emails."
      ),
      buildTier(
        "10k_mau",
        "$100-500",
        "Growing app traffic, paid database tier, more email, monitoring retention, and analytics events."
      ),
      buildTier(
        "100k_mau",
        "$500-2,500+",
        "Meaningful production scale, higher bandwidth, database tuning, storage growth, and support needs."
      )
    ]
  };
}

function buildTier(
  tier: TrafficRange,
  monthlyRange: string,
  assumption: string
): CostTier {
  return {
    tier,
    label: TIER_LABELS[tier],
    monthlyRange,
    assumptions: [assumption],
    categories: {
      hosting: tier === "prototype" ? "$0-20" : "$20-300+",
      database: tier === "prototype" ? "$0-25" : "$20-1,000+",
      storage: tier === "100k_mau" ? "$25-300+" : "$0-50",
      bandwidth: tier === "prototype" ? "$0" : "$0-500+",
      email: tier === "prototype" ? "$0-20" : "$20-300+",
      auth: tier === "prototype" ? "$0" : "$0-500+",
      monitoring: tier === "prototype" ? "$0" : "$0-200+",
      analytics: tier === "prototype" ? "$0" : "$0-300+",
      backgroundJobs: tier === "prototype" ? "$0" : "$10-300+",
      serverlessUsage: tier === "prototype" ? "$0" : "$0-500+"
    }
  };
}
