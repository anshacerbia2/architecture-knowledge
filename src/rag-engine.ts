import { RAG_CONTRACT_VERSION, RAG_PROMPT_VERSION } from "./rag-types.js";
import { buildRagContext } from "./rag-context.js";
import { parseRagModelOutput } from "./rag-output-contract.js";
import { assertRagClassificationAllowed } from "./rag-classification.js";
import type {
  RagAnswerPacket,
  RagCitationAuthority,
  RagContextPacket,
  RagGroundedStatement,
  RagModelOutput,
  RagModelProvider,
  RagRequest,
  RagResolvedCitation,
} from "./rag-types.js";
import type { RetrievalPacket } from "./retrieval-types.js";

export interface RagRetriever {
  query(request: RagRequest["retrieval"]): Promise<RetrievalPacket>;
}

export class RagEngine {
  constructor(
    private readonly retriever: RagRetriever,
    private readonly provider: RagModelProvider,
    private readonly citationAuthority: RagCitationAuthority,
  ) {}

  async answer(request: RagRequest): Promise<RagAnswerPacket> {
    const retrieval = await this.retriever.query(request.retrieval);
    const context = buildRagContext(request, retrieval, this.citationAuthority);
    if (context.evidence.length === 0) {
      return packet(
        context,
        this.provider,
        {
          status: "insufficient-evidence",
          summary: "No governed evidence matched the question.",
          statements: [],
          uncertainties: ["The repository does not currently provide matching governed evidence."],
          refusal_reason: null,
        },
        [{ code: "RAG_INSUFFICIENT_EVIDENCE", message: "No governed evidence matched." }],
        false,
      );
    }
    let output: RagModelOutput;
    try {
      assertRagClassificationAllowed(context, request, this.provider.allowedDataClassifications);
      output = parseRagModelOutput(await this.provider.generate(context, request));
    } catch (error) {
      if (stableCode(error) !== "RAG_MODEL_REFUSAL") throw error;
      return packet(
        context,
        this.provider,
        {
          status: "refused",
          summary: "The model refused to answer.",
          statements: [],
          uncertainties: [],
          refusal_reason: "provider-refusal",
        },
        [{ code: "RAG_MODEL_REFUSAL", message: "The model refused the request." }],
        true,
      );
    }
    const diagnostics = validateGrounding(output, context, request);
    if (diagnostics.length > 0) {
      throw new Error(
        `RAG_GROUNDING_INVALID ${diagnostics
          .map((item) => item.code)
          .sort()
          .join(",")}`,
      );
    }
    return packet(context, this.provider, output, retrieval.diagnostics, true);
  }
}

export function validateGrounding(
  output: RagModelOutput,
  context: RagContextPacket,
  request: RagRequest,
): Array<{ code: string; message: string }> {
  const diagnostics: Array<{ code: string; message: string }> = [];
  const evidence = new Map(context.evidence.map((item) => [item.evidence_id, item]));
  if (output.statements.length > request.answer.max_statements)
    diagnostics.push({ code: "RAG_STATEMENT_LIMIT", message: "Model exceeded statement limit." });
  for (const statement of output.statements) {
    const cited = statement.evidence_ids
      .map((id) => evidence.get(id))
      .filter((item) => item !== undefined);
    if (cited.length !== statement.evidence_ids.length)
      diagnostics.push({
        code: "RAG_EVIDENCE_DANGLING",
        message: `${statement.statement_id} cites unavailable evidence.`,
      });
    const assertive = statement.epistemic_type !== "uncertainty";
    if (assertive && statement.evidence_ids.length === 0)
      diagnostics.push({
        code: "RAG_STATEMENT_UNSUPPORTED",
        message: `${statement.statement_id} has no evidence.`,
      });
    const resolvedSources = resolvedCitations(statement.evidence_ids, context);
    if (assertive && resolvedSources.length === 0)
      diagnostics.push({
        code: "RAG_CITATION_MISSING",
        message: `${statement.statement_id} has no resolvable source citation.`,
      });
    const citedClaims = new Set(
      cited.filter((item) => item.unit_kind === "claim").map((item) => item.record_id),
    );
    if (statement.claim_ids.some((id) => !citedClaims.has(id)))
      diagnostics.push({
        code: "RAG_CLAIM_DANGLING",
        message: `${statement.statement_id} names a claim absent from its evidence.`,
      });
    if (statement.epistemic_type === "sourced-claim") {
      if (statement.claim_ids.length === 0 || citedClaims.size === 0)
        diagnostics.push({
          code: "RAG_SOURCED_CLAIM_REQUIRED",
          message: `${statement.statement_id} lacks directly cited claim evidence.`,
        });
      if (statement.claim_ids.some((id) => !/^AKL-\d{6}$/.test(id)))
        diagnostics.push({
          code: "RAG_CLAIM_ID_INVALID",
          message: `${statement.statement_id} contains a malformed claim ID.`,
        });
    }
    if (statement.epistemic_type === "synthesis" && new Set(statement.evidence_ids).size < 2)
      diagnostics.push({
        code: "RAG_SYNTHESIS_EVIDENCE_INSUFFICIENT",
        message: `${statement.statement_id} synthesis needs at least two evidence items.`,
      });
    if (
      (statement.epistemic_type === "inference" || statement.epistemic_type === "recommendation") &&
      statement.confidence === "high"
    )
      diagnostics.push({
        code: "RAG_DERIVED_CONFIDENCE_EXCESSIVE",
        message: `${statement.statement_id} derived statement cannot claim high confidence.`,
      });
    if (statement.epistemic_type === "recommendation") {
      if (!request.answer.allow_recommendations)
        diagnostics.push({
          code: "RAG_RECOMMENDATION_NOT_ALLOWED",
          message: `${statement.statement_id} recommendation was not requested.`,
        });
      if (
        statement.conditions.length === 0 ||
        statement.alternatives.length === 0 ||
        statement.trade_offs.length === 0
      )
        diagnostics.push({
          code: "RAG_RECOMMENDATION_INCOMPLETE",
          message: `${statement.statement_id} lacks conditions, alternatives, or trade-offs.`,
        });
    }
    if (statement.epistemic_type === "uncertainty" && statement.confidence !== "low")
      diagnostics.push({
        code: "RAG_UNCERTAINTY_CONFIDENCE_INVALID",
        message: `${statement.statement_id} uncertainty must have low confidence.`,
      });
  }
  return diagnostics;
}

function packet(
  context: RagContextPacket,
  provider: RagModelProvider,
  output: RagModelOutput,
  diagnostics: Array<{ code: string; message: string }>,
  modelInvoked: boolean,
): RagAnswerPacket {
  const statements = output.statements.map<RagGroundedStatement>((statement) => ({
    ...statement,
    citations: resolvedCitations(statement.evidence_ids, context),
  }));
  return {
    rag_contract_version: RAG_CONTRACT_VERSION,
    question: context.question,
    status: output.status,
    model_invoked: modelInvoked,
    provider: {
      provider: provider.provider,
      model: provider.model,
      prompt_version: RAG_PROMPT_VERSION,
    },
    provenance: {
      context_fingerprint: context.context_fingerprint,
      retrieval_generation_id: context.retrieval.generation.generation_id,
      graph_input_fingerprint: context.retrieval.generation.graph_input_fingerprint,
      retrieval_manifest_root: context.retrieval.generation.retrieval_manifest_root,
      data_classification: context.data_classification,
    },
    summary: output.summary,
    statements,
    uncertainties: output.uncertainties,
    refusal_reason: output.refusal_reason,
    rendered_markdown: renderRagAnswer(
      output.status,
      output.summary,
      statements,
      output.uncertainties,
    ),
    diagnostics: [...diagnostics].sort((left, right) => left.code.localeCompare(right.code)),
    retrieval: context.retrieval,
  };
}

export function resolvedCitations(
  evidenceIds: string[],
  context: RagContextPacket,
): RagResolvedCitation[] {
  const permitted = new Set(evidenceIds);
  return context.citation_catalog
    .filter((item) => permitted.has(item.evidence_id))
    .sort(
      (left, right) =>
        left.evidence_id.localeCompare(right.evidence_id) ||
        left.source_id.localeCompare(right.source_id) ||
        left.citation_id.localeCompare(right.citation_id),
    );
}

export function renderRagAnswer(
  status: RagModelOutput["status"],
  summary: string,
  statements: RagGroundedStatement[],
  uncertainties: string[],
): string {
  const lines = [`Status: ${status}`, "", summary];
  for (const statement of statements) {
    const citations = statement.citations
      .map((citation) => `[${citation.source_id}](${citation.url})`)
      .filter((value, index, items) => items.indexOf(value) === index)
      .join(" ");
    lines.push(
      "",
      `- **${statement.epistemic_type}**: ${statement.text}${citations ? ` ${citations}` : ""}`,
    );
  }
  if (uncertainties.length > 0) {
    lines.push("", "Uncertainties:", ...uncertainties.map((item) => `- ${item}`));
  }
  return lines.join("\n");
}

function stableCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.match(/^([A-Z][A-Z0-9_]+)/)?.[1] ?? "RAG_MODEL_UNAVAILABLE";
}
