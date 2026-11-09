import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/auth/useAuth";
import { routePaths } from "../routePaths";
import { Skeleton } from "../../../components/ui/skeleton";

export function RequireAuthentication() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-5 sm:px-8" aria-busy="true">
        <Skeleton className="h-10 w-56" />
        <span className="sr-only">Verificando sesión</span>
      </main>
    );
  }

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate
      to={routePaths.signIn}
      state={{ from: `${location.pathname}${location.search}` }}
      replace
    />
  );
}
