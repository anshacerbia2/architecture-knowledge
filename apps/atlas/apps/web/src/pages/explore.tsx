import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type {
  SearchInput,
  SearchOutput,
  Summary,
} from "../../../../packages/contracts/src/index.js";
import { api } from "../api/client.js";
import { Loading, Notice, RecordCard, Trace } from "../components/common.js";

export default function Explore() {
  const [text, setText] = useState("");
  const [family, setFamily] = useState("concept");
  const [mode, setMode] = useState<SearchInput["mode"]>("hybrid-graph");
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: ({ signal }) => api<Summary[]>("/catalog", undefined, signal),
  });
  const search = useMutation({
    mutationFn: (input: SearchInput) => api<SearchOutput>("/search", input),
  });
  const visible =
    catalog.data?.data.filter(
      (r) =>
        (family === "all" || r.family === family) &&
        `${r.title} ${r.id}`.toLowerCase().includes(text.toLowerCase()),
    ) ?? [];
  return (
    <>
      <section className="page-heading">
        <div className="eyebrow">EXPLORE / 01</div>
        <h1>
          Understand the architecture.
          <br />
          <em>Follow the evidence.</em>
        </h1>
        <p>A connected workspace for concepts, claims and the sources behind them.</p>
      </section>
      <form
        className="search-box"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) search.mutate({ text, mode });
        }}
      >
        <span aria-hidden>⌕</span>
        <input
          aria-label="Search knowledge"
          placeholder="Find a concept, question or knowledge ID…"
          value={text}
          maxLength={4000}
          onChange={(e) => {
            setText(e.target.value);
            search.reset();
          }}
        />
        <select
          aria-label="Retrieval mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as SearchInput["mode"])}
        >
          <option value="hybrid-graph">Hybrid + graph</option>
          <option value="hybrid">Hybrid</option>
          <option value="lexical">Lexical</option>
        </select>
        <button disabled={!text.trim() || search.isPending}>
          {search.isPending ? "Searching…" : "Search index ↗"}
        </button>
      </form>
      <p className="hint">
        Typing filters the catalog below. Search index queries PostgreSQL/pgvector; it requires a
        current index. In OpenAI live pilot mode, Hybrid searches send your query to OpenAI for
        embedding and consume budget. Use only public, non-secret test queries. Typing alone sends
        nothing to OpenAI.
      </p>
      <Notice error={search.error} />
      {search.data && (
        <section className="panel">
          <div className="section-heading">
            <h2>Retrieved evidence</h2>
            <span>{search.data.data.hits.length} units</span>
          </div>
          {search.data.data.hits.length === 0 && (
            <p>No matching evidence. Try a more specific architecture term.</p>
          )}
          {search.data.data.hits.map((hit) => (
            <article className="search-hit" key={hit.unit_id}>
              <span className="eyebrow">
                {hit.kind} · {hit.status}
              </span>
              <h3>
                <Link to={`/records/${hit.record_id}`}>{hit.title}</Link>
              </h3>
              <p>
                {hit.text.slice(0, 550)}
                {hit.text.length > 550 ? "…" : ""}
              </p>
              <small>Graph path: {hit.graph_path.join(" → ") || "seed retrieval"}</small>
            </article>
          ))}
          <Trace value={search.data} />
        </section>
      )}
      <div className="section-heading">
        <h2>
          Knowledge library <span className="count">{visible.length}</span>
        </h2>
        <select
          aria-label="Record family"
          value={family}
          onChange={(e) => setFamily(e.target.value)}
        >
          {["concept", "decision-guide", "claim", "source", "relationship", "all"].map((f) => (
            <option key={f} value={f}>
              {f === "all" ? "All records" : f}
            </option>
          ))}
        </select>
      </div>
      <Notice error={catalog.error} />
      {catalog.isPending && <Loading />}
      <div className="card-grid">
        {visible.slice(0, 60).map((r) => (
          <RecordCard key={r.id} record={r} />
        ))}
      </div>
      {visible.length > 60 && (
        <p className="hint">
          Showing 60 of {visible.length}. Narrow the catalog filter to inspect more.
        </p>
      )}
      {catalog.data && visible.length === 0 && <p>No catalog entries match this filter.</p>}
      <div className="principle-strip">
        <span>
          01 <b>Browse the concept</b>
        </span>
        <span>
          02 <b>Inspect claims & relations</b>
        </span>
        <span>
          03 <b>Trace to the source</b>
        </span>
      </div>
    </>
  );
}
