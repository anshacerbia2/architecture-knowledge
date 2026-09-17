import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Answer, AskInput } from "../../../../packages/contracts/src/index.js";
import { api } from "../api/client.js";
import { Notice, Trace } from "../components/common.js";
import { AnswerPanel } from "../components/answer-panel.js";

export default function Ask() {
  const [question, setQuestion] = useState("");
  const [classification, setClassification] = useState<AskInput["data_classification"]>("public");
  const request = useMutation({
    mutationFn: (input: AskInput) => api<Answer>("/rag/answers", input),
  });
  return (
    <>
      <section className="page-heading">
        <div className="eyebrow">REASON / 03</div>
        <h1>
          Ask with evidence.
          <br />
          <em>Keep the uncertainty.</em>
        </h1>
        <p>Single-turn knowledge Q&A. Recommendations and automated decisions are disabled.</p>
      </section>
      <div className="info-banner">
        <strong>Check provider mode in System status</strong>
        <span>
          In OpenAI live pilot mode, submitting sends your question and retrieved public evidence to
          OpenAI and consumes the shared pilot budget. Use only non-secret public test questions.
          Fake mode makes no external model calls. Each question is independent.
        </span>
      </div>
      <form
        className="question-panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) request.mutate({ question, data_classification: classification });
        }}
      >
        <label htmlFor="question">What would you like to understand?</label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What are the trade-offs of using retries with a circuit breaker?"
          maxLength={4000}
          required
          disabled={request.isPending}
        />
        <div className="composer-bottom">
          <label>
            Data classification{" "}
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as AskInput["data_classification"])}
              disabled={request.isPending}
            >
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
            </select>
          </label>
          <span className="hint">{question.length}/4000</span>
          <button disabled={request.isPending || !question.trim()}>
            {request.isPending ? "Checking evidence…" : "Ask knowledge ↗"}
          </button>
        </div>
      </form>
      <div className="suggestions">
        {["What is a circuit breaker?", "Explain retry trade-offs", "What is availability?"].map(
          (q) => (
            <button
              className="secondary"
              key={q}
              disabled={request.isPending}
              onClick={() => setQuestion(q)}
            >
              {q}
            </button>
          ),
        )}
      </div>
      {request.isPending && (
        <div className="working" role="status">
          <span className="pulse" />
          <div>
            <strong>Retrieving, grounding and verifying…</strong>
            <p>The answer appears only after the complete response passes the kernel checks.</p>
          </div>
        </div>
      )}
      <Notice error={request.error} />
      {request.data && (
        <>
          <div className="asked-question">
            <span className="eyebrow">YOUR QUESTION</span>
            <p>{request.data.data.question}</p>
          </div>
          <AnswerPanel answer={request.data.data} />
          <Trace value={request.data} />
          <button
            className="secondary"
            onClick={() => {
              request.reset();
              setQuestion("");
            }}
          >
            Clear question & answer
          </button>
        </>
      )}
      <p className="hint">
        No persisted chat history. Refreshing or leaving this page clears the displayed answer.
      </p>
    </>
  );
}
