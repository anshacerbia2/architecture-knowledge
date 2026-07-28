import { diagnostic, type Diagnostic } from "./diagnostics.js";
import { asString, asStringArray } from "./io.js";
import type { RepositoryModel } from "./model.js";

export function validateClaimDerivations(model: RepositoryModel): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const claimById = new Map(model.claims.map((claim) => [claim.id, claim]));
  const supportingStatuses = new Set(
    model.ontology.sourceStatuses
      .filter((item) => item.may_support_claims === true || item.may_support_claims === "warning")
      .map((item) => asString(item.key))
      .filter((item): item is string => Boolean(item)),
  );
  const supportingSourceIds = new Set(
    model.sources
      .filter((source) => supportingStatuses.has(asString(source.data.status) ?? ""))
      .map((source) => source.id),
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

  for (const component of stronglyConnectedComponents(adjacency)) {
    const cyclic =
      component.length > 1 ||
      (component.length === 1 &&
        (adjacency.get(component[0] ?? "") ?? []).includes(component[0] ?? ""));
    if (!cyclic) {
      continue;
    }
    const ordered = [...component].sort();
    const owner = claimById.get(ordered[0] ?? "");
    diagnostics.push(
      diagnostic(
        "CLAIM_DERIVATION_CYCLE",
        "error",
        owner?.path ?? "claims/",
        `Claim derivation cycle contains ${ordered.join(", ")}.`,
      ),
    );
  }

  const grounded = new Map<string, boolean>();
  const isGrounded = (claimId: string, visiting: Set<string>): boolean => {
    const cached = grounded.get(claimId);
    if (cached !== undefined) {
      return cached;
    }
    if (visiting.has(claimId)) {
      return false;
    }
    const claim = claimById.get(claimId);
    if (!claim) {
      return false;
    }
    if (asStringArray(claim.data.sources).some((sourceId) => supportingSourceIds.has(sourceId))) {
      grounded.set(claimId, true);
      return true;
    }
    const dependencies = asStringArray(claim.data.derived_from_claims);
    if (dependencies.length === 0) {
      grounded.set(claimId, false);
      return false;
    }
    const nextVisiting = new Set(visiting);
    nextVisiting.add(claimId);
    const result = dependencies.every((dependency) => isGrounded(dependency, nextVisiting));
    grounded.set(claimId, result);
    return result;
  };

  for (const claim of model.claims) {
    const claimType = asString(claim.data.claim_type);
    if (claimType && evidenceRequiredTypes.has(claimType) && !isGrounded(claim.id, new Set())) {
      diagnostics.push(
        diagnostic(
          "CLAIM_EVIDENCE_UNGROUNDED",
          "error",
          claim.path,
          `Evidence-required claim '${claim.id}' is not transitively grounded in an admitted source.`,
        ),
      );
    }
  }

  return diagnostics;
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

    if (lowLinks.get(node) !== indices.get(node)) {
      return;
    }
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
    if (!indices.has(node)) {
      visit(node);
    }
  }
  return components;
}
