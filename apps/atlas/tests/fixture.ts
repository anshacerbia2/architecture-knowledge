import type { KnowledgePort } from "../packages/application/src/knowledge-port.js";
import type { DecisionPort } from "../packages/application/src/decision-port.js";
import type {
  Answer,
  DecisionGuideIntake,
  DecisionGuideSummary,
  DecisionSession,
  Summary,
  SystemStatus,
} from "../packages/contracts/src/index.js";

export const node: Summary = {
  id: "AKC-000012",
  title: "Synthetic retry",
  family: "concept",
  status: "proposed",
  source_path: "synthetic.md",
};
export const status: SystemStatus = {
  repository_commit: "a".repeat(40),
  graph: "ready",
  retrieval: "ready",
  retrieval_code: null,
  generation_id: "synthetic-generation",
  database_mode: "local",
  counts: { concept: 1 },
  provider_mode: "deterministic-demo",
  recommendations_enabled: true,
};
export const answer: Answer = {
  question: "Synthetic question",
  status: "answered",
  summary: "Synthetic response only.",
  statements: [],
  uncertainties: [],
  refusal_reason: null,
  model_invoked: true,
  provider: { provider: "test-only", model: "test-only", prompt_version: 1 },
  provenance: {
    context_fingerprint: "synthetic",
    retrieval_generation_id: "synthetic-generation",
    graph_input_fingerprint: "synthetic",
    retrieval_manifest_root: "synthetic",
    data_classification: "public",
  },
};
export function fakePort(overrides: Partial<KnowledgePort> = {}): KnowledgePort {
  return {
    commit: status.repository_commit,
    status: async () => status,
    catalog: async () => [node],
    record: async () => ({ summary: node, fields: {}, connections: [] }),
    graph: async () => ({ nodes: [node], edges: [], truncated: false }),
    search: async () => ({
      hits: [],
      generation_id: "synthetic-generation",
      diagnostics: [],
    }),
    ask: async () => answer,
    close: async () => {},
    ...overrides,
  };
}

export const decisionGuide: DecisionGuideSummary = {
  id: "AKG-000002",
  version: 1,
  title: "Synthetic dependency choice",
  decision_question: "Which bounded response applies?",
  lifecycle_status: "proposed",
  option_ids: ["AKC-000012", "AKC-000013"],
  authority: {
    recommendation_only: true,
    human_decision_required: true,
    automation_may_approve: false,
  },
};
export const decisionIntake: DecisionGuideIntake = {
  guide: decisionGuide,
  context_variables: [],
  constraints: [],
  quality_attributes: [],
  conditions: [],
  privacy: {
    allowed_context_classifications: ["public", "internal"],
    external_provider_policy: "prohibited",
    session_persistence: "ephemeral-only",
  },
};
export const decisionSession: DecisionSession = {
  contract_version: 3,
  session_id: "66666666-6666-4666-8666-666666666666",
  guide_id: decisionGuide.id,
  guide_version: 1,
  context: [],
  drivers: [],
  constraints: [],
  condition_evaluations: [],
  privacy: {
    persistence: "ephemeral-only",
    external_provider_authorized: false,
    external_provider_authorization: null,
    redacted_keys: [],
  },
  authority: decisionGuide.authority,
};
export function fakeDecisionPort(overrides: Partial<DecisionPort> = {}): DecisionPort {
  return {
    commit: status.repository_commit,
    decisionGuides: async () => [decisionGuide],
    decisionIntake: async () => decisionIntake,
    evaluateDecision: async () => ({
      recommendation: {
        contract_version: 4,
        status: "needs-human-clarification",
        authority: decisionGuide.authority,
      },
      clarification_prompts: [],
    }),
    ...overrides,
  };
}
