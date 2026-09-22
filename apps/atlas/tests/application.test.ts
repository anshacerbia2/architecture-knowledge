import { describe, expect, it } from "vitest";
import { KnowledgeService } from "../packages/application/src/knowledge-service.js";
import { DecisionService } from "../packages/application/src/decision-service.js";
import { OperationLimiter } from "../packages/application/src/operation-limiter.js";
import { decisionSession, fakeDecisionPort, fakePort } from "./fixture.js";
import { configuration } from "../apps/api/src/config.js";
import { safeSourceUrl } from "../apps/web/src/components/answer-panel.js";

describe("application policy", () => {
  it("rejects non-opaque identifiers independently of HTTP", () => {
    const service = new KnowledgeService(fakePort());
    expect(() => service.record("../../secrets")).toThrow("registered opaque");
    expect(() => service.graph("Retry")).toThrow("registered opaque");
  });
  it("bounds concurrency and releases capacity after success/failure", async () => {
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    const service = new KnowledgeService(
      fakePort({
        search: async () => {
          await wait;
          if (++calls === 1) throw new Error("synthetic failure");
          return { hits: [], generation_id: "x", diagnostics: [] };
        },
      }),
      1,
    );
    const first = service.search({ text: "retry", mode: "hybrid" });
    await expect(
      service.ask({ question: "retry", data_classification: "public" }),
    ).rejects.toMatchObject({ code: "BUSY" });
    release();
    await expect(first).rejects.toThrow("synthetic failure");
    await expect(service.search({ text: "retry", mode: "hybrid" })).resolves.toMatchObject({
      generation_id: "x",
    });
  });
  it("pins decision evaluation to the snapshot and shares admission control", async () => {
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const limiter = new OperationLimiter(1);
    const decisions = new DecisionService(
      fakeDecisionPort({
        evaluateDecision: async () => {
          await wait;
          return { recommendation: {}, clarification_prompts: [] };
        },
      }),
      limiter,
    );
    const knowledge = new KnowledgeService(fakePort(), 1, limiter);
    const active = decisions.evaluate({
      repository_commit: "a".repeat(40),
      client_revision: 7,
      session: decisionSession,
    });
    await expect(knowledge.search({ text: "retry", mode: "lexical" })).rejects.toMatchObject({
      code: "BUSY",
    });
    release();
    await expect(active).resolves.toMatchObject({ client_revision: 7 });
    expect(() =>
      decisions.evaluate({
        repository_commit: "b".repeat(40),
        client_revision: 8,
        session: decisionSession,
      }),
    ).toThrow("snapshot changed");
    expect(() => decisions.intake("AKC-000012")).toThrow("decision-guide ID");
  });
  it("validates operator configuration", () => {
    expect(configuration({}).port).toBe(4310);
    expect(
      configuration({
        PORT: "4311",
        KNOWLEDGE_REPO_ROOT: ".",
        DATABASE_URL: "postgres://x@localhost/db",
      }).port,
    ).toBe(4311);
    for (const PORT of ["0", "NaN", "65536", "4000.5"])
      expect(() => configuration({ PORT })).toThrow("INVALID_PORT");
    expect(() => configuration({ DATABASE_URL: "https://localhost/db" })).toThrow(
      "DATABASE_URL_INVALID",
    );
    for (const DATABASE_URL of ["postgres://evil.example/db", "postgres://127.0.0.1.evil/db"])
      expect(() => configuration({ DATABASE_URL })).toThrow("LOCAL_DATABASE_REQUIRED");

    const hosted = configuration({
      RETRIEVAL_DATABASE_MODE: "hosted",
      DATABASE_URL:
        "postgresql://reader:secret@synthetic-pooler.example.invalid/neondb?sslmode=require&channel_binding=require",
    });
    expect(hosted.databaseMode).toBe("hosted");
    expect(hosted.databaseUrl).toContain("synthetic-pooler.example.invalid");
    expect(() =>
      configuration({
        RETRIEVAL_DATABASE_MODE: "hosted",
        DATABASE_URL: "postgresql://reader:secret@synthetic.example.invalid/neondb",
      }),
    ).toThrow("HOSTED_DATABASE_TLS_REQUIRED");
    expect(() =>
      configuration({
        RETRIEVAL_DATABASE_MODE: "hosted",
        DATABASE_URL: "postgresql://reader:secret@synthetic.example.invalid/neondb?sslmode=require",
      }),
    ).toThrow("HOSTED_DATABASE_CHANNEL_BINDING_REQUIRED");
    expect(() =>
      configuration({
        RETRIEVAL_DATABASE_MODE: "hosted",
        DATABASE_URL:
          "postgresql://reader@synthetic.example.invalid/neondb?sslmode=require&channel_binding=require",
      }),
    ).toThrow("HOSTED_DATABASE_CREDENTIALS_REQUIRED");
    expect(() =>
      configuration({
        RETRIEVAL_DATABASE_MODE: "hosted",
        DATABASE_URL:
          "postgresql://reader:secret@localhost/neondb?sslmode=require&channel_binding=require",
      }),
    ).toThrow("HOSTED_DATABASE_REQUIRED");
    expect(() => configuration({ RETRIEVAL_DATABASE_MODE: "unsupported" })).toThrow(
      "DATABASE_MODE_INVALID",
    );
    expect(() => configuration({ DATABASE_URL: "not-a-url" })).toThrow("DATABASE_URL_INVALID");
  });
  it("rejects invalid decision revisions and detaches a pending submission", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const service = new DecisionService(
      fakeDecisionPort({
        evaluateDecision: async (session) => {
          await pending;
          return { recommendation: { session_id: session.session_id }, clarification_prompts: [] };
        },
      }),
    );
    const input = {
      repository_commit: "a".repeat(40),
      client_revision: 0,
      session: structuredClone(decisionSession),
    };
    for (const invalid of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => service.evaluate({ ...input, client_revision: invalid })).toThrow(
        "non-negative integer",
      );
    }
    const evaluation = service.evaluate(input);
    input.session.session_id = "modified";
    input.client_revision = 9;
    finish();
    await expect(evaluation).resolves.toMatchObject({
      client_revision: 0,
      recommendation: { session_id: decisionSession.session_id },
    });
  });
  it("does not render executable or credential-bearing source links", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,hi",
      "not a url",
      "https://user:secret@example.com",
    ])
      expect(safeSourceUrl(value)).toBeUndefined();
    expect(safeSourceUrl("https://example.com/docs")).toBe("https://example.com/docs");
  });
});
