import path from "node:path";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { KernelAdapter } from "../../../packages/knowledge-adapter/src/kernel-adapter.js";
import { KnowledgeService } from "../../../packages/application/src/knowledge-service.js";
import { appRoot, configuration } from "./config.js";
import { createServer } from "./http-server.js";

if (existsSync(path.join(appRoot, ".env"))) loadEnvFile(path.join(appRoot, ".env"));
const config = configuration(process.env);
const knowledge = await KernelAdapter.create(
  config.repoRoot,
  config.databaseUrl,
  config.databaseMode,
  config.provider,
);
const staticRoot = path.join(appRoot, "dist/web");
const app = await createServer(new KnowledgeService(knowledge), {
  port: config.port,
  logger: true,
  staticRoot: existsSync(staticRoot) ? staticRoot : undefined,
});
app.addHook("onClose", async () => knowledge.close());
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    void app.close();
  });
await app.listen({ host: "127.0.0.1", port: config.port });
