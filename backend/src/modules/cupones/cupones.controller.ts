import { Request, Response, NextFunction } from "express";
import { cuponesRepository } from "./cupones.repository";
import { carritoRepository } from "../carrito/carrito.repository";
import { bitacoraRepository } from "../bitacora/bitacora.repository";
import { AppError } from "../../errors/AppError";

export const cuponesController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const soloActivos = req.query.soloActivos === "true";
      const cupones = await cuponesRepository.listar(soloActivos);
      res.json({ ok: true, datos: cupones });
    } catch (err) {
      next(err);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nuevo = await cuponesRepository.crear(req.body);

      if (nuevo) {
        await bitacoraRepository.registrar({
          entidad: "Cupones",
          idRegistro: nuevo.IDCupon,
          accion: "CREAR",
          valorNuevo: nuevo,
          idUsuario: req.user!.idUsuario,
          direccionIP: req.ip,
        });
      }

      res.status(201).json({
        ok: true,
        mensaje: "Cupón creado exitosamente.",
        datos: nuevo,
      });
    } catch (err) {
      next(err);
    }
  },

  async cambiarEstado(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idCupon = Number(req.params.id);
      const { activo } = req.body;

      await cuponesRepository.cambiarEstado(idCupon, activo);

      await bitacoraRepository.registrar({
        entidad: "Cupones",
        idRegistro: idCupon,
        accion: activo ? "MODIFICAR" : "DESACTIVAR",
        valorNuevo: { activo },
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.json({
        ok: true,
        mensaje: `Cupón ${activo ? "activado" : "desactivado"} exitosamente.`,
      });
    } catch (err) {
      next(err);
    }
  },

  async validarEnCarrito(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { codigo } = req.body;
      const idUsuario = req.user!.idUsuario;

      const carrito = await carritoRepository.obtenerOCrear(idUsuario, null);
      if (!carrito.IDCarrito) {
        throw new AppError(
          "No tienes un carrito activo para validar el cupón.",
          400,
        );
      }

      const resultado = await cuponesRepository.validarYAplicar(
        codigo,
        idUsuario,
        carrito.IDCarrito,
      );

      res.json({
        ok: true,
        mensaje: "Cupón válido y aplicado al cálculo.",
        datos: resultado,
      });
    } catch (err) {
      next(err);
    }
  },
};
