import { createHash } from "node:crypto";

import { embeddingContract, PRODUCTION_EMBEDDING } from "./retrieval-config.js";
import type { EmbeddingProvider } from "./retrieval-types.js";

export interface OpenAIEmbeddingOptions {
  apiKey: string;
  baseUrl?: string;
  batchSize?: number;
  concurrency?: number;
  timeoutMs?: number;
  maxAttempts?: number;
  allowedDataClassifications?: readonly string[];
  fetchImplementation?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  random?: () => number;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly provider = PRODUCTION_EMBEDDING.provider;
  readonly model = PRODUCTION_EMBEDDING.model;
  readonly dimension = PRODUCTION_EMBEDDING.dimension;
  readonly contractFingerprint = PRODUCTION_EMBEDDING.contract_fingerprint;
  readonly allowedDataClassifications: readonly string[];
  private readonly baseUrl: string;
  private readonly batchSize: number;
  private readonly concurrency: number;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly fetchImplementation: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly random: () => number;

  constructor(private readonly options: OpenAIEmbeddingOptions) {
    if (!options.apiKey.trim()) throw new Error("RETRIEVAL_EMBEDDING_AUTH_MISSING");
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.batchSize = boundedInteger(options.batchSize ?? 64, 1, 256, "batch size");
    this.concurrency = boundedInteger(options.concurrency ?? 2, 1, 8, "concurrency");
    this.timeoutMs = boundedInteger(options.timeoutMs ?? 30_000, 100, 120_000, "timeout");
    this.maxAttempts = boundedInteger(options.maxAttempts ?? 4, 1, 8, "attempts");
    this.allowedDataClassifications = options.allowedDataClassifications ?? ["public"];
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.sleep =
      options.sleep ??
      ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.random = options.random ?? Math.random;
  }

  async embedDocuments(texts: readonly string[]): Promise<readonly number[][]> {
    if (texts.length === 0) return [];
    const batches: Array<{ start: number; values: readonly string[] }> = [];
    for (let start = 0; start < texts.length; start += this.batchSize) {
      batches.push({ start, values: texts.slice(start, start + this.batchSize) });
    }
    const output: number[][] = Array.from({ length: texts.length });
    let next = 0;
    const workers = Array.from({ length: Math.min(this.concurrency, batches.length) }, async () => {
      while (next < batches.length) {
        const batch = batches[next++];
        if (!batch) continue;
        const vectors = await this.request(batch.values);
        for (const [index, vector] of vectors.entries()) output[batch.start + index] = vector;
      }
    });
    await Promise.all(workers);
    return output;
  }

  async embedQuery(text: string): Promise<readonly number[]> {
    const vectors = await this.request([text]);
    const vector = vectors[0];
    if (!vector) throw new Error("RETRIEVAL_EMBEDDING_EMPTY");
    return vector;
  }

  private async request(texts: readonly string[]): Promise<number[][]> {
    if (texts.some((text) => !text.trim())) throw new Error("RETRIEVAL_EMBEDDING_INPUT_EMPTY");
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImplementation(`${this.baseUrl}/embeddings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: this.model, input: texts, encoding_format: "float" }),
          signal: controller.signal,
        });
        if (!response.ok) {
          if (!retryableStatus(response.status) || attempt === this.maxAttempts) {
            const classification =
              response.status === 401 || response.status === 403 ? "AUTH" : "HTTP";
            throw new Error(`RETRIEVAL_EMBEDDING_${classification} status=${response.status}`);
          }
          await this.backoff(attempt);
          continue;
        }
        const body = (await response.json()) as unknown;
        return parseOpenAIResponse(body, texts.length, this.model, this.dimension);
      } catch (error) {
        if (
          error instanceof Error &&
          /^RETRIEVAL_EMBEDDING_(AUTH|HTTP|CONTRACT|DIMENSION|NONFINITE|COUNT|EMPTY)/.test(
            error.message,
          )
        ) {
          throw error;
        }
        if (attempt === this.maxAttempts) {
          throw new Error(
            `RETRIEVAL_EMBEDDING_UNAVAILABLE ${error instanceof Error ? error.name : "unknown"}`,
          );
        }
        await this.backoff(attempt);
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error("RETRIEVAL_EMBEDDING_UNAVAILABLE");
  }

  private async backoff(attempt: number): Promise<void> {
    const exponential = Math.min(4_000, 200 * 2 ** (attempt - 1));
    await this.sleep(exponential + Math.floor(this.random() * 100));
  }
}

export interface FakeEmbeddingOptions {
  provider?: string;
  model?: string;
  dimension?: number;
  fail?: boolean;
  malformed?: "short" | "nan" | "infinite" | "empty";
}

export class DeterministicFakeEmbeddingProvider implements EmbeddingProvider {
  readonly provider: string;
  readonly model: string;
  readonly dimension: number;
  readonly contractFingerprint: string;
  readonly allowedDataClassifications = ["public", "internal", "confidential"] as const;

  constructor(private readonly options: FakeEmbeddingOptions = {}) {
    this.provider = options.provider ?? "deterministic-fake";
    this.model = options.model ?? "token-hash-v1";
    this.dimension = options.dimension ?? PRODUCTION_EMBEDDING.dimension;
    this.contractFingerprint = embeddingContract(
      this.provider,
      this.model,
      this.dimension,
    ).contract_fingerprint;
  }

  async embedDocuments(texts: readonly string[]): Promise<readonly number[][]> {
    if (this.options.fail) throw new Error("RETRIEVAL_EMBEDDING_FAKE_FAILURE");
    return texts.map((text) => this.vector(text));
  }

  async embedQuery(text: string): Promise<readonly number[]> {
    if (this.options.fail) throw new Error("RETRIEVAL_EMBEDDING_FAKE_FAILURE");
    return this.vector(text);
  }

  private vector(text: string): number[] {
    if (this.options.malformed === "empty") return [];
    const length =
      this.options.malformed === "short" ? Math.max(1, this.dimension - 1) : this.dimension;
    const vector = Array.from({ length }, () => 0);
    const tokens = text.toLocaleLowerCase("en-US").match(/[\p{L}\p{N}-]+/gu) ?? [text];
    for (const token of tokens) {
      const digest = createHash("sha256").update(token).digest();
      const index = digest.readUInt32BE(0) % length;
      const sign = digest[4] && digest[4] % 2 === 0 ? 1 : -1;
      vector[index] = (vector[index] ?? 0) + sign;
    }
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    const normalized = vector.map((value) => value / norm);
    if (this.options.malformed === "nan") normalized[0] = Number.NaN;
    if (this.options.malformed === "infinite") normalized[0] = Number.POSITIVE_INFINITY;
    return normalized;
  }
}

export function validateEmbeddingVector(vector: readonly number[], dimension: number): number[] {
  if (vector.length !== dimension) {
    throw new Error(`RETRIEVAL_EMBEDDING_DIMENSION expected=${dimension} actual=${vector.length}`);
  }
  if (vector.some((value) => !Number.isFinite(value))) {
    throw new Error("RETRIEVAL_EMBEDDING_NONFINITE");
  }
  return [...vector];
}

function parseOpenAIResponse(
  body: unknown,
  expectedCount: number,
  expectedModel: string,
  dimension: number,
): number[][] {
  if (!isObject(body) || body.model !== expectedModel || !Array.isArray(body.data)) {
    throw new Error("RETRIEVAL_EMBEDDING_CONTRACT model-or-data");
  }
  const sorted = [...body.data].sort((left, right) => objectIndex(left) - objectIndex(right));
  if (sorted.length !== expectedCount) throw new Error("RETRIEVAL_EMBEDDING_CONTRACT count");
  return sorted.map((item, index) => {
    if (!isObject(item) || item.index !== index || !Array.isArray(item.embedding)) {
      throw new Error("RETRIEVAL_EMBEDDING_CONTRACT item");
    }
    return validateEmbeddingVector(item.embedding as number[], dimension);
  });
}

function retryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function boundedInteger(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`RETRIEVAL_EMBEDDING_CONFIG Invalid ${label}.`);
  }
  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectIndex(value: unknown): number {
  return isObject(value) && typeof value.index === "number" ? value.index : Number.MAX_SAFE_INTEGER;
}
