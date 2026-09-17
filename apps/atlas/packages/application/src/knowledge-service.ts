import type { AskInput, SearchInput } from "../../contracts/src/index.js";
import { KNOWLEDGE_ID_PATTERN } from "../../contracts/src/index.js";
import type { KnowledgePort } from "./knowledge-port.js";
import { AppError } from "./errors.js";

/** Application policy, independent of Fastify, React, PostgreSQL and kernel internals. */
export class KnowledgeService {
  private active = 0;
  constructor(
    private readonly knowledge: KnowledgePort,
    private readonly concurrency = 2,
  ) {}
  get commit() {
    return this.knowledge.commit;
  }
  status() {
    return this.knowledge.status();
  }
  catalog() {
    return this.knowledge.catalog();
  }
  record(id: string) {
    this.validateId(id);
    return this.knowledge.record(id);
  }
  graph(id: string) {
    this.validateId(id);
    return this.knowledge.graph(id);
  }
  search(input: SearchInput) {
    return this.bounded(() => this.knowledge.search(input));
  }
  ask(input: AskInput) {
    return this.bounded(() => this.knowledge.ask(input));
  }
  private validateId(id: string) {
    if (!new RegExp(KNOWLEDGE_ID_PATTERN).test(id))
      throw new AppError("INVALID_ID", 400, "Use a registered opaque knowledge ID.");
  }
  private async bounded<T>(operation: () => Promise<T>): Promise<T> {
    if (this.active >= this.concurrency)
      throw new AppError("BUSY", 429, "Two operations are active. Please wait before retrying.");
    this.active++;
    try {
      return await operation();
    } finally {
      this.active--;
    }
  }
}
