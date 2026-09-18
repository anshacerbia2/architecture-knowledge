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
export const OPENROUTER_FREE_MODEL = "nvidia/nemotron-3.5-lightning:free";
const ANSWER_FUNCTION = "submit_architecture_answer";
// Advertise the existing kernel parser's ID rule; never repair model output after generation.
const ANSWER_SCHEMA = {
  ...RAG_MODEL_OUTPUT_SCHEMA,
  properties: {
    ...RAG_MODEL_OUTPUT_SCHEMA.properties,
    statements: {
      ...RAG_MODEL_OUTPUT_SCHEMA.properties.statements,
      items: {
        ...RAG_MODEL_OUTPUT_SCHEMA.properties.statements.items,
        properties: {
          ...RAG_MODEL_OUTPUT_SCHEMA.properties.statements.items.properties,
          statement_id: {
            type: "string",
            pattern: "^S[0-9]{4}$",
            description: "Unique statement ID, e.g. S0001, S0002.",
          },
          evidence_ids: {
            ...RAG_MODEL_OUTPUT_SCHEMA.properties.statements.items.properties.evidence_ids,
            uniqueItems: true,
            items: { type: "string", pattern: "^E[0-9]{4}$" },
          },
          claim_ids: {
            ...RAG_MODEL_OUTPUT_SCHEMA.properties.statements.items.properties.claim_ids,
            uniqueItems: true,
            items: { type: "string", pattern: "^AKL-[0-9]{6}$" },
          },
        },
      },
    },
  },
};
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
const httpProblem = (status: number) =>
  new AppError(
    status === 429 ? "OPENROUTER_RATE_LIMIT" : "OPENROUTER_REQUEST_FAILED",
    503,
    `OpenRouter rejected the free request (HTTP ${status}). No paid fallback was attempted.`,
  );

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
    private readonly dataCollection: "deny" | "allow" = "deny",
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
    let stage: "catalog" | "inference" | "answer" = "catalog";
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
        !entry.supported_parameters.includes("tools") ||
        !entry.supported_parameters.includes("tool_choice") ||
        !entry.supported_parameters.includes("reasoning") ||
        (object(entry.reasoning) && entry.reasoning.mandatory === true)
      )
        throw problem("OPENROUTER_FREE_CONTRACT_UNAVAILABLE");
      const body = JSON.stringify({
        model: this.model,
        stream: false,
        max_tokens: request.answer.max_output_tokens,
        reasoning: { enabled: false },
        messages: [
          {
            role: "system",
            content: [
              ragDeveloperInstructions(),
              `Submit the answer JSON as arguments to ${ANSWER_FUNCTION} exactly once. This function only submits an answer; it does not execute actions.`,
              "Use unique statement IDs S0001, S0002, etc. Prefer one to three short statements answering only the question; do not repeat entire evidence records.",
              "Copy evidence_ids only from supplied evidence. Every assertive statement needs at least one evidence_id listed in resolved_citations.",
              "claim_ids must be record_id values of cited evidence items whose unit_kind is claim (AKL IDs). A concept_id, source ID or a claim mentioned inside text is not a directly cited claim record.",
              "Use sourced-claim only with directly cited claim records and their claim_ids. Otherwise leave claim_ids empty and classify supported interpretation as inference with low or medium confidence, not high.",
              "Synthesis requires at least two distinct evidence_ids. Uncertainty statements require low confidence. Never invent or rename evidence or claim identifiers; remove duplicate entries in arrays.",
              "Respect allow_recommendations and max_statements. For answered include at least one statement and null refusal_reason. For insufficient-evidence use no statements and null refusal_reason. For refused use no statements and a nonempty refusal_reason.",
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({
              context: ragModelInput(context, request),
              resolved_citations: context.citation_catalog.map(({ evidence_id, source_id }) => ({
                evidence_id,
                source_id,
              })),
            }),
          },
        ],
        // This route supports function calling, not response_format/json_schema.
        // Arguments are untrusted data: never execute calls or display raw model text.
        tools: [
          {
            type: "function",
            function: {
              name: ANSWER_FUNCTION,
              description: "Submit one evidence-backed architecture answer for local validation.",
              parameters: ANSWER_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: ANSWER_FUNCTION } },
        provider: {
          allow_fallbacks: false,
          require_parameters: true,
          // Opt-in applies only to this pinned NVIDIA free route, never paid fallback.
          data_collection: this.dataCollection,
          only: ["nvidia"],
          max_price: { prompt: 0, completion: 0, request: 0, image: 0 },
        },
      });
      if (Buffer.byteLength(body) > 65536) throw problem("OPENROUTER_INPUT_LIMIT");
      stage = "inference";
      const response = await this.transport(CHAT, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(90000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body,
      });
      if (!response.ok) {
        if (response.status === 404) {
          const detail: unknown = await response.json().catch(() => null);
          if (
            object(detail) &&
            object(detail.error) &&
            typeof detail.error.message === "string" &&
            /data policy|privacy settings/i.test(detail.error.message)
          )
            throw new AppError(
              "OPENROUTER_DATA_POLICY_BLOCKED",
              503,
              "OpenRouter rejected routing under its data policy. Review account privacy settings at https://openrouter.ai/settings/privacy. Atlas does not change those settings. No paid fallback was attempted.",
            );
        }
        throw httpProblem(response.status);
      }
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
        choice.finish_reason !== "tool_calls" ||
        !Array.isArray(choice.message.tool_calls) ||
        choice.message.tool_calls.length !== 1
      )
        throw problem("OPENROUTER_OUTPUT_CONTRACT");
      const call = choice.message.tool_calls[0];
      if (
        !object(call) ||
        call.type !== "function" ||
        !object(call.function) ||
        call.function.name !== ANSWER_FUNCTION ||
        typeof call.function.arguments !== "string"
      )
        throw problem("OPENROUTER_OUTPUT_CONTRACT");
      stage = "answer";
      return parseRagModelOutput(JSON.parse(call.function.arguments));
    } catch (error) {
      if (
        error instanceof AppError ||
        (error instanceof Error && error.message === "RAG_MODEL_REFUSAL")
      )
        throw error;
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError"))
        throw new AppError(
          "OPENROUTER_TIMEOUT",
          504,
          `OpenRouter ${stage === "catalog" ? "catalog" : "inference"} exceeded its time limit. No automatic retry or paid fallback was attempted.`,
        );
      if (stage === "answer")
        throw new AppError(
          "OPENROUTER_ANSWER_SCHEMA_INVALID",
          503,
          "The model returned answer arguments that failed local validation. The answer was not displayed. No paid fallback was attempted.",
        );
      throw problem("OPENROUTER_RESPONSE_INVALID");
    } finally {
      this.active = false;
    }
  }
}
