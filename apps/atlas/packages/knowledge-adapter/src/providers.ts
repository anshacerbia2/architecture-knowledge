import {
  DeterministicFakeEmbeddingProvider,
  DeterministicFakeRagProvider,
  OpenAIEmbeddingProvider,
  OpenAIRagProvider,
} from "architecture-knowledge-system/runtime";
import { AppError } from "../../application/src/errors.js";
import { PilotBudget, pilotFetch } from "./pilot-budget.js";

export type ProviderSettings =
  | { mode: "fake" }
  | {
      mode: "openai";
      apiKey: string;
      publicManifest: string;
      budgetFile: string;
    };

export function providers(settings: ProviderSettings, manifest: string) {
  if (settings.mode === "fake")
    return {
      embedding: new DeterministicFakeEmbeddingProvider(),
      answer: new DeterministicFakeRagProvider(),
      budget: null,
    };
  if (
    !/^sha256:[a-f0-9]{64}$/.test(settings.publicManifest) ||
    settings.publicManifest !== manifest
  )
    throw new AppError(
      "PILOT_PUBLIC_MANIFEST_REQUIRED",
      503,
      "Confirm the exact retrieval manifest is public before enabling external providers.",
    );
  const budget = new PilotBudget(settings.budgetFile);
  budget.status();
  const fetchImplementation = pilotFetch(budget);
  return {
    embedding: new OpenAIEmbeddingProvider({
      apiKey: settings.apiKey,
      batchSize: 8,
      concurrency: 1,
      maxAttempts: 1,
      allowedDataClassifications: ["public"],
      fetchImplementation,
    }),
    answer: new OpenAIRagProvider({
      apiKey: settings.apiKey,
      maxAttempts: 1,
      allowedDataClassifications: ["public"],
      fetchImplementation,
    }),
    budget,
  };
}
