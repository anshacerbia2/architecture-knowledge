import { createHash } from "node:crypto";

import type { EmbeddingContract } from "./retrieval-types.js";

export const RETRIEVAL_NORMALIZATION_VERSION = "retrieval-normalization-v1";
export const RETRIEVAL_CHUNKING_VERSION = "semantic-sections-v1-max-1200-estimated-tokens";
export const RETRIEVAL_TOOL_VERSION = "m5-retrieval-v1";
export const MAX_SEMANTIC_UNIT_TOKENS = 1200;
export const MAX_QUERY_CHARACTERS = 4096;
export const MAX_TOP_K = 50;
export const MAX_CANDIDATE_K = 200;
export const MAX_GRAPH_DEPTH = 2;
export const DEFAULT_GRAPH_DEPTH = 1;
export const RRF_K = 60;
export const LEXICAL_RRF_WEIGHT = 1;
export const VECTOR_RRF_WEIGHT = 1;
export const EXACT_ID_BOOST = 0.08;
export const EXACT_TITLE_OR_KEY_BOOST = 0.04;
export const GRAPH_DISTANCE_PENALTY = 0.008;
export const MIN_VECTOR_SIMILARITY = 0.15;

export const PRODUCTION_EMBEDDING = embeddingContract("openai", "text-embedding-3-small", 1536);

export function embeddingContract(
  provider: string,
  model: string,
  dimension: number,
): EmbeddingContract {
  const payload = `${provider}\n${model}\n${dimension}\ncosine\nembedding-contract-v1`;
  return {
    provider,
    model,
    dimension,
    distance_metric: "cosine",
    contract_fingerprint: `sha256:${createHash("sha256").update(payload).digest("hex")}`,
  };
}
