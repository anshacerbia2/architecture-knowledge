import { Link } from "react-router-dom";
import type { Answer, Citation } from "../../../../packages/contracts/src/index.js";
import { FieldValue } from "./common.js";

interface CitationGroup {
  source_id: string;
  title: string;
  url: string;
  evidence_ids: string[];
  locators: unknown[];
}

export function groupCitations(citations: Citation[]): CitationGroup[] {
  const groups = new Map<string, CitationGroup>();
  for (const citation of citations) {
    const key = JSON.stringify([citation.source_id, citation.title, citation.url]);
    const group = groups.get(key) ?? {
      source_id: citation.source_id,
      title: citation.title,
      url: citation.url,
      evidence_ids: [],
      locators: [],
    };
    if (!group.evidence_ids.includes(citation.evidence_id))
      group.evidence_ids.push(citation.evidence_id);
    for (const locator of citation.locators) {
      const locatorKey = JSON.stringify(locator);
      if (!group.locators.some((item) => JSON.stringify(item) === locatorKey))
        group.locators.push(locator);
    }
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function safeSourceUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function AnswerPanel({ answer }: { answer: Answer }) {
  return (
    <article className="answer panel">
      <div className="section-heading">
        <h2>Evidence-backed response</h2>
        <span className="tag">{answer.status}</span>
      </div>
      <p className="answer-summary">{answer.summary}</p>
      {answer.refusal_reason && <p>{answer.refusal_reason}</p>}
      {answer.statements.map((s) => (
        <section className="statement" key={s.statement_id}>
          <div className="actions">
            <span className="eyebrow">{s.epistemic_type}</span>
            <span className="tag">{s.confidence} confidence</span>
          </div>
          <p>{s.text}</p>
          {[
            ["Conditions", s.conditions],
            ["Alternatives", s.alternatives],
            ["Trade-offs", s.trade_offs],
          ].map(
            ([label, values]) =>
              (values as string[]).length > 0 && (
                <div key={label as string}>
                  <h4>{label as string}</h4>
                  <FieldValue value={values} />
                </div>
              ),
          )}
          <div className="actions">
            {s.claim_ids.map((id) => (
              <Link key={id} to={`/records/${id}`}>
                {id}
              </Link>
            ))}
          </div>
          <div className="citations">
            {groupCitations(s.citations).map((c) => (
              <details key={`${s.statement_id}-${c.source_id}-${c.url}`}>
                <summary>
                  {c.source_id} · {c.title}
                </summary>
                <p>Evidence: {c.evidence_ids.join(", ")}</p>
                {safeSourceUrl(c.url) && (
                  <a href={safeSourceUrl(c.url)} target="_blank" rel="noreferrer noopener">
                    Open registered source ↗
                  </a>
                )}
                {c.locators.length > 0 && <FieldValue value={c.locators} />}
              </details>
            ))}
          </div>
        </section>
      ))}
      {answer.uncertainties.length > 0 && (
        <div className="notice">
          <strong>Uncertainty remains</strong>
          <FieldValue value={answer.uncertainties} />
        </div>
      )}
      <p className="hint">
        Citation resolution and structural grounding do not prove semantic entailment.{" "}
        {answer.provider.provider === "deterministic-fake"
          ? "This deterministic provider demonstrates the pipeline, not live-model quality."
          : "Live model output requires source checking; confidence labels are not calibrated probabilities."}
      </p>
      <details className="trace">
        <summary>Evidence & model provenance</summary>
        <FieldValue
          value={{
            ...answer.provenance,
            provider: answer.provider,
            model_invoked: answer.model_invoked,
          }}
        />
      </details>
    </article>
  );
}
