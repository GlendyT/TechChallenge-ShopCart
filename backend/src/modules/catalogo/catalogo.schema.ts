import { z } from "zod";

export const categoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre de la categoría es obligatorio")
    .max(100),
  descripcion: z.string().trim().max(255).optional().nullable(),
  idCategoriaPadre: z.number().int().positive().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const productoSchema = z.object({
  idCategoria: z
    .number()
    .int()
    .positive("El ID de la categoría es obligatorio"),
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre del producto es obligatorio")
    .max(150),
  descripcion: z.string().trim().min(5, "La descripción es obligatoria"),
});

export const productoIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const productoImagenParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  imagenId: z.coerce.number().int().positive(),
});

const imagenUrlSchema = z
  .string()
  .trim()
  .url("La imagen debe tener una URL valida")
  .max(500, "La URL no puede superar 500 caracteres")
  .refine((url) => /^https?:\/\//i.test(url), "La URL debe usar HTTP o HTTPS");

export const productoImagenSchema = z.object({
  imagenUrl: imagenUrlSchema,
  esPrincipal: z.boolean().optional(),
  orden: z.number().int().positive().optional(),
});

export const varianteSchema = z.object({
  idProducto: z.number().int().positive("El ID del producto es obligatorio"),
  sku: z.string().trim().min(3, "El SKU es obligatorio").max(50),
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre de la variante es obligatorio")
    .max(100),
  talla: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(30).optional().nullable(),
  precio: z.number().positive("El precio debe ser mayor a cero"),
  existenciaFisicaInicial: z.number().int().min(0).optional().default(0),
});

export const estadoSchema = z.object({
  activo: z.boolean({
    required_error: "El campo activo (true/false) es obligatorio",
  }),
});
