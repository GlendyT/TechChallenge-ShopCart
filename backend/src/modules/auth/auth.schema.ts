import { z } from "zod";

export const registerSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  apellido: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100),
  correo: z
    .string()
    .trim()
    .email("Formato de correo electrónico inválido")
    .max(150),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100),
  telefono: z.string().trim().max(20).optional().nullable(),
});

export const loginSchema = z.object({
  correo: z.string().trim().email("Formato de correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "El refreshToken es obligatorio"),
});

export const direccionSchema = z.object({
  nombreDestinatario: z
    .string()
    .trim()
    .min(2, "El nombre del destinatario es obligatorio")
    .max(150),
  telefonoContacto: z
    .string()
    .trim()
    .min(7, "El teléfono de contacto es obligatorio")
    .max(20),
  direccionLinea1: z
    .string()
    .trim()
    .min(5, "La dirección principal es obligatoria")
    .max(200),
  direccionLinea2: z.string().trim().max(200).optional().nullable(),
  ciudad: z.string().trim().min(2, "La ciudad es obligatoria").max(100),
  departamento: z
    .string()
    .trim()
    .min(2, "El departamento es obligatorio")
    .max(100),
  codigoPostal: z.string().trim().max(10).optional().nullable(),
  esPrincipal: z.boolean().optional().default(false),
});

export const cambiarEstadoUsuarioSchema = z.object({
  activo: z.boolean({
    required_error: "El campo activo (true/false) es obligatorio",
  }),
});
