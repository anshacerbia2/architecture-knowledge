import Fastify, { LogController } from "fastify";
import staticFiles from "@fastify/static";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { KnowledgeService } from "../../../packages/application/src/knowledge-service.js";
import { AppError } from "../../../packages/application/src/errors.js";
import { KNOWLEDGE_ID_PATTERN } from "../../../packages/contracts/src/index.js";
import type { AskInput, SearchInput } from "../../../packages/contracts/src/index.js";
import {
  OpenRouterOAuthConnector,
  type OpenRouterApiConnector,
} from "../../../packages/ai-connectors/src/openrouter-connectors.js";
import { OAUTH_CALLBACK_ROUTE, registerOpenRouterRoutes } from "./openrouter-routes.js";

export async function createServer(
  service: KnowledgeService,
  options: {
    port: number;
    staticRoot?: string;
    logger?: boolean;
    connector?: OpenRouterOAuthConnector | OpenRouterApiConnector;
  },
) {
  const app = Fastify({
    bodyLimit: 65536,
    requestTimeout: 30000,
    connectionTimeout: 120000,
    logger: options.logger ?? false,
    logController: new LogController({ disableRequestLogging: true }),
    genReqId: () => randomUUID(),
    ajv: {
      customOptions: {
        coerceTypes: false,
        removeAdditional: false,
        useDefaults: false,
      },
    },
  });
  const token = randomBytes(32).toString("hex");
  const origins = new Set([
    `http://127.0.0.1:${options.port}`,
    `http://localhost:${options.port}`,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ]);
  const hosts = new Set([...origins].map((origin) => new URL(origin).host));
  const validToken = (candidate: unknown) =>
    typeof candidate === "string" &&
    /^[a-f0-9]{64}$/.test(candidate) &&
    timingSafeEqual(Buffer.from(candidate), Buffer.from(token));
  app.addHook("onRequest", async (request, reply) => {
    reply
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer")
      .header("Cache-Control", "no-store")
      .header("X-Frame-Options", "DENY")
      .header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      )
      .header("X-Request-ID", request.id);
    if (!hosts.has(request.headers.host ?? ""))
      throw new AppError("HOST_DENIED", 403, "Unrecognized local host.");
    const oauthCallback =
      options.connector instanceof OpenRouterOAuthConnector &&
      request.method === "GET" &&
      request.routeOptions.url === OAUTH_CALLBACK_ROUTE;
    // Browsers retain cross-site Fetch Metadata through the callback's 303 redirect.
    // Permit only the public HTML landing page after a successful OAuth exchange.
    const oauthLanding =
      options.connector instanceof OpenRouterOAuthConnector &&
      options.connector.connected() &&
      Boolean(options.staticRoot) &&
      request.method === "GET" &&
      request.url === "/status" &&
      request.headers["sec-fetch-mode"] === "navigate" &&
      request.headers["sec-fetch-dest"] === "document";
    if (
      request.headers.origin &&
      !origins.has(request.headers.origin) &&
      !((oauthCallback || oauthLanding) && request.headers.origin === "https://openrouter.ai")
    )
      throw new AppError("ORIGIN_DENIED", 403, "Cross-origin access denied.");
    if (
      request.headers["sec-fetch-site"] === "cross-site" &&
      !(oauthCallback && request.headers["sec-fetch-mode"] === "navigate") &&
      !oauthLanding
    )
      throw new AppError("ORIGIN_DENIED", 403, "Cross-site access denied.");
    if (!["GET", "HEAD"].includes(request.method) && !validToken(request.headers["x-app-token"]))
      throw new AppError("TOKEN_REQUIRED", 403, "Refresh this local app to establish a session.");
  });
  app.addHook("onResponse", async (request, reply) => {
    // No request URL/query/body, credentials or model content in operational logs.
    request.log.info(
      {
        request_id: request.id,
        route: request.routeOptions.url,
        status: reply.statusCode,
        elapsed_ms: reply.elapsedTime,
      },
      "request completed",
    );
  });
  app.setErrorHandler((error, request, reply) => {
    const e = error as Error & { validation?: unknown; statusCode?: number };
    const known = error instanceof AppError;
    const status = known
      ? error.status
      : e.validation
        ? 400
        : e.statusCode && e.statusCode < 500
          ? e.statusCode
          : 500;
    reply.code(status).send({
      contract_version: 1,
      request_id: request.id,
      error: {
        code: known
          ? error.code
          : status === 400
            ? "INVALID_REQUEST"
            : status === 500
              ? "OPERATION_FAILED"
              : "HTTP_ERROR",
        message: known
          ? error.message
          : status < 500
            ? "Request did not match the API contract."
            : "Operation failed safely. No answer was released. Check readiness and retry.",
      },
    });
  });
  const envelope = <T>(requestId: string, data: T) => ({
    contract_version: 1 as const,
    request_id: requestId,
    repository_commit: service.commit,
    data,
  });
  if (options.connector) registerOpenRouterRoutes(app, options.connector, service.commit);
  app.get("/health/live", async () => ({ live: true }));
  app.get("/health/ready", async (req, reply) => {
    const status = await service.status();
    return reply
      .code(status.graph === "ready" && status.retrieval === "ready" ? 200 : 503)
      .send(envelope(req.id, status));
  });
  app.get("/api/v1/bootstrap", async (req) => envelope(req.id, { token }));
  app.get("/api/v1/status", async (req) => envelope(req.id, await service.status()));
  app.get("/api/v1/catalog", async (req) => envelope(req.id, await service.catalog()));
  const params = {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: { id: { type: "string", pattern: KNOWLEDGE_ID_PATTERN } },
  };
  app.get<{ Params: { id: string } }>("/api/v1/records/:id", { schema: { params } }, async (req) =>
    envelope(req.id, await service.record(req.params.id)),
  );
  app.get<{ Params: { id: string } }>("/api/v1/graph/:id", { schema: { params } }, async (req) =>
    envelope(req.id, await service.graph(req.params.id)),
  );
  const question = {
    type: "string",
    minLength: 1,
    maxLength: 4000,
    pattern: "\\S",
  };
  app.post<{ Body: SearchInput }>(
    "/api/v1/search",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["text", "mode"],
          properties: {
            text: question,
            mode: {
              type: "string",
              enum: ["lexical", "hybrid", "hybrid-graph"],
            },
          },
        },
      },
    },
    async (req) => envelope(req.id, await service.search(req.body)),
  );
  app.post<{ Body: AskInput }>(
    "/api/v1/rag/answers",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["question", "data_classification"],
          properties: {
            question,
            data_classification: {
              type: "string",
              enum: ["public", "internal", "confidential"],
            },
          },
        },
      },
    },
    async (req) => envelope(req.id, await service.ask(req.body)),
  );
  if (options.staticRoot) {
    await app.register(staticFiles, {
      root: options.staticRoot,
      wildcard: false,
    });
    app.setNotFoundHandler(async (req, reply) => {
      if (
        req.method === "GET" &&
        !req.url.startsWith("/api/") &&
        !req.url.startsWith("/health/") &&
        !req.url.split("?")[0]?.includes(".")
      )
        return reply.sendFile("index.html");
      throw new AppError("NOT_FOUND", 404, "Route not found.");
    });
  }
  return app;
}
