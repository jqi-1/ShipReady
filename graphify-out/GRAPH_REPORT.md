# Graph Report - .  (2026-05-10)

## Corpus Check
- Corpus is ~29,057 words - fits in a single context window. You may not need a graph.

## Summary
- 273 nodes · 525 edges · 23 communities (22 shown, 1 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Planner Workflow|Planner Workflow]]
- [[_COMMUNITY_Product Design Principles|Product Design Principles]]
- [[_COMMUNITY_Repo Analysis Engine|Repo Analysis Engine]]
- [[_COMMUNITY_Launch Plan Generation|Launch Plan Generation]]
- [[_COMMUNITY_Checklist Generation|Checklist Generation]]
- [[_COMMUNITY_Env Detection & Risk Review|Env Detection & Risk Review]]
- [[_COMMUNITY_UI Components|UI Components]]
- [[_COMMUNITY_Docker Analysis|Docker Analysis]]
- [[_COMMUNITY_Stack Recommendations|Stack Recommendations]]
- [[_COMMUNITY_Missing Information|Missing Information]]
- [[_COMMUNITY_Service Detection|Service Detection]]
- [[_COMMUNITY_Runtime Config|Runtime Config]]

## God Nodes (most connected - your core abstractions)
1. `analyzeRepoFiles()` - 37 edges
2. `hasService()` - 27 edges
3. `generateChecklist()` - 23 edges
4. `Launch Architect` - 23 edges
5. `renderSection()` - 18 edges
6. `item()` - 17 edges
7. `buildPlannerDraft()` - 16 edges
8. `buildRecommendationOptions()` - 12 edges
9. `buildBlankProjectIntake()` - 9 edges
10. `reviewRisks()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Launch Architect` --semantically_similar_to--> `ShipReady`  [INFERRED] [semantically similar]
  AGENTS.md → README.md
- `Backend Direction` --semantically_similar_to--> `Backend Direction (README)`  [INFERRED] [semantically similar]
  AGENTS.md → README.md
- `Simplicity First` --semantically_similar_to--> `Stack Recommendation Principles`  [INFERRED] [semantically similar]
  behavior.md → AGENTS.md
- `v0.0.1 Changelog` --conceptually_related_to--> `ShipReady`  [EXTRACTED]
  CHANGELOG.md → README.md
- `Think Before Coding` --conceptually_related_to--> `Design Principle`  [INFERRED]
  behavior.md → AGENTS.md

## Hyperedges (group relationships)
- **Agent System** — agents_repo_inspection_agent, agents_recommendation_agent, agents_launch_plan_agent, agents_checklist_agent, agents_cost_estimation_agent, agents_risk_review_agent, agents_config_generation_agent [INFERRED 0.90]
- **Development Principles** — behavior_think_before_coding, behavior_simplicity_first, behavior_surgical_changes, behavior_goal_driven_execution [INFERRED 0.85]
- **Product Evolution Plan** — agents_mvp_scope, agents_v1_scope, agents_future_scope [INFERRED 0.80]

## Communities (23 total, 1 thin omitted)

### Community 0 - "Planner Workflow"
Cohesion: 0.09
Nodes (25): POST(), analyzeRepo(), resetDemo(), startManually(), startOver(), updateIntake(), exportChecklistMarkdown(), exportDockerfilesMarkdown() (+17 more)

### Community 1 - "Product Design Principles"
Cohesion: 0.07
Nodes (36): Backend Direction, Checklist Agent, Config Generation Agent, Cost Estimation Agent, Design Principle, Example Final Output Structure, Failure Criteria, Future Scope (+28 more)

### Community 2 - "Repo Analysis Engine"
Cohesion: 0.14
Nodes (28): analyzeRepoFiles(), basename(), buildAnalysisSummary(), collectPackageDependencies(), commandForScript(), deploymentProviderName(), detectBackendFramework(), detectBuildCommand() (+20 more)

### Community 3 - "Launch Plan Generation"
Cohesion: 0.15
Nodes (24): factValue(), migrationCommand(), renderAuthSetup(), renderCostEstimate(), renderDatabaseSetup(), renderDeploymentSteps(), renderDetectedServices(), renderDetectedStack() (+16 more)

### Community 4 - "Checklist Generation"
Cohesion: 0.27
Nodes (22): analyticsSection(), authSection(), backupsSection(), buildAndDeploySection(), databaseSection(), dockerSection(), emailSection(), environmentSection() (+14 more)

### Community 5 - "Env Detection & Risk Review"
Cohesion: 0.14
Nodes (15): collectFromDocs(), collectFromEnvExample(), collectFromSourceReferences(), describeVariable(), detectEnvironmentVariables(), detectHardcodedSecrets(), generateEnvExampleSuggestion(), getExposure() (+7 more)

### Community 6 - "UI Components"
Cohesion: 0.11
Nodes (4): RoutePlaceholder(), Alert(), Button(), Panel()

### Community 7 - "Docker Analysis"
Cohesion: 0.18
Nodes (10): slug(), analyzeDockerFiles(), buildDockerRecommendation(), buildDockerRisks(), defaultDockerignore(), isProductionDockerfile(), logicalDockerfileLines(), parseComposeFile() (+2 more)

### Community 8 - "Stack Recommendations"
Cohesion: 0.22
Nodes (10): buildTier(), estimateMonthlyCosts(), generateLaunchPlan(), serviceName(), apiOptions(), buildRecommendationOptions(), fullStackOptions(), orderOptions() (+2 more)

### Community 9 - "Missing Information"
Cohesion: 0.3
Nodes (10): addQuestion(), buildQuestions(), hasBackend(), inferField(), inferIntakeFromAnalysis(), serviceQuestions(), summarizeHighConfidence(), summarizeMissingInformation() (+2 more)

### Community 10 - "Service Detection"
Cohesion: 0.42
Nodes (7): collectComposerDependencies(), collectDependencies(), collectLineDependencies(), collectPackageDependencies(), dedupeEvidence(), detectServiceUsage(), upsertDetection()

## Knowledge Gaps
- **22 isolated node(s):** `Repo Inspection Agent`, `Checklist Agent`, `Cost Estimation Agent`, `Risk Review Agent`, `Config Generation Agent` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `slug()` connect `Docker Analysis` to `Planner Workflow`, `Repo Analysis Engine`, `Launch Plan Generation`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `analyzeRepoFiles()` connect `Repo Analysis Engine` to `Planner Workflow`, `Env Detection & Risk Review`, `Docker Analysis`, `Stack Recommendations`, `Missing Information`, `Service Detection`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `buildPlannerDraft()` connect `Planner Workflow` to `Stack Recommendations`, `Missing Information`, `Checklist Generation`, `Env Detection & Risk Review`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `analyzeRepoFiles()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`analyzeRepoFiles()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `hasService()` (e.g. with `authSection()` and `databaseSection()`) actually correct?**
  _`hasService()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Repo Inspection Agent`, `Checklist Agent`, `Cost Estimation Agent` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Planner Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._