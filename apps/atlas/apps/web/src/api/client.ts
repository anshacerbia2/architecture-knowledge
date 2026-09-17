import type { Envelope } from "../../../../packages/contracts/src/index.js";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly requestId: string,
  ) {
    super(message);
  }
}
let token: string | undefined;
export async function api<T>(
  route: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<Envelope<T>> {
  if (body !== undefined && !token) {
    const bootstrap = await api<{ token: string }>("/bootstrap", undefined, signal);
    token = bootstrap.data.token;
  }
  const response = await fetch(`/api/v1${route}`, {
    method: body === undefined ? "GET" : "POST",
    signal,
    headers:
      body === undefined ? {} : { "Content-Type": "application/json", "X-App-Token": token ?? "" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) {
    if (result.error?.code === "TOKEN_REQUIRED") token = undefined;
    throw new ApiError(
      result.error?.message ?? "Request failed.",
      result.error?.code ?? "NETWORK_ERROR",
      result.request_id ?? "unknown",
    );
  }
  return result as Envelope<T>;
}
