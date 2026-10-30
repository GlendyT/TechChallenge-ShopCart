import sql from "mssql";
import { env } from "../config/env";

const dbConfig: sql.config = {
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  server: env.DB_SERVER,
  port: env.DB_PORT,
  database: env.DB_NAME,
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
    enableArithAbort: true,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

/**
 * Obtiene o inicializa el pool de conexiones a SQL Server (Singleton).
 */
export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((pool) => {
        console.log(`✅ Conectado exitosamente a SQL Server (${env.DB_NAME})`);
        return pool;
      })
      .catch((err) => {
        poolPromise = null;
        console.error("❌ Error al conectar a SQL Server:", err);
        throw err;
      });
  }
  return poolPromise;
};

/**
 * Definición de un parámetro tipado para un Stored Procedure.
 */
export interface SPParam {
  name: string;
  type: sql.ISqlType | (() => sql.ISqlType);
  value: unknown;
}

/**
 * Ejecuta exclusivamente un Procedimiento Almacenado (SP_Modulo_Proceso)
 * con parámetros fuertemente tipados. Prohibido el uso de consultas inline.
 */
export const executeSP = async <T = Record<string, unknown>>(
  spName: string,
  params: SPParam[] = [],
): Promise<sql.IProcedureResult<T>> => {
  const pool = await getPool();
  const request = pool.request();

  for (const param of params) {
    request.input(param.name, param.type, param.value);
  }

  return request.execute<T>(spName);
};

export { sql };
