import { Router } from "express";
import { inventarioController } from "./inventario.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { ajusteManualSchema } from "./inventario.schema";

const router = Router();

// Gestión de existencias y kardex (Operador y Administrador - RF-03)
router.get(
  "/existencias",
  authenticate,
  authorizeRoles("Operador", "Administrador"),
  inventarioController.listarExistencias,
);

router.get(
  "/kardex",
  authenticate,
  authorizeRoles("Operador", "Administrador"),
  inventarioController.consultarKardex,
);

router.post(
  "/ajuste",
  authenticate,
  authorizeRoles("Operador", "Administrador"),
  validateRequest(ajusteManualSchema),
  inventarioController.registrarAjusteManual,
);

export default router;
