import { describe, expect, it } from "vitest";

import { validateLifecycle } from "../src/lifecycle-validator.js";
import { asArray, isPlainObject } from "../src/io.js";
import { validSemanticModel } from "./helpers.js";

describe("machine-readable source lifecycle registry", () => {
  it("drives transition acceptance from the governed registry", async () => {
    const model = await validSemanticModel();
    model.sourceLifecycle = {
      ...model.sourceLifecycle,
      transitions: asArray(model.sourceLifecycle.transitions)
        .filter(isPlainObject)
        .filter((transition) => !(transition.from === "candidate" && transition.to === "approved")),
    };
    expect(validateLifecycle(model).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "LIFECYCLE_TRANSITION_INVALID",
          severity: "error",
          path: "governance/lifecycle-events.yaml",
        }),
      ]),
    );
  });

  it("rejects outgoing transitions from terminal states", async () => {
    const model = await validSemanticModel();
    model.sourceLifecycle = {
      ...model.sourceLifecycle,
      transitions: [
        ...asArray(model.sourceLifecycle.transitions),
        { from: "rejected", to: "candidate", authority: "human-only" },
      ],
    };
    expect(validateLifecycle(model).diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SOURCE_LIFECYCLE_TERMINAL_TRANSITION" }),
      ]),
    );
  });

  it("detects drift between lifecycle states and source status vocabulary", async () => {
    const model = await validSemanticModel();
    model.sourceLifecycle = {
      ...model.sourceLifecycle,
      states: asArray(model.sourceLifecycle.states).filter(
        (state) => !isPlainObject(state) || state.key !== "restricted",
      ),
    };
    expect(validateLifecycle(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SOURCE_LIFECYCLE_STATUS_DRIFT" })]),
    );
  });
});
