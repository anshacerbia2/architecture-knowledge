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
    expect(claims.get("AKL-000061")?.normative).toMatchObject({
      force: "must",
      exceptions: expect.arrayContaining([
        expect.stringContaining("authorized-party"),
        expect.stringContaining("nonce"),
      ]),
    });
    expect(claims.get("AKL-000062")?.normative).toMatchObject({ force: "must-not" });
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
    expect(validateSecurityClaimBindings(model)).toEqual([]);
  });
});
