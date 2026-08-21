import { isPlainObject } from "./io.js";
import {
  DEFAULT_RAG_MAX_OUTPUT_TOKENS,
  DEFAULT_RAG_MAX_STATEMENTS,
  MAX_RAG_OUTPUT_TOKENS,
  MAX_RAG_QUESTION_CHARACTERS,
  MAX_RAG_STATEMENTS,
  MIN_RAG_OUTPUT_TOKENS,
} from "./rag-config.js";
import type { RagProjectContext, RagRequest } from "./rag-types.js";
import { parseRagDataClassification } from "./rag-classification.js";
import { parseRetrievalRequest } from "./retrieval-query-contract.js";

const TOP_LEVEL = new Set([
  "question",
  "data_classification",
  "project_context",
  "retrieval",
  "answer",
]);
const PROJECT_CONTEXT = new Set(["system_description", "constraints", "quality_priorities"]);
const ANSWER = new Set(["allow_recommendations", "max_statements", "max_output_tokens"]);

export function parseRagRequest(input: unknown): RagRequest {
  if (!isPlainObject(input)) fail("request must be an object");
  rejectUnknown(input, TOP_LEVEL, "request");
  const question = requiredText(input.question, "question", MAX_RAG_QUESTION_CHARACTERS);
  const dataClassification = parseRagDataClassification(input.data_classification);
  const projectContext = parseProjectContext(input.project_context);
  const answer = parseAnswer(input.answer);
  if (
    answer.allow_recommendations &&
    !projectContext.system_description &&
    projectContext.constraints.length === 0 &&
    projectContext.quality_priorities.length === 0
  ) {
    fail("recommendations require project context, constraints, or quality priorities");
  }
  const retrievalInput = input.retrieval;
  if (retrievalInput !== undefined && !isPlainObject(retrievalInput))
    fail("retrieval must be an object");
  if (isPlainObject(retrievalInput) && "text" in retrievalInput)
    fail("retrieval.text is derived from question and cannot be overridden");
  const retrieval = parseRetrievalRequest({
    text: question,
    mode: "hybrid-graph",
    top_k: 12,
    candidate_k: 40,
    graph: { enabled: true, max_depth: 1, predicates: [] },
    budget: { max_units: 12, max_estimated_tokens: 6000, max_units_per_concept: 3 },
    explain: true,
    allow_degraded_lexical_fallback: false,
    ...(retrievalInput ?? {}),
  });
  return {
    question,
    data_classification: dataClassification,
    project_context: projectContext,
    retrieval,
    answer,
  };
}

function parseProjectContext(value: unknown): RagProjectContext {
  if (value === undefined)
    return { system_description: null, constraints: [], quality_priorities: [] };
  if (!isPlainObject(value)) fail("project_context must be an object");
  rejectUnknown(value, PROJECT_CONTEXT, "project_context");
  const description = value.system_description;
  if (description !== undefined && description !== null && typeof description !== "string")
    fail("project_context.system_description must be a string or null");
  const normalized = typeof description === "string" ? description.trim() : "";
  if (normalized.length > 2000) fail("project_context.system_description exceeds 2000 characters");
  return {
    system_description: normalized || null,
    constraints: boundedStrings(value.constraints, "project_context.constraints"),
    quality_priorities: boundedStrings(
      value.quality_priorities,
      "project_context.quality_priorities",
    ),
  };
}

function parseAnswer(value: unknown): RagRequest["answer"] {
  if (value !== undefined && !isPlainObject(value)) fail("answer must be an object");
  const object = isPlainObject(value) ? value : {};
  rejectUnknown(object, ANSWER, "answer");
  return {
    allow_recommendations: optionalBoolean(
      object.allow_recommendations,
      false,
      "answer.allow_recommendations",
    ),
    max_statements: integer(
      object.max_statements ?? DEFAULT_RAG_MAX_STATEMENTS,
      1,
      MAX_RAG_STATEMENTS,
      "answer.max_statements",
    ),
    max_output_tokens: integer(
      object.max_output_tokens ?? DEFAULT_RAG_MAX_OUTPUT_TOKENS,
      MIN_RAG_OUTPUT_TOKENS,
      MAX_RAG_OUTPUT_TOKENS,
      "answer.max_output_tokens",
    ),
  };
}

function boundedStrings(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    fail(`${label} must be a string array`);
  const items = [...new Set(value.map((item) => item.trim()).filter(Boolean))].sort();
  if (items.length > 20) fail(`${label} exceeds 20 entries`);
  if (items.some((item) => item.length > 500)) fail(`${label} entries exceed 500 characters`);
  return items;
}

function rejectUnknown(
  object: Record<string, unknown>,
  permitted: ReadonlySet<string>,
  label: string,
): void {
  const unknown = Object.keys(object)
    .filter((key) => !permitted.has(key))
    .sort();
  if (unknown.length > 0) fail(`${label} has unsupported field '${unknown[0]}'`);
}

function requiredText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  const normalized = value.trim();
  if (!normalized) fail(`${label} must not be empty`);
  if (normalized.length > maximum) fail(`${label} exceeds ${maximum} characters`);
  return normalized;
}

function optionalBoolean(value: unknown, fallback: boolean, label: string): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") fail(`${label} must be a boolean`);
  return value;
}

function integer(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum)
    fail(`${label} must be an integer from ${minimum} to ${maximum}`);
  return Number(value);
}

function fail(message: string): never {
  throw new Error(`RAG_REQUEST_SHAPE ${message}`);
}
