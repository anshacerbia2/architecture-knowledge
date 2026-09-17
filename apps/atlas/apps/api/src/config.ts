import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RetrievalDatabaseMode } from "../../../packages/contracts/src/index.js";

export const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export function configuration(env: NodeJS.ProcessEnv) {
  const port = Number(env.PORT ?? "4310");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("INVALID_PORT");
  const repoRoot = path.resolve(env.KNOWLEDGE_REPO_ROOT ?? path.join(appRoot, "../.."));
  const databaseUrl =
    env.DATABASE_URL ?? "postgresql://aks:aks@127.0.0.1:54329/architecture_knowledge";
  const databaseMode = env.RETRIEVAL_DATABASE_MODE ?? "local";
  if (!(["local", "hosted"] as const).includes(databaseMode as RetrievalDatabaseMode))
    throw new Error("DATABASE_MODE_INVALID");
  let db: URL;
  try {
    db = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL_INVALID");
  }
  if (!["postgres:", "postgresql:"].includes(db.protocol)) throw new Error("DATABASE_URL_INVALID");
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(db.hostname);
  if (databaseMode === "local" && !local) throw new Error("LOCAL_DATABASE_REQUIRED");
  if (databaseMode === "hosted") {
    if (local) throw new Error("HOSTED_DATABASE_REQUIRED");
    if (!db.username || !db.password) throw new Error("HOSTED_DATABASE_CREDENTIALS_REQUIRED");
    if (!["require", "verify-ca", "verify-full"].includes(db.searchParams.get("sslmode") ?? ""))
      throw new Error("HOSTED_DATABASE_TLS_REQUIRED");
    if (db.searchParams.get("channel_binding") !== "require")
      throw new Error("HOSTED_DATABASE_CHANNEL_BINDING_REQUIRED");
  }
  return {
    port,
    repoRoot,
    databaseUrl,
    databaseMode: databaseMode as RetrievalDatabaseMode,
  };
}
