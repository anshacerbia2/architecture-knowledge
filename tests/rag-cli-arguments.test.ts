import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseRagCliInput } from "../src/rag-cli-arguments.js";

describe("RAG CLI arguments", () => {
  it("accepts positional questions and bounded context flags", async () => {
    const parsed = await parseRagCliInput([
      "--",
      "Which option fits?",
      "--context",
      "payments",
      "--constraint",
      "regional",
      "--quality",
      "availability",
      "--allow-recommendations",
      "--max-statements",
      "4",
      "--json",
    ]);
    expect(parsed.json).toBe(true);
    expect(parsed.input).toMatchObject({
      question: "Which option fits?",
      project_context: { constraints: ["regional"], quality_priorities: ["availability"] },
      answer: { allow_recommendations: true, max_statements: 4 },
    });
  });

  it("loads complete JSON request files", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "rag-cli-"));
    const file = path.join(directory, "request.json");
    await writeFile(file, JSON.stringify({ question: "file question" }), "utf8");
    await expect(parseRagCliInput(["--file", file, "--json"])).resolves.toEqual({
      input: { question: "file question" },
      json: true,
    });
  });

  it.each([
    [[], "RAG_ARGUMENT_REQUIRED"],
    [["question", "extra"], "RAG_ARGUMENT_UNKNOWN"],
    [["question", "--bad", "x"], "RAG_FLAG_UNSUPPORTED"],
    [["--question"], "RAG_FLAG_VALUE"],
    [["question", "--question", "other"], "RAG_FLAG_CONFLICT"],
  ])("rejects malformed CLI %#", async (args, code) => {
    await expect(parseRagCliInput(args)).rejects.toThrow(code);
  });
});
