import { isPlainObject } from "./io.js";
import {
  MAX_RAG_QUALIFIER_CHARACTERS,
  MAX_RAG_REFUSAL_REASON_CHARACTERS,
  MAX_RAG_STATEMENT_CHARACTERS,
  MAX_RAG_STATEMENT_QUALIFIERS,
  MAX_RAG_STATEMENT_REFERENCES,
  MAX_RAG_STATEMENTS,
  MAX_RAG_SUMMARY_CHARACTERS,
  MAX_RAG_UNCERTAINTIES,
  MAX_RAG_UNCERTAINTY_CHARACTERS,
} from "./rag-config.js";
import type {
  RagAnswerStatus,
  RagEpistemicType,
  RagModelOutput,
  RagModelStatement,
} from "./rag-types.js";

const STATUSES = new Set<RagAnswerStatus>(["answered", "insufficient-evidence", "refused"]);
const EPISTEMIC_TYPES = new Set<RagEpistemicType>([
  "sourced-claim",
  "synthesis",
  "inference",
  "recommendation",
  "uncertainty",
]);
const CONFIDENCE = new Set(["low", "medium", "high"] as const);

export const RAG_MODEL_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: [...STATUSES] },
    summary: { type: "string" },
    statements: {
      type: "array",
      maxItems: MAX_RAG_STATEMENTS,
      items: {
        type: "object",
        properties: {
          statement_id: { type: "string" },
          text: { type: "string" },
          epistemic_type: { type: "string", enum: [...EPISTEMIC_TYPES] },
          evidence_ids: {
            type: "array",
            maxItems: MAX_RAG_STATEMENT_REFERENCES,
            items: { type: "string" },
          },
          claim_ids: {
            type: "array",
            maxItems: MAX_RAG_STATEMENT_REFERENCES,
            items: { type: "string" },
          },
          conditions: {
            type: "array",
            maxItems: MAX_RAG_STATEMENT_QUALIFIERS,
            items: { type: "string" },
          },
          alternatives: {
            type: "array",
            maxItems: MAX_RAG_STATEMENT_QUALIFIERS,
            items: { type: "string" },
          },
          trade_offs: {
            type: "array",
            maxItems: MAX_RAG_STATEMENT_QUALIFIERS,
            items: { type: "string" },
          },
          confidence: { type: "string", enum: [...CONFIDENCE] },
        },
        required: [
          "statement_id",
          "text",
          "epistemic_type",
          "evidence_ids",
          "claim_ids",
          "conditions",
          "alternatives",
          "trade_offs",
          "confidence",
        ],
        additionalProperties: false,
      },
    },
    uncertainties: {
      type: "array",
      maxItems: MAX_RAG_UNCERTAINTIES,
      items: { type: "string" },
    },
    refusal_reason: { type: ["string", "null"] },
  },
  required: ["status", "summary", "statements", "uncertainties", "refusal_reason"],
  additionalProperties: false,
} as const;

export function parseRagModelOutput(value: unknown): RagModelOutput {
  if (!isPlainObject(value)) fail("output must be an object");
  exactKeys(value, ["status", "summary", "statements", "uncertainties", "refusal_reason"]);
  if (typeof value.status !== "string" || !STATUSES.has(value.status as RagAnswerStatus))
    fail("status is invalid");
  const status = value.status as RagAnswerStatus;
  const summary = text(value.summary, "summary", MAX_RAG_SUMMARY_CHARACTERS, true);
  if (!Array.isArray(value.statements) || value.statements.length > MAX_RAG_STATEMENTS)
    fail(`statements must be an array with at most ${MAX_RAG_STATEMENTS} entries`);
  const statements = value.statements.map((statement, index) => parseStatement(statement, index));
  const ids = statements.map((statement) => statement.statement_id);
  if (new Set(ids).size !== ids.length) fail("statement IDs must be unique");
  const uncertainties = strings(
    value.uncertainties,
    "uncertainties",
    MAX_RAG_UNCERTAINTIES,
    MAX_RAG_UNCERTAINTY_CHARACTERS,
  );
  if (value.refusal_reason !== null && typeof value.refusal_reason !== "string")
    fail("refusal_reason must be a string or null");
  const refusalReason =
    typeof value.refusal_reason === "string" ? value.refusal_reason.trim() : null;
  if (refusalReason && refusalReason.length > MAX_RAG_REFUSAL_REASON_CHARACTERS)
    fail(`refusal_reason exceeds ${MAX_RAG_REFUSAL_REASON_CHARACTERS} characters`);
  if (status === "answered" && statements.length === 0)
    fail("answered output requires at least one statement");
  if (status !== "answered" && statements.length > 0)
    fail(`${status} output must not contain statements`);
  if (status === "refused" && !refusalReason) fail("refused output requires refusal_reason");
  if (status !== "refused" && refusalReason) fail(`${status} output cannot contain refusal_reason`);
  return { status, summary, statements, uncertainties, refusal_reason: refusalReason };
}

function parseStatement(value: unknown, index: number): RagModelStatement {
  if (!isPlainObject(value)) fail(`statements[${index}] must be an object`);
  exactKeys(value, [
    "statement_id",
    "text",
    "epistemic_type",
    "evidence_ids",
    "claim_ids",
    "conditions",
    "alternatives",
    "trade_offs",
    "confidence",
  ]);
  const statementId = text(value.statement_id, `statements[${index}].statement_id`, 5);
  if (!/^S\d{4}$/.test(statementId)) fail(`statements[${index}].statement_id is invalid`);
  if (
    typeof value.epistemic_type !== "string" ||
    !EPISTEMIC_TYPES.has(value.epistemic_type as RagEpistemicType)
  )
    fail(`statements[${index}].epistemic_type is invalid`);
  if (typeof value.confidence !== "string" || !CONFIDENCE.has(value.confidence as never))
    fail(`statements[${index}].confidence is invalid`);
  return {
    statement_id: statementId,
    text: text(value.text, `statements[${index}].text`, MAX_RAG_STATEMENT_CHARACTERS),
    epistemic_type: value.epistemic_type as RagEpistemicType,
    evidence_ids: strings(
      value.evidence_ids,
      `statements[${index}].evidence_ids`,
      MAX_RAG_STATEMENT_REFERENCES,
      20,
    ),
    claim_ids: strings(
      value.claim_ids,
      `statements[${index}].claim_ids`,
      MAX_RAG_STATEMENT_REFERENCES,
      20,
    ),
    conditions: strings(
      value.conditions,
      `statements[${index}].conditions`,
      MAX_RAG_STATEMENT_QUALIFIERS,
      MAX_RAG_QUALIFIER_CHARACTERS,
    ),
    alternatives: strings(
      value.alternatives,
      `statements[${index}].alternatives`,
      MAX_RAG_STATEMENT_QUALIFIERS,
      MAX_RAG_QUALIFIER_CHARACTERS,
    ),
    trade_offs: strings(
      value.trade_offs,
      `statements[${index}].trade_offs`,
      MAX_RAG_STATEMENT_QUALIFIERS,
      MAX_RAG_QUALIFIER_CHARACTERS,
    ),
    confidence: value.confidence as RagModelStatement["confidence"],
  };
}

function exactKeys(value: Record<string, unknown>, expected: string[]): void {
  const expectedSet = new Set(expected);
  const unknown = Object.keys(value)
    .filter((key) => !expectedSet.has(key))
    .sort();
  const missing = expected.filter((key) => !(key in value));
  if (unknown.length > 0) fail(`unsupported field '${unknown[0]}'`);
  if (missing.length > 0) fail(`missing field '${missing[0]}'`);
}

function strings(
  value: unknown,
  label: string,
  maximumItems: number,
  maximumLength: number,
): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    fail(`${label} must be a string array`);
  const normalized = value.map((item) => item.trim());
  if (normalized.length > maximumItems) fail(`${label} exceeds ${maximumItems} entries`);
  if (normalized.some((item) => !item)) fail(`${label} must not contain empty strings`);
  if (normalized.some((item) => item.length > maximumLength))
    fail(`${label} entries exceed ${maximumLength} characters`);
  if (new Set(normalized).size !== normalized.length) fail(`${label} must not contain duplicates`);
  return normalized;
}

function text(value: unknown, label: string, maximum: number, allowEmpty = false): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  const normalized = value.trim();
  if (!allowEmpty && !normalized) fail(`${label} must not be empty`);
  if (normalized.length > maximum) fail(`${label} exceeds ${maximum} characters`);
  return normalized;
}

function fail(message: string): never {
  throw new Error(`RAG_MODEL_OUTPUT_INVALID ${message}`);
}
