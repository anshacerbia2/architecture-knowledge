import { asArray, asString, isPlainObject } from "./io.js";
import { diagnostic, type Diagnostic } from "./diagnostics.js";
import type { RecordEntry, RepositoryModel } from "./model.js";

const sourceTransitions = new Map<string, Set<string>>([
  ["candidate", new Set(["approved", "restricted", "rejected"])],
  ["approved", new Set(["restricted", "deprecated", "superseded"])],
  ["restricted", new Set(["approved", "deprecated", "rejected", "superseded"])],
  ["deprecated", new Set(["superseded"])],
]);

const sourceHumanOnlyTargets = new Set([
  "approved",
  "restricted",
  "rejected",
  "deprecated",
  "superseded",
]);

export interface LifecycleAnalysis {
  diagnostics: Diagnostic[];
  distribution: Record<string, number>;
}

export function validateLifecycle(model: RepositoryModel): LifecycleAnalysis {
  const diagnostics: Diagnostic[] = [];
  const distribution: Record<string, number> = {};
  const contentTransitions = new Map<string, Map<string, string>>();
  for (const transition of asArray(model.ontology.lifecycle.transitions).filter(isPlainObject)) {
    const from = asString(transition.from);
    const to = asString(transition.to);
    const authority = asString(transition.authority);
    if (from && to && authority) {
      const targets = contentTransitions.get(from) ?? new Map<string, string>();
      targets.set(to, authority);
      contentTransitions.set(from, targets);
    }
  }

  const events = asArray(model.lifecycleEvents.events).filter(isPlainObject);
  const eventIds = new Set<string>();
  for (const event of events) {
    const eventId = asString(event.event_id);
    if (eventId && eventIds.has(eventId)) {
      diagnostics.push(
        diagnostic(
          "LIFECYCLE_EVENT_DUPLICATE",
          "error",
          "governance/lifecycle-events.yaml",
          `Lifecycle event '${eventId}' is duplicated.`,
        ),
      );
    }
    if (eventId) {
      eventIds.add(eventId);
    }
  }

  for (const record of model.records) {
    const status = asString(record.data.status) ?? "missing";
    const key = `${record.recordKind}:${status}`;
    distribution[key] = (distribution[key] ?? 0) + 1;
    const lifecycleKind = record.recordKind === "source" ? "source" : "content";
    const recordEvents = events
      .filter(
        (event) =>
          asString(event.record_id) === record.id &&
          asString(event.lifecycle_kind) === lifecycleKind,
      )
      .sort((left, right) =>
        (asString(left.occurred_at) ?? "").localeCompare(asString(right.occurred_at) ?? ""),
      );
    validateRecordLifecycle(
      record,
      lifecycleKind,
      status,
      recordEvents,
      contentTransitions,
      diagnostics,
    );
  }

  return {
    diagnostics,
    distribution: Object.fromEntries(
      Object.entries(distribution).sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
}

function validateRecordLifecycle(
  record: RecordEntry,
  lifecycleKind: "content" | "source",
  currentStatus: string,
  events: Record<string, unknown>[],
  contentTransitions: Map<string, Map<string, string>>,
  diagnostics: Diagnostic[],
): void {
  let expected = lifecycleKind === "source" ? "candidate" : "proposed";
  for (const event of events) {
    const from = asString(event.from);
    const to = asString(event.to);
    if (from !== expected) {
      diagnostics.push(
        diagnostic(
          "LIFECYCLE_EVENT_CHAIN",
          "error",
          "governance/lifecycle-events.yaml",
          `Record '${record.id}' event starts at '${from ?? "missing"}', expected '${expected}'.`,
        ),
      );
    }
    const authority =
      lifecycleKind === "content"
        ? contentTransitions.get(from ?? "")?.get(to ?? "")
        : sourceTransitions.get(from ?? "")?.has(to ?? "")
          ? sourceHumanOnlyTargets.has(to ?? "")
            ? "human-only"
            : "automation-or-human"
          : undefined;
    if (!authority) {
      diagnostics.push(
        diagnostic(
          "LIFECYCLE_TRANSITION_INVALID",
          "error",
          "governance/lifecycle-events.yaml",
          `Transition '${from ?? "missing"} -> ${to ?? "missing"}' is not allowed for ${lifecycleKind} records.`,
        ),
      );
    }
    if (authority === "human-only") {
      const authorized =
        event.actor_type === "human" &&
        event.human_authorized === true &&
        (asString(event.authorization_evidence)?.trim().length ?? 0) > 0;
      if (!authorized) {
        diagnostics.push(
          diagnostic(
            "LIFECYCLE_HUMAN_AUTHORIZATION",
            "error",
            "governance/lifecycle-events.yaml",
            `Human-only transition '${from} -> ${to}' for '${record.id}' lacks explicit human authorization evidence.`,
          ),
        );
      }
    }
    expected = to ?? expected;
  }
  if (expected !== currentStatus) {
    diagnostics.push(
      diagnostic(
        "LIFECYCLE_STATUS_UNEXPLAINED",
        "error",
        record.path,
        `Status '${currentStatus}' is not explained by lifecycle events; expected '${expected}'.`,
      ),
    );
  }
  if (currentStatus === "superseded" && !asString(record.data.superseded_by)) {
    diagnostics.push(
      diagnostic(
        "LIFECYCLE_REPLACEMENT_REQUIRED",
        "error",
        record.path,
        `Superseded record '${record.id}' must identify a replacement.`,
      ),
    );
  }
}
