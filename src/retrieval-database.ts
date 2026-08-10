import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import pg from "pg";

const { Pool } = pg;

export interface RetrievalDatabaseOptions {
  connectionString: string;
  maxConnections?: number;
  statementTimeoutMs?: number;
}

export class RetrievalDatabase {
  readonly pool: pg.Pool;

  constructor(options: RetrievalDatabaseOptions) {
    if (!options.connectionString.trim()) throw new Error("RETRIEVAL_DATABASE_URL_MISSING");
    this.pool = new Pool({
      connectionString: options.connectionString,
      max: options.maxConnections ?? 4,
      statement_timeout: options.statementTimeoutMs ?? 30_000,
      application_name: "architecture-knowledge-m5",
    });
    this.pool.on("error", () => undefined);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async ping(): Promise<void> {
    try {
      await this.pool.query("SELECT 1 AS healthy");
    } catch (error) {
      throw databaseError(error);
    }
  }

  async migrate(root: string): Promise<string[]> {
    await this.ping();
    const directory = path.join(root, "migrations");
    const names = (await readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
    const applied: string[] = [];
    for (const name of names) {
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "CREATE TABLE IF NOT EXISTS retrieval_schema_migrations (migration_name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
        );
        const existing = await client.query<{ migration_name: string }>(
          "SELECT migration_name FROM retrieval_schema_migrations WHERE migration_name = $1",
          [name],
        );
        if (existing.rowCount === 0) {
          const sql = await readFile(path.join(directory, name), "utf8");
          await client.query(sql);
          await client.query(
            "INSERT INTO retrieval_schema_migrations (migration_name) VALUES ($1)",
            [name],
          );
          applied.push(name);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw databaseError(error, "RETRIEVAL_MIGRATION_FAILED");
      } finally {
        client.release();
      }
    }
    return applied;
  }
}

export function databaseError(error: unknown, code = "RETRIEVAL_DATABASE_UNAVAILABLE"): Error {
  const pgCode = isPgError(error) ? error.code : undefined;
  return new Error(`${code}${pgCode ? ` pg=${pgCode}` : ""}`);
}

function isPgError(value: unknown): value is { code: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code?: unknown }).code === "string"
  );
}
