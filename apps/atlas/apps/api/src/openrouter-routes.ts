import type { FastifyInstance } from "fastify";
import {
  OpenRouterOAuthConnector,
  type OpenRouterApiConnector,
} from "../../../packages/ai-connectors/src/openrouter-connectors.js";
import { AppError } from "../../../packages/application/src/errors.js";

export const OAUTH_CALLBACK_ROUTE = "/api/v1/connectors/openrouter/callback/:state";
export function registerOpenRouterRoutes(
  app: FastifyInstance,
  connector: OpenRouterOAuthConnector | OpenRouterApiConnector,
  commit: string,
) {
  const empty = { body: { type: "object", properties: {}, additionalProperties: false } };
  app.post("/api/v1/connectors/openrouter/start", { schema: empty }, async (req, reply) => {
    if (!(connector instanceof OpenRouterOAuthConnector))
      throw new AppError(
        "OAUTH_DISABLED",
        409,
        "API-key mode is configured. Choose oauth in server configuration to connect an account.",
      );
    const result = connector.begin(`http://${req.headers.host}`);
    reply.header(
      "Set-Cookie",
      `atlas_or_oauth=${result.browser}; HttpOnly; SameSite=Lax; Path=/api/v1/connectors/openrouter/callback; Max-Age=300`,
    );
    return {
      contract_version: 1,
      request_id: req.id,
      repository_commit: commit,
      data: { authorization_url: result.authorization_url },
    };
  });
  app.post("/api/v1/connectors/openrouter/disconnect", { schema: empty }, async (req) => {
    if (!(connector instanceof OpenRouterOAuthConnector))
      throw new AppError(
        "OAUTH_DISABLED",
        409,
        "Remove the server API key and restart to disconnect API-key mode.",
      );
    connector.disconnect();
    return {
      contract_version: 1,
      request_id: req.id,
      repository_commit: commit,
      data: { connected: false },
    };
  });
  if (!(connector instanceof OpenRouterOAuthConnector)) return;
  app.get<{ Params: { state: string }; Querystring: { code: string } }>(
    OAUTH_CALLBACK_ROUTE,
    {
      schema: {
        params: {
          type: "object",
          required: ["state"],
          additionalProperties: false,
          properties: { state: { type: "string", pattern: "^[a-f0-9]{64}$" } },
        },
        querystring: {
          type: "object",
          required: ["code"],
          additionalProperties: false,
          properties: { code: { type: "string", pattern: "^[a-zA-Z0-9._~-]{1,2048}$" } },
        },
      },
    },
    async (req, reply) => {
      const browser =
        /(?:^|;\s*)atlas_or_oauth=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? "")?.[1] ?? "";
      await connector.complete(req.params.state, req.query.code, browser);
      reply.header(
        "Set-Cookie",
        "atlas_or_oauth=; HttpOnly; SameSite=Lax; Path=/api/v1/connectors/openrouter/callback; Max-Age=0",
      );
      return reply.code(303).header("Location", "/status").send();
    },
  );
}
