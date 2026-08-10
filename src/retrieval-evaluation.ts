import { readFile } from "node:fs/promises";

import YAML from "yaml";

import { serializeGraphValue } from "./graph-projector.js";
import type { RetrievalMode, RetrievalPacket } from "./retrieval-types.js";
import { parseRetrievalRequest } from "./retrieval-query-contract.js";

export interface RetrievalGoldenCase {
  id: string;
  category: string;
  text: string;
  relevant_record_ids: string[];
  acceptable_record_ids: string[];
  prohibited_record_ids: string[];
  filters: Record<string, unknown>;
  no_answer: boolean;
  holdout: boolean;
  notes: string;
}

export interface RetrievalMetrics {
  case_count: number;
  recall_at_1: number;
  recall_at_5: number;
  recall_at_10: number;
  precision_at_5: number;
  mrr_at_10: number;
  ndcg_at_10: number;
  no_answer_accuracy: number;
  citation_completeness: number;
  source_locator_completeness: number;
  excluded_edge_leakage: number;
  prohibited_result_count: number;
}

export interface RetrievalEvaluationReport {
  benchmark_version: number;
  benchmark_status: string;
  case_count: number;
  modes: Record<RetrievalMode, RetrievalMetrics>;
  gates: { passed: boolean; failures: string[] };
  evidence_class: string;
}

export async function loadRetrievalGolden(
  file: string,
): Promise<{ version: number; status: string; cases: RetrievalGoldenCase[] }> {
  const raw = YAML.parse(await readFile(file, "utf8")) as unknown;
  if (!isObject(raw) || raw.version !== 1 || raw.status !== "draft" || !Array.isArray(raw.cases)) {
    throw new Error("RETRIEVAL_EVALUATION_SCHEMA benchmark envelope");
  }
  const cases = raw.cases.map((value, index) => parseCase(value, index));
  if (cases.length < 40) throw new Error("RETRIEVAL_EVALUATION_SCHEMA at least 40 cases required");
  if (new Set(cases.map((item) => item.id)).size !== cases.length)
    throw new Error("RETRIEVAL_EVALUATION_SCHEMA duplicate case ID");
  return { version: raw.version, status: raw.status, cases };
}

export async function evaluateRetrieval(
  benchmark: { version: number; status: string; cases: RetrievalGoldenCase[] },
  run: (
    mode: RetrievalMode,
    request: ReturnType<typeof parseRetrievalRequest>,
  ) => Promise<RetrievalPacket>,
): Promise<RetrievalEvaluationReport> {
  const modes = {} as Record<RetrievalMode, RetrievalMetrics>;
  for (const mode of ["lexical", "vector", "hybrid", "hybrid-graph"] as const) {
    const observations: CaseObservation[] = [];
    for (const item of benchmark.cases) {
      const request = parseRetrievalRequest({
        text: item.text,
        mode,
        top_k: 10,
        candidate_k: 60,
        filters: item.filters,
        graph: { enabled: mode === "hybrid-graph", max_depth: 1, predicates: [] },
        budget: { max_units: 10, max_estimated_tokens: 6000, max_units_per_concept: 3 },
        explain: true,
      });
      observations.push(observe(item, await run(mode, request)));
    }
    modes[mode] = aggregate(observations);
  }
  const failures = gateFailures(modes);
  return {
    benchmark_version: benchmark.version,
    benchmark_status: benchmark.status,
    case_count: benchmark.cases.length,
    modes,
    gates: { passed: failures.length === 0, failures },
    evidence_class:
      "deterministic-provider functional benchmark; not real-provider semantic-quality evidence",
  };
}

interface CaseObservation {
  recalls: [number, number, number];
  precision5: number;
  reciprocalRank: number;
  ndcg10: number;
  noAnswerCorrect: boolean | null;
  citationComplete: boolean;
  locatorComplete: boolean;
  excludedLeakage: number;
  prohibited: number;
}

function observe(item: RetrievalGoldenCase, packet: RetrievalPacket): CaseObservation {
  const records = unique(packet.results.map((result) => result.unit.record_id));
  const relevant = new Set([...item.relevant_record_ids, ...item.acceptable_record_ids]);
  const strictRelevant = new Set(item.relevant_record_ids);
  const recall = (k: number): number =>
    strictRelevant.size === 0
      ? 1
      : records.slice(0, k).filter((id) => strictRelevant.has(id)).length / strictRelevant.size;
  const first = records.slice(0, 10).findIndex((id) => relevant.has(id));
  const citationComplete = packet.results.every((result) =>
    result.unit.citations.every((citation) =>
      Boolean(citation.source_id && citation.title && citation.url),
    ),
  );
  const locatorComplete = packet.results
    .filter((result) => result.unit.unit_kind === "claim")
    .every((result) => {
      const expected = Array.isArray(result.unit.metadata.source_locations)
        ? result.unit.metadata.source_locations
        : [];
      const actual = result.unit.citations.flatMap((citation) => citation.locators);
      return serializeGraphValue(expected) === serializeGraphValue(actual);
    });
  const excludedLeakage = packet.results.reduce(
    (sum, result) =>
      sum +
      result.graph_relationship_ids.filter(
        (id) => id === "AKR-000010" || !TRAVERSABLE_RELATIONSHIPS.has(id),
      ).length,
    0,
  );
  return {
    recalls: [recall(1), recall(5), recall(10)],
    precision5: records.slice(0, 5).filter((id) => relevant.has(id)).length / 5,
    reciprocalRank: first < 0 ? 0 : 1 / (first + 1),
    ndcg10: ndcg(records.slice(0, 10), relevant),
    noAnswerCorrect: item.no_answer ? packet.results.length === 0 : null,
    citationComplete,
    locatorComplete,
    excludedLeakage,
    prohibited: records.filter((id) => item.prohibited_record_ids.includes(id)).length,
  };
}

const TRAVERSABLE_RELATIONSHIPS = new Set([
  "AKR-000002",
  "AKR-000003",
  "AKR-000004",
  "AKR-000008",
  "AKR-000011",
  "AKR-000012",
  "AKR-000014",
  "AKR-000020",
]);

function aggregate(items: CaseObservation[]): RetrievalMetrics {
  const noAnswer = items.filter((item) => item.noAnswerCorrect !== null);
  return {
    case_count: items.length,
    recall_at_1: mean(items.map((item) => item.recalls[0])),
    recall_at_5: mean(items.map((item) => item.recalls[1])),
    recall_at_10: mean(items.map((item) => item.recalls[2])),
    precision_at_5: mean(items.map((item) => item.precision5)),
    mrr_at_10: mean(items.map((item) => item.reciprocalRank)),
    ndcg_at_10: mean(items.map((item) => item.ndcg10)),
    no_answer_accuracy:
      noAnswer.length === 0 ? 1 : mean(noAnswer.map((item) => (item.noAnswerCorrect ? 1 : 0))),
    citation_completeness: mean(items.map((item) => (item.citationComplete ? 1 : 0))),
    source_locator_completeness: mean(items.map((item) => (item.locatorComplete ? 1 : 0))),
    excluded_edge_leakage: items.reduce((sum, item) => sum + item.excludedLeakage, 0),
    prohibited_result_count: items.reduce((sum, item) => sum + item.prohibited, 0),
  };
}

function gateFailures(modes: Record<RetrievalMode, RetrievalMetrics>): string[] {
  const failures: string[] = [];
  for (const [mode, metrics] of Object.entries(modes)) {
    if (metrics.citation_completeness !== 1) failures.push(`${mode}:citation-completeness`);
    if (metrics.source_locator_completeness !== 1)
      failures.push(`${mode}:source-locator-completeness`);
    if (metrics.excluded_edge_leakage !== 0) failures.push(`${mode}:excluded-edge-leakage`);
    if (metrics.no_answer_accuracy !== 1) failures.push(`${mode}:no-answer`);
    if (metrics.prohibited_result_count !== 0) failures.push(`${mode}:prohibited-results`);
  }
  for (const mode of ["hybrid", "hybrid-graph"] as const) {
    if (modes[mode].recall_at_5 < 0.9) failures.push(`${mode}:recall-at-5`);
    if (modes[mode].mrr_at_10 < 0.8) failures.push(`${mode}:mrr-at-10`);
  }
  const baselineRecall = Math.max(modes.lexical.recall_at_5, modes.vector.recall_at_5);
  const baselineMrr = Math.max(modes.lexical.mrr_at_10, modes.vector.mrr_at_10);
  if (modes.hybrid.recall_at_5 < baselineRecall)
    failures.push("hybrid:recall-below-strongest-channel");
  if (modes.hybrid.mrr_at_10 < baselineMrr) failures.push("hybrid:mrr-below-strongest-channel");
  return failures;
}

function parseCase(value: unknown, index: number): RetrievalGoldenCase {
  if (!isObject(value)) throw new Error(`RETRIEVAL_EVALUATION_SCHEMA case ${index}`);
  const id = required(value.id, `case ${index} id`);
  const text = required(value.text, `${id} text`);
  const relevant = strings(value.relevant_record_ids, `${id} relevant_record_ids`);
  const noAnswer = value.no_answer === true;
  if (!noAnswer && relevant.length === 0)
    throw new Error(`RETRIEVAL_EVALUATION_SCHEMA ${id} needs relevance`);
  if (value.filters !== undefined && !isObject(value.filters))
    throw new Error(`RETRIEVAL_EVALUATION_SCHEMA ${id} filters`);
  return {
    id,
    category: required(value.category, `${id} category`),
    text,
    relevant_record_ids: relevant,
    acceptable_record_ids: strings(value.acceptable_record_ids, `${id} acceptable`, true),
    prohibited_record_ids: strings(value.prohibited_record_ids, `${id} prohibited`, true),
    filters: isObject(value.filters) ? value.filters : {},
    no_answer: noAnswer,
    holdout: value.holdout === true,
    notes: typeof value.notes === "string" ? value.notes : "",
  };
}

function ndcg(records: string[], relevant: ReadonlySet<string>): number {
  if (relevant.size === 0) return records.length === 0 ? 1 : 0;
  const dcg = records.reduce(
    (sum, id, index) => sum + (relevant.has(id) ? 1 / Math.log2(index + 2) : 0),
    0,
  );
  const ideal = Array.from(
    { length: Math.min(relevant.size, records.length || 10) },
    (_, index) => 1 / Math.log2(index + 2),
  ).reduce((sum, value) => sum + value, 0);
  return ideal === 0 ? 0 : dcg / ideal;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`RETRIEVAL_EVALUATION_SCHEMA ${label}`);
  return value;
}

function strings(value: unknown, label: string, optional = false): string[] {
  if (value === undefined && optional) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new Error(`RETRIEVAL_EVALUATION_SCHEMA ${label}`);
  return value as string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
