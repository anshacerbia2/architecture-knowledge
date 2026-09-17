import {
  loadValidatedGraph,
  loadCurrentRetrievalArtifacts,
  buildRetrievalArtifacts,
  RetrievalDatabase,
  indexRetrievalGeneration,
  checkRetrievalCurrent,
} from "architecture-knowledge-system/runtime";
import { cleanCommit } from "./snapshot.js";
import { providers, type ProviderSettings } from "./providers.js";

export async function pilotManifest(root: string) {
  const commit = await cleanCommit(root);
  const graph = await loadValidatedGraph(root);
  const artifacts = await loadCurrentRetrievalArtifacts(root, buildRetrievalArtifacts(graph));
  if ((await cleanCommit(root)) !== commit) throw new Error("SNAPSHOT_CHANGED");
  return { commit, artifacts };
}

export async function pilotIndex(
  root: string,
  url: string,
  hosted: boolean,
  settings: ProviderSettings,
  action: "index" | "check",
) {
  if (settings.mode !== "openai") throw new Error("PILOT_LIVE_CONFIG_REQUIRED");
  const { commit, artifacts } = await pilotManifest(root);
  const runtime = providers(settings, artifacts.manifest.manifest_root_hash);
  const database = new RetrievalDatabase({
    connectionString: url,
    maxConnections: 1,
    statementTimeoutMs: 30000,
  });
  Object.assign(database.pool.options, {
    connectionTimeoutMillis: 5000,
    enableChannelBinding: hosted,
  });
  try {
    const generation =
      action === "index"
        ? await indexRetrievalGeneration(database, artifacts, runtime.embedding, commit)
        : await checkRetrievalCurrent(database, artifacts, runtime.embedding, commit);
    return {
      repository_commit: generation.repository_commit,
      generation_id: generation.generation_id,
      unit_count: generation.unit_count,
      status: generation.status,
      budget: runtime.budget?.status(),
    };
  } finally {
    await database.close();
  }
}
