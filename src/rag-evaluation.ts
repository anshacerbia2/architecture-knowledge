import { readFile } from "node:fs/promises";

import YAML from "yaml";

import { parseRagRequest } from "./rag-request.js";
import type { RagAnswerPacket } from "./rag-types.js";

export interface RagGoldenCase {
  id: string;
  category: string;
  question: string;
  expected_claim_ids: string[];
  no_answer: boolean;
  holdout: boolean;
  filters: Record<string, unknown>;
}

export interface RagEvaluationReport {
  benchmark_version: number;
  benchmark_status: string;
  case_count: number;
  metrics: {
    answer_status_accuracy: number;
    expected_claim_recall: number;
    citation_completeness: number;
    citation_resolvability: number;
    epistemic_label_completeness: number;
    unsupported_statement_count: number;
    prohibited_output_count: number;
  };
  gates: { passed: boolean; failures: string[] };
  evidence_class: string;
}

export async function loadRagGolden(
  file: string,
): Promise<{ version: number; status: string; cases: RagGoldenCase[] }> {
  const raw = YAML.parse(await readFile(file, "utf8")) as unknown;
  if (!isObject(raw) || raw.version !== 1 || raw.status !== "draft" || !Array.isArray(raw.cases))
    throw new Error("RAG_EVALUATION_SCHEMA benchmark envelope");
  const cases = raw.cases.map((value, index) => parseCase(value, index));
  if (cases.length < 12) throw new Error("RAG_EVALUATION_SCHEMA at least 12 cases required");
  if (new Set(cases.map((item) => item.id)).size !== cases.length)
    throw new Error("RAG_EVALUATION_SCHEMA duplicate case ID");
  return { version: raw.version, status: raw.status, cases };
}

export async function evaluateRag(
  benchmark: { version: number; status: string; cases: RagGoldenCase[] },
  run: (request: ReturnType<typeof parseRagRequest>) => Promise<RagAnswerPacket>,
): Promise<RagEvaluationReport> {
  const observations: Observation[] = [];
  for (const item of benchmark.cases) {
    const request = parseRagRequest({
      question: item.question,
      project_context: {},
      retrieval: {
        mode: "hybrid-graph",
        top_k: 12,
        candidate_k: 60,
        filters: { ...item.filters, unit_kinds: ["claim"] },
        graph: { enabled: true, max_depth: 1, predicates: [] },
        budget: { max_units: 12, max_estimated_tokens: 6000, max_units_per_concept: 4 },
        explain: true,
      },
      answer: { allow_recommendations: false, max_statements: 8, max_output_tokens: 1800 },
    });
    observations.push(observe(item, await run(request)));
  }
  const answerStatusAccuracy = mean(observations.map((item) => Number(item.statusCorrect)));
  const expectedClaimRecall = mean(
    observations.filter((item) => item.expectedClaims > 0).map((item) => item.claimRecall),
  );
  const citationCompleteness = mean(observations.map((item) => Number(item.citationComplete)));
  const citationResolvability = mean(observations.map((item) => Number(item.citationResolvable)));
  const epistemicLabelCompleteness = mean(
    observations.map((item) => Number(item.epistemicComplete)),
  );
  const unsupported = observations.reduce((sum, item) => sum + item.unsupported, 0);
  const prohibited = observations.reduce((sum, item) => sum + item.prohibited, 0);
  const metrics = {
    answer_status_accuracy: answerStatusAccuracy,
    expected_claim_recall: expectedClaimRecall,
    citation_completeness: citationCompleteness,
    citation_resolvability: citationResolvability,
    epistemic_label_completeness: epistemicLabelCompleteness,
    unsupported_statement_count: unsupported,
    prohibited_output_count: prohibited,
  };
  const failures: string[] = [];
  if (answerStatusAccuracy !== 1) failures.push("answer-status-accuracy");
  if (expectedClaimRecall < 0.8) failures.push("expected-claim-recall");
  if (citationCompleteness !== 1) failures.push("citation-completeness");
  if (citationResolvability !== 1) failures.push("citation-resolvability");
  if (epistemicLabelCompleteness !== 1) failures.push("epistemic-label-completeness");
  if (unsupported !== 0) failures.push("unsupported-statements");
  if (prohibited !== 0) failures.push("prohibited-output");
  return {
    benchmark_version: benchmark.version,
    benchmark_status: benchmark.status,
    case_count: benchmark.cases.length,
    metrics,
    gates: { passed: failures.length === 0, failures },
    evidence_class:
      "deterministic-provider functional RAG benchmark; not real-provider semantic-quality evidence",
  };
}

interface Observation {
  statusCorrect: boolean;
  expectedClaims: number;
  claimRecall: number;
  citationComplete: boolean;
  citationResolvable: boolean;
  epistemicComplete: boolean;
  unsupported: number;
  prohibited: number;
}

function observe(item: RagGoldenCase, packet: RagAnswerPacket): Observation {
  const statements = packet.statements;
  const actualClaims = new Set(statements.flatMap((statement) => statement.claim_ids));
  const expected = new Set(item.expected_claim_ids);
  const claimRecall =
    expected.size === 0
      ? 1
      : [...expected].filter((claim) => actualClaims.has(claim)).length / expected.size;
  const assertive = statements.filter((statement) => statement.epistemic_type !== "uncertainty");
  const statusCorrect = item.no_answer
    ? packet.status === "insufficient-evidence"
    : packet.status === "answered";
  return {
    statusCorrect,
    expectedClaims: expected.size,
    claimRecall,
    citationComplete: assertive.every((statement) => statement.citations.length > 0),
    citationResolvable: statements.every((statement) =>
      statement.citations.every(
        (citation) =>
          Boolean(citation.source_id && citation.title && citation.url) &&
          /^C\d{4}$/.test(citation.citation_id),
      ),
    ),
    epistemicComplete: statements.every((statement) => Boolean(statement.epistemic_type)),
    unsupported: assertive.filter((statement) => statement.evidence_ids.length === 0).length,
    prohibited: item.no_answer ? statements.length : 0,
  };
}

function parseCase(value: unknown, index: number): RagGoldenCase {
  if (!isObject(value)) throw new Error(`RAG_EVALUATION_SCHEMA case ${index}`);
  const id = required(value.id, `case ${index} id`);
  const claims = strings(value.expected_claim_ids, `${id} expected_claim_ids`);
  const noAnswer = value.no_answer === true;
  if (!noAnswer && claims.length === 0)
    throw new Error(`RAG_EVALUATION_SCHEMA ${id} needs expected claims`);
  if (value.filters !== undefined && !isObject(value.filters))
    throw new Error(`RAG_EVALUATION_SCHEMA ${id} filters`);
  return {
    id,
    category: required(value.category, `${id} category`),
    question: required(value.question, `${id} question`),
    expected_claim_ids: claims,
    no_answer: noAnswer,
    holdout: value.holdout === true,
    filters: isObject(value.filters) ? value.filters : {},
  };
}

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`RAG_EVALUATION_SCHEMA ${label}`);
  return value;
}

function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new Error(`RAG_EVALUATION_SCHEMA ${label}`);
  return value as string[];
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
