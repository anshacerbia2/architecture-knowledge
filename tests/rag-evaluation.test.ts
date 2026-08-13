import { mkdtemp, writeFile } from "node:fs/promises";
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
    expect(benchmark.cases).toHaveLength(15);
    expect(benchmark.cases.some((item) => item.no_answer)).toBe(true);
    expect(benchmark.cases.some((item) => item.holdout)).toBe(true);
  });

  it("calculates perfect functional safety gates", async () => {
    const benchmark = {
      version: 1,
      status: "draft",
      cases: [
        {
          id: "RAG-X01",
          category: "exact",
          question: "AKL-000001",
          expected_claim_ids: ["AKL-000001"],
          no_answer: false,
          holdout: false,
          filters: {},
        },
        {
          id: "RAG-X02",
          category: "negative",
          question: "absent",
          expected_claim_ids: [],
          no_answer: true,
          holdout: false,
          filters: {},
        },
      ],
    };
    const report = await evaluateRag(benchmark, async (request) =>
      request.question === "absent" ? noAnswer(request.question) : answered(request.question),
    );
    expect(report.gates).toEqual({ passed: true, failures: [] });
    expect(report.metrics).toMatchObject({
      answer_status_accuracy: 1,
      expected_claim_recall: 1,
      citation_completeness: 1,
      unsupported_statement_count: 0,
    });
  });

  it("fails gates for status, recall, citations, unsupported, and prohibited output", async () => {
    const benchmark = {
      version: 1,
      status: "draft",
      cases: [
        {
          id: "RAG-X01",
          category: "negative",
          question: "absent",
          expected_claim_ids: [],
          no_answer: true,
          holdout: false,
          filters: {},
        },
        {
          id: "RAG-X02",
          category: "exact",
          question: "claim",
          expected_claim_ids: ["AKL-999999"],
          no_answer: false,
          holdout: false,
          filters: {},
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
        "answer-status-accuracy",
        "expected-claim-recall",
        "citation-completeness",
        "unsupported-statements",
        "prohibited-output",
      ]),
    );
  });

  it("rejects malformed or undersized corpora", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "rag-eval-"));
    const file = path.join(directory, "bad.yaml");
    await writeFile(file, "version: 1\nstatus: draft\ncases: []\n", "utf8");
    await expect(loadRagGolden(file)).rejects.toThrow("at least 12 cases required");
  });
});

function answered(question: string): RagAnswerPacket {
  const retrieval = retrievalPacket();
  retrieval.query = ragRequest({ question }).retrieval;
  retrieval.query.text = question;
  return {
    rag_contract_version: 1,
    question,
    status: "answered",
    provider: { provider: "fake", model: "fake", prompt_version: 1 },
    provenance: {
      context_fingerprint: "sha256:context",
      retrieval_generation_id: "rg:test",
      graph_input_fingerprint: "sha256:graph",
      retrieval_manifest_root: "sha256:manifest",
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
  packet.statements = [];
  return packet;
}
