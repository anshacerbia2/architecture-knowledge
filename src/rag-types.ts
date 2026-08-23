import type {
  RetrievalCitation,
  RetrievalDiagnostic,
  RetrievalPacket,
  RetrievalRequest,
  RetrievalUnitKind,
} from "./retrieval-types.js";

export const RAG_CONTRACT_VERSION = 3 as const;
export const RAG_CONTEXT_CONTRACT_VERSION = 3 as const;
export const RAG_PROMPT_VERSION = 3 as const;
export const RAG_DATA_CLASSIFICATIONS = ["public", "internal", "confidential"] as const;

export type RagDataClassification = (typeof RAG_DATA_CLASSIFICATIONS)[number];

export type RagAnswerStatus = "answered" | "insufficient-evidence" | "refused";
export type RagEpistemicType =
  | "sourced-claim"
  | "synthesis"
  | "inference"
  | "recommendation"
  | "uncertainty";

export interface RagProjectContext {
  system_description: string | null;
  constraints: string[];
  quality_priorities: string[];
}

export interface RagRequest {
  question: string;
  data_classification: RagDataClassification;
  project_context: RagProjectContext;
  retrieval: RetrievalRequest;
  answer: {
    allow_recommendations: boolean;
    max_statements: number;
    max_output_tokens: number;
  };
}

export interface RagEvidence {
  evidence_id: string;
  unit_id: string;
  record_id: string;
  concept_id: string | null;
  unit_kind: RetrievalUnitKind;
  title: string;
  text: string;
  source_path: string;
  lifecycle_status: string | null;
  semantic_scope: string | null;
  confidence: string | null;
  content_hash: string;
  citations: RetrievalCitation[];
  graph_path: string[];
  graph_relationship_ids: string[];
}

export interface RagCitationCatalogEntry {
  citation_id: string;
  evidence_id: string;
  source_id: string;
  title: string;
  url: string;
  locators: unknown[];
}

export interface RagAuthoritativeCitation {
  source_id: string;
  title: string;
  url: string;
}

export interface RagCitationAuthority {
  resolve(recordId: string, sourceId: string): RagAuthoritativeCitation | undefined;
}

export interface RagContextPacket {
  rag_context_contract_version: number;
  prompt_version: number;
  question: string;
  data_classification: RagDataClassification;
  project_context: RagProjectContext;
  retrieval: RetrievalPacket;
  evidence: RagEvidence[];
  citation_catalog: RagCitationCatalogEntry[];
  estimated_tokens: number;
  context_fingerprint: string;
}

export interface RagModelStatement {
  statement_id: string;
  text: string;
  epistemic_type: RagEpistemicType;
  evidence_ids: string[];
  claim_ids: string[];
  conditions: string[];
  alternatives: string[];
  trade_offs: string[];
  confidence: "low" | "medium" | "high";
}

export interface RagModelOutput {
  status: RagAnswerStatus;
  summary: string;
  statements: RagModelStatement[];
  uncertainties: string[];
  refusal_reason: string | null;
}

export interface RagResolvedCitation extends RagCitationCatalogEntry {}

export interface RagGroundedStatement extends RagModelStatement {
  citations: RagResolvedCitation[];
}

export interface RagDiagnostic extends RetrievalDiagnostic {}

export interface RagAnswerPacket {
  rag_contract_version: number;
  question: string;
  status: RagAnswerStatus;
  model_invoked: boolean;
  provider: { provider: string; model: string; prompt_version: number };
  provenance: {
    context_fingerprint: string;
    retrieval_generation_id: string;
    graph_input_fingerprint: string;
    retrieval_manifest_root: string;
    data_classification: RagDataClassification;
  };
  summary: string;
  statements: RagGroundedStatement[];
  uncertainties: string[];
  refusal_reason: string | null;
  rendered_markdown: string;
  diagnostics: RagDiagnostic[];
  retrieval: RetrievalPacket;
}

export interface RagModelProvider {
  readonly provider: string;
  readonly model: string;
  readonly allowedDataClassifications: readonly RagDataClassification[];
  generate(context: RagContextPacket, request: RagRequest): Promise<RagModelOutput>;
}
