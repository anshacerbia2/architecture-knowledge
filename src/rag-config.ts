export const MAX_RAG_QUESTION_CHARACTERS = 4000;
export const MAX_RAG_CONTEXT_ITEMS = 20;
export const MAX_RAG_CONTEXT_TOKENS = 12_000;
export const DEFAULT_RAG_MAX_STATEMENTS = 8;
export const MAX_RAG_STATEMENTS = 20;
export const DEFAULT_RAG_MAX_OUTPUT_TOKENS = 1800;
export const MIN_RAG_OUTPUT_TOKENS = 256;
export const MAX_RAG_OUTPUT_TOKENS = 4096;
export const RAG_PROVIDER_TIMEOUT_MS = 45_000;
export const RAG_PROVIDER_MAX_RETRIES = 2;

export const PRODUCTION_RAG_MODEL = {
  provider: "openai",
  model: "gpt-5.6",
} as const;
