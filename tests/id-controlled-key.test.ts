import { describe, expect, it } from "vitest";

import { validateIdentities } from "../src/id-validator.js";
import { validSemanticModel } from "./helpers.js";

describe("controlled vocabulary identity validation", () => {
  it("rejects duplicate keys within one registry", async () => {
    const model = await validSemanticModel();
    model.ontology.conceptTypes.push({ ...model.ontology.conceptTypes[0] });
    expect(validateIdentities(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "ID_CONTROLLED_KEY_DUPLICATE" })]),
    );
  });
});
