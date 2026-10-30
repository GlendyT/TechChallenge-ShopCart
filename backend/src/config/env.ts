import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DB_SERVER: z.string().min(1, "DB_SERVER es obligatorio"),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_USER: z.string().min(1, "DB_USER es obligatorio"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD es obligatorio"),
  DB_NAME: z.string().min(1, "DB_NAME es obligatorio"),
  DB_ENCRYPT: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("false"),
  DB_TRUST_SERVER_CERTIFICATE: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .default("true"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(16, "JWT_ACCESS_SECRET debe tener al menos 16 caracteres"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET debe tener al menos 16 caracteres"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Error crítico en las variables de entorno (.env):");
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
