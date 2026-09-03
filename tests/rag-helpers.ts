import {
  createRagCitationAuthority,
  type RagCitationAuthorityRecord,
} from "../src/rag-citation-authority.js";
import type { RagCitationAuthority, RagModelOutput, RagRequest } from "../src/rag-types.js";
import type { RetrievalPacket, RetrievalResult, RetrievalUnit } from "../src/retrieval-types.js";

export function ragRequest(overrides: Partial<RagRequest> = {}): RagRequest {
  return {
    question: "What does the evidence say?",
    data_classification: "public",
    project_context: { system_description: null, constraints: [], quality_priorities: [] },
    retrieval: {
      text: "What does the evidence say?",
      mode: "hybrid-graph",
      top_k: 10,
      candidate_k: 40,
      filters: {
        concept_types: [],
        domains: [],
        statuses: [],
        claim_types: [],
        semantic_scopes: [],
        minimum_confidence: null,
        normative_forces: [],
        unit_kinds: [],
      },
      graph: { enabled: true, max_depth: 1, predicates: [] },
      budget: { max_units: 10, max_estimated_tokens: 4000, max_units_per_concept: 3 },
      explain: true,
      allow_degraded_lexical_fallback: false,
    },
    answer: { allow_recommendations: false, max_statements: 8, max_output_tokens: 1800 },
    ...overrides,
  };
}

export function retrievalUnit(overrides: Partial<RetrievalUnit> = {}): RetrievalUnit {
  return {
    retrieval_unit_contract_version: 1,
    unit_id: "ru:AKL-000001:claim:claim:0",
    unit_kind: "claim",
    record_id: "AKL-000001",
    concept_id: "AKC-000001",
    section_key: "claim",
    ordinal: 0,
    title: "Synthetic claim",
    retrieval_text: "A bounded synthetic claim.",
    content_hash: "sha256:unit",
    estimated_tokens: 20,
    metadata: { claim_type: "normalized-source-claim" },
    source_path: "claims/AKL-000001.yaml",
    lifecycle_status: "sourced",
    semantic_scope: "concept-global",
    confidence: "high",
    citations: [
      {
        source_id: "AKS-000001",
        title: "Synthetic source",
        url: "https://example.com/source",
        locators: [{ locator: "section 1" }],
      },
    ],
    ...overrides,
  };
}

export function retrievalPacket(units: RetrievalUnit[] = [retrievalUnit()]): RetrievalPacket {
  const results = units.map<RetrievalResult>((unit, index) => ({
    unit,
    lexical_rank: index + 1,
    lexical_score: 1,
    vector_rank: index + 1,
    vector_similarity: 0.9,
    graph_distance: null,
    graph_path: [],
    graph_relationship_ids: [],
    score: 1,
    score_breakdown: {
      lexical_rrf: 0.1,
      vector_rrf: 0.1,
      exact_match_boost: 0,
      graph_penalty: 0,
    },
    selection: { selected: true, reason: "selected" },
  }));
  return {
    retrieval_contract_version: 1,
    query: ragRequest().retrieval,
    generation: {
      generation_id: "rg:test",
      graph_input_fingerprint: "sha256:graph",
      retrieval_manifest_root: "sha256:manifest",
      embedding_provider: "deterministic-fake",
      embedding_model: "token-hash-v1",
      embedding_dimension: 1536,
    },
    result_count: results.length,
    estimated_tokens: units.reduce((sum, unit) => sum + unit.estimated_tokens, 0),
    degraded: false,
    degradation_reason: null,
    results,
    selection_decisions: results.map((result) => ({
      unit_id: result.unit.unit_id,
      selected: true,
      reason: "selected",
    })),
    diagnostics: [],
  };
}

export function modelOutput(overrides: Partial<RagModelOutput> = {}): RagModelOutput {
  return {
    status: "answered",
    summary: "Synthetic answer.",
    statements: [
      {
        statement_id: "S0001",
        text: "A bounded synthetic claim.",
        epistemic_type: "sourced-claim",
        evidence_ids: ["E0001"],
        claim_ids: ["AKL-000001"],
        conditions: [],
        alternatives: [],
        trade_offs: [],
        confidence: "high",
      },
    ],
    uncertainties: [],
    refusal_reason: null,
    ...overrides,
  };
}

export function ragCitationAuthority(
  overrides: {
    claims?: RagCitationAuthorityRecord[];
    sources?: RagCitationAuthorityRecord[];
  } = {},
): RagCitationAuthority {
  return createRagCitationAuthority({
    concepts: [],
    claims: overrides.claims ?? [{ id: "AKL-000001", sources: ["AKS-000001"] }],
    decisionGuides: [],
    relationships: [],
    sources: overrides.sources ?? [
      {
        id: "AKS-000001",
        title: "Synthetic source",
        url: "https://example.com/source",
        status: "approved",
      },
    ],
  });
}
