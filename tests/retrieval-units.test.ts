import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { checkRetrievalArtifacts } from "../src/retrieval-artifacts.js";
import { buildGraphArtifacts } from "../src/graph-projector.js";
import { loadRepository } from "../src/model.js";
import type { RepositoryModel } from "../src/model.js";
import { recordFromData } from "./helpers.js";
import {
  buildRetrievalArtifacts,
  estimateTokens,
  normalizeRetrievalText,
  splitSemanticText,
} from "../src/retrieval-units.js";

describe("M5 deterministic retrieval units", () => {
  let artifacts: ReturnType<typeof buildRetrievalArtifacts>;
  let model: RepositoryModel;
  let graph: ReturnType<typeof buildGraphArtifacts>;

  beforeAll(async () => {
    model = await loadRepository(process.cwd());
    graph = buildGraphArtifacts(model);
    artifacts = buildRetrievalArtifacts(graph);
  });

  it("generates every required family with stable unique IDs", () => {
    expect(artifacts.manifest.unit_counts).toMatchObject({
      "concept-overview": 24,
      claim: 69,
      relationship: 24,
      source: 22,
    });
    expect(artifacts.manifest.unit_counts["concept-section"]).toBeGreaterThan(0);
    expect(new Set(artifacts.units.map((unit) => unit.unit_id)).size).toBe(artifacts.units.length);
    expect(artifacts.units.every((unit) => unit.retrieval_text.length > 0)).toBe(true);
    expect(artifacts.manifest.estimated_token_total).toBe(
      artifacts.units.reduce((sum, unit) => sum + unit.estimated_tokens, 0),
    );
    const overview = artifacts.units.find((unit) => unit.unit_kind === "concept-overview")!;
    expect(overview).toMatchObject({
      source_path: expect.any(String),
      metadata: {
        title: expect.any(String),
        human_key: expect.any(String),
        concept_type: expect.any(String),
        domain: expect.any(String),
        status: expect.any(String),
      },
    });
    expect(overview.lifecycle_status).toBe(overview.metadata.status);
  });

  it("keeps claims atomic and preserves exact evidence locators", () => {
    const claims = artifacts.units.filter((unit) => unit.unit_kind === "claim");
    expect(claims).toHaveLength(69);
    expect(claims.every((unit) => unit.ordinal === 0)).toBe(true);
    const issuer = claims.find((unit) => unit.record_id === "AKL-000061");
    expect(issuer?.metadata.source_locations).toEqual([
      { source_id: "AKS-000019", locator: "OpenID Connect Core Section 3.1.3.7, item 2" },
    ]);
    expect(issuer?.citations[0]?.locators).toEqual(issuer?.metadata.source_locations);
  });

  it("preserves relationship conditions, strength, and traversal exclusions", () => {
    const excluded = artifacts.units.find((unit) => unit.record_id === "AKR-000010");
    expect(excluded).toMatchObject({
      unit_kind: "relationship",
      metadata: { strength: "moderate", traversal_eligible: false },
    });
    expect((excluded?.metadata.conditions as unknown[]).length).toBeGreaterThan(0);
    expect(excluded?.metadata.traversal_exclusion_reason).toBeTruthy();
  });

  it("creates cited, authority-preserving units for first-class decision guides", () => {
    const changedModel = structuredClone(model);
    const guide = recordFromData(
      {
        id: "AKG-900001",
        record_kind: "decision-guide",
        title: "Synthetic retrieval decision guide",
        decision_question: "Which bounded option?",
        status: "proposed",
        evidence: ["AKL-000061"],
        options: [{ concept_id: "AKC-000018", label: "Synthetic option" }],
        constraints: [],
        assumptions: [],
        quality_attributes: [],
        evaluation_criteria: [],
        tradeoff_matrix: [],
        disqualifiers: [],
        risk_questions: [],
        recommended_when: [],
        avoid_when: [],
        evolution_triggers: [],
        uncertainty_policy: { missing_evidence: "insufficient-evidence" },
        privacy: { session_persistence: "ephemeral-only" },
        authority: {
          recommendation_only: true,
          human_decision_required: true,
          automation_may_approve: false,
        },
      },
      "tests/fixtures/synthetic/AKG-900001.yaml",
    );
    changedModel.records.push(guide);
    changedModel.decisionGuides = [guide];
    const changed = buildRetrievalArtifacts(buildGraphArtifacts(changedModel));
    expect(changed.manifest.unit_counts["decision-guide-overview"]).toBe(1);
    const overview = changed.units.find((unit) => unit.unit_kind === "decision-guide-overview");
    expect(overview).toMatchObject({
      record_id: "AKG-900001",
      lifecycle_status: "proposed",
      metadata: { recommendation_only: true, human_decision_required: true },
      citations: [expect.objectContaining({ source_id: "AKS-000019" })],
    });
    expect(changed.units.some((unit) => unit.unit_kind === "decision-guide-section")).toBe(true);
  });

  it("is byte deterministic", () => {
    const second = buildRetrievalArtifacts(graph);
    expect([...second.files]).toEqual([...artifacts.files]);
    expect(second.manifest.manifest_root_hash).toBe(artifacts.manifest.manifest_root_hash);
  });

  it("changes content and manifest hashes without changing semantic unit identity", () => {
    const changedModel = structuredClone(model);
    const concept = changedModel.concepts.find((item) => item.id === "AKC-000014")!;
    concept.data.summary = String(concept.data.summary) + " changed";
    const changed = buildRetrievalArtifacts(buildGraphArtifacts(changedModel));
    const before = artifacts.units.find(
      (unit) => unit.unit_id === "ru:AKC-000014:concept-overview:overview:0",
    )!;
    const after = changed.units.find((unit) => unit.unit_id === before.unit_id)!;
    expect(after.unit_id).toBe(before.unit_id);
    expect(after.content_hash).not.toBe(before.content_hash);
    expect(changed.manifest.manifest_root_hash).not.toBe(artifacts.manifest.manifest_root_hash);
  });

  it("splits oversized semantic text deterministically without random overlap", () => {
    const text = ["identity", "a".repeat(16), "b".repeat(16)].join("\n");
    expect(splitSemanticText(text, 4)).toEqual(splitSemanticText(text, 4));
    expect(splitSemanticText(text, 4).every((part) => part.length <= 16)).toBe(true);
    expect(() => splitSemanticText(text, 0)).toThrow("RETRIEVAL_UNIT_LIMIT_INVALID");
    expect(splitSemanticText("1234", 1)).toEqual(["1234"]);
    expect(splitSemanticText("x".repeat(41), 4)).toEqual([
      "x".repeat(16),
      "x".repeat(16),
      "x".repeat(9),
    ]);
    expect(normalizeRetrievalText(" a\r\n b  ")).toBe("a\nb");
    expect(estimateTokens("")).toBe(1);
    expect(estimateTokens("12345")).toBe(2);
  });

  it("rejects graph artifacts without a governed input fingerprint", () => {
    const invalid = structuredClone(graph);
    invalid.manifest.input_fingerprint = "";
    expect(() => buildRetrievalArtifacts(invalid)).toThrow("RETRIEVAL_GRAPH_FINGERPRINT_MISSING");
  });

  it("detects missing and stale committed artifacts", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "aks-retrieval-units-"));
    const missing = await checkRetrievalArtifacts(directory, artifacts);
    expect(missing.every((item) => item.status === "missing")).toBe(true);
    for (const [relative, contents] of artifacts.files) {
      const target = path.join(directory, relative);
      await import("node:fs/promises").then(({ mkdir }) =>
        mkdir(path.dirname(target), { recursive: true }),
      );
      await writeFile(target, contents, "utf8");
    }
    const target = path.join(directory, "generated/retrieval/manifest.json");
    await writeFile(
      target,
      (await readFile(target, "utf8")).replace("retrieval-manifest", "tampered"),
      "utf8",
    );
    expect(
      (await checkRetrievalArtifacts(directory, artifacts)).some((item) => item.status === "stale"),
    ).toBe(true);
  });
});
