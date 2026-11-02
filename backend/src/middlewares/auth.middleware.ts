import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtUserPayload, RolUsuario } from "../utils/jwt";
import { AppError } from "../errors/AppError";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No autenticado. Se requiere un token Bearer.", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Formato de token inválido.", 401);
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
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        req.user = verifyAccessToken(token);
      } catch {
        // Si el token opcional expiró o es inválido, se continúa como invitado
      }
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
