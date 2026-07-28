import { describe, expect, it } from "vitest";

import { isPlainObject } from "../src/io.js";
import { validateRelationships } from "../src/relationship-validator.js";
import { validSemanticModel } from "./helpers.js";

describe("relationship cycle policy registry", () => {
  it("requires exactly one cycle policy for every predicate", async () => {
    const model = await validSemanticModel();
    const policies = model.ontology.validationPolicies.relationship_cycles;
    if (!isPlainObject(policies) || !Array.isArray(policies.allowed)) {
      throw new Error("Cycle policy fixture is unavailable.");
    }
    policies.allowed = policies.allowed.filter((predicate) => predicate !== "instance-of");
    expect(validateRelationships(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "REL_CYCLE_POLICY_COVERAGE" })]),
    );
  });
});
