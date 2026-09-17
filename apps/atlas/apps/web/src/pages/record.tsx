import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type { RecordView } from "../../../../packages/contracts/src/index.js";
import { api } from "../api/client.js";
import { FieldValue, Loading, Notice, Trace } from "../components/common.js";

export default function Record() {
  const { id = "" } = useParams();
  const result = useQuery({
    queryKey: ["record", id],
    queryFn: ({ signal }) =>
      api<RecordView>(`/records/${encodeURIComponent(id)}`, undefined, signal),
  });
  const record = result.data?.data;
  return (
    <>
      <Link className="back-link" to="/">
        ← Knowledge library
      </Link>
      <Notice error={result.error} />
      {result.isPending && <Loading />}
      {record && (
        <>
          <section className="page-heading">
            <div className="eyebrow">
              {record.summary.family} / {record.summary.id}
            </div>
            <h1>{record.summary.title}</h1>
            <div className="actions">
              <span className="tag">{record.summary.status}</span>
              <Link className="button secondary" to={`/graph?id=${id}`}>
                Explore connections ↗
              </Link>
            </div>
            <p className="mono">{record.summary.source_path}</p>
          </section>
          <div className="detail-layout">
            <section className="panel">
              <h2>Record & evidence</h2>
              <dl className="fields">
                {Object.entries(record.fields)
                  .filter(([k]) => !["id", "record_kind", "title", "source_path"].includes(k))
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replaceAll("_", " ")}</dt>
                      <dd>
                        <FieldValue value={value} />
                      </dd>
                    </div>
                  ))}
              </dl>
            </section>
            <aside className="panel connections">
              <h2>Connections</h2>
              <p className="hint">
                Reference inspection is not a traversal or applicability decision.
              </p>
              {record.connections.map((e) => (
                <div className="connection" key={e.id}>
                  <span className="eyebrow">{e.predicate}</span>
                  <Link to={`/records/${e.from === id ? e.to : e.from}`}>
                    {e.from === id ? e.to : e.from} ↗
                  </Link>
                  {!e.traversable && (
                    <small>Traversal excluded: {e.exclusion_reason ?? "policy"}</small>
                  )}
                  {e.conditions.length > 0 && (
                    <details>
                      <summary>Conditions</summary>
                      <FieldValue value={e.conditions} />
                    </details>
                  )}
                </div>
              ))}
            </aside>
          </div>
          <Trace value={result.data!} />
        </>
      )}
    </>
  );
}
