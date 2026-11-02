import { Router } from "express";
import { catalogoController } from "./catalogo.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import {
  categoriaSchema,
  productoSchema,
  varianteSchema,
  estadoSchema,
} from "./catalogo.schema";

const router = Router();

// Rutas públicas del catálogo (RF-02)
router.get("/categorias", catalogoController.listarCategorias);
router.get("/productos", catalogoController.listarProductos);
router.get(
  "/productos/:codigoPublico",
  catalogoController.obtenerDetalleProducto,
);

// Rutas administrativas de categorías (Solo Administrador - RF-02)
router.post(
  "/categorias",
  authenticate,
  authorizeRoles("Administrador"),
  validateRequest(categoriaSchema),
  catalogoController.crearCategoria,
);
router.put(
  "/categorias/:id",
  authenticate,
  authorizeRoles("Administrador"),
  validateRequest(categoriaSchema),
  catalogoController.actualizarCategoria,
);
router.patch(
  "/categorias/:id/estado",
  authenticate,
  authorizeRoles("Administrador"),
  validateRequest(estadoSchema),
  catalogoController.cambiarEstadoCategoria,
);

// Rutas administrativas de productos y variantes (Solo Administrador - RF-02)
router.post(
  "/productos",
  authenticate,
  authorizeRoles("Administrador"),
  validateRequest(productoSchema),
  catalogoController.crearProducto,
);
router.patch(
  "/productos/:id/estado",
  authenticate,
  authorizeRoles("Administrador"),
  validateRequest(estadoSchema),
  catalogoController.cambiarEstadoProducto,
);
router.post(
  "/variantes",
  authenticate,
  authorizeRoles("Administrador"),
  validateRequest(varianteSchema),
  catalogoController.crearVariante,
);

export default router;
