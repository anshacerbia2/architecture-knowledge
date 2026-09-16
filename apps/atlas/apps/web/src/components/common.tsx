import { Link } from "react-router-dom";
import type { Envelope, Summary } from "../../../../packages/contracts/src/index.js";
import { ApiError } from "../api/client.js";
import { KNOWLEDGE_ID_PATTERN } from "../../../../packages/contracts/src/index.js";

export function Notice({ error }: { error: Error | null }) {
  if (!error) return null;
  return (
    <div role="alert" className="notice">
      <strong>
        {error instanceof ApiError ? error.code.replaceAll("_", " ") : "Unable to complete request"}
      </strong>
      <p>{error.message}</p>
      {error instanceof ApiError && <small>Request {error.requestId}</small>}
    </div>
  );
}
export function Loading() {
  return (
    <p className="loading" role="status">
      Loading validated knowledge…
    </p>
  );
}
export function RecordCard({ record }: { record: Summary }) {
  return (
    <Link className="record-card" to={`/records/${record.id}`}>
      <div className="card-top">
        <span className="eyebrow">{record.family}</span>
        <span className="tag">{record.status ?? "unclassified"}</span>
      </div>
      <h3>{record.title}</h3>
      <span className="mono">{record.id}</span>
      <span className="card-arrow" aria-hidden>
        ↗
      </span>
    </Link>
  );
}
export function Trace({ value }: { value: Envelope<unknown> }) {
  return (
    <details className="trace">
      <summary>Request provenance</summary>
      <dl>
        <dt>Request ID</dt>
        <dd>{value.request_id}</dd>
        <dt>Knowledge commit</dt>
        <dd>{value.repository_commit}</dd>
        <dt>API contract</dt>
        <dd>v{value.contract_version}</dd>
      </dl>
    </details>
  );
}
/** Safe structured text. No raw HTML, auto-loaded images or executable Markdown. */
export function FieldValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="muted">Not specified</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "string")
    return new RegExp(KNOWLEDGE_ID_PATTERN).test(value) ? (
      <Link to={`/records/${value}`}>{value}</Link>
    ) : (
      <span className="prose">{value}</span>
    );
  if (typeof value === "number") return <span>{value}</span>;
  if (Array.isArray(value))
    return value.length ? (
      <ul className="values">
        {value.map((item, i) => (
          <li key={i}>
            <FieldValue value={item} />
          </li>
        ))}
      </ul>
    ) : (
      <span className="muted">None recorded</span>
    );
  return (
    <dl className="fields nested">
      {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
        <div key={key}>
          <dt>{key.replaceAll("_", " ")}</dt>
          <dd>
            <FieldValue value={item} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
