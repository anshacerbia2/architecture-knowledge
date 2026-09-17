import { performance } from "node:perf_hooks";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { appRoot, configuration } from "../apps/api/src/config.js";
import { KernelAdapter } from "../packages/knowledge-adapter/src/kernel-adapter.js";
import { cleanCommit } from "../packages/knowledge-adapter/src/snapshot.js";

if (existsSync(path.join(appRoot, ".env"))) loadEnvFile(path.join(appRoot, ".env"));
const config = configuration(process.env);
const adapter = await KernelAdapter.create(
  config.repoRoot,
  config.databaseUrl,
  config.databaseMode,
);
async function measure(operation: () => Promise<unknown>, count = 25, concurrency = 1) {
  const timings: number[] = [];
  const started = performance.now();
  for (let i = 0; i < count; i += concurrency) {
    await Promise.all(
      Array.from({ length: Math.min(concurrency, count - i) }, async () => {
        const start = performance.now();
        await operation();
        timings.push(performance.now() - start);
      }),
    );
  }
  timings.sort((a, b) => a - b);
  const percentile = (p: number) => Number(timings[Math.ceil(p * timings.length) - 1]!.toFixed(3));
  return {
    count,
    concurrency,
    p50_ms: percentile(0.5),
    p95_ms: percentile(0.95),
    total_ms: Number((performance.now() - started).toFixed(3)),
  };
}
try {
  const results = {
    repository_commit: adapter.commit,
    platform: process.platform,
    node: process.version,
    evidence:
      "Informational in-process microbenchmark. Baseline adds the former Git guard to the same catalog operation; excludes HTTP/network and startup. No production SLO claim.",
    baseline_git_guard: await measure(async () => {
      await cleanCommit(config.repoRoot);
      return adapter.catalog();
    }),
    pinned_snapshot: await measure(() => adapter.catalog()),
    baseline_git_guard_concurrent: await measure(
      async () => {
        await cleanCommit(config.repoRoot);
        return adapter.catalog();
      },
      25,
      5,
    ),
    pinned_snapshot_concurrent: await measure(() => adapter.catalog(), 25, 5),
    database:
      process.env.BENCHMARK_DATABASE === "1"
        ? {
            status_full_integrity: await measure(async () => {
              const status = await adapter.status();
              if (status.retrieval !== "ready")
                throw new Error(status.retrieval_code ?? "NOT_READY");
            }, 5),
            hybrid_graph: await measure(
              () => adapter.search({ text: "retry circuit breaker", mode: "hybrid-graph" }),
              5,
            ),
          }
        : "not requested",
  };
  console.log(JSON.stringify(results, null, 2));
} finally {
  await adapter.close();
}
