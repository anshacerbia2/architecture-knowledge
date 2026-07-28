import { describe, expect, it } from "vitest";

import { validateLifecycle } from "../src/lifecycle-validator.js";
import { asArray, isPlainObject } from "../src/io.js";
import { validSemanticModel } from "./helpers.js";

describe("lifecycle authority validation", () => {
  it("accepts an explicitly authorized human source-admission event", async () => {
    expect(validateLifecycle(await validSemanticModel()).diagnostics).toEqual([]);
  });

  it("rejects an unauthorized human-only transition", async () => {
    const model = await validSemanticModel();
    const events = asArray(model.lifecycleEvents.events).filter(isPlainObject);
    model.lifecycleEvents = {
      ...model.lifecycleEvents,
      events: events.map((event) => ({
        ...event,
        actor_type: "automation",
        human_authorized: false,
        authorization_evidence: null,
      })),
    };
    expect(validateLifecycle(model).diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "LIFECYCLE_HUMAN_AUTHORIZATION" })]),
    );
  });

  it("rejects an invalid transition and unexplained final status", async () => {
    const model = await validSemanticModel();
    model.lifecycleEvents = {
      ...model.lifecycleEvents,
      events: [
        {
          event_id: "LCE-900002",
          record_id: "AKS-900001",
          lifecycle_kind: "source",
          from: "candidate",
          to: "published",
          actor: "Synthetic actor",
          actor_type: "automation",
          human_authorized: false,
          authorization_evidence: null,
          occurred_at: "2026-07-29T00:00:00Z",
        },
      ],
    };
    const codes = validateLifecycle(model).diagnostics.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining(["LIFECYCLE_TRANSITION_INVALID", "LIFECYCLE_STATUS_UNEXPLAINED"]),
    );
  });
});
