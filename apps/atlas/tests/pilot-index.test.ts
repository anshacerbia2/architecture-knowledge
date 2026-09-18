import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  commit: vi.fn(),
  graph: vi.fn(),
  artifacts: vi.fn(),
  index: vi.fn(),
  check: vi.fn(),
  close: vi.fn(),
  providers: vi.fn(),
  options: {},
}));
vi.mock("../packages/knowledge-adapter/src/snapshot.js", () => ({ cleanCommit: state.commit }));
vi.mock("../packages/knowledge-adapter/src/providers.js", () => ({ providers: state.providers }));
vi.mock("architecture-knowledge-system/runtime", async (original) => ({
  ...(await original<typeof import("architecture-knowledge-system/runtime")>()),
  loadValidatedGraph: state.graph,
  loadCurrentRetrievalArtifacts: state.artifacts,
  buildRetrievalArtifacts: () => ({}),
  indexRetrievalGeneration: state.index,
  checkRetrievalCurrent: state.check,
  RetrievalDatabase: class {
    pool = { options: state.options };
    close = state.close;
  },
}));
import { pilotIndex, pilotManifest } from "../packages/knowledge-adapter/src/pilot-index.js";
const config = {
  mode: "openai" as const,
  apiKey: "synthetic",
  publicManifest: "manifest",
  budgetFile: "synthetic-budget",
};
beforeEach(() => {
  vi.resetAllMocks();
  state.commit.mockResolvedValue("a".repeat(40));
  state.artifacts.mockResolvedValue({ units: [], manifest: { manifest_root_hash: "manifest" } });
  state.providers.mockReturnValue({
    embedding: {},
    budget: { status: () => ({ remaining_cents: 500 }) },
  });
  const generation = {
    repository_commit: "a".repeat(40),
    generation_id: "synthetic",
    unit_count: 3,
    status: "active",
  };
  state.index.mockResolvedValue(generation);
  state.check.mockResolvedValue(generation);
});
it("plans without providers, DB or network and rejects changing checkout", async () => {
  expect((await pilotManifest("root")).commit).toBe("a".repeat(40));
  expect(state.providers).not.toHaveBeenCalled();
  state.commit.mockResolvedValueOnce("a".repeat(40)).mockResolvedValueOnce("b".repeat(40));
  await expect(pilotManifest("root")).rejects.toThrow("SNAPSHOT_CHANGED");
});
it.each(["index", "check"] as const)(
  "uses the same governed provider and closes DB for %s",
  async (action) => {
    expect(await pilotIndex("root", "synthetic", true, config, action)).toMatchObject({
      unit_count: 3,
      status: "active",
    });
    expect(state.providers).toHaveBeenCalledWith(config, "manifest");
    expect(action === "index" ? state.index : state.check).toHaveBeenCalledOnce();
    expect(action === "index" ? state.check : state.index).not.toHaveBeenCalled();
    expect(state.options).toMatchObject({ enableChannelBinding: true });
    expect(state.close).toHaveBeenCalledOnce();
  },
);
it("requires explicit live mode and closes DB after indexing failure", async () => {
  await expect(pilotIndex("root", "synthetic", false, { mode: "fake" }, "index")).rejects.toThrow();
  expect(state.providers).not.toHaveBeenCalled();
  state.index.mockRejectedValue(new Error("synthetic index failure"));
  await expect(pilotIndex("root", "synthetic", false, config, "index")).rejects.toThrow();
  expect(state.close).toHaveBeenCalledOnce();
});
