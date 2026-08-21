import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { evaluateRag, loadRagGolden } from "../src/rag-evaluation.js";
import type { RagAnswerPacket } from "../src/rag-types.js";
import { ragRequest, retrievalPacket } from "./rag-helpers.js";

describe("RAG evaluation", () => {
  it("loads the committed draft corpus", async () => {
    const benchmark = await loadRagGolden(
      path.join(process.cwd(), "evaluation", "rag-golden.yaml"),
    );
    expect(benchmark.version).toBe(2);
    expect(benchmark.cases).toHaveLength(20);
    expect(benchmark.cases.filter((item) => item.category === "exact-claim")).toHaveLength(4);
    expect(benchmark.cases.filter((item) => item.holdout)).toHaveLength(7);
    expect(benchmark.cases.filter((item) => item.category === "adversarial")).toHaveLength(3);
  });

  it("calculates perfect functional safety gates", async () => {
    const benchmark = {
      version: 2,
      status: "draft",
      cases: [
        {
          id: "RAG-X01",
          category: "exact",
          question: "AKL-000001",
          expected_claim_ids: ["AKL-000001"],
          expected_status: "answered" as const,
          must_invoke_model: true,
          holdout: false,
          filters: {},
          forbidden_claim_ids: [],
          expected_epistemic_types: ["sourced-claim" as const],
          prohibited_output_terms: [],
        },
        {
          id: "RAG-X02",
          category: "negative",
          question: "absent",
          expected_claim_ids: [],
          expected_status: "insufficient-evidence" as const,
          must_invoke_model: false,
          holdout: false,
          filters: {},
          forbidden_claim_ids: [],
          expected_epistemic_types: [],
          prohibited_output_terms: [],
        },
      ],
    };
    const report = await evaluateRag(benchmark, async (request) =>
      request.question === "absent" ? noAnswer(request.question) : answered(request.question),
    );
    expect(report.gates).toEqual({ passed: true, failures: [] });
    expect(report.metrics).toMatchObject({
      answer_status_accuracy: 1,
      model_invocation_accuracy: 1,
      expected_claim_recall: 1,
      citation_completeness: 1,
      unsupported_statement_count: 0,
    });
  });

  it("fails gates for status, recall, citations, unsupported, and prohibited output", async () => {
    const benchmark = {
      version: 2,
      status: "draft",
      cases: [
        {
          id: "RAG-X01",
          category: "negative",
          question: "absent",
          expected_claim_ids: [],
          expected_status: "insufficient-evidence" as const,
          must_invoke_model: false,
          holdout: false,
          filters: {},
          forbidden_claim_ids: ["AKL-000001"],
          expected_epistemic_types: [],
          prohibited_output_terms: ["claim"],
        },
        {
          id: "RAG-X02",
          category: "exact",
          question: "claim",
          expected_claim_ids: ["AKL-999999"],
          expected_status: "answered" as const,
          must_invoke_model: true,
          holdout: false,
          filters: {},
          forbidden_claim_ids: [],
          expected_epistemic_types: ["synthesis" as const],
          prohibited_output_terms: [],
        },
      ],
    };
    const report = await evaluateRag(benchmark, async (request) => {
      const packet = answered(request.question);
      packet.statements[0]!.citations = [];
      packet.statements[0]!.evidence_ids = [];
      return packet;
    });
    expect(report.gates.passed).toBe(false);
    expect(report.gates.failures).toEqual(
      expect.arrayContaining([
        "all:answer-status-accuracy",
        "all:expected-claim-recall",
        "all:forbidden-claims",
        "all:citation-completeness",
        "all:expected-epistemic-type-coverage",
        "all:unsupported-statements",
        "all:prohibited-output",
      ]),
    );
  });

  it("rejects malformed or undersized corpora", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "rag-eval-"));
    const file = path.join(directory, "bad.yaml");
    await writeFile(file, "version: 2\nstatus: draft\ncases: []\n", "utf8");
    await expect(loadRagGolden(file)).rejects.toThrow("at least 20 cases required");
  });

  it("rejects impossible filter sentinels instead of gaming no-answer cases", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "rag-eval-sentinel-"));
    const file = path.join(directory, "bad.yaml");
    const committed = await readFile(
      path.join(process.cwd(), "evaluation", "rag-golden.yaml"),
      "utf8",
    );
    await writeFile(
      file,
      committed.replace("filters: {}", "filters: { domains: [not-in-corpus] }"),
      "utf8",
    );
    await expect(loadRagGolden(file)).rejects.toThrow("impossible filter sentinel is forbidden");
  });
});

function answered(question: string): RagAnswerPacket {
  const retrieval = retrievalPacket();
  retrieval.query = ragRequest({ question }).retrieval;
  retrieval.query.text = question;
  return {
    rag_contract_version: 2,
    question,
    status: "answered",
    model_invoked: true,
    provider: { provider: "fake", model: "fake", prompt_version: 2 },
    provenance: {
      context_fingerprint: "sha256:context",
      retrieval_generation_id: "rg:test",
      graph_input_fingerprint: "sha256:graph",
      retrieval_manifest_root: "sha256:manifest",
      data_classification: "public",
    },
    summary: "answer",
    statements: [
      {
        statement_id: "S0001",
        text: "claim",
        epistemic_type: "sourced-claim",
        evidence_ids: ["E0001"],
        claim_ids: ["AKL-000001"],
        conditions: [],
        alternatives: [],
        trade_offs: [],
        confidence: "high",
        citations: [
          {
            citation_id: "C0001",
            evidence_id: "E0001",
            source_id: "AKS-000001",
            title: "source",
            url: "https://example.com",
            locators: [],
          },
        ],
      },
    ],
    uncertainties: [],
    refusal_reason: null,
    rendered_markdown: "answer",
    diagnostics: [],
    retrieval,
  };
}

function noAnswer(question: string): RagAnswerPacket {
  const packet = answered(question);
  packet.status = "insufficient-evidence";
  packet.model_invoked = false;
  packet.statements = [];
  return packet;
}
