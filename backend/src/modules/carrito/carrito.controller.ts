import { Request, Response, NextFunction } from 'express';
import { carritoRepository } from './carrito.repository';
import { AppError } from '../../errors/AppError';

const resolverIdentidadCarrito = (req: Request) => {
  const idUsuario = req.user?.idUsuario ?? null;
  const tokenHeader = req.headers['x-guest-token'];
  const tokenQuery = req.query.tokenInvitado;
  const tokenBody = req.body?.tokenInvitado;

  const tokenInvitado =
    (typeof tokenHeader === 'string' && tokenHeader) ||
    (typeof tokenQuery === 'string' && tokenQuery) ||
    (typeof tokenBody === 'string' && tokenBody) ||
    null;

  if (!idUsuario && !tokenInvitado) {
    throw new AppError(
      'Debes iniciar sesión o enviar el header x-guest-token (o tokenInvitado) para gestionar el carrito.',
      400
    );
  }

  return { idUsuario, tokenInvitado };
};

export const carritoController = {
  async obtenerCarrito(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idUsuario, tokenInvitado } = resolverIdentidadCarrito(req);
      const carrito = await carritoRepository.obtenerOCrear(idUsuario, tokenInvitado);
      res.json({ ok: true, datos: carrito });
    } catch (err) {
      next(err);
    }
  },

  async agregarOActualizarItem(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { idUsuario, tokenInvitado } = resolverIdentidadCarrito(req);
      const { idVariante, cantidad } = req.body;

      const carritoActual = await carritoRepository.obtenerOCrear(idUsuario, tokenInvitado);
      if (!carritoActual.IDCarrito) {
        throw new AppError('No se pudo inicializar el carrito de compras.', 500);
      }

      await carritoRepository.agregarOActualizarItem(
        carritoActual.IDCarrito,
        idVariante,
        cantidad
      );

      const carritoActualizado = await carritoRepository.obtenerOCrear(
        idUsuario,
        tokenInvitado
      );

      res.json({
        ok: true,
        mensaje: 'Carrito actualizado exitosamente.',
        datos: carritoActualizado,
      });
    } catch (err) {
      next(err);
    }
  },

  async eliminarItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idUsuario, tokenInvitado } = resolverIdentidadCarrito(req);
      const idVariante = Number(req.params.idVariante);

      const carritoActual = await carritoRepository.obtenerOCrear(idUsuario, tokenInvitado);
      if (carritoActual.IDCarrito) {
        await carritoRepository.eliminarItem(carritoActual.IDCarrito, idVariante);
      }

      const carritoActualizado = await carritoRepository.obtenerOCrear(
        idUsuario,
        tokenInvitado
      );

      res.json({
        ok: true,
        mensaje: 'Artículo eliminado del carrito.',
        datos: carritoActualizado,
      });
    } catch (err) {
      next(err);
    }
  },

  async vaciarCarrito(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idUsuario, tokenInvitado } = resolverIdentidadCarrito(req);
      const carritoActual = await carritoRepository.obtenerOCrear(idUsuario, tokenInvitado);

      if (carritoActual.IDCarrito) {
        await carritoRepository.vaciar(carritoActual.IDCarrito);
      }

      const carritoActualizado = await carritoRepository.obtenerOCrear(
        idUsuario,
        tokenInvitado
      );

      res.json({
        ok: true,
        mensaje: 'El carrito ha sido vaciado.',
        datos: carritoActualizado,
      });
    } catch (err) {
      next(err);
    }
  },

  async migrarCarritoInvitado(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tokenInvitado } = req.body;
      const idUsuario = req.user!.idUsuario;

      await carritoRepository.migrarInvitadoAUsuario(tokenInvitado, idUsuario);
      const carritoFusionado = await carritoRepository.obtenerOCrear(idUsuario, null);

      res.json({
        ok: true,
        mensaje: 'Carrito de invitado fusionado exitosamente con tu cuenta.',
        datos: carritoFusionado,
      });
    } catch (err) {
      next(err);
    }
  },
};
