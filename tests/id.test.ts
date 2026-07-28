import { describe, expect, it } from "vitest";

import { validateIdentities } from "../src/id-validator.js";
import { allocations, cloneRecord, replaceRecord, validSemanticModel } from "./helpers.js";

describe("identity validation", () => {
  it("accepts globally unique allocated records and references", async () => {
    const result = validateIdentities(await validSemanticModel());
    expect(result.diagnostics.filter((item) => item.severity === "error")).toEqual([]);
  });

  it("rejects duplicate IDs, wrong prefixes, and unresolved references", async () => {
    const model = await validSemanticModel();
    const original = model.concepts[0]!;
    const duplicate = {
      ...original,
      path: "tests/fixtures/invalid/duplicate.md",
      data: { ...original.data, title: "Duplicate title" },
    };
    model.records.push(duplicate);
    model.concepts.push(duplicate);
    const claim = cloneRecord(model.claims[0]!, {
      sources: ["AKS-999999"],
    });
    const changed = replaceRecord(model, claim);
    changed.records.push({
      ...model.claims[0]!,
      id: "AKC-900099",
      path: "tests/fixtures/invalid/wrong-prefix.yaml",
    });
    const codes = validateIdentities(changed).diagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining(["ID_DUPLICATE", "ID_PREFIX", "ID_REFERENCE_UNRESOLVED"]),
    );
  });

  it("rejects reuse of a retired allocation", async () => {
    const model = await validSemanticModel();
    const ledger = allocations(model).map((entry) =>
      entry.id === "AKC-900001" ? { ...entry, state: "retired", retired_at: "2026-07-29" } : entry,
    );
    model.idLedger = { ...model.idLedger, allocations: ledger };
    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "ID_RETIRED_REUSED" })]),
    );
  });
});
