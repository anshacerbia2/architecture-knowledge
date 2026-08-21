import { describe, expect, it } from "vitest";

import { buildRagContext } from "../src/rag-context.js";
import { RagEngine, renderRagAnswer, validateGrounding } from "../src/rag-engine.js";
import { DeterministicFakeRagProvider } from "../src/rag-provider.js";
import { modelOutput, ragRequest, retrievalPacket, retrievalUnit } from "./rag-helpers.js";

describe("RAG context and grounding", () => {
  it("builds deterministic evidence and citation catalogs", () => {
    const request = ragRequest();
    const first = buildRagContext(request, retrievalPacket());
    const second = buildRagContext(request, retrievalPacket());
    expect(first).toEqual(second);
    expect(first.evidence[0]?.evidence_id).toBe("E0001");
    expect(first.citation_catalog[0]).toMatchObject({
      citation_id: "C0001",
      evidence_id: "E0001",
      source_id: "AKS-000001",
    });
    expect(first.context_fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("binds fingerprints to content, citations, graph paths, and project context", () => {
    const request = ragRequest();
    const baseline = buildRagContext(request, retrievalPacket()).context_fingerprint;
    const content = retrievalUnit({ content_hash: "sha256:changed" });
    const path = retrievalPacket();
    path.results[0]!.graph_path = ["AKC-000001", "AKC-000002"];
    expect(buildRagContext(request, retrievalPacket([content])).context_fingerprint).not.toBe(
      baseline,
    );
    expect(buildRagContext(request, path).context_fingerprint).not.toBe(baseline);
    expect(
      buildRagContext(
        ragRequest({
          project_context: {
            system_description: "changed",
            constraints: [],
            quality_priorities: [],
          },
        }),
        retrievalPacket(),
      ).context_fingerprint,
    ).not.toBe(baseline);
  });

  it.each([
    ["title", (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, title: "changed" })],
    ["text", (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, retrieval_text: "injected" })],
    ["unit ID", (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, unit_id: "ru:changed" })],
    [
      "record ID",
      (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, record_id: "AKL-000002" }),
    ],
    [
      "concept ID",
      (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, concept_id: "AKC-000002" }),
    ],
    [
      "source path",
      (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, source_path: "changed.yaml" }),
    ],
    [
      "lifecycle",
      (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, lifecycle_status: "changed" }),
    ],
    ["scope", (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, semantic_scope: "changed" })],
    ["confidence", (unit: ReturnType<typeof retrievalUnit>) => ({ ...unit, confidence: "medium" })],
  ])("binds prompt-visible evidence %s even when the declared hash is stale", (_name, change) => {
    const baseline = buildRagContext(ragRequest(), retrievalPacket()).context_fingerprint;
    const changed = change(retrievalUnit());
    expect(buildRagContext(ragRequest(), retrievalPacket([changed])).context_fingerprint).not.toBe(
      baseline,
    );
  });

  it("binds classification and answer controls into the context fingerprint", () => {
    const baseline = buildRagContext(ragRequest(), retrievalPacket()).context_fingerprint;
    const classified = ragRequest({ data_classification: "internal" });
    const bounded = ragRequest({
      answer: { allow_recommendations: false, max_statements: 7, max_output_tokens: 1800 },
    });
    expect(buildRagContext(classified, retrievalPacket()).context_fingerprint).not.toBe(baseline);
    expect(buildRagContext(bounded, retrievalPacket()).context_fingerprint).not.toBe(baseline);
  });

  it.each([
    [
      "query",
      () => {
        const packet = retrievalPacket();
        packet.query.text = "different";
        return packet;
      },
      "RAG_RETRIEVAL_QUERY_MISMATCH",
    ],
    [
      "count",
      () => {
        const packet = retrievalPacket();
        packet.result_count = 2;
        return packet;
      },
      "RAG_RETRIEVAL_COUNT_MISMATCH",
    ],
    [
      "tokens",
      () => {
        const packet = retrievalPacket();
        packet.estimated_tokens = 12001;
        return packet;
      },
      "RAG_CONTEXT_TOKEN_LIMIT",
    ],
    [
      "item limit",
      () => retrievalPacket(Array.from({ length: 21 }, () => retrievalUnit())),
      "RAG_CONTEXT_ITEM_LIMIT",
    ],
  ])("rejects invalid retrieval %s", (_name, factory, code) => {
    expect(() => buildRagContext(ragRequest(), factory())).toThrow(code);
  });

  it("accepts a directly cited sourced claim", () => {
    expect(
      validateGrounding(
        modelOutput(),
        buildRagContext(ragRequest(), retrievalPacket()),
        ragRequest(),
      ),
    ).toEqual([]);
  });

  it.each([
    [
      "dangling evidence",
      modelOutput({ statements: [{ ...modelOutput().statements[0]!, evidence_ids: ["E9999"] }] }),
      "RAG_EVIDENCE_DANGLING",
    ],
    [
      "unsupported assertion",
      modelOutput({ statements: [{ ...modelOutput().statements[0]!, evidence_ids: [] }] }),
      "RAG_STATEMENT_UNSUPPORTED",
    ],
    [
      "dangling claim",
      modelOutput({ statements: [{ ...modelOutput().statements[0]!, claim_ids: ["AKL-999999"] }] }),
      "RAG_CLAIM_DANGLING",
    ],
    [
      "invalid sourced claim ID",
      modelOutput({ statements: [{ ...modelOutput().statements[0]!, claim_ids: ["invalid"] }] }),
      "RAG_CLAIM_ID_INVALID",
    ],
    [
      "sourced claim without a named claim",
      modelOutput({ statements: [{ ...modelOutput().statements[0]!, claim_ids: [] }] }),
      "RAG_SOURCED_CLAIM_REQUIRED",
    ],
    [
      "single-evidence synthesis",
      modelOutput({
        statements: [
          { ...modelOutput().statements[0]!, epistemic_type: "synthesis", claim_ids: [] },
        ],
      }),
      "RAG_SYNTHESIS_EVIDENCE_INSUFFICIENT",
    ],
    [
      "unrequested recommendation",
      modelOutput({
        statements: [
          {
            ...modelOutput().statements[0]!,
            epistemic_type: "recommendation",
            confidence: "medium",
          },
        ],
      }),
      "RAG_RECOMMENDATION_NOT_ALLOWED",
    ],
    [
      "overconfident inference",
      modelOutput({
        statements: [
          { ...modelOutput().statements[0]!, epistemic_type: "inference", claim_ids: [] },
        ],
      }),
      "RAG_DERIVED_CONFIDENCE_EXCESSIVE",
    ],
    [
      "overconfident uncertainty",
      modelOutput({
        statements: [
          {
            ...modelOutput().statements[0]!,
            epistemic_type: "uncertainty",
            evidence_ids: [],
            claim_ids: [],
          },
        ],
      }),
      "RAG_UNCERTAINTY_CONFIDENCE_INVALID",
    ],
  ])("rejects %s", (_name, output, code) => {
    const diagnostics = validateGrounding(
      output,
      buildRagContext(ragRequest(), retrievalPacket()),
      ragRequest(),
    );
    expect(diagnostics.map((item) => item.code)).toContain(code);
  });

  it("rejects a statement count above the request-specific limit", () => {
    const request = ragRequest({
      answer: { allow_recommendations: false, max_statements: 1, max_output_tokens: 1800 },
    });
    const output = modelOutput({
      statements: [
        modelOutput().statements[0]!,
        { ...modelOutput().statements[0]!, statement_id: "S0002" },
      ],
    });
    expect(
      validateGrounding(output, buildRagContext(request, retrievalPacket()), request).map(
        (item) => item.code,
      ),
    ).toContain("RAG_STATEMENT_LIMIT");
  });

  it("rejects assertive evidence without a resolvable source citation", () => {
    const context = buildRagContext(
      ragRequest(),
      retrievalPacket([retrievalUnit({ citations: [] })]),
    );
    expect(
      validateGrounding(modelOutput(), context, ragRequest()).map((item) => item.code),
    ).toContain("RAG_CITATION_MISSING");
  });

  it.each([
    [null, "https://example.com/source"],
    ["Synthetic source", null],
    [null, null],
    ["   ", "https://example.com/source"],
    ["Synthetic source", "   "],
  ])("rejects raw citations excluded from the final catalog (title=%s url=%s)", (title, url) => {
    const context = buildRagContext(
      ragRequest(),
      retrievalPacket([
        retrievalUnit({ citations: [{ source_id: "AKS-000001", title, url, locators: [] }] }),
      ]),
    );
    expect(context.citation_catalog).toEqual([]);
    expect(
      validateGrounding(modelOutput(), context, ragRequest()).map((item) => item.code),
    ).toContain("RAG_CITATION_MISSING");
  });

  it("accepts mixed raw citations only when at least one resolves through the catalog", () => {
    const context = buildRagContext(
      ragRequest(),
      retrievalPacket([
        retrievalUnit({
          citations: [
            { source_id: "AKS-000001", title: null, url: null, locators: [] },
            {
              source_id: "AKS-000002",
              title: "Resolvable source",
              url: "https://example.com/resolvable",
              locators: [],
            },
          ],
        }),
      ]),
    );
    expect(validateGrounding(modelOutput(), context, ragRequest())).toEqual([]);
  });

  it("requires complete recommendation framing when recommendations are enabled", () => {
    const request = ragRequest({
      project_context: {
        system_description: "payments",
        constraints: ["regional"],
        quality_priorities: [],
      },
      answer: { allow_recommendations: true, max_statements: 8, max_output_tokens: 1800 },
    });
    const output = modelOutput({
      statements: [
        {
          ...modelOutput().statements[0]!,
          epistemic_type: "recommendation",
          confidence: "medium",
          conditions: ["when regional operation is required"],
          alternatives: ["central operation"],
          trade_offs: ["more operational complexity"],
        },
      ],
    });
    expect(validateGrounding(output, buildRagContext(request, retrievalPacket()), request)).toEqual(
      [],
    );
  });

  it("answers through deterministic provider and resolves source citations", async () => {
    const engine = new RagEngine(
      { query: async () => retrievalPacket() },
      new DeterministicFakeRagProvider(),
    );
    const answer = await engine.answer(ragRequest());
    expect(answer.status).toBe("answered");
    expect(answer.statements[0]?.citations[0]?.source_id).toBe("AKS-000001");
    expect(answer.rendered_markdown).toContain("[AKS-000001](https://example.com/source)");
  });

  it("returns insufficient evidence without calling the provider", async () => {
    const provider = new DeterministicFakeRagProvider({ fail: true });
    const engine = new RagEngine({ query: async () => retrievalPacket([]) }, provider);
    const answer = await engine.answer(ragRequest());
    expect(answer.status).toBe("insufficient-evidence");
    expect(answer.diagnostics[0]?.code).toBe("RAG_INSUFFICIENT_EVIDENCE");
  });

  it("enforces classification at the reusable engine boundary", async () => {
    let called = false;
    const provider = {
      provider: "synthetic",
      model: "synthetic-v1",
      allowedDataClassifications: ["public"] as const,
      generate: async () => {
        called = true;
        return modelOutput();
      },
    };
    await expect(
      new RagEngine({ query: async () => retrievalPacket() }, provider).answer(
        ragRequest({ data_classification: "internal" }),
      ),
    ).rejects.toThrow("RAG_DATA_CLASSIFICATION_DENIED");
    expect(called).toBe(false);
  });

  it("fails closed when model grounding is invalid", async () => {
    const provider = new DeterministicFakeRagProvider({
      output: modelOutput({
        statements: [{ ...modelOutput().statements[0]!, evidence_ids: ["E9999"] }],
      }),
    });
    const engine = new RagEngine({ query: async () => retrievalPacket() }, provider);
    await expect(engine.answer(ragRequest())).rejects.toThrow("RAG_GROUNDING_INVALID");
  });

  it("converts only an explicit provider refusal into a refused packet", async () => {
    const provider = {
      provider: "synthetic",
      model: "synthetic-v1",
      allowedDataClassifications: ["public"] as const,
      generate: async () => {
        throw new Error("RAG_MODEL_REFUSAL policy");
      },
    };
    const answer = await new RagEngine({ query: async () => retrievalPacket() }, provider).answer(
      ragRequest(),
    );
    expect(answer.status).toBe("refused");
    expect(answer.diagnostics).toEqual([
      { code: "RAG_MODEL_REFUSAL", message: "The model refused the request." },
    ]);

    const unavailable = {
      ...provider,
      generate: async () => {
        throw new Error("network failure");
      },
    };
    await expect(
      new RagEngine({ query: async () => retrievalPacket() }, unavailable).answer(ragRequest()),
    ).rejects.toThrow("network failure");
  });

  it("renders explicit no-answer uncertainty", () => {
    expect(
      renderRagAnswer("insufficient-evidence", "No answer.", [], ["Missing evidence."]),
    ).toContain("Uncertainties:\n- Missing evidence.");
  });
});
