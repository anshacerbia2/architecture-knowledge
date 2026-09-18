import path from "node:path";
import { expect, it, vi } from "vitest";
import { parseRagRequest, type RagContextPacket } from "architecture-knowledge-system/runtime";
import { AgyProvider } from "../packages/knowledge-adapter/src/agy-provider.js";
import { providers } from "../packages/knowledge-adapter/src/providers.js";
import { configuration } from "../apps/api/src/config.js";
const context = {
  data_classification: "public",
  evidence: [],
  citation_catalog: [],
  context_fingerprint: "synthetic",
} as unknown as RagContextPacket;
const request = parseRagRequest({
  question: "synthetic public question",
  data_classification: "public",
});
const output = {
  status: "insufficient-evidence",
  summary: "Synthetic only.",
  statements: [],
  uncertainties: [],
  refusal_reason: null,
};
it("preserves classification and local schema validation across CLI transport", async () => {
  const transport = { probe: vi.fn(), generate: vi.fn().mockResolvedValue(output) };
  const p = new AgyProvider(transport);
  expect(await p.generate(context, request)).toEqual(output);
  expect(transport.generate.mock.calls[0]![0]).toContain("synthetic public question");
  expect(transport.generate.mock.calls[0]![0]).toContain("whose unit_kind is claim");
  expect(transport.generate.mock.calls[0]![0]).toContain("at least two distinct evidence items");
  expect(transport.generate.mock.calls[0]![0]).not.toContain("Claim IDs: AKL-000001");
  for (const c of ["internal", "confidential"] as const)
    await expect(p.generate({ ...context, data_classification: c }, request)).rejects.toThrow();
  expect(transport.generate).toHaveBeenCalledOnce();
  transport.generate.mockResolvedValueOnce({ text: "not a contract" });
  await expect(p.generate(context, request)).rejects.toMatchObject({
    code: "AGY_ANSWER_SCHEMA_INVALID",
  });
  transport.generate.mockRejectedValueOnce(new Error("bounded transport error"));
  await expect(p.generate(context, request)).rejects.toThrow("bounded transport error");
});
it("bounds session attempts and does not retry or fall back", async () => {
  const transport = { probe: vi.fn(), generate: vi.fn().mockResolvedValue(output) };
  const p = new AgyProvider(transport);
  for (let i = 0; i < 20; i++) await p.generate(context, request);
  await expect(p.generate(context, request)).rejects.toMatchObject({ code: "AGY_SESSION_LIMIT" });
  expect(transport.generate).toHaveBeenCalledTimes(20);
});
it("composes a distinct CLI provider with exact public consent, manifest and absolute executable", () => {
  const manifest = `sha256:${"a".repeat(64)}`;
  const env = {
    ATLAS_PROVIDER_MODE: "antigravity-cli",
    ATLAS_LIVE_CONSENT: "agy-public-cloud-cli-history",
    ATLAS_PUBLIC_MANIFEST: manifest,
    ATLAS_AGY_EXECUTABLE: path.resolve("agy.exe"),
  };
  const config = configuration(env);
  expect(config.connector).toBeUndefined();
  expect(providers(config.provider, manifest)).toMatchObject({
    mode: "antigravity-cli",
    credential: null,
    budget: null,
    answer: { provider: "antigravity-cli" },
  });
  expect(() => providers(config.provider, `sha256:${"b".repeat(64)}`)).toThrow();
  for (const key of ["ATLAS_LIVE_CONSENT", "ATLAS_PUBLIC_MANIFEST", "ATLAS_AGY_EXECUTABLE"])
    expect(() => configuration({ ...env, [key]: "" })).toThrow();
  expect(() =>
    configuration({ ...env, ATLAS_AGY_EXECUTABLE: path.resolve("shell.cmd") }),
  ).toThrow();
});
