import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";

interface SqlCustomError extends Error {
  number?: number;
  class?: number;
  state?: number;
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // 1. Errores operacionales controlados (AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      mensaje: err.message,
    });
    return;
  }

  // 2. Errores de validación de esquemas (Zod)
  if (err instanceof ZodError) {
    const detalles = err.errors.map((e) => ({
      campo: e.path.join("."),
      mensaje: e.message,
    }));

    res.status(400).json({
      ok: false,
      mensaje: "Error de validación en los datos enviados.",
      errores: detalles,
    });
    return;
  }

  // 3. Errores de reglas de negocio lanzados con RAISERROR desde SQL Server (Error 50000)
  const sqlErr = err as SqlCustomError;
  if (sqlErr.number === 50000) {
    const msg = sqlErr.message;
    const isNotFound = msg.toLowerCase().includes("no existe");
    const isConflict =
      msg.toLowerCase().includes("ya existe") ||
      msg.toLowerCase().includes("ya está registrado") ||
      msg.toLowerCase().includes("stock insuficiente");

    const statusCode = isNotFound ? 404 : isConflict ? 409 : 400;

    res.status(statusCode).json({
      ok: false,
      mensaje: msg,
    });
    return;
  }

  // 4. Error interno no controlado (Ocultar detalles técnicos en producción)
  console.error("❌ Error no controlado:", err);

  res.status(500).json({
    ok: false,
    mensaje: "Error interno del servidor.",
    ...(env.NODE_ENV === "development" && { detalle: err.message }),
  });
};
