import {
  assertRagClassificationAllowed,
  RAG_MODEL_OUTPUT_SCHEMA,
  parseRagModelOutput,
  ragDeveloperInstructions,
  ragModelInput,
  type RagModelProvider,
  type RagContextPacket,
  type RagRequest,
} from "architecture-knowledge-system/runtime";
import type { AiCredentialPort } from "../../application/src/ai-credential-port.js";
import { AppError } from "../../application/src/errors.js";

// Fixed zero-price route verified against the public model catalog on 2026-09-17.
export const OPENROUTER_FREE_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const CATALOG = "https://openrouter.ai/api/v1/models";
const CHAT = "https://openrouter.ai/api/v1/chat/completions";
const problem = (code: string) =>
  new AppError(
    code,
    503,
    "OpenRouter free route is unavailable or rejected its contract. No paid fallback was attempted.",
  );
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export class OpenRouterFreeProvider implements RagModelProvider {
  readonly provider = "openrouter";
  readonly model = OPENROUTER_FREE_MODEL;
  readonly allowedDataClassifications = ["public"] as const;
  private active = false;
  private attempts = 0;
  private nextAttempt = 0;
  constructor(
    private readonly credential: AiCredentialPort,
    private readonly transport: typeof fetch = fetch,
  ) {}

  async generate(context: RagContextPacket, request: RagRequest) {
    assertRagClassificationAllowed(context, request, this.allowedDataClassifications);
    const apiKey = this.credential.apiKey();
    if (this.active || Date.now() < this.nextAttempt || this.attempts >= 20)
      throw problem("OPENROUTER_LOCAL_RATE_LIMIT");
    if (
      !Number.isInteger(request.answer.max_output_tokens) ||
      request.answer.max_output_tokens < 256 ||
      request.answer.max_output_tokens > 4096
    )
      throw problem("OPENROUTER_OUTPUT_LIMIT");
    this.active = true;
    this.nextAttempt = Date.now() + 3000;
    this.attempts++;
    try {
      // Revalidate each attempt: free availability/prices may change. No key or query sent here.
      const catalogResponse = await this.transport(CATALOG, {
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      if (!catalogResponse.ok) throw problem("OPENROUTER_CATALOG_UNAVAILABLE");
      const catalog: unknown = await catalogResponse.json();
      const entry =
        object(catalog) && Array.isArray(catalog.data)
          ? catalog.data.find((v: unknown) => object(v) && v.id === this.model)
          : undefined;
      if (
        !object(entry) ||
        !object(entry.pricing) ||
        entry.pricing.prompt !== "0" ||
        entry.pricing.completion !== "0" ||
        Object.entries(entry.pricing).some(
          ([k, v]) => k !== "discount" && (typeof v !== "string" || Number(v) !== 0),
        ) ||
        !Array.isArray(entry.supported_parameters) ||
        !entry.supported_parameters.includes("structured_outputs")
      )
        throw problem("OPENROUTER_FREE_CONTRACT_UNAVAILABLE");
      const body = JSON.stringify({
        model: this.model,
        stream: false,
        max_tokens: request.answer.max_output_tokens,
        messages: [
          { role: "system", content: ragDeveloperInstructions() },
          { role: "user", content: JSON.stringify(ragModelInput(context, request)) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "architecture_rag_answer",
            strict: true,
            schema: RAG_MODEL_OUTPUT_SCHEMA,
          },
        },
        provider: {
          allow_fallbacks: false,
          require_parameters: true,
          data_collection: "deny",
          max_price: { prompt: 0, completion: 0, request: 0, image: 0 },
        },
      });
      if (Buffer.byteLength(body) > 65536) throw problem("OPENROUTER_INPUT_LIMIT");
      const response = await this.transport(CHAT, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(45000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body,
      });
      if (!response.ok)
        throw problem(
          response.status === 429 ? "OPENROUTER_RATE_LIMIT" : "OPENROUTER_REQUEST_FAILED",
        );
      const result: unknown = await response.json();
      if (
        !object(result) ||
        result.model !== this.model ||
        !Array.isArray(result.choices) ||
        result.choices.length !== 1
      )
        throw problem("OPENROUTER_OUTPUT_CONTRACT");
      if (object(result.usage) && result.usage.cost !== undefined && result.usage.cost !== 0)
        throw problem("OPENROUTER_NONZERO_COST_REPORTED");
      const choice = result.choices[0];
      if (!object(choice) || !object(choice.message)) throw problem("OPENROUTER_OUTPUT_CONTRACT");
      if (choice.message.refusal) throw new Error("RAG_MODEL_REFUSAL");
      if (
        choice.finish_reason !== "stop" ||
        typeof choice.message.content !== "string" ||
        choice.message.tool_calls
      )
        throw problem("OPENROUTER_OUTPUT_CONTRACT");
      return parseRagModelOutput(JSON.parse(choice.message.content));
    } catch (error) {
      if (
        error instanceof AppError ||
        (error instanceof Error && error.message === "RAG_MODEL_REFUSAL")
      )
        throw error;
      throw problem("OPENROUTER_RESPONSE_INVALID");
    } finally {
      this.active = false;
    }
  }
}
