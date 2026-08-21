import { describe, expect, it } from "vitest";

import { parseRagRequest } from "../src/rag-request.js";

describe("RAG request contract", () => {
  it("builds a bounded hybrid-graph request by default", () => {
    const request = parseRagRequest({
      question: "  What is idempotency?  ",
      data_classification: "public",
    });
    expect(request.question).toBe("What is idempotency?");
    expect(request.retrieval.text).toBe(request.question);
    expect(request.retrieval.mode).toBe("hybrid-graph");
    expect(request.retrieval.graph).toEqual({ enabled: true, max_depth: 1, predicates: [] });
    expect(request.answer).toEqual({
      allow_recommendations: false,
      max_statements: 8,
      max_output_tokens: 1800,
    });
  });

  it("normalizes bounded project context and explicit answer controls", () => {
    const request = parseRagRequest({
      question: "Choose an approach",
      data_classification: "internal",
      project_context: {
        system_description: " payments ",
        constraints: ["PCI", "PCI", "regional"],
        quality_priorities: ["availability"],
      },
      answer: { allow_recommendations: true, max_statements: 4, max_output_tokens: 512 },
    });
    expect(request.project_context).toEqual({
      system_description: "payments",
      constraints: ["PCI", "regional"],
      quality_priorities: ["availability"],
    });
    expect(request.data_classification).toBe("internal");
  });

  it.each([
    [{}, "question must be a string"],
    [{ question: " " }, "question must not be empty"],
    [{ question: "x", data_classification: "unknown" }, "data_classification 'unknown' is unknown"],
    [
      { question: "x", data_classification: "public", extra: true },
      "request has unsupported field 'extra'",
    ],
    [
      { question: "x", data_classification: "public", retrieval: { text: "override" } },
      "retrieval.text is derived from question and cannot be overridden",
    ],
    [
      { question: "x", data_classification: "public", project_context: { unknown: [] } },
      "project_context has unsupported field 'unknown'",
    ],
    [
      { question: "x", data_classification: "public", answer: { max_statements: 21 } },
      "answer.max_statements must be an integer from 1 to 20",
    ],
    [
      { question: "x", data_classification: "public", answer: { max_output_tokens: 100 } },
      "answer.max_output_tokens must be an integer from 256 to 4096",
    ],
    [
      {
        question: "choose",
        data_classification: "public",
        answer: { allow_recommendations: true },
      },
      "recommendations require project context",
    ],
  ])("rejects malformed request %#", (value, message) => {
    expect(() => parseRagRequest(value)).toThrow(`RAG_REQUEST_SHAPE ${message}`);
  });
});
