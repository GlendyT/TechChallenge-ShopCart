# ShopCart Frontend

Frontend de la tienda Don Arturo. Está construido con React, TypeScript, Vite y Tailwind CSS. La aplicación consume la API de ShopCart y ofrece las áreas de tienda, cuenta de cliente, operaciones y administración.

## Requisitos

- Node.js 22 o compatible con la versión fijada por el proyecto.
- pnpm 10.
- Backend disponible en `http://localhost:3000`.

Configura `VITE_API_BASE_URL` en `frontend/.env.local` si la API usa otra dirección:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Desarrollo

Desde esta carpeta:

```powershell
pnpm install
pnpm dev
```

## Para qué sirve cada carpeta de `src`

| Carpeta | Responsabilidad |
| --- | --- |
| `app/` | Composición de la aplicación: proveedores, rutas y guards de acceso. |
| `components/` | Componentes compartidos entre varias áreas, como layouts, encabezados, navegación y tablas. |
| `components/__test__/` | Pruebas de los componentes compartidos que están directamente en `components/`, como los layouts y `StoreBenefits`. |
| `components/feedback/` | Estados reutilizables de carga, error o ausencia de resultados. |
| `components/forms/` | Controles y contenedores compartidos para formularios, como `FormSheet`. |
| `components/tables/` | Tabla genérica, paginación y constantes comunes a las tablas. |
| `components/ui/` | Primitivas visuales basadas en shadcn/Radix que componen los controles de la aplicación. |
| `features/` | Funcionalidades organizadas por dominio (`catalog`, `cart`, `account`, `operations`, `administration`, etc.). Cada dominio puede tener sus propias páginas, componentes, hooks, API y tipos. |
| `shared/` | Código transversal compartido entre funcionalidades: `api/` contiene el cliente HTTP y sus tipos/errores, `auth/` administra la sesión y el contexto del usuario, y `hooks/` aporta hooks reutilizables como el debounce. Cada capa mantiene sus pruebas en `__test__/`. |
| `hooks/` | Hooks generales de interfaz que no pertenecen a un dominio funcional específico; sus pruebas están en `hooks/__test__/`. |
| `lib/` | Utilidades generales, formato de datos y configuración compartida de React Query; sus pruebas están en `lib/__test__/`. |
| `assets/` | Recursos estáticos importados por la aplicación. |
| `test/` | Configuración, servidor MSW y utilidades compartidas para pruebas unitarias. |

### Estructura de una funcionalidad

Las carpetas bajo `features/` separan cada dominio. Por ejemplo, `features/account/` usa esta organización:

| Subcarpeta | Responsabilidad |
| --- | --- |
| `api/` | Funciones que llaman los endpoints del dominio y transforman sus respuestas. |
| `hooks/` | Consultas y mutaciones de React Query; coordinan carga, caché, invalidación y notificaciones de éxito. |
| `components/` | Componentes propios del dominio que encapsulan interacciones, como la gestión de direcciones. |
| `pages/` | Pantallas que organizan los componentes y estados de la funcionalidad. |
| `types/` | Tipos de datos y contratos usados por las capas del dominio. |

Las pruebas siguen la misma separación: `api/__test__/` valida las solicitudes HTTP, `hooks/__test__/` comprueba consultas y mutaciones, y `components/__test__/` o `pages/__test__/` cubren sus interacciones y estados visibles.

En `features/administration/`, `pages/` reúne las pantallas de catálogo y usuarios, además de las secciones de categorías, productos, cupones y auditoría; `components/` contiene piezas administrativas como `ProductEditSheet`; `hooks/useAdminData.ts` concentra las consultas, invalidaciones de caché y mensajes de éxito; y `api/adminApi.ts` define las llamadas al backend. `pages/__test__/` mantiene pruebas por pantalla y por sección; API, hooks y componentes tienen su propia carpeta `__test__/` junto a la capa que verifican.

En `features/auth/`, `pages/AuthPage.tsx` maneja los formularios de acceso y registro, interpreta el portal seleccionado y dirige al usuario según su rol; `api/authApi.ts` implementa login, registro, lectura de la sesión en cookie, logout y migración del carrito invitado. La validación de portales y el estado global de sesión pertenecen a `shared/auth/`. Las pruebas de formularios y endpoints se encuentran respectivamente en `pages/__test__/` y `api/__test__/`.

En `features/cart/`, `api/cartApi.ts` concentra las solicitudes de lectura y modificación del carrito, enviando el token invitado cuando corresponde; `hooks/` mantiene el carrito en React Query y actualiza su caché después de cambiar cantidades, quitar productos o vaciarlo; `pages/CartPage.tsx` muestra los estados del carrito y dirige al checkout según la sesión. Las pruebas de endpoints, caché y flujos de pantalla están en `api/__test__/`, `hooks/__test__/` y `pages/__test__/`.

En `features/catalog/`, `api/catalogApi.ts` arma filtros y consulta categorías, listados y detalle de producto; `hooks/` gestiona filtros sincronizados con la URL, consultas cacheadas, sugerencias con debounce y la acción de agregar al carrito; `components/` contiene tarjetas, carruseles y secciones de productos por categoría; `pages/` compone el catálogo y el detalle, y `routes/ProductRoute.tsx` extrae el código público de la URL. Cada capa tiene sus pruebas en su correspondiente carpeta `__test__/`.

En `features/checkout/`, `api/` valida cupones, reserva y confirma pedidos y consulta pedidos confirmados; `hooks/` coordina estas operaciones con React Query, invalida el carrito y redirige tras la compra; `pages/` contiene el formulario de checkout y el resumen de confirmación; `routes/` valida y extrae el código público del pedido. Las pruebas de API, hooks, páginas y rutas se guardan en sus respectivas carpetas `__test__/`.

En `features/operations/`, `inventory/` concentra existencias, categorías, movimientos de Kardex y ajustes; `orders/` gestiona el listado, el flujo de estados, cancelaciones y devoluciones; y `reports/` reúne consultas y visualizaciones de ventas, productos, categorías y carritos abandonados. Cada dominio separa `api/`, `hooks/`, `components/`, `pages/` y `types/`; sus pruebas unitarias y funcionales están en carpetas `__test__/` junto a cada capa. Las pruebas de páginas recorren interacciones con MSW y las pruebas de API verifican parámetros, cuerpos y filtros enviados al backend.

Las carpetas `__test__/` contienen las pruebas de los módulos de esa área. Por ejemplo, las pruebas de `DataTable` están en `components/tables/__test__/` y las de `FormSheet` en `components/forms/__test__/`. Así se mantienen juntas la responsabilidad de la carpeta y su cobertura sin mezclar los tests con el código de producción.

## Estructura de `src/app`

- `App.tsx` compone proveedores globales, rutas y notificaciones.
- `app/providers/AppProviders.tsx` registra React Query y el proveedor de autenticación.
- `app/router/AppRouter.tsx` define las rutas públicas y las áreas protegidas.
- `app/router/routePaths.ts` centraliza los paths usados por enlaces, navegación y pruebas.
- `app/router/authNavigation.ts` calcula el destino después del login según rol y URL solicitada.
- `app/router/guards/RequireAuthentication.tsx` espera la restauración de sesión y protege cuenta y checkout.
- `app/router/guards/RequireRole.tsx` protege operaciones y administración según el rol.

### Rutas principales

| Área | Ruta | Acceso |
| --- | --- | --- |
| Tienda | `/` | Público |
| Categoría | `/categoria/:categoryId` | Público |
| Producto | `/producto/:codigoPublico` | Público |
| Carrito | `/carrito` | Público |
| Acceso y registro | `/acceso`, `/registro` | Público |
| Checkout y cuenta | `/checkout`, `/cuenta` | Usuario autenticado |
| Operaciones | `/operaciones/*` | Operador o administrador |
| Administración | `/administracion/*` | Administrador |

Los guards conservan la ruta solicitada al redirigir al acceso. Cuando termina el login, `authNavigation` valida que el rol pueda volver a ella; si no, lleva al área predeterminada del rol.

## Autenticación del navegador

Los JWT no se guardan en `localStorage` ni `sessionStorage`. El backend emite cookies `HttpOnly`; las solicitudes de API usan `credentials: "include"`. Al cargar la aplicación, `AuthProvider` consulta `/auth/me` para restaurar el usuario. `RequireAuthentication` y `RequireRole` muestran estado de carga durante esa comprobación.

El token de carrito invitado (`shopcart.guest-token`) sí se conserva en `localStorage` para recuperar el carrito entre visitas. El backend lo limita a las operaciones del carrito invitado.

## Pruebas y calidad

```powershell
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run test:e2e
pnpm run check
```

`pnpm run check` ejecuta lint, typecheck, pruebas unitarias, build y pruebas e2e en secuencia. Las pruebas unitarias se separan en carpetas `__test__/` dentro del área que verifican; las pruebas e2e están en `e2e/` y usan Playwright.
