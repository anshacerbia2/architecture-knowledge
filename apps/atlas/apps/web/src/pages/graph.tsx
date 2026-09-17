import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import type { GraphView, Summary } from "../../../../packages/contracts/src/index.js";
import { api } from "../api/client.js";
import { FieldValue, Loading, Notice, Trace } from "../components/common.js";

export default function Graph() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id") ?? "AKC-000012";
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: ({ signal }) => api<Summary[]>("/catalog", undefined, signal),
  });
  const result = useQuery({
    queryKey: ["graph", id],
    queryFn: ({ signal }) => api<GraphView>(`/graph/${encodeURIComponent(id)}`, undefined, signal),
  });
  const nodes = result.data?.data.nodes ?? [];
  const peripheral = nodes.filter((n) => n.id !== id);
  const positions = new Map(
    nodes.map((n) => {
      const index = peripheral.findIndex((p) => p.id === n.id);
      const angle = (index / Math.max(peripheral.length, 1)) * Math.PI * 2;
      return [
        n.id,
        n.id === id ? [400, 255] : [400 + Math.cos(angle) * 280, 255 + Math.sin(angle) * 185],
      ];
    }),
  );
  return (
    <>
      <section className="page-heading">
        <div className="eyebrow">CONNECT / 02</div>
        <h1>See what connects.</h1>
        <p>
          A bounded, one-hop inspection of evidence and relationships. Dotted edges are excluded
          from traversal.
        </p>
      </section>
      <label className="control-label">
        Focus record
        <select value={id} onChange={(e) => setParams({ id: e.target.value })}>
          {catalog.data?.data.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title} · {n.id}
            </option>
          ))}
        </select>
      </label>
      <Notice error={result.error} />
      {result.isPending && <Loading />}
      {result.data && (
        <>
          <section className="graph-panel">
            <div className="graph-legend">
              <span>● Focus</span>
              <span>○ Connected record</span>
              <span>⇢ Directed reference</span>
            </div>
            <svg viewBox="0 0 800 510" role="img" aria-label={`One-hop connections for ${id}`}>
              <defs>
                <marker
                  id="arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="18"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8" fill="#9aa9a5" />
                </marker>
              </defs>
              {result.data.data.edges.map((e) => {
                const a = positions.get(e.from);
                const b = positions.get(e.to);
                return (
                  a &&
                  b && (
                    <line
                      key={e.id}
                      x1={a[0]}
                      y1={a[1]}
                      x2={b[0]}
                      y2={b[1]}
                      className={e.traversable ? "graph-edge" : "graph-edge excluded"}
                      markerEnd={e.direction === "directed" ? "url(#arrow)" : undefined}
                    />
                  )
                );
              })}
              {nodes.map((n) => {
                const p = positions.get(n.id)!;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${p[0]}, ${p[1]})`}
                    className={n.id === id ? "graph-node focus" : "graph-node"}
                  >
                    <circle r={n.id === id ? 35 : 17} />
                    <text y={n.id === id ? 58 : 35} textAnchor="middle">
                      {n.title.length > 27 ? `${n.title.slice(0, 25)}…` : n.title}
                    </text>
                    <title>
                      {n.title} · {n.id}
                    </title>
                  </g>
                );
              })}
            </svg>
          </section>
          <p className="hint">
            {result.data.data.edges.length} edges · {nodes.length} records ·{" "}
            {result.data.data.truncated
              ? "Truncated at 40 edges; open the record for all connections."
              : "All immediate connections shown."}
          </p>
          <section className="panel">
            <h2>Connection details</h2>
            <div className="edge-list">
              {result.data.data.edges.map((e) => (
                <article key={e.id}>
                  <div className="edge-line">
                    <Link to={`/records/${e.from}`}>{e.from}</Link>
                    <span>
                      {e.direction === "symmetric" ? "↔" : "→"} {e.predicate}
                    </span>
                    <Link to={`/records/${e.to}`}>{e.to}</Link>
                    <span className="tag">{e.traversable ? "traversal eligible" : "excluded"}</span>
                  </div>
                  {!e.traversable && <p>{e.exclusion_reason}</p>}
                  {e.conditions.length > 0 && (
                    <details>
                      <summary>Applicability conditions</summary>
                      <FieldValue value={e.conditions} />
                    </details>
                  )}
                </article>
              ))}
            </div>
            <h3>Change focus</h3>
            <div className="actions">
              {nodes.map((n) => (
                <button
                  key={n.id}
                  className="secondary"
                  title={n.title}
                  onClick={() => setParams({ id: n.id })}
                >
                  {n.id} · {n.title.length > 45 ? `${n.title.slice(0, 42)}…` : n.title}
                </button>
              ))}
            </div>
          </section>
          <Trace value={result.data} />
        </>
      )}
    </>
  );
}
