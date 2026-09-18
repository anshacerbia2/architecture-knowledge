import { expect, it, vi } from "vitest";
vi.mock("node:fs", async (original) => {
  const fs = await original<typeof import("node:fs")>();
  return { ...fs, fsyncSync: vi.fn(fs.fsyncSync), appendFileSync: vi.fn(fs.appendFileSync) };
});
import { mkdtempSync, rmSync, fsyncSync, appendFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { PilotBudget, pilotFetch } from "../packages/knowledge-adapter/src/pilot-budget.js";

it("flushes initialization and reservation before transport, and refuses transport on failed flush", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "atlas-durability-test-"));
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-17T00:00:00Z"));
  try {
    const budget = new PilotBudget(path.join(directory, "budget.txt"));
    budget.initialize();
    expect(fsyncSync).toHaveBeenCalledTimes(1);
    const transport = vi.fn<typeof fetch>().mockImplementation(async () => {
      expect(appendFileSync).toHaveBeenCalledOnce();
      expect(fsyncSync).toHaveBeenCalledTimes(2);
      return new Response("{}");
    });
    const request = pilotFetch(budget, transport);
    const init = {
      method: "POST",
      body: JSON.stringify({ model: "text-embedding-3-small", input: ["public"] }),
    };
    await request("https://api.openai.com/v1/embeddings", init);
    vi.mocked(fsyncSync).mockImplementationOnce(() => {
      throw new Error("synthetic flush failure");
    });
    await expect(request("https://api.openai.com/v1/embeddings", init)).rejects.toThrow();
    expect(transport).toHaveBeenCalledOnce();
  } finally {
    vi.restoreAllMocks();
    rmSync(directory, { recursive: true, force: true });
  }
});
