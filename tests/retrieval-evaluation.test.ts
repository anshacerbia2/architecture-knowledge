import path from "node:path";

import { describe, expect, it } from "vitest";

import { evaluateRetrieval, loadRetrievalGolden } from "../src/retrieval-evaluation.js";
import type { RetrievalPacket, RetrievalRequest, RetrievalResult } from "../src/retrieval-types.js";

describe("M5 retrieval evaluation", () => {
  it("validates a meaningful draft benchmark with a holdout", async () => {
    const benchmark = await loadRetrievalGolden(
      path.join(process.cwd(), "evaluation/retrieval-golden.yaml"),
    );
    expect(benchmark.cases.length).toBeGreaterThanOrEqual(40);
    expect(benchmark.cases.some((item) => item.holdout)).toBe(true);
    expect(new Set(benchmark.cases.map((item) => item.category)).size).toBeGreaterThan(10);
  });

  it("calculates rank, no-answer, citation, locator, and leakage gates deterministically", async () => {
    const benchmark = await loadRetrievalGolden(
      path.join(process.cwd(), "evaluation/retrieval-golden.yaml"),
    );
    const byText = new Map(benchmark.cases.map((item) => [item.text, item]));
    const report = await evaluateRetrieval(benchmark, async (_mode, request) => {
      const item = byText.get(request.text)!;
      const results = item.no_answer
        ? []
        : item.relevant_record_ids.map((id, index) => result(id, index));
      return packet(request, results);
    });
    expect(report.gates).toEqual({ passed: true, failures: [] });
    expect(report.modes.hybrid).toMatchObject({
      recall_at_5: 1,
      mrr_at_10: 42 / 46,
      no_answer_accuracy: 1,
      citation_completeness: 1,
      source_locator_completeness: 1,
      excluded_edge_leakage: 0,
    });
  });

  it("fails every safety gate for fabricated, uncited, excluded-path output", async () => {
    const benchmark = {
      version: 1,
      status: "draft",
      cases: [
        {
          id: "bad",
          category: "negative",
          text: "absent",
          relevant_record_ids: [],
          acceptable_record_ids: [],
          prohibited_record_ids: ["AKL-BAD"],
          filters: {},
          no_answer: true,
          holdout: false,
          notes: "",
        },
      ],
    };
    const report = await evaluateRetrieval(benchmark, async (_mode, request) => {
      const bad = result("AKL-BAD", 0);
      bad.unit.unit_kind = "claim";
      bad.unit.metadata.source_locations = [{ source_id: "AKS-BAD", locator: "x" }];
      bad.unit.citations = [{ source_id: "AKS-BAD", title: null, url: null, locators: [] }];
      bad.graph_relationship_ids = ["AKR-000010"];
      return packet(request, [bad]);
    });
    expect(report.gates.passed).toBe(false);
    expect(report.gates.failures).toEqual(
      expect.arrayContaining([
        "hybrid:citation-completeness",
        "hybrid:source-locator-completeness",
        "hybrid:excluded-edge-leakage",
        "hybrid:no-answer",
        "hybrid:prohibited-results",
      ]),
    );
    expect(report.modes.hybrid).toMatchObject({
      citation_completeness: 0,
      source_locator_completeness: 0,
      excluded_edge_leakage: 1,
      no_answer_accuracy: 0,
      prohibited_result_count: 1,
    });
  });
});

function result(recordId: string, index: number): RetrievalResult {
  return {
    unit: {
      retrieval_unit_contract_version: 1,
      unit_id: `ru:${recordId}:${index}`,
      unit_kind: "concept-overview",
      record_id: recordId,
      concept_id: recordId.startsWith("AKC") ? recordId : null,
      section_key: "overview",
      ordinal: 0,
      title: recordId,
      retrieval_text: recordId,
      content_hash: "sha256:test",
      estimated_tokens: 1,
      metadata: {},
      source_path: "synthetic",
      lifecycle_status: "proposed",
      semantic_scope: null,
      confidence: null,
      citations: [],
    },
    lexical_rank: index + 1,
    lexical_score: 1,
    vector_rank: index + 1,
    vector_similarity: 1,
    graph_distance: null,
    graph_path: [],
    graph_relationship_ids: [],
    score: 1,
    score_breakdown: { lexical_rrf: 1, vector_rrf: 1, exact_match_boost: 0, graph_penalty: 0 },
    selection: { selected: true, reason: "selected" },
  };
}

function packet(query: RetrievalRequest, results: RetrievalResult[]): RetrievalPacket {
  return {
    retrieval_contract_version: 1,
    query,
    generation: {
      generation_id: "rg:test",
      graph_input_fingerprint: "sha256:graph",
      retrieval_manifest_root: "sha256:manifest",
      embedding_provider: "fake",
      embedding_model: "fake",
      embedding_dimension: 1536,
    },
    result_count: results.length,
    estimated_tokens: results.length,
    degraded: false,
    degradation_reason: null,
    results,
    selection_decisions: [],
    diagnostics: [],
  };
}
