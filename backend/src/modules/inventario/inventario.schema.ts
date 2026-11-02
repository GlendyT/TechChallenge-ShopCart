import { z } from "zod";

export const ajusteManualSchema = z.object({
  idVariante: z.number().int().positive("El ID de la variante es obligatorio"),
  tipoAjuste: z.enum(["POSITIVO", "NEGATIVO"], {
    required_error: "El tipo de ajuste debe ser POSITIVO o NEGATIVO",
  }),
  cantidad: z
    .number()
    .int()
    .positive("La cantidad a ajustar debe ser mayor a cero"),
  motivo: z
    .string()
    .trim()
    .min(5, "El motivo del ajuste es obligatorio (mínimo 5 caracteres)")
    .max(255),
});
