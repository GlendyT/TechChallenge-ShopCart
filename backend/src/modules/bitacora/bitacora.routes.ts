import { Router } from "express";
import { bitacoraController } from "./bitacora.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware";

const router = Router();

// Solo el Administrador puede consultar la bitácora de auditoría (RF-09)
router.get(
  "/",
  authenticate,
  authorizeRoles("Administrador"),
  bitacoraController.consultar,
);

export default router;
