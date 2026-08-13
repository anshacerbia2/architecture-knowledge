import { readFile } from "node:fs/promises";

export interface RagCliInput {
  input: unknown;
  json: boolean;
}

export async function parseRagCliInput(arguments_: readonly string[]): Promise<RagCliInput> {
  const args = [...arguments_];
  if (args[0] === "--") args.shift();
  const flags = new Map<string, string[]>();
  let question: string | undefined;
  while (args.length > 0) {
    const value = args.shift();
    if (!value) break;
    if (!value.startsWith("--")) {
      if (question !== undefined) throw new Error(`RAG_ARGUMENT_UNKNOWN Unexpected '${value}'.`);
      question = value;
      continue;
    }
    const key = value.slice(2);
    if (key === "json" || key === "allow-recommendations") {
      flags.set(key, []);
      continue;
    }
    const flagValue = args.shift();
    if (!flagValue || flagValue.startsWith("--"))
      throw new Error(`RAG_FLAG_VALUE Missing value for --${key}.`);
    flags.set(key, [...(flags.get(key) ?? []), flagValue]);
  }
  const permitted = new Set([
    "question",
    "file",
    "context",
    "constraint",
    "quality",
    "mode",
    "top-k",
    "max-context-tokens",
    "max-statements",
    "max-output-tokens",
    "allow-recommendations",
    "json",
  ]);
  for (const key of flags.keys())
    if (!permitted.has(key)) throw new Error(`RAG_FLAG_UNSUPPORTED --${key}`);
  const file = single(flags, "file");
  if (file) {
    if (question !== undefined || [...flags.keys()].some((key) => !["file", "json"].includes(key)))
      throw new Error("RAG_FLAG_CONFLICT --file cannot be combined with inline request options.");
    try {
      return {
        input: JSON.parse(await readFile(file, "utf8")) as unknown,
        json: flags.has("json"),
      };
    } catch (error) {
      throw new Error(`RAG_REQUEST_FILE ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const flaggedQuestion = single(flags, "question");
  if (flaggedQuestion && question !== undefined)
    throw new Error("RAG_FLAG_CONFLICT --question cannot be combined with positional question.");
  question = flaggedQuestion ?? question;
  if (!question) throw new Error("RAG_ARGUMENT_REQUIRED Missing question.");
  return {
    json: flags.has("json"),
    input: {
      question,
      project_context: {
        system_description: single(flags, "context") ?? null,
        constraints: flags.get("constraint") ?? [],
        quality_priorities: flags.get("quality") ?? [],
      },
      retrieval: {
        mode: single(flags, "mode") ?? "hybrid-graph",
        ...optionalNumber(flags, "top-k", "top_k"),
        budget: {
          ...optionalNumber(flags, "max-context-tokens", "max_estimated_tokens"),
        },
      },
      answer: {
        allow_recommendations: flags.has("allow-recommendations"),
        ...optionalNumber(flags, "max-statements", "max_statements"),
        ...optionalNumber(flags, "max-output-tokens", "max_output_tokens"),
      },
    },
  };
}

function optionalNumber(flags: Map<string, string[]>, key: string, output: string) {
  const value = single(flags, key);
  return value === undefined ? {} : { [output]: Number(value) };
}

function single(flags: Map<string, string[]>, key: string): string | undefined {
  const values = flags.get(key) ?? [];
  if (values.length > 1) throw new Error(`RAG_FLAG_REPEAT --${key}`);
  return values[0];
}
