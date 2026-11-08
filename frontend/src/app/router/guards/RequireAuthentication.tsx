import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/auth/useAuth";
import { routePaths } from "../routePaths";

export function RequireAuthentication() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

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
