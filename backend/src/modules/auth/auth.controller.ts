import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { authRepository } from "./auth.repository";

export const authController = {
  async registrar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const resultado = await authService.registrarCliente(req.body, req.ip);
      res.status(201).json({
        ok: true,
        mensaje: "Registro completado exitosamente.",
        datos: resultado,
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, password } = req.body;
      const resultado = await authService.login(correo, password);
      res.json({
        ok: true,
        mensaje: "Inicio de sesión exitoso.",
        datos: resultado,
      });
    } catch (err) {
      next(err);
    }
  },

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      res.json({
        ok: true,
        mensaje: "Sesión renovada exitosamente.",
        datos: tokens,
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({
        ok: true,
        mensaje: "Sesión cerrada exitosamente.",
      });
    } catch (err) {
      next(err);
    }
  },

  async perfil(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await authRepository.obtenerPorCorreo(req.user!.correo);
      res.json({
        ok: true,
        datos: usuario
          ? {
              idUsuario: usuario.IDUsuario,
              codigoPublico: usuario.CodigoPublico,
              nombre: usuario.Nombre,
              apellido: usuario.Apellido,
              correo: usuario.Correo,
              telefono: usuario.Telefono,
              rol: usuario.Rol,
              activo: usuario.Activo,
              fechaCreacion: usuario.FechaCreacion,
            }
          : req.user,
      });
    } catch (err) {
      next(err);
    }
  },

  async listarDirecciones(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const direcciones = await authRepository.listarDirecciones(
        req.user!.idUsuario,
      );
      res.json({ ok: true, datos: direcciones });
    } catch (err) {
      next(err);
    }
  },

  async crearDireccion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const nueva = await authRepository.crearDireccion(
        req.user!.idUsuario,
        req.body,
      );
      res.status(201).json({
        ok: true,
        mensaje: "Dirección registrada exitosamente.",
        datos: nueva,
      });
    } catch (err) {
      next(err);
    }
  },

  async actualizarDireccion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idDireccion = Number(req.params.id);
      await authRepository.actualizarDireccion(
        idDireccion,
        req.user!.idUsuario,
        req.body,
      );
      res.json({
        ok: true,
        mensaje: "Dirección actualizada exitosamente.",
      });
    } catch (err) {
      next(err);
    }
  },

  async eliminarDireccion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idDireccion = Number(req.params.id);
      await authRepository.eliminarDireccion(idDireccion, req.user!.idUsuario);
      res.json({
        ok: true,
        mensaje: "Dirección eliminada exitosamente.",
      });
    } catch (err) {
      next(err);
    }
  },

  async listarUsuarios(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const soloActivos = req.query.soloActivos === "true";
      const busqueda = req.query.busqueda
        ? String(req.query.busqueda)
        : undefined;
      const usuarios = await authRepository.listarUsuarios(
        soloActivos,
        busqueda,
      );
      res.json({ ok: true, datos: usuarios });
    } catch (err) {
      next(err);
    }
  },

  async cambiarEstadoUsuario(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idUsuarioObjetivo = Number(req.params.id);
      const { activo } = req.body;
      await authService.cambiarEstadoUsuario(
        idUsuarioObjetivo,
        activo,
        req.user!.idUsuario,
        req.ip,
      );
      res.json({
        ok: true,
        mensaje: `Usuario ${activo ? "activado" : "desactivado"} exitosamente.`,
      });
    } catch (err) {
      next(err);
    }
  },
};
