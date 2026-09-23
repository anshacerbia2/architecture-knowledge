import { AppError } from "./errors.js";

/** Process-local admission control shared by Search, Ask and decision evaluation. */
export class OperationLimiter {
  private active = 0;

  constructor(private readonly concurrency = 2) {}

  async run<T>(operation: () => Promise<T>): Promise<T> {
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
