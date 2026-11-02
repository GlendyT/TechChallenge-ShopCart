import { z } from "zod";

export const itemCarritoSchema = z.object({
  idVariante: z.number().int().positive("El ID de la variante es obligatorio"),
  cantidad: z.number().int().min(0, "La cantidad no puede ser negativa"),
  tokenInvitado: z.string().trim().max(100).optional().nullable(),
});

export const migrarCarritoSchema = z.object({
  tokenInvitado: z
    .string()
    .trim()
    .min(1, "El tokenInvitado es obligatorio")
    .max(100),
});
