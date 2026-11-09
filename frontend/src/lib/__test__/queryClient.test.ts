import { describe, expect, it } from "vitest";
import { queryClient } from "../queryClient";

describe("shared query client", () => {
  it("uses the shared retry and refresh defaults", () => {
    expect(queryClient.getDefaultOptions()).toMatchObject({
      queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    });
  });
});
