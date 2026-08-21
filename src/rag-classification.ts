import {
  RAG_DATA_CLASSIFICATIONS,
  type RagContextPacket,
  type RagDataClassification,
  type RagRequest,
} from "./rag-types.js";

const CLASSIFICATIONS = new Set<string>(RAG_DATA_CLASSIFICATIONS);

export function parseRagDataClassification(
  value: unknown,
  code = "RAG_REQUEST_SHAPE",
): RagDataClassification {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${code} data_classification is required`);
  const normalized = value.trim();
  if (!CLASSIFICATIONS.has(normalized))
    throw new Error(`${code} data_classification '${normalized}' is unknown`);
  return normalized as RagDataClassification;
}

export function parseAllowedRagClassifications(values: readonly string[]): RagDataClassification[] {
  if (values.length === 0) throw new Error("RAG_MODEL_CONFIG_INVALID classifications empty");
  return [...new Set(values.map((value) => parseRagDataClassification(value, "RAG_MODEL_CONFIG")))];
}

export function assertRagClassificationAllowed(
  context: RagContextPacket,
  request: RagRequest,
  allowed: readonly RagDataClassification[],
): void {
  const requested = parseRagDataClassification(
    (request as Partial<RagRequest>).data_classification,
    "RAG_DATA_CLASSIFICATION",
  );
  const contextual = parseRagDataClassification(
    (context as Partial<RagContextPacket>).data_classification,
    "RAG_DATA_CLASSIFICATION",
  );
  if (requested !== contextual)
    throw new Error(`RAG_DATA_CLASSIFICATION_MISMATCH '${requested}' '${contextual}'`);
  if (!allowed.includes(requested))
    throw new Error(`RAG_DATA_CLASSIFICATION_DENIED '${requested}'`);
}
