import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  DecisionEvaluationInput,
  DecisionEvaluationOutput,
  DecisionGuideIntake,
  DecisionGuideSummary,
  DecisionSession,
  Envelope,
} from "../../../../packages/contracts/src/index.js";
import { api } from "../api/client.js";
import { FieldValue, Notice, Trace } from "../components/common.js";

type RecordValue = Record<string, unknown>;
const text = (value: unknown): string => (typeof value === "string" ? value : "");

function createSession(intake: DecisionGuideIntake): DecisionSession {
  return {
    contract_version: 3,
    session_id: crypto.randomUUID(),
    guide_id: intake.guide.id,
    guide_version: intake.guide.version,
    context: intake.context_variables.map((entry) => {
      const value = entry as RecordValue;
      return {
        key: text(value.key),
        value: "",
        classification: text(value.sensitivity) as "public" | "internal",
        provenance: "human-provided",
        confirmed_by_human: false,
      };
    }),
    drivers: [],
    constraints: intake.constraints.map((entry) => {
      const value = entry as RecordValue;
      return { concept_id: text(value.concept_id), satisfied: null, notes: null };
    }),
    condition_evaluations: intake.conditions.map((prompt) => ({
      condition: structuredClone(prompt.condition),
      satisfied: null,
      confirmed_by_human: false,
    })),
    privacy: {
      persistence: "ephemeral-only",
      external_provider_authorized: false,
      external_provider_authorization: null,
      redacted_keys: [],
    },
    authority: {
      recommendation_only: true,
      human_decision_required: true,
      automation_may_approve: false,
    },
  };
}

export default function Decide() {
  const guides = useQuery({
    queryKey: ["decision-guides"],
    queryFn: () => api<DecisionGuideSummary[]>("/decision-guides"),
    staleTime: Infinity,
  });
  const [guideId, setGuideId] = useState("");
  const intake = useQuery({
    queryKey: ["decision-intake", guideId],
    queryFn: () => api<DecisionGuideIntake>(`/decision-guides/${guideId}/intake`),
    enabled: Boolean(guideId),
    staleTime: Infinity,
  });
  const [draft, setDraft] = useState<DecisionSession | null>(null);
  const [revision, setRevision] = useState(0);
  const revisionRef = useRef(0);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<Envelope<DecisionEvaluationOutput> | null>(null);

  useEffect(() => {
    if (!guideId && guides.data?.data[0]) setGuideId(guides.data.data[0].id);
  }, [guideId, guides.data]);
  useEffect(() => {
    if (!intake.data || intake.data.data.guide.id !== guideId) return;
    requestRef.current?.abort();
    const nextRevision = revisionRef.current + 1;
    revisionRef.current = nextRevision;
    setRevision(nextRevision);
    setDraft(createSession(intake.data.data));
    setResult(null);
    setError(null);
    setPending(false);
  }, [intake.data, guideId]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  const invalidate = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    const nextRevision = revisionRef.current + 1;
    revisionRef.current = nextRevision;
    setRevision(nextRevision);
    setResult(null);
    setError(null);
    setPending(false);
  };

  const edit = (update: (value: DecisionSession) => DecisionSession) => {
    setDraft((current) => (current ? update(structuredClone(current)) : current));
    invalidate();
  };
  const reset = () => {
    if (!intake.data) return;
    invalidate();
    setDraft(createSession(intake.data.data));
    setResult(null);
    setError(null);
    setPending(false);
  };
  const evaluate = async () => {
    if (!draft || !intake.data || pending || draft.guide_id !== guideId) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const submittedRevision = revisionRef.current;
    setPending(true);
    setError(null);
    try {
      const payload: DecisionEvaluationInput = {
        repository_commit: intake.data.repository_commit,
        client_revision: submittedRevision,
        session: structuredClone(draft),
      };
      const response = await api<DecisionEvaluationOutput>(
        "/decision-evaluations",
        payload,
        controller.signal,
      );
      if (
        mountedRef.current &&
        !controller.signal.aborted &&
        requestRef.current === controller &&
        submittedRevision === revisionRef.current &&
        response.data.client_revision === submittedRevision &&
        response.repository_commit === intake.data.repository_commit
      )
        setResult(response);
    } catch (cause) {
      if (
        mountedRef.current &&
        !controller.signal.aborted &&
        requestRef.current === controller &&
        submittedRevision === revisionRef.current
      )
        setError(cause instanceof Error ? cause : new Error("Decision evaluation failed."));
    } finally {
      if (mountedRef.current && requestRef.current === controller) setPending(false);
    }
  };

  const selected = intake.data?.data.guide.id === guideId ? intake.data.data : undefined;
  const recommendation = result?.data.recommendation;
  return (
    <>
      <section className="page-heading">
        <div className="eyebrow">DECIDE / 04</div>
        <h1>
          Compare with evidence.
          <br />
          <em>Keep the human decision.</em>
        </h1>
        <p>
          A local, deterministic assistant for the three proposed M7.2 guides. It asks for explicit
          confirmation and never approves or persists a decision.
        </p>
      </section>
      <div className="info-banner">
        <strong>Local evaluation only</strong>
        <span>
          Decision context is evaluated against the pinned repository snapshot. No AI provider,
          retrieval database, chat history, or automatic lifecycle transition is used.
        </span>
      </div>
      <section className="panel decision-guide-picker">
        <label htmlFor="decision-guide">Decision guide</label>
        <select
          id="decision-guide"
          value={guideId}
          disabled={guides.isLoading}
          onChange={(event) => {
            invalidate();
            setDraft(null);
            setGuideId(event.target.value);
          }}
        >
          {(guides.data?.data ?? []).map((guide) => (
            <option value={guide.id} key={guide.id}>
              {guide.title} · {guide.id}
            </option>
          ))}
        </select>
        {selected && (
          <div className="guide-summary">
            <span className="tag">{selected.guide.lifecycle_status}</span>
            <span className="tag">human decision required</span>
            <p>{selected.guide.decision_question}</p>
          </div>
        )}
      </section>
      <Notice error={guides.error ?? intake.error ?? error} />
      {draft && selected && draft.guide_id === selected.guide.id && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void evaluate();
          }}
        >
          <section className="panel decision-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">1 · PROJECT CONTEXT</span>
                <h2>Describe the bounded decision</h2>
              </div>
              <span className="tag">internal</span>
            </div>
            {selected.context_variables.map((entry, index) => {
              const variable = entry as RecordValue;
              const item = draft.context[index]!;
              return (
                <fieldset className="decision-field" key={item.key}>
                  <legend>{text(variable.question)}</legend>
                  <p>{text(variable.description)}</p>
                  <textarea
                    aria-label={text(variable.question)}
                    value={String(item.value ?? "")}
                    maxLength={4000}
                    onChange={(event) =>
                      edit((value) => {
                        value.context[index]!.value = event.target.value;
                        value.context[index]!.confirmed_by_human = false;
                        return value;
                      })
                    }
                  />
                  <label className="confirm-control">
                    <input
                      type="checkbox"
                      checked={item.confirmed_by_human}
                      disabled={!String(item.value ?? "").trim()}
                      onChange={(event) =>
                        edit((value) => {
                          value.context[index]!.confirmed_by_human = event.target.checked;
                          return value;
                        })
                      }
                    />
                    I confirm this project context is accurate for this evaluation.
                  </label>
                </fieldset>
              );
            })}
          </section>

          <section className="panel decision-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">2 · CONSTRAINTS & DRIVERS</span>
                <h2>Confirm scope and priorities</h2>
              </div>
            </div>
            {selected.constraints.map((entry, index) => {
              const constraint = entry as RecordValue;
              return (
                <fieldset className="decision-field" key={text(constraint.concept_id)}>
                  <legend>
                    {text(constraint.concept_id)} · {text(constraint.hardness)} constraint
                  </legend>
                  <p>{text(constraint.rationale)}</p>
                  <label>
                    Assessment
                    <select
                      value={String(draft.constraints[index]!.satisfied)}
                      onChange={(event) =>
                        edit((value) => {
                          value.constraints[index]!.satisfied =
                            event.target.value === "null" ? null : event.target.value === "true";
                          return value;
                        })
                      }
                    >
                      <option value="null">Unknown — ask for clarification</option>
                      <option value="true">Satisfied — confirmed by me</option>
                      <option value="false">Not satisfied — confirmed by me</option>
                    </select>
                  </label>
                  <label>
                    Project note (optional)
                    <input
                      value={draft.constraints[index]!.notes ?? ""}
                      maxLength={4000}
                      onChange={(event) =>
                        edit((value) => {
                          value.constraints[index]!.notes = event.target.value || null;
                          return value;
                        })
                      }
                    />
                  </label>
                </fieldset>
              );
            })}
            {selected.quality_attributes.map((entry) => {
              const driver = entry as RecordValue;
              const conceptId = text(driver.concept_id);
              const active = draft.drivers.some((item) => item.concept_id === conceptId);
              return (
                <label className="driver-card" key={conceptId}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) =>
                      edit((value) => {
                        value.drivers = event.target.checked
                          ? [
                              ...value.drivers,
                              {
                                concept_id: conceptId,
                                role: "quality-attribute",
                                priority: (text(driver.priority) || "medium") as "medium",
                              },
                            ]
                          : value.drivers.filter((item) => item.concept_id !== conceptId);
                        return value;
                      })
                    }
                  />
                  <span>
                    <strong>{conceptId}</strong>
                    <small>{text(driver.rationale)}</small>
                  </span>
                </label>
              );
            })}
          </section>

          <section className="panel decision-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">3 · APPLICABILITY</span>
                <h2>Assess each condition explicitly</h2>
              </div>
              <span className="count">{selected.conditions.length} conditions</span>
            </div>
            <p className="hint">
              Choosing a value does not confirm it. Check the confirmation box after reviewing the
              condition for this project.
            </p>
            <div className="condition-list">
              {selected.conditions.map((prompt, index) => {
                const item = draft.condition_evaluations[index]!;
                return (
                  <fieldset className="condition-card" key={prompt.key}>
                    <legend>{prompt.condition.statement}</legend>
                    <small>
                      {prompt.condition.scope} ·{" "}
                      {prompt.condition.concept_ids.join(", ") || "no concept reference"}
                    </small>
                    <div className="condition-options">
                      {[
                        ["true", "Yes"],
                        ["false", "No"],
                        ["null", "Unknown"],
                      ].map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name={`condition-${index}`}
                            value={value}
                            checked={String(item.satisfied) === value}
                            onChange={() =>
                              edit((session) => {
                                session.condition_evaluations[index]!.satisfied =
                                  value === "null" ? null : value === "true";
                                session.condition_evaluations[index]!.confirmed_by_human = false;
                                return session;
                              })
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <label className="confirm-control">
                      <input
                        type="checkbox"
                        checked={item.confirmed_by_human}
                        disabled={item.satisfied === null}
                        onChange={(event) =>
                          edit((session) => {
                            session.condition_evaluations[index]!.confirmed_by_human =
                              event.target.checked;
                            return session;
                          })
                        }
                      />
                      I confirm this assessment.
                    </label>
                  </fieldset>
                );
              })}
            </div>
          </section>

          <div className="decision-actions">
            <button disabled={pending} type="submit">
              {pending ? "Validating decision context…" : "Evaluate options"}
            </button>
            <button className="secondary" type="button" onClick={reset}>
              Reset ephemeral session
            </button>
            <span className="hint">Draft revision {revision} · not persisted</span>
          </div>
        </form>
      )}

      {pending && (
        <div className="working" role="status">
          <span className="pulse" />
          <div>
            <strong>Evaluating confirmed conditions and evidence…</strong>
            <p>No provider or retrieval database is called.</p>
          </div>
        </div>
      )}
      {result && recommendation && (
        <section className="panel decision-result" aria-live="polite">
          <div className="section-heading">
            <div>
              <span className="eyebrow">VALIDATED RECOMMENDATION</span>
              <h2>{text(recommendation.status).replaceAll("-", " ")}</h2>
            </div>
            <span className="tag">proposed · human decision required</span>
          </div>
          {result.data.clarification_prompts.length > 0 && (
            <div className="notice">
              <strong>Clarification required</strong>
              <ul>
                {result.data.clarification_prompts.map((prompt) => (
                  <li key={`${prompt.kind}-${prompt.key}`}>{prompt.question}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="decision-columns">
            <div>
              <h3>Viable options</h3>
              <FieldValue value={recommendation.viable_options} />
            </div>
            <div>
              <h3>Rejected options</h3>
              <FieldValue value={recommendation.rejected_options} />
            </div>
            <div>
              <h3>Inapplicable options</h3>
              <FieldValue value={recommendation.inapplicable_options} />
            </div>
          </div>
          <div className="decision-evidence-grid">
            {[
              ["Trade-offs", recommendation.tradeoffs],
              ["Verification", recommendation.verification],
              ["Evolution triggers", recommendation.evolution_triggers],
              ["Uncertainty", recommendation.uncertainty],
            ].map(([label, value]) => (
              <article key={String(label)}>
                <h3>{String(label)}</h3>
                <FieldValue value={value} />
              </article>
            ))}
          </div>
          <details className="evidence-inspector">
            <summary>Evidence and decision-basis inspector</summary>
            <FieldValue
              value={{
                decision_basis: recommendation.decision_basis,
                claim_ids: recommendation.claim_ids,
                source_ids: recommendation.source_ids,
                evidence_claims: recommendation.evidence_claims,
                authority: recommendation.authority,
              }}
            />
          </details>
          <Trace value={result} />
        </section>
      )}
      <p className="hint">
        Leaving or refreshing this page discards the draft and result. Browser/OS memory is not
        claimed to be securely erased.
      </p>
    </>
  );
}
