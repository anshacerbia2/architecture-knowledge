import { describe, expect, it } from "vitest";

import { loadRepository } from "../src/model.js";
import { validateSecurityClaimBindings } from "../src/security-claim-validator.js";
import { validSemanticModel } from "./helpers.js";

const normativeStatement = "Clients MUST validate the synthetic security assertion.";

async function securityModel() {
  const model = await validSemanticModel();
  const concept = model.concepts[0]!;
  const claim = model.claims[0]!;
  concept.data.domain = "security-privacy";
  concept.data.type = "protocol";
  concept.data.status = "sourced";
  concept.data.claims = [claim.id];
  concept.data.sources = [model.sources[0]!.id];
  model.sources[0]!.data.domains = ["security-privacy"];
  concept.data.security_implications = [
    {
      statement: normativeStatement,
      kind: "normative-control",
      claim_ids: [claim.id],
      scope: "edge-local",
      concept_ids: [],
    },
  ];
  claim.data.statement = normativeStatement;
  claim.data.claim_type = "normalized-source-claim";
  claim.data.semantic_scope = "concept-global";
  claim.data.applicable_concept_ids = [];
  claim.data.conditions = [];
  claim.data.status = "sourced";
  claim.data.sources = [model.sources[0]!.id];
  claim.data.source_locations = [
    { source_id: model.sources[0]!.id, locator: "Synthetic specification Section 1" },
  ];
  claim.data.normative = {
    force: "must",
    applies_to: "Synthetic security clients.",
    exceptions: [],
  };
  return model;
}

function codes(model: Awaited<ReturnType<typeof securityModel>>): string[] {
  return validateSecurityClaimBindings(model).map((item) => item.code);
}

function implication(model: Awaited<ReturnType<typeof securityModel>>): Record<string, unknown> {
  return (model.concepts[0]!.data.security_implications as Record<string, unknown>[])[0]!;
}

describe("security claim binding", () => {
  it("accepts an exact structured normative claim with direct admitted evidence", async () => {
    expect(validateSecurityClaimBindings(await securityModel())).toEqual([]);
  });

  it("rejects normative security prose that is not structured", async () => {
    const model = await securityModel();
    model.concepts[0]!.data.security_implications = [normativeStatement];
    expect(validateSecurityClaimBindings(model)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SECURITY_NORMATIVE_UNSTRUCTURED" }),
      ]),
    );
  });

  it("rejects missing and merely adjacent claim or source evidence", async () => {
    const model = await securityModel();
    model.concepts[0]!.data.claims = [];
    model.concepts[0]!.data.sources = [];
    const codes = validateSecurityClaimBindings(model).map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining(["SECURITY_CLAIM_UNDECLARED", "SECURITY_SOURCE_ADJACENCY"]),
    );
  });

  it("rejects unresolved, non-sourced, and unlocated security evidence", async () => {
    const model = await securityModel();
    model.concepts[0]!.data.security_implications = [
      ...(model.concepts[0]!.data.security_implications as object[]),
      {
        statement: "Unresolved control.",
        kind: "normative-control",
        claim_ids: ["AKL-999999"],
        scope: "edge-local",
        concept_ids: [],
      },
    ];
    model.claims[0]!.data.status = "proposed";
    model.claims[0]!.data.source_locations = [];
    const codes = validateSecurityClaimBindings(model).map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "SECURITY_CLAIM_UNRESOLVED",
        "SECURITY_CLAIM_STATUS",
        "SECURITY_SOURCE_LOCATION",
      ]),
    );
  });

  it("rejects broadened normative prose even when notes or adjacency look plausible", async () => {
    const model = await securityModel();
    const implication = (
      model.concepts[0]!.data.security_implications as Record<string, unknown>[]
    )[0]!;
    implication.statement = "All clients MUST validate every possible assertion.";
    model.claims[0]!.data.notes = "The prose is intended to be narrower.";
    expect(validateSecurityClaimBindings(model)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SECURITY_NORMATIVE_SCOPE" })]),
    );
  });

  it.each(["security-risk", "implementation-observation"])(
    "rejects protocol force hidden under %s",
    async (kind) => {
      const model = await securityModel();
      model.concepts[0]!.data.security_implications = [
        {
          statement: normativeStatement,
          kind,
          claim_ids: [],
          scope: "edge-local",
          concept_ids: [],
        },
      ];
      expect(codes(model)).toContain("SECURITY_NORMATIVE_KIND");
    },
  );

  it("rejects protocol force hidden under an operational recommendation", async () => {
    const model = await securityModel();
    implication(model).kind = "operational-recommendation";
    expect(codes(model)).toContain("SECURITY_NORMATIVE_KIND");
  });

  it("rejects a normative control with no claim binding", async () => {
    const model = await securityModel();
    implication(model).claim_ids = [];
    expect(codes(model)).toContain("SECURITY_NORMATIVE_CLAIM_REQUIRED");
  });

  it("rejects a claim force weakened while its MUST statement remains", async () => {
    const model = await securityModel();
    (model.claims[0]!.data.normative as Record<string, unknown>).force = "may";
    expect(codes(model)).toContain("SECURITY_NORMATIVE_FORCE");
  });

  it("rejects a claim force stronger than its SHOULD statement", async () => {
    const model = await securityModel();
    const statement = "Clients SHOULD validate the synthetic security assertion.";
    model.claims[0]!.data.statement = statement;
    implication(model).statement = statement;
    expect(codes(model)).toContain("SECURITY_NORMATIVE_FORCE");
  });

  it("rejects removal of a material exception", async () => {
    const model = await securityModel();
    const statement =
      "Clients MUST validate the synthetic security assertion unless the synthetic exception applies.";
    model.claims[0]!.data.statement = statement;
    implication(model).statement = statement;
    expect(codes(model)).toContain("SECURITY_NORMATIVE_EXCEPTION");
  });

  it("rejects a conditional requirement made structurally unconditional", async () => {
    const model = await securityModel();
    const statement =
      "When the synthetic boundary applies, clients MUST validate the synthetic security assertion.";
    model.claims[0]!.data.statement = statement;
    implication(model).statement = statement;
    model.claims[0]!.data.conditions = [];
    expect(codes(model)).toContain("SECURITY_NORMATIVE_CONDITION");
  });

  it("rejects a structured condition that does not preserve the claim qualifier", async () => {
    const model = await securityModel();
    const statement =
      "When the synthetic boundary applies, clients MUST validate the synthetic security assertion.";
    model.claims[0]!.data.statement = statement;
    implication(model).statement = statement;
    model.claims[0]!.data.conditions = [
      {
        statement: "An unrelated deployment property holds.",
        concept_ids: [],
        scope: "edge-local",
      },
    ];
    expect(codes(model)).toContain("SECURITY_NORMATIVE_CONDITION");
  });

  it("rejects structured exception metadata that does not preserve the claim exception", async () => {
    const model = await securityModel();
    const statement =
      "Clients MUST validate the synthetic security assertion unless the synthetic exception applies.";
    model.claims[0]!.data.statement = statement;
    implication(model).statement = statement;
    (model.claims[0]!.data.normative as Record<string, unknown>).exceptions = [
      "An unrelated operational exception applies.",
    ];
    expect(codes(model)).toContain("SECURITY_NORMATIVE_EXCEPTION");
  });

  it("rejects sourced normative guidance with no direct source", async () => {
    const model = await securityModel();
    model.claims[0]!.data.sources = [];
    model.claims[0]!.data.source_locations = [];
    expect(codes(model)).toContain("SECURITY_NORMATIVE_DIRECT_SOURCE");
  });

  it("rejects sourced normative guidance supported only by a derived claim", async () => {
    const model = await securityModel();
    model.claims[0]!.data.sources = [];
    model.claims[0]!.data.source_locations = [];
    model.claims[0]!.data.derived_from_claims = ["AKL-900002"];
    expect(codes(model)).toContain("SECURITY_NORMATIVE_DIRECT_SOURCE");
  });

  it("rejects normative guidance without a direct source locator", async () => {
    const model = await securityModel();
    model.claims[0]!.data.source_locations = [];
    expect(codes(model)).toContain("SECURITY_SOURCE_LOCATION");
  });

  it("rejects a locator that belongs to a different source", async () => {
    const model = await securityModel();
    model.claims[0]!.data.source_locations = [
      { source_id: "AKS-999999", locator: "Unrelated specification Section 1" },
    ];
    expect(codes(model)).toContain("SECURITY_SOURCE_LOCATION");
  });

  it("rejects a non-admitted direct source for normative guidance", async () => {
    const model = await securityModel();
    model.sources[0]!.data.status = "candidate";
    expect(codes(model)).toContain("SECURITY_CLAIM_EVIDENCE");
  });

  it("rejects an unrelated claim attached across a semantic boundary", async () => {
    const model = await securityModel();
    model.claims[0]!.data.subject = model.concepts[1]!.id;
    model.claims[0]!.data.applicable_concept_ids = [];
    expect(codes(model)).toContain("SECURITY_CLAIM_APPLICABILITY");
  });

  it("rejects reverse cross-boundary reuse without explicit applicability", async () => {
    const model = await securityModel();
    const target = model.concepts[1]!;
    target.data.domain = "security-privacy";
    target.data.type = "protocol";
    target.data.status = "sourced";
    target.data.claims = [model.claims[0]!.id];
    target.data.sources = [model.sources[0]!.id];
    target.data.security_implications = [structuredClone(implication(model))];
    model.claims[0]!.data.subject = model.concepts[0]!.id;
    model.claims[0]!.data.applicable_concept_ids = [];
    expect(codes(model)).toContain("SECURITY_CLAIM_APPLICABILITY");
  });

  it("rejects removal of an applicable normative implication and declaration together", async () => {
    const model = await securityModel();
    model.concepts[0]!.data.security_implications = [
      {
        statement: "A descriptive synthetic security risk.",
        kind: "security-risk",
        claim_ids: [],
        scope: "edge-local",
        concept_ids: [],
      },
    ];
    model.concepts[0]!.data.claims = [];
    expect(codes(model)).toContain("SECURITY_APPLICABLE_CLAIM_MISSING");
  });

  it("rejects a recommendation projected as a protocol-level MUST NOT", async () => {
    const model = await securityModel();
    const statement = "Clients MUST NOT use the synthetic credential.";
    model.claims[0]!.data.claim_type = "recommendation";
    model.claims[0]!.data.conditions = [
      { statement: "The synthetic API boundary applies.", concept_ids: [], scope: "edge-local" },
    ];
    model.claims[0]!.data.statement = statement;
    (model.claims[0]!.data.normative as Record<string, unknown>).force = "must-not";
    implication(model).statement = statement;
    expect(codes(model)).toContain("SECURITY_NORMATIVE_CLAIM_TYPE");
  });

  it("rejects an operational recommendation backed by a non-recommendation claim", async () => {
    const model = await securityModel();
    const statement =
      "Repository guidance recommends preserving the synthetic credential boundary.";
    delete model.claims[0]!.data.normative;
    model.claims[0]!.data.statement = statement;
    implication(model).statement = statement;
    implication(model).kind = "operational-recommendation";
    expect(codes(model)).toContain("SECURITY_RECOMMENDATION_MODEL");
  });

  it("accepts claim reuse with explicit cross-concept applicability", async () => {
    const model = await securityModel();
    model.claims[0]!.data.subject = model.concepts[1]!.id;
    model.claims[0]!.data.applicable_concept_ids = [model.concepts[0]!.id];
    expect(validateSecurityClaimBindings(model)).toEqual([]);
  });

  it.each(["security-risk", "implementation-observation"])(
    "accepts a non-normative unbound %s",
    async (kind) => {
      const model = await securityModel();
      delete model.claims[0]!.data.normative;
      model.concepts[0]!.data.security_implications = [
        {
          statement: "A descriptive synthetic security condition.",
          kind,
          claim_ids: [],
          scope: "edge-local",
          concept_ids: [],
        },
      ];
      expect(validateSecurityClaimBindings(model)).toEqual([]);
    },
  );

  it("accepts a repository-authored operational recommendation without protocol force", async () => {
    const model = await securityModel();
    const statement =
      "Repository guidance recommends preserving the synthetic credential boundary.";
    delete model.claims[0]!.data.normative;
    model.claims[0]!.data.claim_type = "recommendation";
    model.claims[0]!.data.conditions = [
      { statement: "The synthetic API boundary applies.", concept_ids: [], scope: "edge-local" },
    ];
    model.claims[0]!.data.statement = statement;
    implication(model).statement = statement;
    implication(model).kind = "operational-recommendation";
    expect(validateSecurityClaimBindings(model)).toEqual([]);
  });

  it("encodes the production OAuth and OIDC qualifiers as governed fields", async () => {
    const model = await loadRepository(process.cwd());
    const claims = new Map(model.claims.map((claim) => [claim.id, claim.data]));
    expect(claims.get("AKL-000050")?.normative).toMatchObject({ force: "must", exceptions: [] });
    expect(claims.get("AKL-000052")?.normative).toMatchObject({
      force: "must",
      exceptions: [expect.stringContaining("loopback")],
    });
    expect(claims.get("AKL-000054")?.normative).toMatchObject({
      force: "should-not",
      exceptions: [expect.stringContaining("injection")],
    });
    expect(claims.get("AKL-000056")?.normative).toMatchObject({ force: "should" });
    expect(claims.get("AKL-000059")).toMatchObject({
      predicate: "defines-access-token-role",
      statement:
        "OAuth access tokens are authorization credentials for protected-resource access, and OAuth does not require every access token to use JWT format.",
      sources: ["AKS-000017"],
      source_locations: [{ source_id: "AKS-000017", locator: "RFC 6749 Section 1.4" }],
    });
    expect(claims.get("AKL-000059")?.normative).toBeUndefined();
    expect(claims.get("AKL-000063")?.statement).toContain("replayed");
    expect(claims.get("AKL-000061")).toMatchObject({
      predicate: "requires-id-token-issuer-validation",
      normative: { force: "must", exceptions: [] },
    });
    expect(claims.get("AKL-000062")).toMatchObject({
      claim_type: "recommendation",
      semantic_scope: "claim-context-only",
    });
    expect(claims.get("AKL-000062")?.normative).toBeUndefined();
    expect(claims.get("AKL-000065")?.normative).toMatchObject({ force: "should" });
    expect(claims.get("AKL-000066")?.normative).toMatchObject({ force: "must" });
    expect(claims.get("AKL-000067")?.normative).toMatchObject({ force: "may" });
    expect(claims.get("AKL-000068")?.normative).toMatchObject({ force: "must" });
    expect(claims.get("AKL-000069")?.normative).toMatchObject({ force: "must" });
    for (const id of [
      "AKL-000049",
      "AKL-000050",
      "AKL-000051",
      "AKL-000052",
      "AKL-000053",
      "AKL-000054",
      "AKL-000055",
      "AKL-000056",
      "AKL-000057",
      "AKL-000058",
      "AKL-000059",
      "AKL-000060",
      "AKL-000061",
      "AKL-000062",
      "AKL-000063",
      "AKL-000064",
      "AKL-000065",
      "AKL-000066",
      "AKL-000067",
      "AKL-000068",
      "AKL-000069",
    ]) {
      const claim = claims.get(id)!;
      expect(claim.status, id).toBe("sourced");
      expect(claim.sources, id).not.toEqual([]);
      expect(
        (claim.source_locations as { source_id: string }[]).map((item) => item.source_id),
        id,
      ).toEqual(claim.sources);
    }

    const oidc = model.concepts.find((concept) => concept.id === "AKC-000018")!;
    expect(oidc.data.sources).toEqual(
      expect.arrayContaining(["AKS-000017", "AKS-000018", "AKS-000019"]),
    );
    expect(claims.get("AKL-000054")?.statement).toMatch(/^OAuth clients SHOULD NOT/u);
    expect(claims.get("AKL-000056")?.statement).toMatch(
      /^Authorization servers and resource servers SHOULD/u,
    );
    for (const id of ["AKL-000050", "AKL-000051", "AKL-000052", "AKL-000054", "AKL-000059"]) {
      expect(claims.get(id)?.applicable_concept_ids, id).toContain("AKC-000018");
    }
    expect(validateSecurityClaimBindings(model)).toEqual([]);
  });
});
