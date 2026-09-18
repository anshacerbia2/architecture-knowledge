// Mirrors the registered ID format; checked against the actual kernel catalog in E2E.
export const KNOWLEDGE_ID_PATTERN = "^(AKC|AKS|AKL|AKR|AKG)-[0-9]{6}$";
export type RetrievalDatabaseMode = "local" | "hosted";

export interface Envelope<T> {
  contract_version: 1;
  request_id: string;
  repository_commit: string;
  data: T;
}
export interface Summary {
  id: string;
  title: string;
  family: string;
  status: string | null;
  source_path: string;
}
export interface Edge {
  id: string;
  from: string;
  to: string;
  predicate: string;
  direction: string;
  traversable: boolean;
  conditions: unknown[];
  exclusion_reason: string | null;
}
export interface GraphView {
  nodes: Summary[];
  edges: Edge[];
  truncated: boolean;
}
export interface RecordView {
  summary: Summary;
  fields: Record<string, unknown>;
  connections: Edge[];
}
export interface SystemStatus {
  repository_commit: string;
  graph: "ready" | "stale";
  retrieval: "ready" | "unavailable";
  retrieval_code: string | null;
  generation_id: string | null;
  database_mode: RetrievalDatabaseMode;
  counts: Record<string, number>;
  provider_mode: "deterministic-demo" | "openai-live-pilot" | "openrouter-free" | "antigravity-cli";
  ai_connection?: { mode: "api" | "oauth"; connected: boolean } | null;
  retrieval_strategy?: "lexical" | "hybrid-graph";
  pilot_budget?: {
    limit_cents: number;
    reserved_cents: number;
    remaining_cents: number;
    expires_at: string;
  } | null;
  recommendations_enabled: false;
}
export interface SearchInput {
  text: string;
  mode: "lexical" | "hybrid" | "hybrid-graph";
}
export interface SearchHit {
  unit_id: string;
  record_id: string;
  title: string;
  text: string;
  status: string | null;
  kind: string;
  graph_path: string[];
}
export interface SearchOutput {
  hits: SearchHit[];
  generation_id: string;
  diagnostics: string[];
}
export interface AskInput {
  question: string;
  data_classification: "public" | "internal" | "confidential";
}
export interface Citation {
  citation_id: string;
  evidence_id: string;
  source_id: string;
  title: string;
  url: string;
  locators: unknown[];
}
export interface Statement {
  statement_id: string;
  text: string;
  epistemic_type: string;
  confidence: string;
  evidence_ids: string[];
  claim_ids: string[];
  conditions: string[];
  alternatives: string[];
  trade_offs: string[];
  citations: Citation[];
}
export interface Answer {
  question: string;
  status: "answered" | "insufficient-evidence" | "refused";
  summary: string;
  statements: Statement[];
  uncertainties: string[];
  refusal_reason: string | null;
  model_invoked: boolean;
  provider: { provider: string; model: string; prompt_version: number };
  provenance: {
    context_fingerprint: string;
    retrieval_generation_id: string;
    graph_input_fingerprint: string;
    retrieval_manifest_root: string;
    data_classification: string;
  };
}
