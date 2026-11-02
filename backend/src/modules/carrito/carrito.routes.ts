import { Router } from 'express';
import { carritoController } from './carrito.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { itemCarritoSchema, migrarCarritoSchema } from './carrito.schema';

const router = Router();

// Operaciones híbridas (Invitado con x-guest-token o Cliente autenticado - RF-04)
router.get('/', optionalAuthenticate, carritoController.obtenerCarrito);
router.post(
  '/items',
  optionalAuthenticate,
  validateRequest(itemCarritoSchema),
  carritoController.agregarOActualizarItem
);
router.delete(
  '/items/:idVariante',
  optionalAuthenticate,
  carritoController.eliminarItem
);
router.delete('/', optionalAuthenticate, carritoController.vaciarCarrito);

// Fusión de carrito invitado al iniciar sesión (RF-04)
router.post(
  '/migrar',
  authenticate,
  validateRequest(migrarCarritoSchema),
  carritoController.migrarCarritoInvitado
);

export default router;
