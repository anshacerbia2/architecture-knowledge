/** Backend-only authentication port; credentials must never become transport DTOs. */
export interface AiCredentialPort {
  readonly mode: "api" | "oauth";
  connected(): boolean;
  apiKey(): string;
}
