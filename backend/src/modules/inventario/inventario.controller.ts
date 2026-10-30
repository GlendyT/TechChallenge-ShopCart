import { Request, Response, NextFunction } from "express";
import { inventarioRepository } from "./inventario.repository";
import { bitacoraRepository } from "../bitacora/bitacora.repository";

export const inventarioController = {
  async listarExistencias(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { busqueda, idCategoria, soloBajoStock, pagina, limite } =
        req.query;
      const numeroPagina = pagina ? Number(pagina) : 1;
      const tamanoPagina = limite ? Number(limite) : 20;

      const existencias = await inventarioRepository.listarExistencias({
        busqueda: busqueda ? String(busqueda) : undefined,
        idCategoria: idCategoria ? Number(idCategoria) : undefined,
        soloBajoStock: soloBajoStock === "true",
        numeroPagina,
        tamanoPagina,
      });

      const totalRegistros =
        existencias.length > 0 ? Number(existencias[0].TotalRegistros ?? 0) : 0;

      res.json({
        ok: true,
        totalRegistros,
        paginaActual: numeroPagina,
        tamanoPagina,
        totalPaginas: Math.ceil(totalRegistros / tamanoPagina) || 1,
        datos: existencias,
      });
    } catch (err) {
      next(err);
    }
  },

  async consultarKardex(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        idVariante,
        tipoMovimiento,
        fechaInicio,
        fechaFin,
        pagina,
        limite,
      } = req.query;
      const numeroPagina = pagina ? Number(pagina) : 1;
      const tamanoPagina = limite ? Number(limite) : 20;

      const movimientos = await inventarioRepository.consultarKardex({
        idVariante: idVariante ? Number(idVariante) : undefined,
        tipoMovimiento: tipoMovimiento ? String(tipoMovimiento) : undefined,
        fechaInicio: fechaInicio ? String(fechaInicio) : undefined,
        fechaFin: fechaFin ? String(fechaFin) : undefined,
        numeroPagina,
        tamanoPagina,
      });

      const totalRegistros =
        movimientos.length > 0 ? Number(movimientos[0].TotalRegistros ?? 0) : 0;

      res.json({
        ok: true,
        totalRegistros,
        paginaActual: numeroPagina,
        tamanoPagina,
        totalPaginas: Math.ceil(totalRegistros / tamanoPagina) || 1,
        datos: movimientos,
      });
    } catch (err) {
      next(err);
    }
  },

  async registrarAjusteManual(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const movimiento = await inventarioRepository.registrarAjusteManual({
        ...req.body,
        idUsuario: req.user!.idUsuario,
      });

      if (movimiento) {
        await bitacoraRepository.registrar({
          entidad: "Inventario",
          idRegistro: movimiento.IDVariante,
          accion: "MODIFICAR",
          valorAnterior: { existenciaFisica: movimiento.ExistenciaAnterior },
          valorNuevo: {
            existenciaFisica: movimiento.ExistenciaNueva,
            tipoMovimiento: movimiento.TipoMovimiento,
            cantidad: movimiento.Cantidad,
            motivo: movimiento.Motivo,
          },
          idUsuario: req.user!.idUsuario,
          direccionIP: req.ip,
        });
      }

      res.status(201).json({
        ok: true,
        mensaje:
          "Ajuste manual de inventario registrado en el kardex exitosamente.",
        datos: movimiento,
      });
    } catch (err) {
      next(err);
    }
  },
};
