import { createHash } from "node:crypto";

import { serializeGraphValue } from "./graph-projector.js";
import { MAX_RAG_CONTEXT_ITEMS, MAX_RAG_CONTEXT_TOKENS } from "./rag-config.js";
import {
  RAG_CONTEXT_CONTRACT_VERSION,
  RAG_PROMPT_VERSION,
  type RagCitationCatalogEntry,
  type RagContextPacket,
  type RagEvidence,
  type RagRequest,
} from "./rag-types.js";
import type { RetrievalPacket } from "./retrieval-types.js";

export function buildRagContext(request: RagRequest, retrieval: RetrievalPacket): RagContextPacket {
  if (retrieval.query.text.trim() !== request.question)
    throw new Error("RAG_RETRIEVAL_QUERY_MISMATCH");
  if (retrieval.result_count !== retrieval.results.length)
    throw new Error("RAG_RETRIEVAL_COUNT_MISMATCH");
  if (retrieval.results.length > MAX_RAG_CONTEXT_ITEMS) throw new Error("RAG_CONTEXT_ITEM_LIMIT");
  if (retrieval.estimated_tokens > MAX_RAG_CONTEXT_TOKENS)
    throw new Error("RAG_CONTEXT_TOKEN_LIMIT");
  const evidence = retrieval.results.map<RagEvidence>((result, index) => ({
    evidence_id: evidenceId(index),
    unit_id: result.unit.unit_id,
    record_id: result.unit.record_id,
    concept_id: result.unit.concept_id,
    unit_kind: result.unit.unit_kind,
    title: result.unit.title,
    text: result.unit.retrieval_text,
    source_path: result.unit.source_path,
    lifecycle_status: result.unit.lifecycle_status,
    semantic_scope: result.unit.semantic_scope,
    confidence: result.unit.confidence,
    content_hash: result.unit.content_hash,
    citations: result.unit.citations,
    graph_path: result.graph_path,
    graph_relationship_ids: result.graph_relationship_ids,
  }));
  const citationCatalog = citations(evidence);
  const fingerprintInput = {
    contract: RAG_CONTEXT_CONTRACT_VERSION,
    prompt: RAG_PROMPT_VERSION,
    question: request.question,
    project_context: request.project_context,
    generation: retrieval.generation,
    degraded: retrieval.degraded,
    evidence: evidence.map((item) => ({
      evidence_id: item.evidence_id,
      unit_id: item.unit_id,
      content_hash: item.content_hash,
      citations: item.citations,
      graph_path: item.graph_path,
      graph_relationship_ids: item.graph_relationship_ids,
    })),
  };
  return {
    rag_context_contract_version: RAG_CONTEXT_CONTRACT_VERSION,
    prompt_version: RAG_PROMPT_VERSION,
    question: request.question,
    project_context: request.project_context,
    retrieval,
    evidence,
    citation_catalog: citationCatalog,
    estimated_tokens: retrieval.estimated_tokens,
    context_fingerprint: `sha256:${createHash("sha256")
      .update(serializeGraphValue(fingerprintInput))
      .digest("hex")}`,
  };
}

function citations(evidence: RagEvidence[]): RagCitationCatalogEntry[] {
  const output: RagCitationCatalogEntry[] = [];
  for (const item of evidence) {
    for (const citation of item.citations) {
      if (!citation.title || !citation.url) continue;
      output.push({
        citation_id: `C${String(output.length + 1).padStart(4, "0")}`,
        evidence_id: item.evidence_id,
        source_id: citation.source_id,
        title: citation.title,
        url: citation.url,
        locators: citation.locators,
      });
    }
  }
  return output;
}

function evidenceId(index: number): string {
  return `E${String(index + 1).padStart(4, "0")}`;
}
