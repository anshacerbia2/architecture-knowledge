import { describe, expect, it } from "vitest";

import { validateIdentities } from "../src/id-validator.js";
import { asArray, isPlainObject } from "../src/io.js";
import { loadRepository } from "../src/model.js";
import { validateSchemas } from "../src/schema-validator.js";
import { allocations, validSemanticModel } from "./helpers.js";

describe("active concept human keys", () => {
  it("rejects a null human_key for an active concept allocation", async () => {
    const model = await validSemanticModel();
    model.idLedger = {
      ...model.idLedger,
      allocations: allocations(model).map((allocation) =>
        allocation.id === "AKC-900001" ? { ...allocation, human_key: null } : allocation,
      ),
    };

    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "ID_HUMAN_KEY_REQUIRED" })]),
    );
  });

  it("enforces the same rule through the ledger schema", async () => {
    const model = await loadRepository(process.cwd());
    const ledger = model.governedFiles.find((file) => file.path === "ids/ledger.yaml");
    if (!ledger || !isPlainObject(ledger.data)) {
      throw new Error("ID ledger fixture is unavailable.");
    }
    ledger.data.allocations = [
      {
        id: "AKC-900001",
        record_kind: "concept",
        human_key: null,
        state: "active",
        path: null,
        allocated_at: "2026-07-29",
        retired_at: null,
      },
    ];

    expect((await validateSchemas(model)).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SCHEMA_INSTANCE", path: "ids/ledger.yaml" }),
      ]),
    );
  });

  it("allows a null human_key for a non-concept allocation", async () => {
    const model = await validSemanticModel();
    const rows = asArray(model.idLedger.allocations).filter(isPlainObject);
    model.idLedger = {
      ...model.idLedger,
      allocations: rows.map((allocation) =>
        allocation.id === "AKL-900001" ? { ...allocation, human_key: null } : allocation,
      ),
    };

    expect(validateIdentities(model).diagnostics).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "ID_HUMAN_KEY_REQUIRED" })]),
    );
  });
});
