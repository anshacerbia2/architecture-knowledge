import { describe, expect, it } from "vitest";

import { isPlainObject } from "../src/io.js";
import { loadRepository } from "../src/model.js";
import { validateSchemas } from "../src/schema-validator.js";

describe("registry and schema consistency", () => {
  it("accepts the synchronized repository vocabulary contracts", async () => {
    const model = await loadRepository(process.cwd());
    expect((await validateSchemas(model)).diagnostics).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SCHEMA_REGISTRY_DRIFT" })]),
    );
  });

  it("rejects a new assignable concept type missing from the knowledge schema", async () => {
    const model = await loadRepository(process.cwd());
    const data = model.governedFiles.find(
      (file) => file.path === "ontology/concept-types.yaml",
    )?.data;
    if (!isPlainObject(data) || !Array.isArray(data.types)) {
      throw new Error("Concept type registry fixture is unavailable.");
    }
    const added = {
      key: "audit-probe-type",
      definition: "Synthetic registry drift probe.",
      assignable_primary: true,
    };
    data.types.push(added);
    model.ontology.conceptTypes.push(added);

    expect((await validateSchemas(model)).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_REGISTRY_DRIFT",
          path: "ontology/concept-types.yaml",
        }),
      ]),
    );
  });

  it("rejects relationship policy semantics that drift from schema conditionals", async () => {
    const model = await loadRepository(process.cwd());
    const predicate = model.ontology.relationshipTypes.find((item) => item.key === "depends-on");
    if (!predicate) {
      throw new Error("Relationship predicate fixture is unavailable.");
    }
    predicate.conditions_required = false;

    expect((await validateSchemas(model)).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SCHEMA_REGISTRY_DRIFT",
          path: "ontology/relationship-types.yaml",
        }),
      ]),
    );
  });
});
