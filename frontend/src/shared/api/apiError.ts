import type { ApiFieldError } from "./apiTypes";

export class ApiError extends Error {
  public readonly status: number;
  public readonly fields?: ApiFieldError[];

  constructor(
    message: string,
    status: number,
    fields?: ApiFieldError[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}
