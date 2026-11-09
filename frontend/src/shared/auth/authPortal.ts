import type { UserRole } from "./authTypes";

export const authPortals = ["cliente", "operador", "administrador"] as const;
export type AuthPortal = (typeof authPortals)[number];

const portalRoles: Record<AuthPortal, UserRole> = {
  cliente: "Cliente",
  operador: "Operador",
  administrador: "Administrador",
};

const portalLabels: Record<AuthPortal, string> = {
  cliente: "cliente",
  operador: "operador",
  administrador: "administrador",
};

export function parseAuthPortal(value: string | null): AuthPortal | null {
  return authPortals.find((portal) => portal === value) ?? null;
}

export function getExpectedRoleForPortal(portal: AuthPortal): UserRole {
  return portalRoles[portal];
}

export function getAuthPortalLabel(portal: AuthPortal): string {
  return portalLabels[portal];
}
