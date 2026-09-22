import { readFile, readdir } from "node:fs/promises";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createDecisionRecommendationValidator,
  validateDecisionRecommendation,
} from "../src/decision-recommendation-validator.js";
import { loadDecisionValidationSnapshot } from "../src/decision-validation-snapshot.js";
import { loadRepository } from "../src/model.js";
import { validateSchemas } from "../src/schema-validator.js";
import { recommendationFixture } from "./decision-recommendation-helpers.js";
import { outputScenario } from "./m7-2-output-helpers.js";

vi.mock("node:fs/promises", async (original) => {
  const actual = await original<typeof import("node:fs/promises")>();
  return { ...actual, readFile: vi.fn(actual.readFile), readdir: vi.fn(actual.readdir) };
});

afterEach(() => {
  vi.mocked(readFile).mockReset();
  vi.mocked(readdir).mockReset();
});

describe("decision validation snapshot", () => {
  let documents: ReadonlyMap<string, unknown>;
  beforeAll(async () => {
    documents = (await validateSchemas(await loadRepository(process.cwd()))).documents;
  });

  it("exposes only the checked loader through the public runtime facade", async () => {
    const facade = await import("../src/runtime-api.js");
    expect(facade.loadDecisionValidationSnapshot).toBe(loadDecisionValidationSnapshot);
    expect(facade).not.toHaveProperty("createDecisionRecommendationValidator");
    expect(facade).not.toHaveProperty("createSchemaValidator");
  });

  it("matches the legacy gate and preserves semantic rejection", async () => {
    const f = await recommendationFixture();
    const snapshot = createDecisionRecommendationValidator(f.model, documents);
    expect(await snapshot.validate(f.session, f.output)).toEqual([]);
    expect(await validateDecisionRecommendation(f.model, f.session, f.output)).toEqual([]);
    f.output.decision_basis = [];
    const diagnostics = await snapshot.validate(f.session, f.output);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: "DR_DECISION_BASIS" }));
    expect(diagnostics).toEqual(await validateDecisionRecommendation(f.model, f.session, f.output));
  });

  it("pins schema, guide and evidence and copies inputs before the first await", async () => {
    const f = await recommendationFixture();
    const docs = structuredClone(new Map(documents));
    const snapshot = createDecisionRecommendationValidator(f.model, docs);
    f.model.decisionGuides[0]!.data.version = 999;
    f.model.claims[0]!.data.status = "proposed";
    docs.clear();
    const pending = snapshot.validate(f.session, f.output);
    const validOutput = structuredClone(f.output);
    f.output.evidence_claims = [];
    f.session.guide_version = 999;
    expect(await pending).toEqual([]);
    const stale = await snapshot.validate(f.session, validOutput);
    expect(stale).toContainEqual(expect.objectContaining({ code: "DR_GUIDE_VERSION" }));
    f.session.guide_version = 1;
    expect(await snapshot.validate(f.session, f.output)).toContainEqual(
      expect.objectContaining({ code: "DR_EVIDENCE_SNAPSHOT" }),
    );
    stale[0]!.code = "FORGED";
    expect(await snapshot.validate(f.session, validOutput)).toEqual([]);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("rejects a malformed evidence model even when its fields were caller-supplied", async () => {
    const f = await recommendationFixture();
    f.model.claims[0]!.data.injected_field = true;
    const snapshot = createDecisionRecommendationValidator(f.model, documents);
    expect(await snapshot.validate(f.session, f.output)).toContainEqual(
      expect.objectContaining({ code: "SCHEMA_INSTANCE" }),
    );
  });

  it("does not accept malformed compiled schemas or coerce contract versions", async () => {
    const f = await recommendationFixture();
    const docs = new Map(documents);
    docs.set("schemas/bad.schema.json", {
      $id: "https://synthetic.invalid/absent",
      $ref: "https://synthetic.invalid/not-there",
    });
    expect(
      await createDecisionRecommendationValidator(f.model, docs).validate(f.session, f.output),
    ).toContainEqual(expect.objectContaining({ code: "SCHEMA_REFERENCE" }));
    const snapshot = createDecisionRecommendationValidator(f.model, documents);
    expect(
      await snapshot.validate({ ...f.session, contract_version: "3" }, f.output),
    ).toContainEqual(expect.objectContaining({ code: "SCHEMA_INSTANCE" }));
  });

  it("loads the real repository at startup then validates both pilot outcomes without filesystem IO", async () => {
    const model = await loadRepository(process.cwd());
    const snapshot = await loadDecisionValidationSnapshot(process.cwd());
    const selected = outputScenario(model, 2, [0]);
    const combined = outputScenario(model, 2, [0, 1]);
    vi.mocked(readFile).mockClear().mockRejectedValue(new Error("Disk unavailable after startup"));
    vi.mocked(readdir).mockClear().mockRejectedValue(new Error("Disk unavailable after startup"));
    expect(await snapshot.validate(selected.session, selected.output)).toEqual([]);
    expect(await snapshot.validate(combined.session, combined.output)).toEqual([]);
    combined.output.verification = [];
    expect(await snapshot.validate(combined.session, combined.output)).toContainEqual(
      expect.objectContaining({ code: "SCHEMA_INSTANCE" }),
    );
    expect(readFile).not.toHaveBeenCalled();
    expect(readdir).not.toHaveBeenCalled();
  });

  it("refuses startup with malformed repository data without echoing content", async () => {
    vi.mocked(readFile).mockResolvedValue("private-invalid-json");
    await expect(loadDecisionValidationSnapshot(process.cwd())).rejects.toThrow(
      "DECISION_SNAPSHOT_INVALID",
    );
  });

  it("refuses startup if the complete kernel reports a lifecycle error", async () => {
    const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    vi.mocked(readFile).mockImplementation(async (...args: Parameters<typeof readFile>) => {
      const value = await actual.readFile(...args);
      if (String(args[0]).replaceAll("\\", "/").endsWith("/governance/lifecycle-events.yaml"))
        return String(value).replace("actor_type: human", "actor_type: automation");
      return value;
    });
    await expect(loadDecisionValidationSnapshot(process.cwd())).rejects.toThrow(
      "DECISION_SNAPSHOT_INVALID",
    );
  });
});
