import { Router } from 'express';
import { pedidosController } from './pedidos.controller';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  iniciarReservaSchema,
  confirmarCheckoutSchema,
  cambiarEstadoPedidoSchema,
  cancelarPedidoSchema,
  procesarDevolucionSchema,
} from './pedidos.schema';

const router = Router();

// Checkout y reservas (Cliente autenticado - RF-06)
router.post(
  '/checkout/reserva',
  authenticate,
  validateRequest(iniciarReservaSchema),
  pedidosController.iniciarReservaCheckout
);

router.post(
  '/checkout/confirmar',
  authenticate,
  validateRequest(confirmarCheckoutSchema),
  pedidosController.confirmarCheckout
);

// Historial de pedidos del cliente autenticado (RF-01, RF-07)
router.get('/mis-pedidos', authenticate, pedidosController.listarMisPedidos);

// Listado operativo/administrativo de todos los pedidos con filtros (RF-07, RF-08)
router.get(
  '/',
  authenticate,
  authorizeRoles('Operador', 'Administrador'),
  pedidosController.listarTodosPedidos
);

// Detalle completo por CodigoPublico (Cliente dueño, Operador o Administrador - RF-07)
router.get(
  '/:codigoPublico',
  authenticate,
  pedidosController.obtenerDetallePorCodigoPublico
);

// Gestión del ciclo de vida del pedido (Operador y Administrador - RF-07)
router.patch(
  '/:id/estado',
  authenticate,
  authorizeRoles('Operador', 'Administrador'),
  validateRequest(cambiarEstadoPedidoSchema),
  pedidosController.cambiarEstado
);

router.post(
  '/:id/cancelar',
  authenticate,
  authorizeRoles('Operador', 'Administrador'),
  validateRequest(cancelarPedidoSchema),
  pedidosController.cancelarPedido
);

router.post(
  '/:id/devoluciones',
  authenticate,
  authorizeRoles('Operador', 'Administrador'),
  validateRequest(procesarDevolucionSchema),
  pedidosController.procesarDevolucion
);

export default router;
