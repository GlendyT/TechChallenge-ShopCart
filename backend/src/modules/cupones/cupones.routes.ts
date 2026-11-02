import { Router } from 'express';
import { cuponesController } from './cupones.controller';
import { authenticate, authorizeRoles } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  crearCuponSchema,
  validarCuponSchema,
  estadoCuponSchema,
} from './cupones.schema';

const router = Router();

// Validación de cupón sobre el carrito del cliente (RF-05)
router.post(
  '/validar',
  authenticate,
  validateRequest(validarCuponSchema),
  cuponesController.validarEnCarrito
);

// Administración de cupones (Solo Administrador - RF-05)
router.get(
  '/',
  authenticate,
  authorizeRoles('Administrador'),
  cuponesController.listar
);

router.post(
  '/',
  authenticate,
  authorizeRoles('Administrador'),
  validateRequest(crearCuponSchema),
  cuponesController.crear
);

router.patch(
  '/:id/estado',
  authenticate,
  authorizeRoles('Administrador'),
  validateRequest(estadoCuponSchema),
  cuponesController.cambiarEstado
);

export default router;
