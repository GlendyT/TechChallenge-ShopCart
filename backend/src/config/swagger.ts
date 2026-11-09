import { env } from './env';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ShopCart API REST — Don Arturo / Grupo Pentandra',
    version: '1.0.0',
    description:
      'API RESTful de la plataforma de comercio electrónico **ShopCart**.\n\n' +
      '### Reglas Técnicas y de Negocio:\n' +
      '- **Moneda:** Quetzales (`GTQ`) con el **12% de IVA incluido** en todos los precios.\n' +
      '- **Acceso a Datos:** 100% mediante Procedimientos Almacenados (`SP_Modulo_Proceso`), cero ORM y cero SQL inline.\n' +
      '- **Concurrencia:** Reservas de stock de 15 minutos y bloqueo pesimista (`UPDLOCK, HOLDLOCK`) contra sobreventa.\n\n' +
      '### Credenciales de Prueba (Seed):\n' +
      '- **Administrador:** `admin@shopcart.gt` / `Admin123!`\n' +
      '- **Operador:** `operador@shopcart.gt` / `Operador123!`\n' +
      '- **Cliente:** `cliente@shopcart.gt` / `Cliente123!`',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Servidor Local de Desarrollo',
    },
  ],
  tags: [
    { name: 'Salud', description: 'Estado operativo del servicio' },
    { name: 'RF-01 Auth y Usuarios', description: 'Registro, login JWT, refresh token con rotación, direcciones y usuarios' },
    { name: 'RF-02 Catálogo', description: 'Categorías, listado paginado de productos, detalle y variantes' },
    { name: 'RF-03 Inventario y Kardex', description: 'Existencias disponibles/físicas, historial Kardex y ajustes manuales' },
    { name: 'RF-04 Carrito de Compras', description: 'Carrito híbrido (invitado/autenticado) y fusión al iniciar sesión' },
    { name: 'RF-05 Cupones', description: 'Administración y validación de cupones de descuento' },
    { name: 'RF-06 / RF-07 Checkout y Pedidos', description: 'Reserva de 15 min, confirmación atómica, ciclo de vida, cancelaciones y devoluciones' },
    { name: 'RF-08 Reportes y Dashboard', description: 'Métricas de ventas, ticket promedio, Top 10 productos y carritos abandonados' },
    { name: 'RF-09 Bitácora', description: 'Auditoría inmutable de operaciones críticas' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'shopcart_access',
        description: 'Cookie HttpOnly emitida por /api/auth/login o /api/auth/register',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa el accessToken obtenido en /api/auth/login',
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Salud'],
        summary: 'Verificar estado del servidor',
        responses: {
          200: { description: 'Servidor activo y saludable' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Registrar un nuevo cliente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'apellido', 'correo', 'password'],
                properties: {
                  nombre: { type: 'string', example: 'Ana' },
                  apellido: { type: 'string', example: 'Morales' },
                  correo: { type: 'string', example: 'ana.morales@correo.gt' },
                  password: { type: 'string', example: 'Cliente123!' },
                  telefono: { type: 'string', example: '50255559999' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cliente registrado; la sesión se emite en cookies HttpOnly' },
          409: { description: 'El correo ya está registrado' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Iniciar sesión (Cliente, Operador o Administrador)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['correo', 'password'],
                properties: {
                  correo: { type: 'string', example: 'admin@shopcart.gt' },
                  password: { type: 'string', example: 'Admin123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Inicio de sesión exitoso; la sesión se emite en cookies HttpOnly' },
          401: { description: 'Credenciales inválidas' },
          403: { description: 'Cuenta desactivada' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Renovar Access Token con rotación de Refresh Token',
        description: 'Lee la cookie HttpOnly de refresh y rota la sesión.',
        responses: {
          200: { description: 'Cookies de sesión renovadas exitosamente' },
          401: { description: 'Refresh token inválido, revocado o expirado' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Cerrar sesión y revocar Refresh Token',
        description: 'Revoca la sesión asociada a la cookie y limpia las cookies HttpOnly.',
        responses: {
          200: { description: 'Sesión cerrada exitosamente' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Obtener perfil del usuario autenticado',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Datos del perfil actual' },
        },
      },
    },
    '/api/auth/direcciones': {
      get: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Listar direcciones de entrega del usuario autenticado',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Lista de direcciones' },
        },
      },
      post: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Crear una nueva dirección de entrega',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombreDestinatario', 'telefonoContacto', 'direccionLinea1', 'ciudad', 'departamento'],
                properties: {
                  nombreDestinatario: { type: 'string', example: 'Mario Gómez' },
                  telefonoContacto: { type: 'string', example: '50255553000' },
                  direccionLinea1: { type: 'string', example: 'Diagonal 6 10-01 Zona 10' },
                  direccionLinea2: { type: 'string', example: 'Torre II Oficina 402' },
                  ciudad: { type: 'string', example: 'Ciudad de Guatemala' },
                  departamento: { type: 'string', example: 'Guatemala' },
                  codigoPostal: { type: 'string', example: '01010' },
                  esPrincipal: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Dirección creada' },
        },
      },
    },
    '/api/auth/usuarios': {
      get: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Listar usuarios del sistema (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'soloActivos', in: 'query', schema: { type: 'boolean' } },
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Listado de usuarios' },
        },
      },
    },
    '/api/auth/usuarios/{id}/estado': {
      patch: {
        tags: ['RF-01 Auth y Usuarios'],
        summary: 'Activar o desactivar cuenta de usuario (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['activo'],
                properties: { activo: { type: 'boolean', example: false } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Estado de usuario actualizado' },
        },
      },
    },
    '/api/catalogo/categorias': {
      get: {
        tags: ['RF-02 Catálogo'],
        summary: 'Listar categorías del catálogo',
        parameters: [{ name: 'todas', in: 'query', schema: { type: 'boolean' } }],
        responses: {
          200: { description: 'Listado de categorías' },
        },
      },
      post: {
        tags: ['RF-02 Catálogo'],
        summary: 'Crear categoría (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre'],
                properties: {
                  nombre: { type: 'string', example: 'Relojería' },
                  descripcion: { type: 'string', example: 'Relojes formales y casuales' },
                  idCategoriaPadre: { type: 'integer', nullable: true, example: null },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Categoría creada' },
        },
      },
    },
    '/api/catalogo/productos': {
      get: {
        tags: ['RF-02 Catálogo'],
        summary: 'Listar productos con filtros combinables y paginación en servidor',
        parameters: [
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'idCategoria', in: 'query', schema: { type: 'integer' } },
          { name: 'precioMin', in: 'query', schema: { type: 'number' } },
          { name: 'precioMax', in: 'query', schema: { type: 'number' } },
          { name: 'soloConStock', in: 'query', schema: { type: 'boolean' } },
          { name: 'orden', in: 'query', schema: { type: 'string', enum: ['RECIENTE', 'PRECIO_ASC', 'PRECIO_DESC', 'NOMBRE_ASC'] } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: { description: 'Listado paginado de productos' },
        },
      },
      post: {
        tags: ['RF-02 Catálogo'],
        summary: 'Crear producto maestro (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idCategoria', 'nombre', 'descripcion'],
                properties: {
                  idCategoria: { type: 'integer', example: 1 },
                  nombre: { type: 'string', example: 'Blazer Ejecutivo Don Arturo' },
                  descripcion: { type: 'string', example: 'Blazer corte sastre en lana fría.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Producto creado' },
        },
      },
    },
    '/api/catalogo/productos/{id}': {
      put: {
        tags: ['RF-02 Catálogo'],
        summary: 'Actualizar nombre, categoría y descripción de producto (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, description: 'ID interno del producto', schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idCategoria', 'nombre', 'descripcion'],
                properties: {
                  idCategoria: { type: 'integer', example: 1 },
                  nombre: { type: 'string', example: 'Blazer Ejecutivo Don Arturo' },
                  descripcion: { type: 'string', example: 'Blazer de corte clásico.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Producto actualizado' },
          404: { description: 'Producto o categoría no encontrado' },
        },
      },
      get: {
        tags: ['RF-02 Catálogo'],
        summary: 'Obtener detalle de producto, variantes con stock e imágenes por CodigoPublico (UUID)',
        parameters: [{ name: 'id', in: 'path', required: true, description: 'CodigoPublico (UUID)', schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Detalle del producto con sus variantes e imágenes' },
          404: { description: 'Producto no encontrado' },
        },
      },
    },
    '/api/catalogo/productos/{id}/imagenes': {
      post: {
        tags: ['RF-02 Catálogo'],
        summary: 'Agregar URL de imagen a un producto (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imagenUrl'],
                properties: {
                  imagenUrl: { type: 'string', format: 'uri', maxLength: 500 },
                  esPrincipal: { type: 'boolean' },
                  orden: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'URL de imagen agregada' },
          404: { description: 'Producto no encontrado' },
        },
      },
    },
    '/api/catalogo/productos/{id}/imagenes/{imagenId}': {
      put: {
        tags: ['RF-02 Catálogo'],
        summary: 'Actualizar URL, orden o imagen principal (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'imagenId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imagenUrl'],
                properties: {
                  imagenUrl: { type: 'string', format: 'uri', maxLength: 500 },
                  esPrincipal: { type: 'boolean' },
                  orden: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Imagen actualizada' },
          404: { description: 'Imagen no encontrada para el producto' },
        },
      },
      delete: {
        tags: ['RF-02 Catálogo'],
        summary: 'Eliminar imagen de producto (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'imagenId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Imagen eliminada' },
          404: { description: 'Imagen no encontrada para el producto' },
        },
      },
    },
    '/api/catalogo/variantes': {
      post: {
        tags: ['RF-02 Catálogo'],
        summary: 'Crear variante de producto con asiento inicial en Kardex (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idProducto', 'nombre', 'precio'],
                properties: {
                  idProducto: { type: 'integer', example: 1 },
                  sku: { type: 'string', minLength: 3, maxLength: 50, example: 'P42-GRIS-L-01', description: 'Opcional. Si se omite o se envia vacio, el backend lo genera.' },
                  nombre: { type: 'string', example: 'Gris / Talla L' },
                  talla: { type: 'string', example: 'L' },
                  color: { type: 'string', example: 'Gris' },
                  precio: { type: 'number', example: 259.0 },
                  existenciaFisicaInicial: { type: 'integer', example: 20 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Variante creada y registrada en Kardex' },
        },
      },
    },
    '/api/inventario/existencias': {
      get: {
        tags: ['RF-03 Inventario y Kardex'],
        summary: 'Listar existencias físicas, reservadas y disponibles (Operador / Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'idCategoria', in: 'query', schema: { type: 'integer' } },
          { name: 'soloBajoStock', in: 'query', schema: { type: 'boolean' } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Listado de existencias en tiempo real' },
        },
      },
    },
    '/api/inventario/kardex': {
      get: {
        tags: ['RF-03 Inventario y Kardex'],
        summary: 'Consultar historial inmutable de movimientos de Kardex (Operador / Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'idVariante', in: 'query', schema: { type: 'integer' } },
          { name: 'tipoMovimiento', in: 'query', schema: { type: 'string' } },
          { name: 'fechaInicio', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'fechaFin', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Movimientos del Kardex' },
        },
      },
    },
    '/api/inventario/ajuste': {
      post: {
        tags: ['RF-03 Inventario y Kardex'],
        summary: 'Registrar ajuste manual de inventario con motivo obligatorio (Operador / Administrador)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idVariante', 'tipoAjuste', 'cantidad', 'motivo'],
                properties: {
                  idVariante: { type: 'integer', example: 1 },
                  tipoAjuste: { type: 'string', enum: ['POSITIVO', 'NEGATIVO'], example: 'POSITIVO' },
                  cantidad: { type: 'integer', example: 5 },
                  motivo: { type: 'string', example: 'Reposición por conteo cíclico de bodega central' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Ajuste aplicado y registrado en Kardex y Bitácora' },
          400: { description: 'El ajuste negativo dejaría la existencia en negativo o falta motivo' },
        },
      },
    },
    '/api/carrito': {
      get: {
        tags: ['RF-04 Carrito de Compras'],
        summary: 'Obtener carrito actual (autenticado con Bearer o invitado con x-guest-token)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'x-guest-token', in: 'header', required: false, schema: { type: 'string', example: 'guest-session-12345' } },
        ],
        responses: {
          200: { description: 'Estado actual del carrito con totales y líneas' },
        },
      },
      delete: {
        tags: ['RF-04 Carrito de Compras'],
        summary: 'Vaciar carrito de compras',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'x-guest-token', in: 'header', required: false, schema: { type: 'string', example: 'guest-session-12345' } },
        ],
        responses: {
          200: { description: 'Carrito vaciado' },
        },
      },
    },
    '/api/carrito/items': {
      post: {
        tags: ['RF-04 Carrito de Compras'],
        summary: 'Agregar o actualizar cantidad de una variante en el carrito (valida stock disponible)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'x-guest-token', in: 'header', required: false, schema: { type: 'string', example: 'guest-session-12345' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idVariante', 'cantidad'],
                properties: {
                  idVariante: { type: 'integer', example: 1 },
                  cantidad: { type: 'integer', example: 2 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Carrito actualizado' },
          400: { description: 'Cantidad supera la existencia disponible' },
        },
      },
    },
    '/api/carrito/migrar': {
      post: {
        tags: ['RF-04 Carrito de Compras'],
        summary: 'Fusionar carrito de invitado al carrito del cliente al iniciar sesión',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tokenInvitado'],
                properties: {
                  tokenInvitado: { type: 'string', example: 'guest-session-12345' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Carritos fusionados sin pérdida de artículos' },
        },
      },
    },
    '/api/cupones': {
      get: {
        tags: ['RF-05 Cupones'],
        summary: 'Listar cupones (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Listado de cupones' },
        },
      },
      post: {
        tags: ['RF-05 Cupones'],
        summary: 'Crear nuevo cupón de descuento (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['codigo', 'tipoDescuento', 'valorDescuento', 'limiteUsosTotal', 'fechaInicio', 'fechaFin'],
                properties: {
                  codigo: { type: 'string', example: 'PROMO25' },
                  tipoDescuento: { type: 'string', enum: ['PORCENTAJE', 'MONTO_FIJO'], example: 'PORCENTAJE' },
                  valorDescuento: { type: 'number', example: 25 },
                  montoMinimoCompra: { type: 'number', example: 250 },
                  limiteUsosTotal: { type: 'integer', example: 100 },
                  limiteUsosPorCliente: { type: 'integer', example: 1 },
                  idCategoria: { type: 'integer', nullable: true, example: null },
                  fechaInicio: { type: 'string', example: '2026-10-01T00:00:00Z' },
                  fechaFin: { type: 'string', example: '2026-12-31T23:59:59Z' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cupón creado' },
        },
      },
    },
    '/api/cupones/validar': {
      post: {
        tags: ['RF-05 Cupones'],
        summary: 'Validar y calcular descuento de un cupón sobre el carrito actual del cliente',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['codigo'],
                properties: {
                  codigo: { type: 'string', example: 'BIENVENIDA10' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Descuento calculado exitosamente' },
          400: { description: 'Motivo específico de rechazo (vencido, agotado, monto mínimo, categoría)' },
        },
      },
    },
    '/api/pedidos/checkout/reserva': {
      post: {
        tags: ['RF-06 / RF-07 Checkout y Pedidos'],
        summary: 'Iniciar reserva temporal de existencias por 15 minutos con clave de idempotencia',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['claveIdempotencia'],
                properties: {
                  claveIdempotencia: { type: 'string', example: 'res-cliente-001' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Unidades reservadas por 15 minutos' },
        },
      },
    },
    '/api/pedidos/checkout/confirmar': {
      post: {
        tags: ['RF-06 / RF-07 Checkout y Pedidos'],
        summary: 'Confirmar checkout atómico con pasarela de pago simulada (APROBADO / RECHAZADO)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idDireccionEntrega', 'claveIdempotencia'],
                properties: {
                  idDireccionEntrega: { type: 'integer', example: 1 },
                  claveIdempotencia: { type: 'string', example: 'ord-cliente-001' },
                  metodoPago: { type: 'string', example: 'TARJETA_CREDITO' },
                  codigoCupon: { type: 'string', nullable: true, example: 'BIENVENIDA10' },
                  simularResultadoPago: {
                    type: 'string',
                    enum: ['APROBADO', 'RECHAZADO'],
                    example: 'APROBADO',
                    description: 'Permite elegir el resultado de la pasarela simulada durante las pruebas (RF-06)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Pedido confirmado, precios congelados y Kardex actualizado' },
          402: { description: 'Pago rechazado por la pasarela simulada (carrito e inventario intactos)' },
        },
      },
    },
    '/api/pedidos/mis-pedidos': {
      get: {
        tags: ['RF-06 / RF-07 Checkout y Pedidos'],
        summary: 'Listar historial de pedidos del cliente autenticado',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Historial de pedidos del cliente' },
        },
      },
    },
    '/api/pedidos': {
      get: {
        tags: ['RF-06 / RF-07 Checkout y Pedidos'],
        summary: 'Listar todos los pedidos con filtros y paginación (Operador / Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'estado', in: 'query', schema: { type: 'string' } },
          { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          { name: 'fechaInicio', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'fechaFin', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Listado paginado de pedidos' },
        },
      },
    },
    '/api/pedidos/{id}/estado': {
      patch: {
        tags: ['RF-06 / RF-07 Checkout y Pedidos'],
        summary: 'Avanzar estado del pedido validando ciclo de vida (Operador / Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['estadoNuevo'],
                properties: {
                  estadoNuevo: {
                    type: 'string',
                    enum: ['EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'],
                    example: 'EN_PREPARACION',
                  },
                  motivo: { type: 'string', example: 'Orden empacada en bodega central' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Estado actualizado' },
          400: { description: 'Transición de estado inválida' },
        },
      },
    },
    '/api/pedidos/{id}/cancelar': {
      post: {
        tags: ['RF-06 / RF-07 Checkout y Pedidos'],
        summary: 'Cancelar pedido antes del despacho con reintegro automático a Kardex (Operador / Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['motivo'],
                properties: {
                  motivo: { type: 'string', example: 'Cancelación solicitada por el cliente antes del envío' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Pedido cancelado y existencias reintegradas' },
        },
      },
    },
    '/api/pedidos/{id}/devoluciones': {
      post: {
        tags: ['RF-06 / RF-07 Checkout y Pedidos'],
        summary: 'Procesar devolución parcial o total sobre pedido entregado (Operador / Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idPedidoDetalle', 'cantidadADevolver', 'motivo'],
                properties: {
                  idPedidoDetalle: { type: 'integer', example: 1 },
                  cantidadADevolver: { type: 'integer', example: 1 },
                  motivo: { type: 'string', example: 'Cambio de talla solicitado por el cliente' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Devolución registrada y stock reintegrado a Kardex' },
        },
      },
    },
    '/api/reportes/ventas-periodo': {
      get: {
        tags: ['RF-08 Reportes y Dashboard'],
        summary: 'Ventas netas y ticket promedio por día, semana o mes (excluye cancelados y descuenta devoluciones)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'fechaInicio', in: 'query', schema: { type: 'string', example: '2026-10-01' } },
          { name: 'fechaFin', in: 'query', schema: { type: 'string', example: '2026-10-30' } },
          { name: 'agrupacion', in: 'query', schema: { type: 'string', enum: ['DIA', 'SEMANA', 'MES'], default: 'DIA' } },
        ],
        responses: {
          200: { description: 'Serie temporal de ventas y ticket promedio' },
        },
      },
    },
    '/api/reportes/top-productos': {
      get: {
        tags: ['RF-08 Reportes y Dashboard'],
        summary: 'Top 10 productos más vendidos del período',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Ranking Top 10 productos' },
        },
      },
    },
    '/api/reportes/ventas-categoria': {
      get: {
        tags: ['RF-08 Reportes y Dashboard'],
        summary: 'Distribución de ventas netas por categoría',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Ventas por categoría con porcentaje de participación' },
        },
      },
    },
    '/api/reportes/carritos-abandonados': {
      get: {
        tags: ['RF-08 Reportes y Dashboard'],
        summary: 'Reporte de carritos abandonados (>24h de inactividad por defecto)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'minutosInactividad', in: 'query', schema: { type: 'integer', default: 1440 } },
        ],
        responses: {
          200: { description: 'Listado de carritos abandonados y valor estimado' },
        },
      },
    },
    '/api/bitacora': {
      get: {
        tags: ['RF-09 Bitácora'],
        summary: 'Consultar bitácora inmutable filtrable por módulo/entidad (Solo Administrador)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'entidad', in: 'query', schema: { type: 'string', enum: ['Productos', 'Variantes', 'Cupones', 'Pedidos', 'Inventario', 'Usuarios'] } },
          { name: 'accion', in: 'query', schema: { type: 'string', enum: ['CREAR', 'MODIFICAR', 'DESACTIVAR', 'CAMBIO_ESTADO'] } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Registros de auditoría' },
        },
      },
    },
  },
};
