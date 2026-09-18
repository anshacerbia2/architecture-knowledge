/** Backend-only, single-turn inference. Never exposes a command or credential to HTTP callers. */
export interface StructuredCliPort {
  probe(): Promise<void>;
  generate(prompt: string, schema: object): Promise<unknown>;
}
