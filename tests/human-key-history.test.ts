import { describe, expect, it } from "vitest";

import { validateIdentities } from "../src/id-validator.js";
import { allocations, validSemanticModel } from "./helpers.js";

describe("human key history and lookup invariants", () => {
  it("keeps current and previous keys resolvable to the same opaque ID", async () => {
    const model = await validSemanticModel();
    model.idLedger = {
      ...model.idLedger,
      allocations: allocations(model).map((allocation) =>
        allocation.id === "AKC-900001"
          ? {
              ...allocation,
              human_key: "renamed-concept",
              previous_human_keys: ["fixture-01"],
            }
          : allocation,
      ),
    };
    const analysis = validateIdentities(model);
    expect(analysis.diagnostics).toEqual([]);
    expect(analysis.humanKeyLookup).toEqual(
      expect.arrayContaining([
        { key: "renamed-concept", id: "AKC-900001", current: true },
        { key: "fixture-01", id: "AKC-900001", current: false },
      ]),
    );
  });

  it("prevents an old key from being assigned to another concept", async () => {
    const model = await validSemanticModel();
    model.idLedger = {
      ...model.idLedger,
      allocations: allocations(model).map((allocation) => {
        if (allocation.id === "AKC-900001") {
          return {
            ...allocation,
            human_key: "renamed-concept",
            previous_human_keys: ["fixture-01"],
          };
        }
        return allocation.id === "AKC-900002"
          ? { ...allocation, human_key: "fixture-01" }
          : allocation;
      }),
    };
    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "ID_HUMAN_KEY_COLLISION" })]),
    );
  });

  it("reserves retired keys against silent reuse", async () => {
    const model = await validSemanticModel();
    model.idLedger = {
      ...model.idLedger,
      allocations: [
        ...allocations(model),
        {
          id: "AKC-999999",
          record_kind: "concept",
          human_key: "fixture-01",
          previous_human_keys: [],
          state: "retired",
          path: null,
          allocated_at: "2026-07-28",
          retired_at: "2026-07-29",
        },
      ],
    };
    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "ID_HUMAN_KEY_REUSED" })]),
    );
  });

  it("rejects an alias colliding with another active human key", async () => {
    const model = await validSemanticModel();
    model.concepts[1]!.data.aliases = ["Fixture 01"];
    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "ID_HUMAN_KEY_COLLISION" })]),
    );
  });
});
