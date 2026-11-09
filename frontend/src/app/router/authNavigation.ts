import { routePaths } from "./routePaths";
import type { UserRole } from "../../shared/auth/authTypes";

const defaultRouteByRole: Record<UserRole, string> = {
  Administrador: routePaths.administrationCatalog,
  Operador: routePaths.operations,
  Cliente: routePaths.account,
};

export function getPostAuthenticationRoute(
  role: UserRole,
  requestedRoute?: string | null,
): string {
  if (requestedRoute && isInternalRoute(requestedRoute)) {
    const pathname = requestedRoute.split(/[?#]/, 1)[0];
    if (role === "Administrador" && pathname === routePaths.administration) {
      return routePaths.administrationCatalog;
    }
    if (isAllowedForRole(role, pathname)) return requestedRoute;
  }

  return defaultRouteByRole[role];
}

function isInternalRoute(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

function isAllowedForRole(role: UserRole, pathname: string): boolean {
  if (pathname === routePaths.signIn || pathname === routePaths.signUp) {
    return false;
  }

  if (isRouteWithin(pathname, routePaths.administration)) {
    return role === "Administrador";
  }

  if (isRouteWithin(pathname, routePaths.operations)) {
    return role === "Administrador" || role === "Operador";
  }

  return true;
}

function isRouteWithin(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}
