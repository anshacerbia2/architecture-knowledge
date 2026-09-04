export const RETRIEVAL_CONTRACT_VERSION = 2 as const;
export const RETRIEVAL_UNIT_CONTRACT_VERSION = 2 as const;
export const RETRIEVAL_GENERATOR_VERSION = 2 as const;

export type RetrievalUnitKind =
  | "concept-overview"
  | "concept-section"
  | "claim"
  | "relationship"
  | "source"
  | "decision-guide-overview"
  | "decision-guide-section";

export interface RetrievalCitation {
  source_id: string;
  title: string | null;
  url: string | null;
  locators: unknown[];
}

export interface RetrievalUnit {
  retrieval_unit_contract_version: number;
  unit_id: string;
  unit_kind: RetrievalUnitKind;
  record_id: string;
  concept_id: string | null;
  section_key: string;
  ordinal: number;
  title: string;
  retrieval_text: string;
  content_hash: string;
  estimated_tokens: number;
  metadata: Record<string, unknown>;
  source_path: string;
  lifecycle_status: string | null;
  semantic_scope: string | null;
  confidence: string | null;
  citations: RetrievalCitation[];
}

export interface RetrievalManifest {
  retrieval_contract_version: number;
  retrieval_unit_contract_version: number;
  generator_version: number;
  graph_contract_version: number;
  graph_input_fingerprint: string;
  governed_input_hash: string;
  unit_counts: Record<RetrievalUnitKind, number>;
  unit_count: number;
  estimated_token_total: number;
  embedding_contract: EmbeddingContract;
  normalization_version: string;
  chunking_version: string;
  artifact_inventory: string[];
  units: Array<{
    unit_id: string;
    record_id: string;
    unit_kind: RetrievalUnitKind;
    content_hash: string;
  }>;
  manifest_root_hash: string;
}

export interface RetrievalArtifacts {
  units: RetrievalUnit[];
  manifest: RetrievalManifest;
  files: Map<string, string>;
}

export interface EmbeddingContract {
  provider: string;
  model: string;
  dimension: number;
  distance_metric: "cosine";
  contract_fingerprint: string;
}

export interface EmbeddingProvider {
  readonly provider: string;
  readonly model: string;
  readonly dimension: number;
  readonly contractFingerprint: string;
  readonly allowedDataClassifications: readonly string[];
  embedDocuments(texts: readonly string[]): Promise<readonly number[][]>;
  embedQuery(text: string): Promise<readonly number[]>;
}

export type RetrievalMode = "lexical" | "vector" | "hybrid" | "hybrid-graph";

export interface RetrievalFilters {
  concept_types: string[];
  domains: string[];
  statuses: string[];
  claim_types: string[];
  semantic_scopes: string[];
  minimum_confidence: string | null;
  normative_forces: string[];
  unit_kinds: RetrievalUnitKind[];
}

export interface RetrievalRequest {
  text: string;
  mode: RetrievalMode;
  top_k: number;
  candidate_k: number;
  filters: RetrievalFilters;
  graph: { enabled: boolean; max_depth: number; predicates: string[] };
  budget: {
    max_units: number;
    max_estimated_tokens: number;
    max_units_per_concept: number;
  };
  explain: boolean;
  allow_degraded_lexical_fallback: boolean;
}

export interface RetrievalCandidate {
  unit: RetrievalUnit;
  lexical_rank: number | null;
  lexical_score: number | null;
  vector_rank: number | null;
  vector_similarity: number | null;
  graph_distance: number | null;
  graph_path: string[];
  graph_relationship_ids: string[];
}

export interface RetrievalResult extends RetrievalCandidate {
  score: number;
  score_breakdown: {
    lexical_rrf: number;
    vector_rrf: number;
    exact_match_boost: number;
    graph_penalty: number;
  };
  selection: { selected: boolean; reason: string };
}

export interface RetrievalDiagnostic {
  code: string;
  message: string;
}

export interface RetrievalPacket {
  retrieval_contract_version: number;
  query: RetrievalRequest;
  generation: {
    generation_id: string;
    graph_input_fingerprint: string;
    retrieval_manifest_root: string;
    embedding_provider: string;
    embedding_model: string;
    embedding_dimension: number;
  };
  result_count: number;
  estimated_tokens: number;
  degraded: boolean;
  degradation_reason: string | null;
  results: RetrievalResult[];
  selection_decisions: Array<{ unit_id: string; selected: boolean; reason: string }>;
  diagnostics: RetrievalDiagnostic[];
}

export interface RankedRow {
  unit: RetrievalUnit;
  rank: number;
  score: number;
}
