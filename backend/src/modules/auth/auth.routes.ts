import { Router } from "express";
import { authController } from "./auth.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  direccionSchema,
  cambiarEstadoUsuarioSchema,
} from "./auth.schema";

const router = Router();

// Rutas públicas de autenticación (RF-01)
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.registrar,
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  authController.refresh,
);
router.post(
  "/logout",
  validateRequest(refreshTokenSchema),
  authController.logout,
);

// Perfil y direcciones del usuario autenticado (RF-01, RF-06)
router.get("/me", authenticate, authController.perfil);
router.get("/direcciones", authenticate, authController.listarDirecciones);
router.post(
  "/direcciones",
  authenticate,
  validateRequest(direccionSchema),
  authController.crearDireccion,
);
router.put(
  "/direcciones/:id",
  authenticate,
  validateRequest(direccionSchema),
  authController.actualizarDireccion,
);
router.delete(
  "/direcciones/:id",
  authenticate,
  authController.eliminarDireccion,
);

// Administración de usuarios (Solo Administrador - RF-01)
router.get(
  "/usuarios",
  authenticate,
  authorizeRoles("Administrador"),
  authController.listarUsuarios,
);
router.patch(
  "/usuarios/:id/estado",
  authenticate,
  authorizeRoles("Administrador"),
  validateRequest(cambiarEstadoUsuarioSchema),
  authController.cambiarEstadoUsuario,
);

export default router;
