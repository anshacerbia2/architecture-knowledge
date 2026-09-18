import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { StringDecoder } from "node:string_decoder";
import type { StructuredCliPort } from "../../application/src/structured-cli-port.js";
import { AppError } from "../../application/src/errors.js";

export const AGY_MODEL = "gemini-3.8-flash-low";
const fail = (code: string) =>
  new AppError(
    code,
    503,
    "Antigravity CLI could not complete this request. Run pnpm app:agy:check. No fallback was attempted.",
  );
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parseAgyResult(value: unknown): Record<string, unknown> {
  if (
    !object(value) ||
    value.status !== "SUCCESS" ||
    value.error !== undefined ||
    !Number.isSafeInteger(value.num_turns) ||
    Number(value.num_turns) < 1 ||
    !object(value.structured_output)
  )
    throw fail("AGY_RESPONSE_INVALID");
  // The CLI can count an internal schema completion turn (observed: 2).
  // Atlas sends one prompt and never resumes conversations.
  return value.structured_output;
}

export function agyEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const selected: NodeJS.ProcessEnv = {};
  for (const name of [
    "SystemRoot",
    "WINDIR",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "TEMP",
    "TMP",
  ])
    if (env[name]) selected[name] = env[name];
  return selected;
}

export type AgySpawn = (
  file: string,
  args: string[],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
    shell: false;
    windowsHide: true;
    stdio: "pipe";
  },
) => ChildProcessWithoutNullStreams;

/** Trusted local CLI runner, not a tool sandbox. Uses existing AGY account authentication. */
export class AgyProcess implements StructuredCliPort {
  private active = false;
  constructor(
    private readonly executable: string,
    private readonly launch: AgySpawn = spawn,
  ) {
    if (!path.isAbsolute(executable) || !/^agy(?:\.exe)?$/i.test(path.basename(executable)))
      throw fail("AGY_EXECUTABLE_INVALID");
  }
  async probe(): Promise<void> {
    const value = await this.generate("Return status ok as JSON. No tools or file access needed.", {
      type: "object",
      properties: { status: { type: "string", enum: ["ok"] } },
      required: ["status"],
      additionalProperties: false,
    });
    if (!object(value) || value.status !== "ok") throw fail("AGY_RESPONSE_INVALID");
  }
  async generate(prompt: string, schema: object): Promise<unknown> {
    if (this.active) throw fail("AGY_BUSY");
    const args = [
      "-p",
      prompt,
      "--model",
      AGY_MODEL,
      "--disable-slash-commands",
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(schema),
      "--print-timeout",
      "90s",
    ];
    // Conservative bound includes quoting expansion under Windows' 32767 UTF-16 command limit.
    if (this.executable.length + args.reduce((n, arg) => n + arg.length * 2 + 3, 0) > 30000)
      throw fail("AGY_INPUT_LIMIT");
    this.active = true;
    let cwd: string | undefined;
    try {
      if (!(await stat(this.executable)).isFile()) throw fail("AGY_EXECUTABLE_INVALID");
      cwd = await mkdtemp(path.join(os.tmpdir(), "atlas-agy-"));
      return await new Promise<unknown>((resolve, reject) => {
        const child = this.launch(this.executable, args, {
          cwd: cwd!,
          env: agyEnvironment(process.env),
          shell: false,
          windowsHide: true,
          stdio: "pipe",
        });
        const decoder = new StringDecoder("utf8");
        let output = "",
          bytes = 0,
          error: AppError | undefined;
        const stop = (e: AppError) => {
          if (error) return;
          error = e;
          child.kill();
        };
        const timer = setTimeout(() => stop(fail("AGY_TIMEOUT")), 95000);
        child.on("error", () => stop(fail("AGY_START_FAILED")));
        child.stdin.on("error", () => stop(fail("AGY_INPUT_FAILED")));
        child.stdin.end();
        child.stdout.on("data", (chunk: Buffer) => {
          if (error) return;
          bytes += chunk.length;
          if (bytes > 1048576) {
            stop(fail("AGY_OUTPUT_LIMIT"));
            return;
          }
          output += decoder.write(chunk);
        });
        child.stderr.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 1048576) stop(fail("AGY_OUTPUT_LIMIT"));
        });
        child.on("close", (code) => {
          clearTimeout(timer);
          if (error) {
            reject(error);
            return;
          }
          if (code !== 0) {
            reject(fail("AGY_REQUEST_FAILED"));
            return;
          }
          try {
            resolve(parseAgyResult(JSON.parse(output + decoder.end())));
          } catch {
            reject(fail("AGY_RESPONSE_INVALID"));
          }
        });
      });
    } catch (e) {
      throw e instanceof AppError ? e : fail("AGY_SETUP_REQUIRED");
    } finally {
      try {
        if (cwd) await rm(cwd, { recursive: true, force: true });
      } catch {
        throw fail("AGY_CLEANUP_FAILED");
      } finally {
        this.active = false;
      }
    }
  }
}
