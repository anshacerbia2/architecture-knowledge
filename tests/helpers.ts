import path from "node:path";

import { asArray, isPlainObject, parseMarkdownFile, parseYamlFile } from "../src/io.js";
import { loadRepository, type RecordEntry, type RepositoryModel } from "../src/model.js";

const root = process.cwd();
const fixtureRoot = path.join(root, "tests", "fixtures");

export async function validSemanticModel(): Promise<RepositoryModel> {
  const model = await loadRepository(root);
  const source = await fixtureRecord("valid/source.yaml");
  const claim = await fixtureRecord("valid/claim.yaml");
  const relationship = await fixtureRecord("valid/relationship.yaml");
  const parsedMarkdown = await parseMarkdownFile(
    path.join(fixtureRoot, "valid", "knowledge.md"),
    "tests/fixtures/valid/knowledge.md",
  );
  if (!parsedMarkdown.document || !isPlainObject(parsedMarkdown.document.frontMatter)) {
    throw new Error("Valid Markdown fixture could not be parsed.");
  }
  const concept = recordFromData(
    parsedMarkdown.document.frontMatter,
    "tests/fixtures/valid/knowledge.md",
    parsedMarkdown.document,
  );
  const supportingConcepts = [
    conceptRecord("AKC-900002", "Synthetic Quality", "quality-attribute"),
    conceptRecord("AKC-900003", "Synthetic Failure", "failure-mode"),
    conceptRecord("AKC-900004", "Synthetic Alternative", "architectural-pattern"),
  ];
  const records = [concept, ...supportingConcepts, source, claim, relationship];
  const allocations = records.map((record, index) => ({
    id: record.id,
    record_kind: record.recordKind,
    human_key: `fixture-${String(index + 1).padStart(2, "0")}`,
    previous_human_keys: [],
    state: "active",
    path: record.path,
    allocated_at: "2026-07-29",
    retired_at: null,
  }));
  const lifecycleEvents = {
    schema_version: 1,
    status: "proposed",
    events: [
      {
        event_id: "LCE-900001",
        record_id: source.id,
        lifecycle_kind: "source",
        from: "candidate",
        to: "approved",
        actor: "Synthetic Human Reviewer",
        actor_type: "human",
        human_authorized: true,
        authorization_evidence: "Fixture authorization evidence.",
        occurred_at: "2026-07-29T00:00:00Z",
      },
    ],
  };
  return {
    ...model,
    records,
    concepts: [concept, ...supportingConcepts],
    sources: [source],
    claims: [claim],
    relationships: [relationship],
    decisionGuides: [],
    markdownFiles: [parsedMarkdown.document],
    idLedger: { schema_version: 1, status: "proposed", allocations },
    lifecycleEvents,
  };
}

export async function fixtureRecord(relative: string): Promise<RecordEntry> {
  const displayPath = `tests/fixtures/${relative}`;
  const parsed = await parseYamlFile(path.join(fixtureRoot, relative), displayPath);
  if (!isPlainObject(parsed.data)) {
    throw new Error(`Fixture ${relative} is not an object.`);
  }
  return recordFromData(parsed.data, displayPath);
}

export async function fixtureObject(relative: string): Promise<Record<string, unknown>> {
  const parsed = await parseYamlFile(
    path.join(fixtureRoot, relative),
    `tests/fixtures/${relative}`,
  );
  if (!isPlainObject(parsed.data)) {
    throw new Error(`Fixture ${relative} is not an object.`);
  }
  return parsed.data;
}

export async function fixtureMarkdown(relative: string) {
  const parsed = await parseMarkdownFile(
    path.join(fixtureRoot, relative),
    `tests/fixtures/${relative}`,
  );
  if (!parsed.document || !isPlainObject(parsed.document.frontMatter)) {
    throw new Error(`Fixture ${relative} is not a knowledge Markdown document.`);
  }
  return parsed.document;
}

export function recordFromData(
  data: Record<string, unknown>,
  recordPath: string,
  markdown?: RecordEntry["markdown"],
): RecordEntry {
  const id = data.id;
  const recordKind = data.record_kind;
  if (typeof id !== "string" || typeof recordKind !== "string") {
    throw new Error(`Record at ${recordPath} lacks id or record_kind.`);
  }
  return markdown
    ? { id, recordKind, path: recordPath, data, markdown }
    : { id, recordKind, path: recordPath, data };
}

export function conceptRecord(id: string, title: string, type: string): RecordEntry {
  return recordFromData(
    {
      id,
      record_kind: "concept",
      title,
      aliases: [],
      type,
      domain: "distributed-systems",
      status: "proposed",
    },
    `tests/fixtures/synthetic/${id}.yaml`,
  );
}

export function cloneRecord(record: RecordEntry, changes: Record<string, unknown>): RecordEntry {
  return {
    ...record,
    data: { ...record.data, ...changes },
  };
}

export function replaceRecord(model: RepositoryModel, replacement: RecordEntry): RepositoryModel {
  const records = model.records.map((record) =>
    record.id === replacement.id ? replacement : record,
  );
  return {
    ...model,
    records,
    concepts: records.filter((record) => record.recordKind === "concept"),
    sources: records.filter((record) => record.recordKind === "source"),
    claims: records.filter((record) => record.recordKind === "claim"),
    relationships: records.filter((record) => record.recordKind === "relationship"),
    decisionGuides: records.filter((record) => record.recordKind === "decision-guide"),
  };
}

export function allocations(model: RepositoryModel): Record<string, unknown>[] {
  return asArray(model.idLedger.allocations).filter(isPlainObject);
}
