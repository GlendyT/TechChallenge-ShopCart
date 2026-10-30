import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import catalogoRoutes from './modules/catalogo/catalogo.routes';
import inventarioRoutes from './modules/inventario/inventario.routes';
import carritoRoutes from './modules/carrito/carrito.routes';
import cuponesRoutes from './modules/cupones/cupones.routes';
import pedidosRoutes from './modules/pedidos/pedidos.routes';
import reportesRoutes from './modules/reportes/reportes.routes';
import bitacoraRoutes from './modules/bitacora/bitacora.routes';

const app = express();

// Middlewares globales de seguridad y parseo (RNF Seguridad)
app.use(
  helmet({
    contentSecurityPolicy: false, // Permite cargar la interfaz interactiva de Swagger UI
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Documentación interactiva OpenAPI 3.0 / Swagger UI
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ShopCart API Docs - Don Arturo',
  })
);

// Endpoint de salud de la API
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    servicio: 'ShopCart API REST - Don Arturo / Grupo Pentandra',
    moneda: 'GTQ (IVA 12% incluido)',
    documentacion: `http://localhost:${env.PORT}/api/docs`,
    timestamp: new Date().toISOString(),
  });
});

// Registro de módulos funcionales (RF-01 a RF-09)
app.use('/api/auth', authRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/cupones', cuponesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/bitacora', bitacoraRoutes);

// Ruta 404 para endpoints no existentes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    mensaje: 'El endpoint solicitado no existe en ShopCart API.',
  });
});

// Middleware centralizado de errores
app.use(errorHandler);

export default app;
