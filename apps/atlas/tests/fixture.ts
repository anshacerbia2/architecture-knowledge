import type { KnowledgePort } from "../packages/application/src/knowledge-port.js";
import type { Answer, Summary, SystemStatus } from "../packages/contracts/src/index.js";

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
  recommendations_enabled: false,
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
