import { describe, expect, it } from "vitest";

import { validateEvidence } from "../src/evidence-validator.js";
import { validateIdentities } from "../src/id-validator.js";
import { asArray, asString, isPlainObject } from "../src/io.js";
import { validateLifecycle } from "../src/lifecycle-validator.js";
import type { RecordEntry } from "../src/model.js";
import { validateRelationships } from "../src/relationship-validator.js";
import {
  allocations,
  cloneRecord,
  recordFromData,
  replaceRecord,
  validSemanticModel,
} from "./helpers.js";

describe("audit regression coverage", () => {
  it("rejects missing, duplicate, inconsistent, and orphaned ledger allocations", async () => {
    const model = await validSemanticModel();
    const rows = allocations(model);
    const first = rows[0]!;
    model.idLedger = {
      ...model.idLedger,
      allocations: [
        ...rows
          .slice(1)
          .map((allocation) =>
            allocation.id === "AKC-900002"
              ? { ...allocation, path: "knowledge/wrong-path.md" }
              : allocation,
          ),
        { ...first, record_kind: "claim" },
        { ...first, record_kind: "claim" },
        {
          id: "AKC-900099",
          record_kind: "concept",
          human_key: "orphaned-reservation",
          previous_human_keys: [],
          state: "active",
          path: "knowledge/missing.md",
          allocated_at: "2026-07-29",
          retired_at: null,
        },
      ],
    };

    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ID_LEDGER_PREFIX" }),
        expect.objectContaining({ code: "ID_LEDGER_DUPLICATE" }),
        expect.objectContaining({ code: "ID_LEDGER_PATH" }),
        expect.objectContaining({ code: "ID_LEDGER_RECORD_MISSING" }),
      ]),
    );
  });

  it("rejects unallocated and malformed records with unknown kinds", async () => {
    const model = await validSemanticModel();
    const malformed = {
      ...model.claims[0]!,
      id: "INVALID",
      recordKind: "unknown-kind",
      path: "tests/fixtures/regression/invalid-id.yaml",
    };
    model.records.push(malformed);

    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ID_FORMAT" }),
        expect.objectContaining({ code: "ID_RECORD_KIND_UNKNOWN" }),
        expect.objectContaining({ code: "ID_LEDGER_UNALLOCATED" }),
      ]),
    );
  });

  it("rejects normalized label and human-key collisions", async () => {
    const model = await validSemanticModel();
    const rows = allocations(model);
    model.idLedger = {
      ...model.idLedger,
      allocations: rows.map((allocation) =>
        allocation.id === "AKC-900002"
          ? { ...allocation, human_key: rows[0]!.human_key }
          : allocation,
      ),
    };
    model.concepts[1]!.data.title = model.concepts[0]!.data.title;

    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "ID_HUMAN_KEY_COLLISION" })]),
    );
  });

  it("rejects admitted unassessed, restricted, and unreplaced sources", async () => {
    let model = await validSemanticModel();
    model = replaceRecord(
      model,
      cloneRecord(model.sources[0]!, {
        quality: {
          ...(model.sources[0]!.data.quality as Record<string, unknown>),
          authority: "unassessed",
        },
      }),
    );
    let diagnostics = validateEvidence(model).sourceDiagnostics;
    expect(diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SOURCE_ADMITTED_UNASSESSED" })]),
    );

    model = replaceRecord(
      model,
      cloneRecord(model.sources[0]!, {
        status: "restricted",
        license_or_usage_notes: "",
      }),
    );
    diagnostics = validateEvidence(model).sourceDiagnostics;
    expect(diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SOURCE_RESTRICTED_NOTES" })]),
    );

    model = replaceRecord(
      model,
      cloneRecord(model.sources[0]!, {
        status: "superseded",
        superseded_by: null,
      }),
    );
    diagnostics = validateEvidence(model).sourceDiagnostics;
    expect(diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SOURCE_REPLACEMENT_REQUIRED" })]),
    );
  });

  it("rejects unknown, unsupported, and unconditional evidence-required claims", async () => {
    const baseline = await validSemanticModel();
    let model = replaceRecord(
      baseline,
      cloneRecord(baseline.claims[0]!, { claim_type: "unknown-type" }),
    );
    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "CLAIM_TYPE_UNKNOWN" })]),
    );

    model = replaceRecord(
      baseline,
      cloneRecord(baseline.claims[0]!, {
        claim_type: "recommendation",
        sources: [],
        derived_from_claims: [],
        conditions: [],
      }),
    );
    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CLAIM_EVIDENCE_REQUIRED" }),
        expect.objectContaining({ code: "CLAIM_CONDITIONS_REQUIRED" }),
        expect.objectContaining({ code: "CLAIM_EVIDENCE_UNGROUNDED" }),
      ]),
    );

    model = replaceRecord(
      baseline,
      cloneRecord(baseline.claims[0]!, {
        claim_type: "normalized-source-claim",
        sources: [],
        derived_from_claims: ["AKL-900001"],
      }),
    );
    expect(validateEvidence(model).claimDiagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "CLAIM_DIRECT_SOURCE_REQUIRED" })]),
    );
  });

  it("rejects duplicate, discontinuous lifecycle events and missing replacements", async () => {
    const model = await validSemanticModel();
    const event = asArray(model.lifecycleEvents.events).filter(isPlainObject)[0]!;
    model.lifecycleEvents = { ...model.lifecycleEvents, events: [event, { ...event }] };
    model.concepts[0]!.data.status = "superseded";
    model.concepts[0]!.data.superseded_by = null;

    expect(validateLifecycle(model).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "LIFECYCLE_EVENT_DUPLICATE" }),
        expect.objectContaining({ code: "LIFECYCLE_EVENT_CHAIN" }),
        expect.objectContaining({ code: "LIFECYCLE_REPLACEMENT_REQUIRED" }),
      ]),
    );
  });

  it("enforces relationship direction, conditions, evidence, kinds, and ordering", async () => {
    const model = await validSemanticModel();
    model.relationships = [
      relationshipRecord({
        id: "AKR-900010",
        subject: "AKS-900001",
        predicate: "depends-on",
        object: "AKC-900001",
        direction: "symmetric",
        conditions: [],
        evidence: ["AKC-900001"],
      }),
      relationshipRecord({
        id: "AKR-900011",
        subject: "AKC-900002",
        predicate: "conflicts-with",
        object: "AKC-900001",
      }),
      relationshipRecord({
        id: "AKR-900012",
        subject: "AKC-900001",
        predicate: "influences",
        object: "AKC-900002",
        conditions: [],
        evidence: [],
      }),
    ];

    expect(validateRelationships(model).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "REL_ENDPOINT_KIND" }),
        expect.objectContaining({ code: "REL_DIRECTION" }),
        expect.objectContaining({ code: "REL_CONDITIONS_REQUIRED" }),
        expect.objectContaining({ code: "REL_EVIDENCE_CLAIM" }),
        expect.objectContaining({ code: "REL_SYMMETRIC_ORDER" }),
        expect.objectContaining({ code: "REL_EVIDENCE_REQUIRED" }),
        expect.objectContaining({ code: "REL_INFLUENCES_UNCONDITIONAL" }),
      ]),
    );
  });

  it("detects duplicate, conflicting, ambiguous, and unknown relationship policy", async () => {
    const model = await validSemanticModel();
    const improves = relationshipRecord({
      id: "AKR-900020",
      subject: "AKC-900001",
      predicate: "improves",
      object: "AKC-900002",
    });
    const duplicate = relationshipRecord({
      ...improves.data,
      id: "AKR-900021",
    });
    const degrades = relationshipRecord({
      id: "AKR-900022",
      subject: "AKC-900001",
      predicate: "degrades",
      object: "AKC-900002",
    });
    const isA = relationshipRecord({
      id: "AKR-900023",
      subject: "AKC-900001",
      predicate: "is-a",
      object: "AKC-900004",
    });
    const specializes = relationshipRecord({
      id: "AKR-900024",
      subject: "AKC-900001",
      predicate: "specializes",
      object: "AKC-900004",
    });
    model.relationships = [improves, duplicate, degrades, isA, specializes];
    const policies = model.ontology.validationPolicies.relationship_cycles;
    if (!isPlainObject(policies) || !Array.isArray(policies.allowed)) {
      throw new Error("Relationship cycle policy fixture is unavailable.");
    }
    policies.allowed.push("unknown-predicate");

    expect(validateRelationships(model).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "REL_DUPLICATE" }),
        expect.objectContaining({ code: "REL_CONFLICTING" }),
        expect.objectContaining({ code: "REL_CLASSIFICATION_AMBIGUOUS" }),
        expect.objectContaining({ code: "REL_CYCLE_POLICY_UNKNOWN" }),
      ]),
    );
  });
});

function relationshipRecord(partial: Record<string, unknown>): RecordEntry {
  const predicate = asString(partial.predicate) ?? "depends-on";
  const symmetric = new Set([
    "related-to",
    "conflicts-with",
    "compatible-with",
    "alternative-to",
    "contradicted-by",
  ]).has(predicate);
  return recordFromData(
    {
      id: "AKR-900099",
      record_kind: "relationship",
      subject: "AKC-900001",
      predicate,
      object: "AKC-900002",
      strength: "weak",
      direction: symmetric ? "symmetric" : "directed",
      semantic_scope: "claim-context-only",
      conditions: [
        { statement: "Synthetic audit condition.", concept_ids: [], scope: "edge-local" },
      ],
      evidence: ["AKL-900001"],
      confidence: "low",
      status: "proposed",
      traversal: { eligible: false, rationale: "Synthetic relationship is not traversable." },
      notes: "Synthetic audit fixture.",
      version: 1,
      ...partial,
    },
    `tests/fixtures/regression/${String(partial.id ?? "AKR-900099")}.yaml`,
  );
}
