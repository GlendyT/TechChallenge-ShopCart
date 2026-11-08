import type { ApiFieldError } from "./apiTypes";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields?: ApiFieldError[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
