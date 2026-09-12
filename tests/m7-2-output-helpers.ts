import { asArray, asStringArray, isPlainObject } from "../src/io.js";
import type { RepositoryModel } from "../src/model.js";
import { decisionConditionKey } from "../src/decision-guide-validator.js";

type Obj = Record<string, unknown>;
export const objects = (v: unknown): Obj[] => asArray(v).filter(isPlainObject);

// Synthetic ephemeral inputs over unchanged pilot records, not a recommendation generator.
// Expected pointers and selected options are fixed by the test scenario, not by validator output.
export function outputScenario(model: RepositoryModel, n: 2 | 3, selected: number[]) {
  const guide = model.decisionGuides.find((g) => g.id === `AKG-00000${n}`)!.data;
  const options = objects(guide.options).map((o) => String(o.concept_id));
  const inactive = [0, 1].filter((i) => !selected.includes(i));
  const pointers = [
    "/options/0",
    "/options/1",
    "/constraints/0",
    "/recommended_when/0",
    "/recommended_when/1",
    ...inactive.map((i) => `/avoid_when/${i}`),
  ];
  const at = (pointer: string) => {
    const [, field, index] = pointer.split("/");
    return objects(guide[field!])[Number(index)]!;
  };
  const basis = pointers.map((guide_pointer) => ({
    guide_pointer,
    claim_ids: asStringArray(at(guide_pointer).claim_ids),
  }));
  const claims = new Map(model.claims.map((c) => [c.id, c.data]));
  const closure = (roots: string[]) => {
    const ids = new Set<string>();
    const visit = (id: string) => {
      if (ids.has(id)) return;
      ids.add(id);
      asStringArray(claims.get(id)!.derived_from_claims).forEach(visit);
    };
    roots.forEach(visit);
    return [...ids].sort();
  };
  const roots = [...new Set(basis.flatMap((b) => b.claim_ids))].sort();
  const chain = closure(roots);
  const conditions = new Map<string, Obj>();
  const collect = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(collect);
    else if (isPlainObject(v)) {
      if (
        typeof v.statement === "string" &&
        typeof v.scope === "string" &&
        Array.isArray(v.concept_ids)
      )
        conditions.set(decisionConditionKey(v), v);
      Object.values(v).forEach(collect);
    }
  };
  collect(guide);
  closure(asStringArray(guide.evidence)).forEach((id) => collect(claims.get(id)!.conditions));
  const activePointers = [
    "/constraints/0",
    ...selected.flatMap((i) => [`/options/${i}`, `/recommended_when/${i}`]),
  ];
  const trueKeys = new Set<string>();
  for (const item of [
    ...activePointers.map(at),
    ...closure(activePointers.flatMap((p) => asStringArray(at(p).claim_ids))).map(
      (id) => claims.get(id)!,
    ),
  ])
    objects(item.conditions).forEach((c) => trueKeys.add(decisionConditionKey(c)));
  const context = objects(guide.context_variables).map((v) => ({
    key: String(v.key),
    value: "Synthetic bounded applicability scenario, not real project evidence.",
    classification: "internal",
    provenance: "human-provided",
    confirmed_by_human: true,
  }));
  const authority = {
    recommendation_only: true,
    human_decision_required: true,
    automation_may_approve: false,
  };
  const session = {
    contract_version: 3,
    guide_version: 1,
    session_id: "33333333-3333-4333-8333-333333333333",
    guide_id: guide.id,
    context,
    drivers: [],
    constraints: [{ concept_id: "AKC-000003", satisfied: true, notes: "Synthetic scope" }],
    condition_evaluations: [...conditions].map(([key, condition]) => ({
      condition: structuredClone(condition),
      satisfied: trueKeys.has(key) as boolean | null,
      confirmed_by_human: true,
    })),
    privacy: {
      persistence: "ephemeral-only",
      external_provider_authorized: false,
      external_provider_authorization: null,
      redacted_keys: [],
    },
    authority,
  };
  const statements = selected.map((i) => ({
    statement: "Synthetic verification question scoped to this option; no project conclusion.",
    claim_ids: asStringArray(objects(guide.options)[i]!.claim_ids),
    option_ids: [options[i]!],
  }));
  const output = {
    contract_version: 4,
    guide_version: 1,
    session_id: session.session_id,
    guide_id: guide.id,
    status:
      selected.length === 2
        ? "multiple-viable-options"
        : selected.length === 1
          ? "recommendation"
          : "needs-human-clarification",
    applicable_context: structuredClone(context),
    constraint_results: [
      {
        concept_id: "AKC-000003",
        hardness: "hard",
        status: "satisfied",
        rationale: "Synthetic bounded scope",
        claim_ids: ["AKL-000081"],
      },
    ],
    viable_options: selected.map((i) => options[i]!),
    rejected_options: [] as { concept_id: string; reason: string; claim_ids: string[] }[],
    inapplicable_options: inactive.map((i) => ({
      concept_id: options[i]!,
      reason: "All selection and exclusion rules assessed false; not prohibited or ranked lower.",
    })),
    tradeoffs: statements,
    verification: structuredClone(statements),
    risks: [] as typeof statements,
    evolution_triggers: [] as typeof statements,
    decision_basis: basis,
    claim_ids: roots,
    source_ids: [...new Set(chain.flatMap((id) => asStringArray(claims.get(id)!.sources)))].sort(),
    evidence_claims: chain.map((id) => structuredClone(claims.get(id)!)),
    uncertainty: chain
      .filter((id) => claims.get(id)!.confidence === "low")
      .map((id) => ({
        statement: "Synthetic low-confidence evidence remains uncertain.",
        basis: "low-confidence",
        claim_ids: [id],
      })),
    authority,
  };
  if (!selected.length)
    output.uncertainty.push({
      statement:
        "No applicable option; ask a human for the next course, do not manufacture a winner.",
      basis: "unknown-context",
      claim_ids: [],
    });
  return { model, session, output, guide };
}
