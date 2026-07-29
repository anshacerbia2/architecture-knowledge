import { diagnostic, type Diagnostic } from "./diagnostics.js";
import { asArray, asString, asStringArray, isPlainObject } from "./io.js";
import type { RepositoryModel } from "./model.js";

export function validateClaimDerivations(model: RepositoryModel): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const claimById = new Map(model.claims.map((claim) => [claim.id, claim]));
  const sourceById = new Map(model.sources.map((source) => [source.id, source]));
  const sourceEligibility = new Map(
    asArray(model.sourceLifecycle.states)
      .filter(isPlainObject)
      .map((state) => [asString(state.key), asString(state.evidence_eligibility)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1])),
  );
  const evidenceRequiredTypes = new Set(
    model.ontology.claimTypes
      .filter((item) => item.evidence_required === true)
      .map((item) => asString(item.key))
      .filter((item): item is string => Boolean(item)),
  );
  const adjacency = new Map(
    model.claims.map((claim) => [
      claim.id,
      asStringArray(claim.data.derived_from_claims).filter((id) => claimById.has(id)),
    ]),
  );

  for (const claim of model.claims) {
    for (const dependency of asStringArray(claim.data.derived_from_claims)) {
      if (!claimById.has(dependency)) {
        diagnostics.push(
          diagnostic(
            "CLAIM_DERIVED_REFERENCE_MISSING",
            "error",
            claim.path,
            `Derived claim reference '${dependency}' from '${claim.id}' does not resolve.`,
            "/derived_from_claims",
          ),
        );
      }
    }
    for (const sourceId of asStringArray(claim.data.sources)) {
      const source = sourceById.get(sourceId);
      if (!source) continue;
      const status = asString(source.data.status) ?? "unknown";
      if (sourceEligibility.get(status) === "forbidden") {
        diagnostics.push(
          diagnostic(
            "CLAIM_GROUNDING_SOURCE_REJECTED",
            "error",
            claim.path,
            `Source '${sourceId}' in state '${status}' is ineligible to ground claim '${claim.id}'.`,
            "/sources",
          ),
        );
      }
    }
  }

  for (const component of stronglyConnectedComponents(adjacency)) {
    const cyclic =
      component.length > 1 ||
      (component.length === 1 &&
        (adjacency.get(component[0] ?? "") ?? []).includes(component[0] ?? ""));
    if (!cyclic) continue;
    const path = cyclePath(component, adjacency);
    const owner = claimById.get(path[0] ?? component[0] ?? "");
    diagnostics.push(
      diagnostic(
        "CLAIM_DERIVATION_CYCLE",
        "error",
        owner?.path ?? "claims/",
        `Claim derivation cycle path: ${path.join(" -> ")}.`,
        "/derived_from_claims",
      ),
    );
  }

  const grounded = new Map<string, boolean>();
  const isGrounded = (claimId: string, visiting: Set<string>): boolean => {
    const cached = grounded.get(claimId);
    if (cached !== undefined) return cached;
    if (visiting.has(claimId)) return false;
    const claim = claimById.get(claimId);
    if (!claim) return false;
    const sourceIds = asStringArray(claim.data.sources);
    const dependencies = asStringArray(claim.data.derived_from_claims);
    const sourcesGrounded =
      sourceIds.length > 0 &&
      sourceIds.every((sourceId) => {
        const source = sourceById.get(sourceId);
        const status = source ? asString(source.data.status) : undefined;
        return Boolean(status && sourceEligibility.get(status) !== "forbidden");
      });
    const nextVisiting = new Set(visiting);
    nextVisiting.add(claimId);
    const dependenciesGrounded =
      dependencies.length > 0 &&
      dependencies.every((dependency) => isGrounded(dependency, nextVisiting));
    const result =
      sourceIds.length > 0 && dependencies.length > 0
        ? sourcesGrounded && dependenciesGrounded
        : sourceIds.length > 0
          ? sourcesGrounded
          : dependencies.length > 0
            ? dependenciesGrounded
            : false;
    grounded.set(claimId, result);
    return result;
  };

  for (const claim of model.claims) {
    const claimType = asString(claim.data.claim_type);
    if (!claimType || !evidenceRequiredTypes.has(claimType)) continue;
    const sources = asStringArray(claim.data.sources);
    const dependencies = asStringArray(claim.data.derived_from_claims);
    const valid = isGrounded(claim.id, new Set());
    if (sources.length > 0 && dependencies.length > 0 && !valid) {
      diagnostics.push(
        diagnostic(
          "CLAIM_EVIDENCE_CHAIN_MIXED_INVALID",
          "error",
          claim.path,
          `Mixed source/claim evidence chain for '${claim.id}' is not fully grounded.`,
          "/",
        ),
      );
    }
    if (!valid) {
      diagnostics.push(
        diagnostic(
          "CLAIM_EVIDENCE_UNGROUNDED",
          "error",
          claim.path,
          `Evidence-required claim '${claim.id}' is not transitively grounded in admitted evidence.`,
          "/",
        ),
      );
    }
  }

  return diagnostics;
}

function cyclePath(
  component: readonly string[],
  adjacency: ReadonlyMap<string, string[]>,
): string[] {
  const allowed = new Set(component);
  const start = [...component].sort()[0];
  if (!start) return [];
  const visit = (node: string, path: string[], seen: Set<string>): string[] | undefined => {
    for (const target of [...(adjacency.get(node) ?? [])].filter((id) => allowed.has(id)).sort()) {
      if (target === start) return [...path, target];
      if (seen.has(target)) continue;
      const next = visit(target, [...path, target], new Set([...seen, target]));
      if (next) return next;
    }
    return undefined;
  };
  return visit(start, [start], new Set([start])) ?? [...component].sort();
}

function stronglyConnectedComponents(adjacency: ReadonlyMap<string, string[]>): string[][] {
  let nextIndex = 0;
  const indices = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];

  const visit = (node: string): void => {
    indices.set(node, nextIndex);
    lowLinks.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);
    for (const target of adjacency.get(node) ?? []) {
      if (!indices.has(target)) {
        visit(target);
        lowLinks.set(node, Math.min(lowLinks.get(node) ?? 0, lowLinks.get(target) ?? 0));
      } else if (onStack.has(target)) {
        lowLinks.set(node, Math.min(lowLinks.get(node) ?? 0, indices.get(target) ?? 0));
      }
    }
    if (lowLinks.get(node) !== indices.get(node)) return;
    const component: string[] = [];
    let current: string | undefined;
    do {
      current = stack.pop();
      if (current) {
        onStack.delete(current);
        component.push(current);
      }
    } while (current && current !== node);
    components.push(component);
  };

  for (const node of [...adjacency.keys()].sort()) {
    if (!indices.has(node)) visit(node);
  }
  return components;
}
