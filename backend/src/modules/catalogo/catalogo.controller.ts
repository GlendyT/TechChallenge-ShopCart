import { Request, Response, NextFunction } from "express";
import { catalogoRepository } from "./catalogo.repository";
import { catalogoService } from "./catalogo.service";
import { bitacoraRepository } from "../bitacora/bitacora.repository";

export const catalogoController = {
  async listarCategorias(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const soloActivas = req.query.todas !== "true";
      const categorias = await catalogoRepository.listarCategorias(soloActivas);
      res.json({ ok: true, datos: categorias });
    } catch (err) {
      next(err);
    }
  },

  async crearCategoria(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const nueva = await catalogoRepository.crearCategoria(req.body);
      res.status(201).json({
        ok: true,
        mensaje: "Categoría creada exitosamente.",
        datos: nueva,
      });
    } catch (err) {
      next(err);
    }
  },

  async actualizarCategoria(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idCategoria = Number(req.params.id);
      await catalogoRepository.actualizarCategoria(idCategoria, req.body);
      res.json({
        ok: true,
        mensaje: "Categoría actualizada exitosamente.",
      });
    } catch (err) {
      next(err);
    }
  },

  async cambiarEstadoCategoria(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idCategoria = Number(req.params.id);
      const { activo } = req.body;
      await catalogoRepository.cambiarEstadoCategoria(idCategoria, activo);
      res.json({
        ok: true,
        mensaje: `Categoría ${activo ? "activada" : "desactivada"} exitosamente.`,
      });
    } catch (err) {
      next(err);
    }
  },

  async listarProductos(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        busqueda,
        idCategoria,
        precioMin,
        precioMax,
        soloConStock,
        incluirInactivos,
        orden,
        pagina,
        limite,
      } = req.query;

      const numeroPagina = pagina ? Number(pagina) : 1;
      const tamanoPagina = limite ? Number(limite) : 12;

      const productos = await catalogoRepository.listarProductosPaginado({
        busqueda: busqueda ? String(busqueda) : undefined,
        idCategoria: idCategoria ? Number(idCategoria) : undefined,
        precioMin: precioMin ? Number(precioMin) : undefined,
        precioMax: precioMax ? Number(precioMax) : undefined,
        soloConStock: soloConStock === "true",
        soloActivos: incluirInactivos !== "true",
        orden: orden ? String(orden) : "RECIENTE",
        numeroPagina,
        tamanoPagina,
      });

      const totalRegistros =
        productos.length > 0 ? Number(productos[0].TotalRegistros ?? 0) : 0;

      res.json({
        ok: true,
        totalRegistros,
        paginaActual: numeroPagina,
        tamanoPagina,
        totalPaginas: Math.ceil(totalRegistros / tamanoPagina) || 1,
        datos: productos,
      });
    } catch (err) {
      next(err);
    }
  },

  async obtenerDetalleProducto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const codigoPublico = String(req.params.codigoPublico);
      const producto =
        await catalogoRepository.obtenerProductoPorCodigoPublico(codigoPublico);
      res.json({ ok: true, datos: producto });
    } catch (err) {
      next(err);
    }
  },

  async crearProducto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const nuevo = await catalogoRepository.crearProducto(req.body);
      if (nuevo) {
        await bitacoraRepository.registrar({
          entidad: "Productos",
          idRegistro: nuevo.IDProducto,
          accion: "CREAR",
          valorNuevo: nuevo,
          idUsuario: req.user!.idUsuario,
          direccionIP: req.ip,
        });
      }

      res.status(201).json({
        ok: true,
        mensaje: "Producto creado exitosamente.",
        datos: nuevo,
      });
    } catch (err) {
      next(err);
    }
  },

  async actualizarProducto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idProducto = Number(req.params.id);
      const { anterior, nuevo } = await catalogoRepository.actualizarProducto(
        idProducto,
        req.body,
      );

      await bitacoraRepository.registrar({
        entidad: "Productos",
        idRegistro: idProducto,
        accion: "MODIFICAR",
        valorAnterior: anterior,
        valorNuevo: nuevo,
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.json({
        ok: true,
        mensaje: "Producto actualizado exitosamente.",
        datos: nuevo,
      });
    } catch (err) {
      next(err);
    }
  },

  async agregarImagenProducto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idProducto = Number(req.params.id);
      const imagen = await catalogoRepository.agregarImagenProducto(
        idProducto,
        req.body,
      );

      await bitacoraRepository.registrar({
        entidad: "Productos",
        idRegistro: idProducto,
        accion: "MODIFICAR",
        valorNuevo: { imagenAgregada: imagen },
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.status(201).json({
        ok: true,
        mensaje: "Imagen agregada exitosamente.",
        datos: imagen,
      });
    } catch (err) {
      next(err);
    }
  },

  async actualizarImagenProducto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idProducto = Number(req.params.id);
      const idImagen = Number(req.params.imagenId);
      const { anterior, nuevo } =
        await catalogoRepository.actualizarImagenProducto(
          idProducto,
          idImagen,
          req.body,
        );

      await bitacoraRepository.registrar({
        entidad: "Productos",
        idRegistro: idProducto,
        accion: "MODIFICAR",
        valorAnterior: { imagen: anterior },
        valorNuevo: { imagen: nuevo },
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.json({
        ok: true,
        mensaje: "Imagen actualizada exitosamente.",
        datos: nuevo,
      });
    } catch (err) {
      next(err);
    }
  },

  async eliminarImagenProducto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idProducto = Number(req.params.id);
      const idImagen = Number(req.params.imagenId);
      const imagen = await catalogoRepository.eliminarImagenProducto(
        idProducto,
        idImagen,
      );

      await bitacoraRepository.registrar({
        entidad: "Productos",
        idRegistro: idProducto,
        accion: "MODIFICAR",
        valorAnterior: { imagen },
        valorNuevo: { imagenEliminada: true },
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.json({ ok: true, mensaje: "Imagen eliminada exitosamente." });
    } catch (err) {
      next(err);
    }
  },

  async cambiarEstadoProducto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idProducto = Number(req.params.id);
      const { activo } = req.body;
      await catalogoRepository.cambiarEstadoProducto(idProducto, activo);

      await bitacoraRepository.registrar({
        entidad: "Productos",
        idRegistro: idProducto,
        accion: activo ? "MODIFICAR" : "DESACTIVAR",
        valorNuevo: { activo },
        idUsuario: req.user!.idUsuario,
        direccionIP: req.ip,
      });

      res.json({
        ok: true,
        mensaje: `Producto ${activo ? "activado" : "desactivado"} exitosamente.`,
      });
    } catch (err) {
      next(err);
    }
  },

  async crearVariante(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const nueva = await catalogoService.crearVariante({
        ...req.body,
        idUsuarioOperador: req.user!.idUsuario,
      });

      if (nueva) {
        await bitacoraRepository.registrar({
          entidad: "Variantes",
          idRegistro: nueva.IDVariante,
          accion: "CREAR",
          valorNuevo: nueva,
          idUsuario: req.user!.idUsuario,
          direccionIP: req.ip,
        });
      }

      res.status(201).json({
        ok: true,
        mensaje: "Variante creada exitosamente.",
        datos: nueva,
      });
    } catch (err) {
      next(err);
    }
  },
};
