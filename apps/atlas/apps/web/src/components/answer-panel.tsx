import { Link } from "react-router-dom";
import type { Answer } from "../../../../packages/contracts/src/index.js";
import { FieldValue } from "./common.js";

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
            {s.citations.map((c) => (
              <details key={`${s.statement_id}-${c.citation_id}`}>
                <summary>
                  {c.source_id} · {c.title}
                </summary>
                <p>Evidence: {c.evidence_id}</p>
                {safeSourceUrl(c.url) && (
                  <a href={safeSourceUrl(c.url)} target="_blank" rel="noreferrer noopener">
                    Open registered source ↗
                  </a>
                )}
                <FieldValue value={c.locators} />
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
        Citation resolution and structural grounding do not prove semantic entailment. This
        deterministic provider demonstrates the pipeline, not live-model quality.
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
