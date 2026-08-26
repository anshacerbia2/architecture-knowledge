import { asString, asStringArray } from "./io.js";
import type { RagAuthoritativeCitation, RagCitationAuthority } from "./rag-types.js";

export interface RagCitationAuthorityRecord extends Record<string, unknown> {
  id: string;
}

export interface RagCitationAuthorityRecords {
  concepts: readonly RagCitationAuthorityRecord[];
  claims: readonly RagCitationAuthorityRecord[];
  relationships: readonly RagCitationAuthorityRecord[];
  sources: readonly RagCitationAuthorityRecord[];
}

export function createRagCitationAuthority(
  records: RagCitationAuthorityRecords,
): RagCitationAuthority {
  const sources = new Map<string, RagAuthoritativeCitation>();
  for (const source of records.sources) {
    if (asString(source.status) !== "approved") continue;
    const title = asString(source.title)?.trim();
    const url = asString(source.url)?.trim();
    if (!isSourceId(source.id) || !title || !url || !isGovernedUrl(url)) continue;
    sources.set(source.id, { source_id: source.id, title, url });
  }

  const sourceIdsByRecord = new Map<string, ReadonlySet<string>>();
  const add = (record: RagCitationAuthorityRecord, sourceIds: string[]): void => {
    if (sourceIdsByRecord.has(record.id))
      throw new Error(`RAG_CITATION_AUTHORITY_DUPLICATE ${record.id}`);
    sourceIdsByRecord.set(record.id, new Set(sourceIds));
  };
  for (const concept of records.concepts) add(concept, asStringArray(concept.sources));
  for (const claim of records.claims) add(claim, asStringArray(claim.sources));
  for (const relationship of records.relationships)
    add(relationship, asStringArray(relationship.direct_source_ids));
  for (const source of records.sources) add(source, [source.id]);

  return {
    resolve(recordId: string, sourceId: string): RagAuthoritativeCitation | undefined {
      if (!isSourceId(sourceId) || !sourceIdsByRecord.get(recordId)?.has(sourceId))
        return undefined;
      return sources.get(sourceId);
    },
  };
}

function isSourceId(value: string): boolean {
  return /^AKS-\d{6}$/.test(value);
}

function isGovernedUrl(value: string): boolean {
  return URL.canParse(value) && new URL(value).protocol === "https:";
}
