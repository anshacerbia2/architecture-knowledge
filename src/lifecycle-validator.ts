import { diagnostic, type Diagnostic } from "./diagnostics.js";
import { asArray, asString, isPlainObject } from "./io.js";
import type { RecordEntry, RepositoryModel } from "./model.js";

export interface LifecycleAnalysis {
  diagnostics: Diagnostic[];
  distribution: Record<string, number>;
}

export function validateLifecycle(model: RepositoryModel): LifecycleAnalysis {
  const diagnostics: Diagnostic[] = [];
  const distribution: Record<string, number> = {};
  const contentTransitions = transitionMap(
    asArray(model.ontology.lifecycle.transitions).filter(isPlainObject),
  );
  const sourceTransitions = transitionMap(
    asArray(model.sourceLifecycle.transitions).filter(isPlainObject),
  );
  const sourceStates = asArray(model.sourceLifecycle.states).filter(isPlainObject);
  const sourceInitial = asString(model.sourceLifecycle.initial_state) ?? "candidate";
  validateSourceLifecycleRegistry(model, sourceStates, sourceTransitions, diagnostics);

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
    if (eventId) eventIds.add(eventId);
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
      lifecycleKind === "source" ? sourceTransitions : contentTransitions,
      lifecycleKind === "source" ? sourceInitial : "proposed",
      sourceStates,
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

function transitionMap(transitions: Record<string, unknown>[]): Map<string, Map<string, string>> {
  const output = new Map<string, Map<string, string>>();
  for (const transition of transitions) {
    const from = asString(transition.from);
    const to = asString(transition.to);
    const authority = asString(transition.authority);
    if (!from || !to || !authority) continue;
    const targets = output.get(from) ?? new Map<string, string>();
    targets.set(to, authority);
    output.set(from, targets);
  }
  return output;
}

function validateSourceLifecycleRegistry(
  model: RepositoryModel,
  states: Record<string, unknown>[],
  transitions: Map<string, Map<string, string>>,
  diagnostics: Diagnostic[],
): void {
  const stateKeys = states
    .map((state) => asString(state.key))
    .filter((key): key is string => Boolean(key));
  const sourceStatusKeys = model.ontology.sourceStatuses
    .map((status) => asString(status.key))
    .filter((key): key is string => Boolean(key));
  if (!sameSet(stateKeys, sourceStatusKeys)) {
    diagnostics.push(
      diagnostic(
        "SOURCE_LIFECYCLE_STATUS_DRIFT",
        "error",
        "governance/source-lifecycle.yaml",
        "Source lifecycle states and source status registry keys differ.",
      ),
    );
  }
  const known = new Set(stateKeys);
  const initial = asString(model.sourceLifecycle.initial_state);
  if (!initial || !known.has(initial)) {
    diagnostics.push(
      diagnostic(
        "SOURCE_LIFECYCLE_INITIAL_UNKNOWN",
        "error",
        "governance/source-lifecycle.yaml",
        `Initial source state '${initial ?? "missing"}' is not registered.`,
      ),
    );
  }
  const duplicates = stateKeys.filter((key, index) => stateKeys.indexOf(key) !== index);
  for (const key of [...new Set(duplicates)].sort()) {
    diagnostics.push(
      diagnostic(
        "SOURCE_LIFECYCLE_STATE_DUPLICATE",
        "error",
        "governance/source-lifecycle.yaml",
        `Source lifecycle state '${key}' is duplicated.`,
      ),
    );
  }
  for (const [from, targets] of transitions) {
    for (const to of targets.keys()) {
      if (!known.has(from) || !known.has(to)) {
        diagnostics.push(
          diagnostic(
            "SOURCE_LIFECYCLE_TRANSITION_UNKNOWN_STATE",
            "error",
            "governance/source-lifecycle.yaml",
            `Source lifecycle transition '${from} -> ${to}' references an unknown state.`,
          ),
        );
      }
    }
  }
  for (const state of states) {
    const key = asString(state.key);
    if (key && state.terminal === true && (transitions.get(key)?.size ?? 0) > 0) {
      diagnostics.push(
        diagnostic(
          "SOURCE_LIFECYCLE_TERMINAL_TRANSITION",
          "error",
          "governance/source-lifecycle.yaml",
          `Terminal source state '${key}' cannot have outgoing transitions.`,
        ),
      );
    }
  }
}

function validateRecordLifecycle(
  record: RecordEntry,
  lifecycleKind: "content" | "source",
  currentStatus: string,
  events: Record<string, unknown>[],
  transitions: Map<string, Map<string, string>>,
  initial: string,
  sourceStates: Record<string, unknown>[],
  diagnostics: Diagnostic[],
): void {
  let expected = initial;
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
          `/events/${asString(event.event_id) ?? "unknown"}`,
        ),
      );
    }
    const authority = transitions.get(from ?? "")?.get(to ?? "");
    if (!authority) {
      diagnostics.push(
        diagnostic(
          "LIFECYCLE_TRANSITION_INVALID",
          "error",
          "governance/lifecycle-events.yaml",
          `Transition '${from ?? "missing"} -> ${to ?? "missing"}' is not allowed for ${lifecycleKind} records.`,
          `/events/${asString(event.event_id) ?? "unknown"}`,
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
            `/events/${asString(event.event_id) ?? "unknown"}`,
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
  if (
    ((lifecycleKind === "source" &&
      sourceStates.find((state) => state.key === currentStatus)?.replacement_required === true) ||
      (lifecycleKind === "content" && currentStatus === "superseded")) &&
    !asString(record.data.superseded_by)
  ) {
    diagnostics.push(
      diagnostic(
        "LIFECYCLE_REPLACEMENT_REQUIRED",
        "error",
        record.path,
        `State '${currentStatus}' for '${record.id}' requires a replacement.`,
      ),
    );
  }
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
