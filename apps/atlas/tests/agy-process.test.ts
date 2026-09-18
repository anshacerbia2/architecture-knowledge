import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import path from "node:path";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const fs = vi.hoisted(() => ({ stat: vi.fn(), mkdtemp: vi.fn(), rm: vi.fn() }));
vi.mock("node:fs/promises", () => fs);
import {
  AgyProcess,
  parseAgyResult,
  agyEnvironment,
  type AgySpawn,
} from "../packages/ai-connectors/src/agy-process.js";
const exe = path.resolve("agy.exe");
const response = () => ({ status: "SUCCESS", num_turns: 2, structured_output: { status: "ok" } });
beforeEach(() => {
  fs.stat.mockResolvedValue({ isFile: () => true });
  fs.mkdtemp.mockResolvedValue(path.resolve("synthetic-temp"));
  fs.rm.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
});
function fixture(result: unknown = response(), code = 0, automatic = true) {
  const child = new EventEmitter() as ChildProcessWithoutNullStreams;
  Object.assign(child, {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
  });
  child.kill = vi.fn(() => {
    queueMicrotask(() => child.emit("close", null));
    return true;
  });
  const launch = vi.fn<AgySpawn>(() => {
    if (automatic)
      queueMicrotask(() => {
        child.stdout.emit("data", Buffer.from(JSON.stringify(result)));
        child.emit("close", code);
      });
    return child;
  });
  return { child, launch };
}
it("accepts CLI schema completion with 1 or 2 reported turns", () => {
  for (const num_turns of [1, 2])
    expect(parseAgyResult({ ...response(), num_turns })).toEqual({ status: "ok" });
});
it.each([
  null,
  [],
  {},
  { status: "ERROR", num_turns: 1, structured_output: {} },
  { ...response(), num_turns: 0 },
  { ...response(), num_turns: 1.5 },
  { ...response(), num_turns: "1" },
  { ...response(), error: "secret" },
  { ...response(), structured_output: [] },
  { ...response(), structured_output: null },
])("rejects malformed response %j", (v) => {
  expect(() => parseAgyResult(v)).toThrow();
});
it("runs print mode with separate arguments, no shell, no resume and no permission bypass", async () => {
  const f = fixture();
  const p = new AgyProcess(exe, f.launch);
  const prompt = 'Public synthetic question; $(malicious) "quoted"';
  expect(await p.generate(prompt, { type: "object" })).toEqual({ status: "ok" });
  const [file, args, options] = f.launch.mock.calls[0]!;
  expect(file).toBe(exe);
  expect(args.slice(0, 2)).toEqual(["-p", prompt]);
  expect(args).toEqual([
    "-p",
    prompt,
    "--model",
    "gemini-3.8-flash-low",
    "--disable-slash-commands",
    "--output-format",
    "json",
    "--json-schema",
    '{"type":"object"}',
    "--print-timeout",
    "90s",
  ]);
  expect(options).toMatchObject({
    cwd: path.resolve("synthetic-temp"),
    shell: false,
    windowsHide: true,
    stdio: "pipe",
  });
  expect(f.child.stdin.writableEnded).toBe(true);
  expect(fs.rm).toHaveBeenCalledWith(path.resolve("synthetic-temp"), {
    recursive: true,
    force: true,
  });
});
it("does not inherit application credentials or command injection overrides", () => {
  expect(
    agyEnvironment({
      SystemRoot: "os",
      USERPROFILE: "user",
      TEMP: "temp",
      DATABASE_URL: "secret",
      OPENROUTER_API_KEY: "secret",
      NODE_OPTIONS: "secret",
      PATH: "other",
      HTTP_PROXY: "secret",
    }),
  ).toEqual({ SystemRoot: "os", USERPROFILE: "user", TEMP: "temp" });
});
it("probe performs a public live-model check and validates its expected result", async () => {
  const f = fixture();
  await new AgyProcess(exe, f.launch).probe();
  expect(f.launch.mock.calls[0]![1][1]).toContain("Return status ok");
  const bad = fixture({ ...response(), structured_output: { status: "wrong" } });
  await expect(new AgyProcess(exe, bad.launch).probe()).rejects.toMatchObject({
    code: "AGY_RESPONSE_INVALID",
  });
});
it("rejects executable and oversized argv before launch", async () => {
  expect(() => new AgyProcess("agy")).toThrow();
  expect(() => new AgyProcess(path.resolve("shell.cmd"))).toThrow();
  expect(() => new AgyProcess(path.resolve("notagy.exe"))).toThrow();
  const f = fixture();
  const p = new AgyProcess(exe, f.launch);
  await expect(p.generate("x".repeat(15000), {})).rejects.toMatchObject({
    code: "AGY_INPUT_LIMIT",
  });
  fs.stat.mockResolvedValueOnce({ isFile: () => false });
  await expect(p.probe()).rejects.toMatchObject({ code: "AGY_EXECUTABLE_INVALID" });
  fs.stat.mockRejectedValueOnce(new Error("private path"));
  await expect(p.probe()).rejects.toMatchObject({ code: "AGY_SETUP_REQUIRED" });
  expect(f.launch).not.toHaveBeenCalled();
});
it("rejects nonzero exits even with a valid result", async () => {
  const f = fixture(response(), 1);
  await expect(new AgyProcess(exe, f.launch).probe()).rejects.toMatchObject({
    code: "AGY_REQUEST_FAILED",
  });
});
it("rejects malformed output without echoing it", async () => {
  const f = fixture(undefined, 0, false);
  const pending = new AgyProcess(exe, f.launch).probe();
  const assertion = expect(pending).rejects.toMatchObject({ code: "AGY_RESPONSE_INVALID" });
  await vi.waitFor(() => expect(f.launch).toHaveBeenCalled());
  f.child.stdout.emit("data", Buffer.from("private non-json output"));
  f.child.emit("close", 0);
  await assertion;
});
it.each(["stdout", "stderr"] as const)("bounds %s", async (stream) => {
  const f = fixture(undefined, 0, false);
  const pending = new AgyProcess(exe, f.launch).probe();
  const assertion = expect(pending).rejects.toMatchObject({ code: "AGY_OUTPUT_LIMIT" });
  await vi.waitFor(() => expect(f.launch).toHaveBeenCalled());
  f.child[stream].emit("data", Buffer.alloc(1048577));
  await assertion;
  expect(f.child.kill).toHaveBeenCalledOnce();
});
it("bounds time/concurrency without retrying", async () => {
  vi.useFakeTimers();
  const f = fixture(undefined, 0, false);
  const p = new AgyProcess(exe, f.launch);
  const pending = p.probe();
  const assertion = expect(pending).rejects.toMatchObject({ code: "AGY_TIMEOUT" });
  await expect(p.probe()).rejects.toMatchObject({ code: "AGY_BUSY" });
  await vi.advanceTimersByTimeAsync(95001);
  await assertion;
  expect(f.launch).toHaveBeenCalledOnce();
});
it.each(["start", "stdin"])("redacts %s errors", async (kind) => {
  const f = fixture(undefined, 0, false);
  const pending = new AgyProcess(exe, f.launch).probe();
  const assertion = expect(pending).rejects.toMatchObject({
    code: kind === "start" ? "AGY_START_FAILED" : "AGY_INPUT_FAILED",
  });
  await vi.waitFor(() => expect(f.launch).toHaveBeenCalled());
  (kind === "start" ? f.child : f.child.stdin).emit("error", new Error("sensitive"));
  await assertion;
});
it("preserves UTF-8 across chunks", async () => {
  const f = fixture(undefined, 0, false);
  const pending = new AgyProcess(exe, f.launch).generate("public", {});
  await vi.waitFor(() => expect(f.launch).toHaveBeenCalled());
  for (const byte of Buffer.from(
    JSON.stringify({ ...response(), structured_output: { text: "é" } }),
  ))
    f.child.stdout.emit("data", Buffer.from([byte]));
  f.child.emit("close", 0);
  expect(await pending).toEqual({ text: "é" });
});
it("redacts cleanup failure and releases the lock", async () => {
  const f = fixture();
  const p = new AgyProcess(exe, f.launch);
  fs.rm.mockRejectedValueOnce(new Error("private"));
  await expect(p.probe()).rejects.toMatchObject({ code: "AGY_CLEANUP_FAILED" });
  fs.stat.mockRejectedValueOnce(new Error("missing"));
  await expect(p.probe()).rejects.toMatchObject({ code: "AGY_SETUP_REQUIRED" });
});
