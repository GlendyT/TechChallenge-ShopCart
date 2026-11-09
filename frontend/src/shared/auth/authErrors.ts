import type { UserRole } from "./authTypes";

export class AuthPortalMismatchError extends Error {
  constructor(expectedRole: UserRole, actualRole: UserRole) {
    super(
      `Seleccionaste el acceso de ${expectedRole}, pero esta cuenta tiene el rol ${actualRole}.`,
    );
    this.name = "AuthPortalMismatchError";
  }
}
