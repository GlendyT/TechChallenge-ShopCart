import app from './app';
import { env } from './config/env';
import { getPool } from './database/db';

const startServer = async (): Promise<void> => {
  try {
    // Verificar conexión inicial al pool de SQL Server antes de aceptar tráfico
    await getPool();

    app.listen(env.PORT, () => {
      console.log('============================================================');
      console.log(`🚀 ShopCart Backend API ejecutándose en http://localhost:${env.PORT}`);
      console.log(`📌 Entorno: ${env.NODE_ENV} | Base de Datos: ${env.DB_NAME}`);
      console.log(`🩺 Healthcheck: http://localhost:${env.PORT}/api/health`);
      console.log(`📚 Swagger UI:  http://localhost:${env.PORT}/api/docs`);
      console.log('============================================================');
    });
  } catch (err) {
    console.error('❌ No se pudo iniciar el servidor ShopCart:', err);
    process.exit(1);
  }
};

void startServer();
