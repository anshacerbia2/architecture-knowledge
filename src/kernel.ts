import { type Diagnostic } from "./diagnostics.js";
import { validateEvidence, type EvidenceAnalysis } from "./evidence-validator.js";
import { validateIdentities, type IdentityAnalysis } from "./id-validator.js";
import { validateLifecycle, type LifecycleAnalysis } from "./lifecycle-validator.js";
import {
  validateLinks,
  validateMarkdown,
  type LinkAnalysis,
  type MarkdownAnalysis,
} from "./markdown-validator.js";
import { loadRepository, type RepositoryModel } from "./model.js";
import { validateRelationships, type RelationshipAnalysis } from "./relationship-validator.js";
import {
  validateRegistrySchemaConsistency,
  type VocabularyAnalysis,
} from "./registry-consistency-validator.js";
import { validateSchemas, type SchemaValidationResult } from "./schema-validator.js";

export type ValidationCategory =
  | "schema"
  | "vocabulary"
  | "ids"
  | "sources"
  | "claims"
  | "relationships"
  | "lifecycle"
  | "markdown"
  | "links";

export const validationCategories: ValidationCategory[] = [
  "schema",
  "vocabulary",
  "ids",
  "sources",
  "claims",
  "relationships",
  "lifecycle",
  "markdown",
  "links",
];

export interface KernelAnalysis {
  model: RepositoryModel;
  schema: SchemaValidationResult;
  vocabulary: VocabularyAnalysis;
  identity: IdentityAnalysis;
  evidence: EvidenceAnalysis;
  relationships: RelationshipAnalysis;
  lifecycle: LifecycleAnalysis;
  markdown: MarkdownAnalysis;
  links: LinkAnalysis;
}

export async function analyzeRepository(root: string): Promise<KernelAnalysis> {
  const model = await loadRepository(root);
  const [schema, links] = await Promise.all([validateSchemas(model), validateLinks(model)]);
  return {
    model,
    schema,
    vocabulary: validateRegistrySchemaConsistency(model, schema.documents),
    identity: validateIdentities(model),
    evidence: validateEvidence(model),
    relationships: validateRelationships(model),
    lifecycle: validateLifecycle(model),
    markdown: validateMarkdown(model),
    links,
  };
}

export function diagnosticsFor(
  analysis: KernelAnalysis,
  categories: readonly ValidationCategory[] = validationCategories,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const category of categories) {
    switch (category) {
      case "schema":
        diagnostics.push(...analysis.schema.diagnostics);
        break;
      case "vocabulary":
        diagnostics.push(...analysis.model.diagnostics, ...analysis.vocabulary.diagnostics);
        break;
      case "ids":
        diagnostics.push(...analysis.model.diagnostics, ...analysis.identity.diagnostics);
        break;
      case "sources":
        diagnostics.push(...analysis.model.diagnostics, ...analysis.evidence.sourceDiagnostics);
        break;
      case "claims":
        diagnostics.push(...analysis.model.diagnostics, ...analysis.evidence.claimDiagnostics);
        break;
      case "relationships":
        diagnostics.push(...analysis.model.diagnostics, ...analysis.relationships.diagnostics);
        break;
      case "lifecycle":
        diagnostics.push(...analysis.model.diagnostics, ...analysis.lifecycle.diagnostics);
        break;
      case "markdown":
        diagnostics.push(...analysis.model.diagnostics, ...analysis.markdown.diagnostics);
        break;
      case "links":
        diagnostics.push(...analysis.model.diagnostics, ...analysis.links.diagnostics);
        break;
    }
  }
  return deduplicateDiagnostics(diagnostics);
}

function deduplicateDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  const unique = new Map<string, Diagnostic>();
  for (const item of diagnostics) {
    const key = [item.code, item.severity, item.path, item.pointer ?? "", item.message].join("|");
    unique.set(key, item);
  }
  return [...unique.values()];
}
