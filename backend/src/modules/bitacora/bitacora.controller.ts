import { Request, Response, NextFunction } from "express";
import { bitacoraRepository } from "./bitacora.repository";

export const bitacoraController = {
  async consultar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        entidad,
        accion,
        idUsuario,
        fechaInicio,
        fechaFin,
        pagina,
        limite,
      } = req.query;

      const registros = await bitacoraRepository.consultar({
        entidad: entidad ? String(entidad) : undefined,
        accion: accion ? String(accion) : undefined,
        idUsuario: idUsuario ? Number(idUsuario) : undefined,
        fechaInicio: fechaInicio ? String(fechaInicio) : undefined,
        fechaFin: fechaFin ? String(fechaFin) : undefined,
        numeroPagina: pagina ? Number(pagina) : 1,
        tamanoPagina: limite ? Number(limite) : 25,
      });

      const totalRegistros =
        registros.length > 0 ? Number(registros[0].TotalRegistros ?? 0) : 0;

      res.json({
        ok: true,
        totalRegistros,
        paginaActual: pagina ? Number(pagina) : 1,
        datos: registros,
      });
    } catch (err) {
      next(err);
    }
  },
};
