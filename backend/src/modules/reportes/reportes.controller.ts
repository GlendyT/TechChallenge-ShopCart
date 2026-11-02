import { Request, Response, NextFunction } from "express";
import { reportesRepository } from "./reportes.repository";

const obtenerRangoPorDefecto = () => {
  const hoy = new Date();
  const hace30Dias = new Date();
  hace30Dias.setDate(hoy.getDate() - 30);

  return {
    inicio: hace30Dias.toISOString().split("T")[0]!,
    fin: hoy.toISOString().split("T")[0]!,
  };
};

export const reportesController = {
  async ventasPeriodo(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const defecto = obtenerRangoPorDefecto();
      const fechaInicio = req.query.fechaInicio
        ? String(req.query.fechaInicio)
        : defecto.inicio;
      const fechaFin = req.query.fechaFin
        ? String(req.query.fechaFin)
        : defecto.fin;
      const agrupacionRaw = req.query.agrupacion
        ? String(req.query.agrupacion).toUpperCase()
        : "DIA";

      const agrupacion: "DIA" | "SEMANA" | "MES" =
        agrupacionRaw === "SEMANA" || agrupacionRaw === "MES"
          ? agrupacionRaw
          : "DIA";

      const datos = await reportesRepository.ventasPeriodo(
        fechaInicio,
        fechaFin,
        agrupacion,
      );

      res.json({
        ok: true,
        rango: { fechaInicio, fechaFin, agrupacion },
        datos,
      });
    } catch (err) {
      next(err);
    }
  },

  async topProductos(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const fechaInicio = req.query.fechaInicio
        ? String(req.query.fechaInicio)
        : undefined;
      const fechaFin = req.query.fechaFin
        ? String(req.query.fechaFin)
        : undefined;

      const datos = await reportesRepository.top10ProductosMasVendidos(
        fechaInicio,
        fechaFin,
      );

      res.json({ ok: true, datos });
    } catch (err) {
      next(err);
    }
  },

  async ventasPorCategoria(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const fechaInicio = req.query.fechaInicio
        ? String(req.query.fechaInicio)
        : undefined;
      const fechaFin = req.query.fechaFin
        ? String(req.query.fechaFin)
        : undefined;

      const datos = await reportesRepository.ventasPorCategoria(
        fechaInicio,
        fechaFin,
      );

      res.json({ ok: true, datos });
    } catch (err) {
      next(err);
    }
  },

  async carritosAbandonados(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const minutos = req.query.minutosInactividad
        ? Number(req.query.minutosInactividad)
        : 1440;

      const datos = await reportesRepository.carritosAbandonados(minutos);

      res.json({
        ok: true,
        minutosInactividadMinimo: minutos,
        totalCarritosAbandonados: datos.length,
        datos,
      });
    } catch (err) {
      next(err);
    }
  },
};
