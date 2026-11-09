import { useQueryClient } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { queryClient } from "../../../lib/queryClient";
import { setSession } from "../../../shared/api/httpClient";
import { useAuth } from "../../../shared/auth/useAuth";
import { server } from "../../../test/server";
import { AppProviders } from "../AppProviders";

const api = "http://localhost:3000/api";

function ProviderProbe() {
  const activeQueryClient = useQueryClient();
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <output data-testid="provider-state">
      {activeQueryClient === queryClient ? "query-ready" : "query-missing"}
      {isLoading ? " auth-loading" : " auth-ready"}
      {isAuthenticated ? " authenticated" : " anonymous"}
    </output>
  );
}

describe("AppProviders", () => {
  it("provides the shared query client and resolves the cookie session", async () => {
    setSession(null);
    queryClient.clear();
    server.use(
      http.get(`${api}/auth/me`, () =>
        HttpResponse.json(
          { ok: false, mensaje: "No autenticado." },
          { status: 401 },
        ),
      ),
      http.post(`${api}/auth/refresh`, () =>
        HttpResponse.json(
          { ok: false, mensaje: "No hay sesión renovable." },
          { status: 401 },
        ),
      ),
    );

    render(
      <AppProviders>
        <ProviderProbe />
      </AppProviders>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("provider-state")).toHaveTextContent(
        "query-ready auth-ready anonymous",
      ),
    );
  });
});
