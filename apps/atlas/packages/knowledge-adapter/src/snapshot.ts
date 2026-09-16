import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AppError } from "../../application/src/errors.js";

const execute = promisify(execFile);
/** Startup-only guard. Request handlers serve the pinned in-memory snapshot. */
export async function cleanCommit(root: string): Promise<string> {
  const options = {
    cwd: root,
    timeout: 10000,
    maxBuffer: 2 * 1024 * 1024,
    windowsHide: true,
  };
  const [head, state] = await Promise.all([
    execute("git", ["rev-parse", "HEAD"], options),
    execute("git", ["status", "--porcelain", "--untracked-files=normal"], options),
  ]);
  if (state.stdout.trim())
    throw new AppError(
      "SNAPSHOT_CHANGED",
      409,
      "Knowledge checkout changed. Validate, commit, reindex and restart the app.",
    );
  return head.stdout.trim();
}

/** Detach from loader-owned data; deep freeze records/arrays used by runtime engines.
 * Artifact Maps are private construction metadata and are never exposed to consumers.
 */
export function immutableCopy<T>(input: T): T {
  const copy = structuredClone(input);
  const freeze = (value: unknown): void => {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return;
    if (value instanceof Map) {
      for (const item of value.values()) freeze(item);
    } else {
      for (const item of Object.values(value)) freeze(item);
    }
    Object.freeze(value);
  };
  freeze(copy);
  return copy;
}
