import { expect, it } from "vitest";
import path from "node:path";
import { KernelAdapter } from "../packages/knowledge-adapter/src/kernel-adapter.js";
import { KnowledgeService } from "../packages/application/src/knowledge-service.js";
import { createServer } from "../apps/api/src/http-server.js";

it.skipIf(!process.env.ATLAS_TEST_DATABASE_URL)(
  "serves current PostgreSQL search and a governed RAG answer through HTTP",
  async () => {
    const adapter = await KernelAdapter.create(
      path.resolve(process.env.KNOWLEDGE_REPO_ROOT ?? "../.."),
      process.env.ATLAS_TEST_DATABASE_URL!,
      process.env.ATLAS_TEST_DATABASE_MODE === "hosted" ? "hosted" : "local",
    );
    const app = await createServer(new KnowledgeService(adapter), { port: 4310 });
    try {
      const host = { host: "127.0.0.1:4310" };
      const ready = await app.inject({ url: "/health/ready", headers: host });
      expect(ready.statusCode).toBe(200);
      expect(ready.json().data.retrieval).toBe("ready");
      const bootstrap = await app.inject({ url: "/api/v1/bootstrap", headers: host });
      const headers = { ...host, "x-app-token": bootstrap.json().data.token };
      const search = await app.inject({
        method: "POST",
        url: "/api/v1/search",
        headers,
        payload: { text: "retry circuit breaker", mode: "hybrid-graph" },
      });
      expect(search.statusCode).toBe(200);
      expect(search.json().data.hits.length).toBeGreaterThan(0);
      expect(search.json().data.generation_id).toBe(ready.json().data.generation_id);
      const answer = await app.inject({
        method: "POST",
        url: "/api/v1/rag/answers",
        headers,
        payload: {
          question: "Can Retry and Circuit Breaker be combined?",
          data_classification: "public",
        },
      });
      expect(answer.statusCode).toBe(200);
      expect(answer.json().data.status).toBe("answered");
      expect(answer.json().data.statements.length).toBeGreaterThan(0);
      expect(answer.json().repository_commit).toBe(adapter.commit);
    } finally {
      await app.close();
      await adapter.close();
    }
  },
  60_000,
);
