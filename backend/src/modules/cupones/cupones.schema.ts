import { z } from "zod";

export const crearCuponSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(3, "El código del cupón debe tener al menos 3 caracteres")
    .max(30),
  tipoDescuento: z.enum(["PORCENTAJE", "MONTO_FIJO"], {
    required_error: "El tipo de descuento debe ser PORCENTAJE o MONTO_FIJO",
  }),
  valorDescuento: z
    .number()
    .positive("El valor del descuento debe ser mayor a cero"),
  montoMinimoCompra: z.number().min(0).optional().default(0),
  limiteUsosTotal: z
    .number()
    .int()
    .positive("El límite total de usos debe ser mayor a cero"),
  limiteUsosPorCliente: z
    .number()
    .int()
    .positive("El límite de usos por cliente debe ser mayor a cero")
    .optional()
    .default(1),
  idCategoria: z.number().int().positive().optional().nullable(),
  fechaInicio: z.string().min(1, "La fecha de inicio es obligatoria"),
  fechaFin: z.string().min(1, "La fecha de fin es obligatoria"),
});

export const validarCuponSchema = z.object({
  codigo: z.string().trim().min(1, "Debes ingresar un código de cupón").max(30),
});

export const estadoCuponSchema = z.object({
  activo: z.boolean({
    required_error: "El campo activo (true/false) es obligatorio",
  }),
});
