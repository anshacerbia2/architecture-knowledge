import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateDecisionGuides } from "../src/decision-guide-validator.js";
import { validateSchemas } from "../src/schema-validator.js";
import type { RepositoryModel } from "../src/model.js";
import { recordFromData } from "./helpers.js";
import { guideModel } from "./decision-guide-helpers.js";
import { recommendationFixture } from "./decision-recommendation-helpers.js";

describe("decision-guide validation kernel", () => {
  it("accepts a complete, sourced, applicable synthetic guide", async () => {
    const model = await guideModel();
    expect(validateDecisionGuides(model).diagnostics).toEqual([]);
    model.governedFiles.push({
      path: "tests/fixtures/synthetic/decision-guide.yaml",
      absolutePath: path.join(process.cwd(), "tests/fixtures/synthetic/decision-guide.yaml"),
      schemaRef: "schemas/decision-guide.schema.json",
      data: model.decisionGuides[0]!.data,
      format: "yaml",
    });
    expect(
      (await validateSchemas(model)).diagnostics.filter((item) => item.severity === "error"),
    ).toEqual([]);
  });

  it("rejects incomplete and duplicate matrix coordinates", async () => {
    const model = await guideModel();
    const guide = model.decisionGuides[0]!;
    const matrix = structuredClone(guide.data.tradeoff_matrix) as unknown[];
    matrix[1] = structuredClone(matrix[0]);
    guide.data.tradeoff_matrix = matrix;
    expect(codes(model)).toEqual(
      expect.arrayContaining(["DG_MATRIX_DUPLICATE_CELL", "DG_MATRIX_MISSING_CELL"]),
    );
  });

  it("rejects undeclared matrix coordinates and unresolved bound claims", async () => {
    const model = await guideModel();
    const guide = model.decisionGuides[0]!;
    (guide.data.tradeoff_matrix as Array<Record<string, unknown>>)[0]!.criterion = "undeclared";
    (guide.data.risk_questions as Array<Record<string, unknown>>)[0]!.claim_ids = ["AKL-999999"];
    guide.data.evidence = ["AKL-900001", "AKL-999999"];
    expect(codes(model)).toEqual(
      expect.arrayContaining([
        "DG_MATRIX_UNEXPECTED_CELL",
        "DG_MATRIX_MISSING_CELL",
        "DG_CLAIM_UNRESOLVED",
      ]),
    );
  });

  it("rejects unresolved and unused evidence inventory entries", async () => {
    const model = await guideModel();
    model.decisionGuides[0]!.data.evidence = ["AKL-999998"];
    expect(codes(model)).toEqual(
      expect.arrayContaining(["DG_EVIDENCE_INVENTORY_MISSING", "DG_EVIDENCE_INVENTORY_UNUSED"]),
    );
  });

  it("rejects claims that are unsourced, ungrounded, inapplicable, or lose conditions", async () => {
    const model = await guideModel();
    const claim = model.claims[0]!;
    claim.data.status = "proposed";
    claim.data.sources = [];
    claim.data.subject = "AKC-999999";
    claim.data.applicable_concept_ids = [];
    const guide = model.decisionGuides[0]!;
    (guide.data.constraints as Array<Record<string, unknown>>)[0]!.conditions = [];
    expect(codes(model)).toEqual(
      expect.arrayContaining([
        "DG_CLAIM_NOT_SOURCED",
        "DG_CLAIM_NOT_GROUNDED",
        "DG_CLAIM_APPLICABILITY",
        "DG_CLAIM_CONDITION_LOST",
      ]),
    );
  });

  it("requires every derivation branch to be transitively admitted and acyclic", async () => {
    const model = await guideModel();
    const root = model.claims[0]!;
    const unsupported = recordFromData(
      {
        ...structuredClone(root.data),
        id: "AKL-900002",
        sources: [],
        derived_from_claims: [root.id],
      },
      "tests/fixtures/synthetic/AKL-900002.yaml",
    );
    root.data.derived_from_claims = [unsupported.id];
    model.claims.push(unsupported);
    model.records.push(unsupported);
    expect(codes(model)).toContain("DG_CLAIM_NOT_GROUNDED");
  });

  it("enforces concept types, declared options, unique keys, and privacy classifications", async () => {
    const model = await guideModel();
    const guide = model.decisionGuides[0]!;
    (guide.data.constraints as Array<Record<string, unknown>>)[0]!.concept_id = "AKC-900002";
    (guide.data.risk_questions as Array<Record<string, unknown>>)[0]!.affected_option_ids = [
      "AKC-999999",
    ];
    (guide.data.context_variables as Array<Record<string, unknown>>).push(
      structuredClone((guide.data.context_variables as unknown[])[0]) as Record<string, unknown>,
    );
    (guide.data.privacy as Record<string, unknown>).allowed_context_classifications = ["public"];
    expect(codes(model)).toEqual(
      expect.arrayContaining([
        "DG_CONCEPT_TYPE",
        "DG_OPTION_UNDECLARED",
        "DG_CONTEXT_KEY_DUPLICATE",
        "DG_PRIVACY_CLASSIFICATION",
      ]),
    );
  });

  it("validates separate ephemeral session, recommendation, and draft-artifact contracts", async () => {
    const model = await guideModel();
    const authority = {
      recommendation_only: true,
      human_decision_required: true,
      automation_may_approve: false,
    };
    const contracts: Array<[string, string, Record<string, unknown>]> = [
      [
        "decision-session",
        "schemas/decision-session.schema.json",
        {
          contract_version: 1,
          session_id: "11111111-1111-4111-8111-111111111111",
          guide_id: "AKG-900001",
          context: [
            {
              key: "classification",
              value: "one",
              classification: "internal",
              provenance: "human-provided",
              confirmed_by_human: true,
            },
          ],
          drivers: [{ concept_id: "AKC-900002", role: "quality-attribute", priority: "high" }],
          constraints: [{ concept_id: "AKC-900005", satisfied: null, notes: null }],
          privacy: {
            persistence: "ephemeral-only",
            external_provider_authorized: false,
            external_provider_authorization: null,
            redacted_keys: [],
          },
          authority,
        },
      ],
      [
        "decision-recommendation",
        "schemas/decision-recommendation.schema.json",
        {
          contract_version: 1,
          session_id: "11111111-1111-4111-8111-111111111111",
          guide_id: "AKG-900001",
          status: "multiple-viable-options",
          applicable_context: [
            {
              key: "classification",
              value: "one",
              classification: "internal",
              provenance: "human-provided",
              confirmed_by_human: true,
            },
          ],
          constraint_results: [
            {
              concept_id: "AKC-900005",
              hardness: "hard",
              status: "satisfied",
              rationale: "The synthetic constraint is satisfied.",
              claim_ids: ["AKL-900001"],
            },
          ],
          viable_options: ["AKC-900001", "AKC-900004"],
          rejected_options: [],
          tradeoffs: [
            {
              statement: "Synthetic trade-off.",
              claim_ids: ["AKL-900001"],
              option_ids: ["AKC-900001"],
            },
          ],
          risks: [],
          uncertainty: [],
          verification: [
            {
              statement: "Synthetic verification.",
              claim_ids: ["AKL-900001"],
              option_ids: ["AKC-900001"],
            },
          ],
          evolution_triggers: [],
          claim_ids: ["AKL-900001"],
          source_ids: ["AKS-900001"],
          authority,
        },
      ],
      [
        "decision-artifact-draft",
        "schemas/decision-artifact-draft.schema.json",
        {
          contract_version: 1,
          format: "adr",
          status: "draft",
          title: "Synthetic draft",
          sections: [{ key: "context", content: "Synthetic only.", claim_ids: ["AKL-900001"] }],
          guide_id: "AKG-900001",
          session_id: "11111111-1111-4111-8111-111111111111",
          claim_ids: ["AKL-900001"],
          source_ids: ["AKS-900001"],
          authority: {
            draft_only: true,
            human_acceptance_required: true,
            automation_may_approve: false,
          },
        },
      ],
    ];
    for (const [name, schemaRef, data] of contracts) {
      if (name === "decision-session") {
        data.contract_version = 3;
        data.guide_version = 1;
        data.condition_evaluations = [];
      }
      if (name === "decision-recommendation") {
        data.contract_version = 4;
        data.inapplicable_options = [];
        data.guide_version = 1;
        data.decision_basis = [];
        data.evidence_claims = [structuredClone(model.claims[0]!.data)];
      }
      model.governedFiles.push({
        path: `tests/fixtures/synthetic/${name}.json`,
        absolutePath: path.join(process.cwd(), `tests/fixtures/synthetic/${name}.json`),
        schemaRef,
        data,
        format: "json",
      });
    }
    expect(
      (await validateSchemas(model)).diagnostics.filter((item) => item.severity === "error"),
    ).toEqual([]);
  });

  it("rejects evidence-free recommendations and unscoped provider authorization", async () => {
    const fixture = await recommendationFixture();
    const model = fixture.model;
    model.governedFiles.push(
      {
        path: "tests/fixtures/synthetic/invalid-recommendation.json",
        absolutePath: path.join(
          process.cwd(),
          "tests/fixtures/synthetic/invalid-recommendation.json",
        ),
        schemaRef: "schemas/decision-recommendation.schema.json",
        format: "json",
        data: structuredClone(fixture.output),
      },
      {
        path: "tests/fixtures/synthetic/invalid-provider-authorization.json",
        absolutePath: path.join(
          process.cwd(),
          "tests/fixtures/synthetic/invalid-provider-authorization.json",
        ),
        schemaRef: "schemas/decision-session.schema.json",
        format: "json",
        data: structuredClone(fixture.session),
      },
    );
    // Start from current, schema-valid controls: an obsolete version must not
    // accidentally satisfy these evidence/privacy rejection assertions.
    const recommendationFile = model.governedFiles.find((file) =>
      file.path.endsWith("invalid-recommendation.json"),
    )!;
    const sessionFile = model.governedFiles.find((file) =>
      file.path.endsWith("invalid-provider-authorization.json"),
    )!;
    expect((await validateSchemas(model)).diagnostics).toEqual([]);
    (recommendationFile.data as Record<string, unknown>).claim_ids = [];
    (
      (sessionFile.data as Record<string, unknown>).privacy as Record<string, unknown>
    ).external_provider_authorized = true;
    const diagnostics = (await validateSchemas(model)).diagnostics;
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_INSTANCE",
          path: "tests/fixtures/synthetic/invalid-recommendation.json",
          pointer: "/claim_ids",
        }),
        expect.objectContaining({
          code: "SCHEMA_INSTANCE",
          path: "tests/fixtures/synthetic/invalid-provider-authorization.json",
          pointer: "/privacy/external_provider_authorization",
        }),
      ]),
    );
  });

  it("rejects a draft contract that grants automation approval authority", async () => {
    const model = await guideModel();
    model.governedFiles.push({
      path: "tests/fixtures/synthetic/invalid-draft.json",
      absolutePath: path.join(process.cwd(), "tests/fixtures/synthetic/invalid-draft.json"),
      schemaRef: "schemas/decision-artifact-draft.schema.json",
      format: "json",
      data: {
        contract_version: 1,
        format: "adr",
        status: "draft",
        title: "Invalid synthetic draft",
        sections: [{ key: "context", content: "Synthetic.", claim_ids: [] }],
        guide_id: "AKG-900001",
        session_id: "11111111-1111-4111-8111-111111111111",
        claim_ids: [],
        source_ids: [],
        authority: {
          draft_only: true,
          human_acceptance_required: true,
          automation_may_approve: true,
        },
      },
    });
    expect((await validateSchemas(model)).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_INSTANCE",
          path: "tests/fixtures/synthetic/invalid-draft.json",
        }),
      ]),
    );
  });
});

function codes(model: RepositoryModel): string[] {
  return validateDecisionGuides(model).diagnostics.map((item) => item.code);
}
