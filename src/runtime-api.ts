/** Public v1 runtime facade. Consumers must not import kernel implementation files. */
export { loadValidatedGraph, loadCurrentRetrievalArtifacts } from "./retrieval-artifacts.js";
export { buildRetrievalArtifacts } from "./retrieval-units.js";
export { RetrievalDatabase } from "./retrieval-database.js";
export { checkRetrievalCurrent, indexRetrievalGeneration } from "./retrieval-indexer.js";
export {
  DeterministicFakeEmbeddingProvider,
  OpenAIEmbeddingProvider,
} from "./embedding-provider.js";
export { DeterministicFakeRagProvider, OpenAIRagProvider } from "./rag-provider.js";
export {
  developerInstructions as ragDeveloperInstructions,
  modelInput as ragModelInput,
} from "./rag-provider.js";
export { RAG_MODEL_OUTPUT_SCHEMA, parseRagModelOutput } from "./rag-output-contract.js";
export { assertRagClassificationAllowed } from "./rag-classification.js";
export type {
  RagModelProvider,
  RagContextPacket,
  RagRequest,
  RagModelOutput,
} from "./rag-types.js";
export { RetrievalEngine, PostgresRetrievalStore } from "./retrieval-query.js";
export { parseRetrievalRequest } from "./retrieval-query-contract.js";
export { parseRagRequest } from "./rag-request.js";
export { RagEngine } from "./rag-engine.js";
export { createRagCitationAuthority } from "./rag-citation-authority.js";
export type { GraphArtifacts, GraphEdge } from "./graph-types.js";
export type { RetrievalArtifacts } from "./retrieval-types.js";
export { loadDecisionValidationSnapshot } from "./decision-validation-snapshot.js";
export type { DecisionRecommendationValidator } from "./decision-recommendation-validator.js";
