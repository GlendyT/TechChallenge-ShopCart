import { Router } from 'express';
import { reportesController } from './reportes.controller';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';

const router = Router();

// Analítica y Dashboard administrativo (Operador y Administrador - RF-08)
router.get(
  '/ventas-periodo',
  authenticate,
  authorizeRoles('Operador', 'Administrador'),
  reportesController.ventasPeriodo
);

router.get(
  '/top-productos',
  authenticate,
  authorizeRoles('Operador', 'Administrador'),
  reportesController.topProductos
);

router.get(
  '/ventas-categoria',
  authenticate,
  authorizeRoles('Operador', 'Administrador'),
  reportesController.ventasPorCategoria
);

router.get(
  '/carritos-abandonados',
  authenticate,
  authorizeRoles('Operador', 'Administrador'),
  reportesController.carritosAbandonados
);

export default router;
