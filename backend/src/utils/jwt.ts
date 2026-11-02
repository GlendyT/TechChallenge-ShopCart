import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

export type RolUsuario = "Administrador" | "Operador" | "Cliente";

export interface JwtUserPayload {
  idUsuario: number;
  codigoPublico: string;
  correo: string;
  rol: RolUsuario;
}

export const generateAccessToken = (payload: JwtUserPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: JwtUserPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    options,
  );
};

export const verifyAccessToken = (token: string): JwtUserPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtUserPayload;
  } catch {
    throw new AppError("Token de acceso inválido o expirado.", 401);
  }
};

export const verifyRefreshToken = (token: string): JwtUserPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtUserPayload;
  } catch {
    throw new AppError("Refresh token inválido o expirado.", 401);
  }
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
