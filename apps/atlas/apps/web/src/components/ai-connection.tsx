import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { Notice } from "./common.js";

export function AiConnection({
  connection,
  refresh,
}: {
  connection: { mode: "api" | "oauth"; connected: boolean };
  refresh: () => void;
}) {
  const connect = useMutation({
    mutationFn: async () => {
      const response = await api<{ authorization_url: string }>("/connectors/openrouter/start", {});
      const url = new URL(response.data.authorization_url);
      if (url.origin !== "https://openrouter.ai" || url.pathname !== "/auth")
        throw new Error("Unexpected authorization destination.");
      return url.href;
    },
    onSuccess: (url) => window.location.assign(url),
  });
  const disconnect = useMutation({
    mutationFn: () => api("/connectors/openrouter/disconnect", {}),
    onSuccess: refresh,
  });
  return (
    <section className="panel">
      <h2>OpenRouter connection</h2>
      <p>
        {connection.mode === "oauth" ? "Account connection (OAuth PKCE)" : "Server API key"}:{" "}
        {connection.connected ? "Connected" : "Not connected"}.
      </p>
      <p>
        Only public, non-secret questions and evidence. Free requests may be rate-limited or
        unavailable; no paid fallback. OAuth connects AI usage, not multi-user login to Atlas.
      </p>
      {connection.mode === "oauth" ? (
        <>
          <button
            disabled={connect.isPending || disconnect.isPending}
            onClick={() => connect.mutate()}
          >
            Connect OpenRouter
          </button>{" "}
          <button
            className="secondary"
            disabled={!connection.connected || connect.isPending || disconnect.isPending}
            onClick={() => disconnect.mutate()}
          >
            Disconnect locally
          </button>
          <p className="hint">
            The credential stays in server memory. Restarting requires reconnecting. Disconnect
            forgets it locally; revoke unwanted keys in your OpenRouter dashboard.
          </p>
        </>
      ) : (
        <p className="hint">
          Configure OPENROUTER_API_KEY in apps/atlas/.env. Never paste it into this page or chat.
          Restart after changing it.
        </p>
      )}
      <Notice error={connect.error ?? disconnect.error} />
    </section>
  );
}
