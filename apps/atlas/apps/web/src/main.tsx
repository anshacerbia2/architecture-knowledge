import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loading } from "./components/common.js";
import "./styles.css";

const Explore = lazy(() => import("./pages/explore.js"));
const Record = lazy(() => import("./pages/record.js"));
const Graph = lazy(() => import("./pages/graph.js"));
const Ask = lazy(() => import("./pages/ask.js"));
const Status = lazy(() => import("./pages/status.js"));
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 15000 },
    mutations: { retry: false },
  },
});
function App() {
  return (
    <div className="workspace">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-symbol">a.</span>
          <span>
            Architecture
            <br />
            <b>Atlas</b>
          </span>
        </NavLink>
        <div className="nav-caption">KNOWLEDGE WORKSPACE</div>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            <span>◈</span> Explore knowledge
          </NavLink>
          <NavLink to="/graph">
            <span>⌘</span> Graph explorer
          </NavLink>
          <NavLink to="/ask">
            <span>✳</span> Ask knowledge
          </NavLink>
          <NavLink to="/status">
            <span>◉</span> System status
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <span className="local-dot" /> Local workspace
          <p>
            Evidence first.
            <br />
            Human decisions.
          </p>
          <small>v0.1 · Read-only pilot</small>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <span>
            Architecture Knowledge System <span className="divider">/</span> Local app
          </span>
          <NavLink to="/status" className="demo-pill">
            PROVIDER STATUS
          </NavLink>
        </header>
        <main id="main">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Explore />} />
              <Route path="/records/:id" element={<Record />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="/ask" element={<Ask />} />
              <Route path="/status" element={<Status />} />
              <Route
                path="*"
                element={
                  <section>
                    <h1>Page not found</h1>
                    <NavLink to="/">Back to workspace</NavLink>
                  </section>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <footer>
          Knowledge retains its recorded lifecycle. Retrieval and citation checks are not human
          approval.
        </footer>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
