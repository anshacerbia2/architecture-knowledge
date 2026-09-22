import type { FastifyInstance } from "fastify";

import type { DecisionService } from "../../../packages/application/src/decision-service.js";
import {
  KNOWLEDGE_ID_PATTERN,
  type DecisionEvaluationInput,
} from "../../../packages/contracts/src/index.js";

const guideId = { type: "string", pattern: "^AKG-[0-9]{6}$" };
const conceptId = { type: "string", pattern: "^AKC-[0-9]{6}$" };
const slug = { type: "string", pattern: "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$" };
const condition = {
  type: "object",
  additionalProperties: false,
  required: ["statement", "scope", "concept_ids"],
  properties: {
    statement: { type: "string", minLength: 1, maxLength: 4000, pattern: "\\S" },
    scope: { type: "string", enum: ["edge-local", "reusable-concept"] },
    concept_ids: {
      type: "array",
      maxItems: 32,
      uniqueItems: true,
      items: conceptId,
    },
  },
};
const authority = {
  type: "object",
  additionalProperties: false,
  required: ["recommendation_only", "human_decision_required", "automation_may_approve"],
  properties: {
    recommendation_only: { const: true },
    human_decision_required: { const: true },
    automation_may_approve: { const: false },
  },
};
const session = {
  type: "object",
  additionalProperties: false,
  required: [
    "contract_version",
    "session_id",
    "guide_id",
    "guide_version",
    "context",
    "drivers",
    "constraints",
    "privacy",
    "authority",
    "condition_evaluations",
  ],
  properties: {
    contract_version: { const: 3 },
    session_id: { type: "string", format: "uuid" },
    guide_id: guideId,
    guide_version: { type: "integer", minimum: 1 },
    context: {
      type: "array",
      maxItems: 32,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "value", "classification", "provenance", "confirmed_by_human"],
        properties: {
          key: slug,
          value: {
            anyOf: [
              { type: "string", maxLength: 4000 },
              { type: "number" },
              { type: "boolean" },
              { type: "null" },
            ],
          },
          classification: {
            type: "string",
            enum: ["public", "internal", "confidential", "restricted"],
          },
          provenance: {
            type: "string",
            enum: ["human-provided", "system-observed", "inferred"],
          },
          confirmed_by_human: { type: "boolean" },
        },
      },
    },
    drivers: {
      type: "array",
      maxItems: 32,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["concept_id", "role", "priority"],
        properties: {
          concept_id: conceptId,
          role: {
            type: "string",
            enum: ["quality-attribute", "constraint", "assumption", "context"],
          },
          priority: { type: "string", enum: ["required", "high", "medium", "low"] },
        },
      },
    },
    constraints: {
      type: "array",
      maxItems: 32,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["concept_id", "satisfied", "notes"],
        properties: {
          concept_id: conceptId,
          satisfied: { type: ["boolean", "null"] },
          notes: { type: ["string", "null"], maxLength: 4000 },
        },
      },
    },
    condition_evaluations: {
      type: "array",
      maxItems: 128,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["condition", "satisfied", "confirmed_by_human"],
        properties: {
          condition,
          satisfied: { type: ["boolean", "null"] },
          confirmed_by_human: { type: "boolean" },
        },
      },
    },
    privacy: {
      type: "object",
      additionalProperties: false,
      required: [
        "persistence",
        "external_provider_authorized",
        "external_provider_authorization",
        "redacted_keys",
      ],
      properties: {
        persistence: { const: "ephemeral-only" },
        external_provider_authorized: { const: false },
        external_provider_authorization: { type: "null" },
        redacted_keys: {
          type: "array",
          maxItems: 32,
          uniqueItems: true,
          items: slug,
        },
      },
    },
    authority,
  },
};

export function registerDecisionRoutes(
  app: FastifyInstance,
  decisions: DecisionService,
  envelope: (requestId: string, data: unknown) => unknown,
): void {
  app.get("/api/v1/decision-guides", async (request) =>
    envelope(request.id, await decisions.guides()),
  );
  app.get<{ Params: { id: string } }>(
    "/api/v1/decision-guides/:id/intake",
    {
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["id"],
          properties: { id: { type: "string", pattern: KNOWLEDGE_ID_PATTERN } },
        },
      },
    },
    async (request) => envelope(request.id, await decisions.intake(request.params.id)),
  );
  app.post<{ Body: DecisionEvaluationInput }>(
    "/api/v1/decision-evaluations",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["repository_commit", "client_revision", "session"],
          properties: {
            repository_commit: { type: "string", pattern: "^[a-f0-9]{40}$" },
            client_revision: { type: "integer", minimum: 0 },
            session,
          },
        },
      },
    },
    async (request) => envelope(request.id, await decisions.evaluate(request.body)),
  );
}
