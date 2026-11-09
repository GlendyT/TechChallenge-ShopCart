import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const validateCookieRequestOrigin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const origin = req.get("origin");
  const hasAuthCookie = Boolean(req.headers.cookie?.includes("shopcart_"));

  if (!UNSAFE_METHODS.has(req.method) || !origin || !hasAuthCookie) {
    next();
    return;
  }

  try {
    const requestOrigin = new URL(origin);
    const configuredOrigin = new URL(env.CORS_ORIGIN).origin;
    const sameApiHost = requestOrigin.host === req.get("host");
    if (requestOrigin.origin !== configuredOrigin && !sameApiHost) {
      next(new AppError("Origen no autorizado para la sesión.", 403));
      return;
    }
  } catch {
    next(new AppError("Origen de sesión inválido.", 403));
    return;
  }

  next();
};
