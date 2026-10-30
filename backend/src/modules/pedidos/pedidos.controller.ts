import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { pedidosRepository } from './pedidos.repository';
import { carritoRepository } from '../carrito/carrito.repository';
import { bitacoraRepository } from '../bitacora/bitacora.repository';
import { AppError } from '../../errors/AppError';

export const pedidosController = {
  async iniciarReservaCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idUsuario = req.user!.idUsuario;
      const { claveIdempotencia } = req.body;

      const carrito = await carritoRepository.obtenerOCrear(idUsuario, null);
      if (!carrito.IDCarrito) {
        throw new AppError('No tienes un carrito activo para reservar existencias.', 400);
      }

      const reserva = await pedidosRepository.iniciarReserva(
        idUsuario,
        carrito.IDCarrito,
        claveIdempotencia
      );

      res.status(201).json({
        ok: true,
        mensaje: 'Existencias reservadas por 15 minutos para completar el checkout.',
        datos: reserva,
      });
    } catch (err) {
      next(err);
    }
  },

  async confirmarCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idUsuario = req.user!.idUsuario;
      const {
        idDireccionEntrega,
        claveIdempotencia,
        metodoPago,
        codigoCupon,
        simularResultadoPago,
      } = req.body;

      // Simulación de pasarela de pago (RF-06):
      // Si el pago es rechazado, no se genera pedido, no se descuenta stock y el carrito queda intacto
      if (simularResultadoPago === 'RECHAZADO') {
        throw new AppError(
          'Pago rechazado por la pasarela de pagos simulada. No se realizó ningún cargo ni descuento de inventario y tu carrito permanece intacto.',
          402
        );
      }

      const carrito = await carritoRepository.obtenerOCrear(idUsuario, null);
      if (!carrito.IDCarrito) {
        throw new AppError('No tienes un carrito activo para confirmar el pedido.', 400);
      }

      const idTransaccionPago = `TXN-${Date.now()}-${crypto
        .randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;

      const pedido = await pedidosRepository.confirmarPedido({
        idUsuario,
        idDireccionEntrega,
        idCarrito: carrito.IDCarrito,
        claveIdempotencia,
        metodoPago,
        idTransaccionPago,
        codigoCupon,
      });

      if (pedido && pedido.Mensaje === 'PEDIDO_CREADO_EXITOSAMENTE') {
        await bitacoraRepository.registrar({
          entidad: 'Pedidos',
          idRegistro: pedido.IDPedido,
          accion: 'CREAR',
          valorNuevo: pedido,
          idUsuario,
          direccionIP: req.ip,
        });
      }

      const statusCode =
        pedido?.Mensaje === 'PEDIDO_PREVIAMENTE_PROCESADO' ? 200 : 201;

      res.status(statusCode).json({
        ok: true,
        mensaje:
          pedido?.Mensaje === 'PEDIDO_PREVIAMENTE_PROCESADO'
            ? 'Este pedido ya había sido procesado previamente (Idempotencia garantizada).'
            : 'Pedido confirmado y pagado exitosamente.',
        datos: pedido,
      });
    } catch (err) {
      next(err);
    }
  },

  async listarMisPedidos(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { estado, pagina, limite } = req.query;
      const numeroPagina = pagina ? Number(pagina) : 1;
      const tamanoPagina = limite ? Number(limite) : 20;

      const pedidos = await pedidosRepository.listarConFiltros({
        idUsuario: req.user!.idUsuario,
        estado: estado ? String(estado) : undefined,
        numeroPagina,
        tamanoPagina,
      });

      const totalRegistros =
        pedidos.length > 0 ? Number(pedidos[0].TotalRegistros ?? 0) : 0;

      res.json({
        ok: true,
        totalRegistros,
        paginaActual: numeroPagina,
        tamanoPagina,
        totalPaginas: Math.ceil(totalRegistros / tamanoPagina) || 1,
        datos: pedidos,
      });
    } catch (err) {
      next(err);
    }
  },

  async listarTodosPedidos(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { estado, idUsuario, fechaInicio, fechaFin, busqueda, pagina, limite } =
        req.query;
      const numeroPagina = pagina ? Number(pagina) : 1;
      const tamanoPagina = limite ? Number(limite) : 20;

      const pedidos = await pedidosRepository.listarConFiltros({
        estado: estado ? String(estado) : undefined,
        idUsuario: idUsuario ? Number(idUsuario) : undefined,
        fechaInicio: fechaInicio ? String(fechaInicio) : undefined,
        fechaFin: fechaFin ? String(fechaFin) : undefined,
        busqueda: busqueda ? String(busqueda) : undefined,
        numeroPagina,
        tamanoPagina,
      });

      const totalRegistros =
        pedidos.length > 0 ? Number(pedidos[0].TotalRegistros ?? 0) : 0;

      res.json({
        ok: true,
        totalRegistros,
        paginaActual: numeroPagina,
        tamanoPagina,
        totalPaginas: Math.ceil(totalRegistros / tamanoPagina) || 1,
        datos: pedidos,
      });
    } catch (err) {
      next(err);
    }
  },

  async obtenerDetallePorCodigoPublico(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const codigoPublico = String(req.params.codigoPublico);
      const esOperadorOAdmin =
        req.user!.rol === 'Operador' || req.user!.rol === 'Administrador';

      const detalle = await pedidosRepository.obtenerPorCodigoPublico(
        codigoPublico,
        req.user!.idUsuario,
        esOperadorOAdmin
      );

      res.json({ ok: true, datos: detalle });
    } catch (err) {
      next(err);
    }
  },

  async cambiarEstado(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idPedido = Number(req.params.id);
      const { estadoNuevo, motivo } = req.body;

      const resultado = await pedidosRepository.cambiarEstado(
        idPedido,
        estadoNuevo,
        req.user!.idUsuario,
        motivo
      );

      await bitacoraRepository.registrar({
        entidad: 'Pedidos',
        idRegistro: idPedido,
        accion: 'CAMBIO_ESTADO',
        valorNuevo: { estadoNuevo, motivo },
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.json({
        ok: true,
        mensaje: `El pedido pasó al estado ${estadoNuevo} exitosamente.`,
        datos: resultado,
      });
    } catch (err) {
      next(err);
    }
  },

  async cancelarPedido(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idPedido = Number(req.params.id);
      const { motivo } = req.body;

      const resultado = await pedidosRepository.cancelar(
        idPedido,
        req.user!.idUsuario,
        motivo
      );

      await bitacoraRepository.registrar({
        entidad: 'Pedidos',
        idRegistro: idPedido,
        accion: 'CAMBIO_ESTADO',
        valorNuevo: { estadoNuevo: 'CANCELADO', motivo },
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.json({
        ok: true,
        mensaje: 'Pedido cancelado y existencias reintegradas al inventario.',
        datos: resultado,
      });
    } catch (err) {
      next(err);
    }
  },

  async procesarDevolucion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idPedido = Number(req.params.id);
      const { idPedidoDetalle, cantidadADevolver, motivo } = req.body;

      const resultado = await pedidosRepository.procesarDevolucion({
        idPedido,
        idPedidoDetalle,
        cantidadADevolver,
        idUsuarioOperador: req.user!.idUsuario,
        motivo,
      });

      await bitacoraRepository.registrar({
        entidad: 'Pedidos',
        idRegistro: idPedido,
        accion: 'CAMBIO_ESTADO',
        valorNuevo: {
          accion: 'DEVOLUCION',
          idPedidoDetalle,
          cantidadADevolver,
          motivo,
          resultado,
        },
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.status(201).json({
        ok: true,
        mensaje: 'Devolución registrada y unidades reintegradas al inventario.',
        datos: resultado,
      });
    } catch (err) {
      next(err);
    }
  },
};
