import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtUserPayload, RolUsuario } from "../utils/jwt";
import { ACCESS_COOKIE_NAME, readCookie } from "../utils/authCookies";
import { AppError } from "../errors/AppError";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

const getAccessToken = (req: Request): string | undefined => {
  const cookieToken = readCookie(req, ACCESS_COOKIE_NAME);
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : undefined;
};

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = getAccessToken(req);
    if (!token) {
      throw new AppError("No autenticado. Se requiere una sesión activa.", 401);
    }

    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = getAccessToken(req);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Token opcional expirado o inválido: la petición continúa como invitado.
    }
  }
  next();
};

export const authorizeRoles = (...allowedRoles: RolUsuario[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("No autenticado.", 401));
      return;
    }

    if (!allowedRoles.includes(req.user.rol)) {
      next(
        new AppError(
          `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}.`,
          403,
        ),
      );
      return;
    }

    next();
  };
};
