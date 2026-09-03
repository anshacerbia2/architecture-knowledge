import { describe, expect, it } from "vitest";

import { createRagCitationAuthority } from "../src/rag-citation-authority.js";

describe("RAG citation authority", () => {
  it("resolves canonical metadata only for record-authorized admitted sources", () => {
    const authority = createRagCitationAuthority({
      concepts: [{ id: "AKC-000001", sources: ["AKS-000001"] }],
      claims: [{ id: "AKL-000001", sources: ["AKS-000001"] }],
      decisionGuides: [{ id: "AKG-000001", evidence_source_ids: ["AKS-000001"] }],
      relationships: [{ id: "AKR-000001", direct_source_ids: ["AKS-000001"] }],
      sources: [
        {
          id: "AKS-000001",
          title: "  Governed title  ",
          url: "  https://example.com/source  ",
          status: "approved",
        },
      ],
    });

    const expected = {
      source_id: "AKS-000001",
      title: "Governed title",
      url: "https://example.com/source",
    };
    expect(authority.resolve("AKC-000001", "AKS-000001")).toEqual(expected);
    expect(authority.resolve("AKL-000001", "AKS-000001")).toEqual(expected);
    expect(authority.resolve("AKG-000001", "AKS-000001")).toEqual(expected);
    expect(authority.resolve("AKR-000001", "AKS-000001")).toEqual(expected);
    expect(authority.resolve("AKS-000001", "AKS-000001")).toEqual(expected);
  });

  it.each([
    ["candidate", "Governed title", "https://example.com/source", "AKS-000001"],
    ["approved", "", "https://example.com/source", "AKS-000001"],
    ["approved", undefined, "https://example.com/source", "AKS-000001"],
    ["approved", "Governed title", "not-a-url", "AKS-000001"],
    ["approved", "Governed title", undefined, "AKS-000001"],
    ["approved", "Governed title", "http://example.com/source", "AKS-000001"],
    ["approved", "Governed title", "https://example.com/source", "AKS-BAD"],
  ])("does not admit invalid source authority (%s, %s, %s, %s)", (status, title, url, id) => {
    const authority = createRagCitationAuthority({
      concepts: [],
      claims: [{ id: "AKL-000001", sources: [id] }],
      decisionGuides: [],
      relationships: [],
      sources: [{ id, title, url, status }],
    });
    expect(authority.resolve("AKL-000001", id)).toBeUndefined();
  });

  it("rejects unknown, malformed, blank, and record-unauthorized source references", () => {
    const authority = createRagCitationAuthority({
      concepts: [],
      claims: [
        { id: "AKL-000001", sources: ["AKS-000001"] },
        { id: "AKL-000002", sources: [] },
      ],
      decisionGuides: [],
      relationships: [],
      sources: [
        {
          id: "AKS-000001",
          title: "Governed title",
          url: "https://example.com/source",
          status: "approved",
        },
      ],
    });
    expect(authority.resolve("AKL-000002", "AKS-000001")).toBeUndefined();
    expect(authority.resolve("AKL-999999", "AKS-000001")).toBeUndefined();
    expect(authority.resolve("AKL-000001", "AKS-999999")).toBeUndefined();
    expect(authority.resolve("AKL-000001", "")).toBeUndefined();
    expect(authority.resolve("AKL-000001", " AKS-000001 ")).toBeUndefined();
  });

  it("rejects duplicate source and cross-family record IDs", () => {
    const source = {
      id: "AKS-000001",
      title: "Governed title",
      url: "https://example.com/source",
      status: "approved",
    };
    expect(() =>
      createRagCitationAuthority({
        concepts: [],
        claims: [],
        decisionGuides: [],
        relationships: [],
        sources: [source, { ...source }],
      }),
    ).toThrow("RAG_CITATION_AUTHORITY_DUPLICATE AKS-000001");
    expect(() =>
      createRagCitationAuthority({
        concepts: [{ id: "AKL-000001", sources: [] }],
        claims: [{ id: "AKL-000001", sources: [] }],
        decisionGuides: [],
        relationships: [],
        sources: [source],
      }),
    ).toThrow("RAG_CITATION_AUTHORITY_DUPLICATE AKL-000001");
  });
});
