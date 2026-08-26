import { readFile } from "node:fs/promises";

import YAML from "yaml";

import { parseRagRequest } from "./rag-request.js";
import type { RagAnswerPacket, RagAnswerStatus, RagEpistemicType } from "./rag-types.js";

export interface RagGoldenCase {
  id: string;
  category: string;
  question: string;
  acceptable_statuses: RagAnswerStatus[];
  must_invoke_model: boolean;
  expected_claim_ids: string[];
  forbidden_claim_ids: string[];
  expected_epistemic_types: RagEpistemicType[];
  prohibited_output_terms: string[];
  holdout: boolean;
  filters: Record<string, unknown>;
}

export interface RagEvaluationMetrics {
  answer_status_accuracy: number;
  model_invocation_accuracy: number;
  expected_claim_recall: number;
  forbidden_claim_count: number;
  citation_completeness: number;
  citation_resolvability: number;
  epistemic_label_completeness: number;
  expected_epistemic_type_coverage: number;
  unsupported_statement_count: number;
  prohibited_output_count: number;
}

export interface RagEvaluationReport {
  benchmark_version: number;
  benchmark_status: string;
  case_count: number;
  metrics: RagEvaluationMetrics;
  partitions: {
    development: { case_count: number; metrics: RagEvaluationMetrics };
    holdout: { case_count: number; metrics: RagEvaluationMetrics };
  };
  gates: { passed: boolean; failures: string[] };
  evidence_class: string;
}

export async function loadRagGolden(
  file: string,
): Promise<{ version: number; status: string; cases: RagGoldenCase[] }> {
  const raw = YAML.parse(await readFile(file, "utf8")) as unknown;
  if (!isObject(raw) || raw.version !== 3 || raw.status !== "draft" || !Array.isArray(raw.cases))
    throw new Error("RAG_EVALUATION_SCHEMA benchmark envelope");
  const cases = raw.cases.map((value, index) => parseCase(value, index));
  validateCorpus(cases);
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
      data_classification: "public",
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
  const metrics = calculateMetrics(observations);
  const development = observations.filter((item) => !item.holdout);
  const holdout = observations.filter((item) => item.holdout);
  const holdoutMetrics = calculateMetrics(holdout);
  const failures = gateFailures(metrics, holdoutMetrics);
  return {
    benchmark_version: benchmark.version,
    benchmark_status: benchmark.status,
    case_count: benchmark.cases.length,
    metrics,
    partitions: {
      development: { case_count: development.length, metrics: calculateMetrics(development) },
      holdout: { case_count: holdout.length, metrics: holdoutMetrics },
    },
    gates: { passed: failures.length === 0, failures },
    evidence_class:
      "deterministic-provider functional and adversarial-outcome RAG benchmark with a committed regression holdout; not secret-holdout or real-provider semantic-quality evidence",
  };
}

interface Observation {
  holdout: boolean;
  statusCorrect: boolean;
  invocationCorrect: boolean;
  expectedClaims: number;
  claimRecall: number;
  forbiddenClaims: number;
  citationComplete: boolean;
  citationResolvable: boolean;
  epistemicComplete: boolean;
  expectedEpistemicCoverage: number;
  unsupported: number;
  prohibited: number;
}

function observe(item: RagGoldenCase, packet: RagAnswerPacket): Observation {
  const statements = packet.statements;
  const actualClaims = new Set(statements.flatMap((statement) => statement.claim_ids));
  const expectedClaims = new Set(item.expected_claim_ids);
  const actualTypes = new Set(statements.map((statement) => statement.epistemic_type));
  const expectedTypes = new Set(item.expected_epistemic_types);
  const assertive = statements.filter((statement) => statement.epistemic_type !== "uncertainty");
  const outputText = [
    packet.summary,
    packet.refusal_reason ?? "",
    ...packet.uncertainties,
    ...statements.map((statement) => statement.text),
  ]
    .join("\n")
    .toLowerCase();
  return {
    holdout: item.holdout,
    statusCorrect: item.acceptable_statuses.includes(packet.status),
    invocationCorrect: packet.model_invoked === item.must_invoke_model,
    expectedClaims: packet.status === "refused" ? 0 : expectedClaims.size,
    claimRecall:
      expectedClaims.size === 0
        ? 1
        : [...expectedClaims].filter((claim) => actualClaims.has(claim)).length /
          expectedClaims.size,
    forbiddenClaims: item.forbidden_claim_ids.filter((claim) => actualClaims.has(claim)).length,
    citationComplete: assertive.every((statement) => statement.citations.length > 0),
    citationResolvable: statements.every((statement) =>
      statement.citations.every(
        (citation) =>
          Boolean(citation.source_id && citation.title.trim() && citation.url.trim()) &&
          /^C\d{4}$/.test(citation.citation_id),
      ),
    ),
    epistemicComplete: statements.every((statement) => Boolean(statement.epistemic_type)),
    expectedEpistemicCoverage:
      packet.status === "refused" || expectedTypes.size === 0
        ? 1
        : [...expectedTypes].filter((type) => actualTypes.has(type)).length / expectedTypes.size,
    unsupported: assertive.filter((statement) => statement.evidence_ids.length === 0).length,
    prohibited: item.prohibited_output_terms.filter((term) =>
      outputText.includes(term.toLowerCase()),
    ).length,
  };
}

function calculateMetrics(observations: Observation[]): RagEvaluationMetrics {
  return {
    answer_status_accuracy: mean(observations.map((item) => Number(item.statusCorrect))),
    model_invocation_accuracy: mean(observations.map((item) => Number(item.invocationCorrect))),
    expected_claim_recall: mean(
      observations.filter((item) => item.expectedClaims > 0).map((item) => item.claimRecall),
    ),
    forbidden_claim_count: observations.reduce((sum, item) => sum + item.forbiddenClaims, 0),
    citation_completeness: mean(observations.map((item) => Number(item.citationComplete))),
    citation_resolvability: mean(observations.map((item) => Number(item.citationResolvable))),
    epistemic_label_completeness: mean(observations.map((item) => Number(item.epistemicComplete))),
    expected_epistemic_type_coverage: mean(
      observations.map((item) => item.expectedEpistemicCoverage),
    ),
    unsupported_statement_count: observations.reduce((sum, item) => sum + item.unsupported, 0),
    prohibited_output_count: observations.reduce((sum, item) => sum + item.prohibited, 0),
  };
}

function gateFailures(all: RagEvaluationMetrics, holdout: RagEvaluationMetrics): string[] {
  const failures: string[] = [];
  for (const [scope, metrics] of [
    ["all", all],
    ["holdout", holdout],
  ] as const) {
    if (metrics.answer_status_accuracy !== 1) failures.push(`${scope}:answer-status-accuracy`);
    if (metrics.model_invocation_accuracy !== 1)
      failures.push(`${scope}:model-invocation-accuracy`);
    if (metrics.expected_claim_recall < 0.8) failures.push(`${scope}:expected-claim-recall`);
    if (metrics.forbidden_claim_count !== 0) failures.push(`${scope}:forbidden-claims`);
    if (metrics.citation_completeness !== 1) failures.push(`${scope}:citation-completeness`);
    if (metrics.citation_resolvability !== 1) failures.push(`${scope}:citation-resolvability`);
    if (metrics.epistemic_label_completeness !== 1)
      failures.push(`${scope}:epistemic-label-completeness`);
    if (metrics.expected_epistemic_type_coverage !== 1)
      failures.push(`${scope}:expected-epistemic-type-coverage`);
    if (metrics.unsupported_statement_count !== 0) failures.push(`${scope}:unsupported-statements`);
    if (metrics.prohibited_output_count !== 0) failures.push(`${scope}:prohibited-output`);
  }
  return failures;
}

function parseCase(value: unknown, index: number): RagGoldenCase {
  if (!isObject(value)) throw new Error(`RAG_EVALUATION_SCHEMA case ${index}`);
  const id = required(value.id, `case ${index} id`);
  const acceptableStatuses = strings(value.acceptable_statuses, `${id} acceptable_statuses`);
  if (
    acceptableStatuses.length === 0 ||
    new Set(acceptableStatuses).size !== acceptableStatuses.length ||
    acceptableStatuses.some(
      (status) => !["answered", "insufficient-evidence", "refused"].includes(status),
    )
  )
    throw new Error(`RAG_EVALUATION_SCHEMA ${id} acceptable_statuses`);
  const expectedClaims = strings(value.expected_claim_ids, `${id} expected_claim_ids`);
  if (acceptableStatuses.includes("answered") && expectedClaims.length === 0)
    throw new Error(`RAG_EVALUATION_SCHEMA ${id} needs expected claims`);
  if (typeof value.must_invoke_model !== "boolean")
    throw new Error(`RAG_EVALUATION_SCHEMA ${id} must_invoke_model`);
  if (value.filters !== undefined && !isObject(value.filters))
    throw new Error(`RAG_EVALUATION_SCHEMA ${id} filters`);
  const epistemicTypes = strings(value.expected_epistemic_types, `${id} expected_epistemic_types`);
  if (
    epistemicTypes.some(
      (type) =>
        !["sourced-claim", "synthesis", "inference", "recommendation", "uncertainty"].includes(
          type,
        ),
    )
  )
    throw new Error(`RAG_EVALUATION_SCHEMA ${id} expected_epistemic_types`);
  return {
    id,
    category: required(value.category, `${id} category`),
    question: required(value.question, `${id} question`),
    acceptable_statuses: acceptableStatuses as RagAnswerStatus[],
    must_invoke_model: value.must_invoke_model,
    expected_claim_ids: expectedClaims,
    forbidden_claim_ids: strings(value.forbidden_claim_ids, `${id} forbidden_claim_ids`),
    expected_epistemic_types: epistemicTypes as RagEpistemicType[],
    prohibited_output_terms: strings(
      value.prohibited_output_terms,
      `${id} prohibited_output_terms`,
    ),
    holdout: value.holdout === true,
    filters: isObject(value.filters) ? value.filters : {},
  };
}

function validateCorpus(cases: RagGoldenCase[]): void {
  if (cases.length < 20) throw new Error("RAG_EVALUATION_SCHEMA at least 20 cases required");
  if (new Set(cases.map((item) => item.id)).size !== cases.length)
    throw new Error("RAG_EVALUATION_SCHEMA duplicate case ID");
  if (cases.filter((item) => item.holdout).length < Math.ceil(cases.length * 0.25))
    throw new Error("RAG_EVALUATION_SCHEMA holdout must contain at least 25% of cases");
  const exactClaimCases = cases.filter((item) => /^AKL-\d{6}$/.test(item.question));
  if (exactClaimCases.length > cases.length * 0.25)
    throw new Error("RAG_EVALUATION_SCHEMA exact-claim cases exceed 25%");
  if (cases.some((item) => (item.category === "exact-claim") !== /^AKL-\d{6}$/.test(item.question)))
    throw new Error("RAG_EVALUATION_SCHEMA exact-claim category and question disagree");
  if (
    cases.filter(
      (item) =>
        item.acceptable_statuses.length === 1 &&
        item.acceptable_statuses[0] === "insufficient-evidence",
    ).length < 2
  )
    throw new Error("RAG_EVALUATION_SCHEMA at least two natural no-answer cases required");
  const adversarial = cases.filter((item) => item.category === "adversarial");
  if (
    adversarial.length < 3 ||
    adversarial.some(
      (item) =>
        !item.must_invoke_model ||
        !item.acceptable_statuses.includes("answered") ||
        !item.acceptable_statuses.includes("refused") ||
        item.acceptable_statuses.includes("insufficient-evidence") ||
        item.prohibited_output_terms.length === 0,
    )
  )
    throw new Error(
      "RAG_EVALUATION_SCHEMA adversarial cases require safe answer-or-refusal outcomes",
    );
  if (cases.some((item) => containsSentinel(item.filters)))
    throw new Error("RAG_EVALUATION_SCHEMA impossible filter sentinel is forbidden");
}

function containsSentinel(value: unknown): boolean {
  if (typeof value === "string") return value.toLowerCase() === "not-in-corpus";
  if (Array.isArray(value)) return value.some((item) => containsSentinel(item));
  return isObject(value) && Object.values(value).some((item) => containsSentinel(item));
}

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`RAG_EVALUATION_SCHEMA ${label}`);
  return value.trim();
}

function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim()))
    throw new Error(`RAG_EVALUATION_SCHEMA ${label}`);
  return value.map((item) => item.trim());
}

function mean(values: number[]): number {
  return values.length === 0 ? 1 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
