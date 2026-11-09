# Decisiones de arquitectura del frontend

Este documento reúne las decisiones de alto nivel tomadas al construir el frontend de ShopCart. Explica qué problema resuelve cada decisión, cómo se refleja en el código y qué consecuencias prácticas tiene. La estructura actual del proyecto puede cambiar; si cambia una decisión, se debe actualizar este documento y el README.

## 1. Aplicación de una sola página con React, TypeScript y Vite

### Decisión

El cliente se implementa como una SPA con React y TypeScript, compilada y servida en desarrollo con Vite.

### Motivo

La aplicación requiere pantallas interactivas para catálogo, carrito, checkout y herramientas internas. React permite componer esas pantallas con componentes y estado local; TypeScript ayuda a detectar incompatibilidades entre formularios, respuestas de API y componentes antes de ejecutar la aplicación. Vite proporciona el servidor de desarrollo y el proceso de build utilizado por el proyecto.

### Consecuencias

- Las pantallas se componen desde `src/features/` y se conectan a través de React Router.
- Las rutas protegidas se deciden en el cliente para orientar la navegación, mientras que la autorización real permanece en los middlewares del backend.
- El build del frontend produce recursos estáticos; el servidor de producción debe servir la aplicación con fallback de rutas para las URL de React Router.
- TypeScript se ejecuta con `pnpm run typecheck` y también como parte del build.

## 2. Organización por capacidad de negocio y capas dentro de cada feature

### Decisión

El código se organiza principalmente por feature: `account`, `administration`, `auth`, `cart`, `catalog`, `checkout` y `operations`. Dentro de cada feature, cuando aplica, se separan `api/`, `hooks/`, `components/`, `pages/`, `routes/` y `types/`. Los elementos compartidos viven en `components/`, `shared/` y `lib/`.

### Motivo

Una modificación de negocio suele tocar la página, sus datos, validación y pruebas a la vez. Mantener estas piezas dentro de una feature facilita encontrarlas y cambiar el flujo sin dispersar todo el código por grandes carpetas globales como `pages`, `services` o `models`. Las carpetas compartidas se reservan para responsabilidades que realmente utilizan varias features.

### Límites y responsabilidades

- `api/`: funciones de acceso HTTP específicas del dominio. No renderiza UI.
- `hooks/`: estado reutilizable y coordinación de consultas/mutaciones, por ejemplo TanStack Query.
- `pages/`: composición de la pantalla y coordinación de eventos propios de una ruta.
- `components/`: partes visuales con responsabilidades concretas dentro de la feature.
- `types/`: contratos TypeScript del dominio de frontend.
- `shared/`: servicios y reglas transversales, como API, autenticación y hooks genéricos.
- `components/`: elementos visuales reutilizables por más de una feature.
- `lib/`: utilidades sin estado de interfaz, como formato de precios y configuración de QueryClient.

No todas las features necesitan crear todas las carpetas. Se evita agregar capas vacías o mover una función a un servicio genérico cuando solo se utiliza en un lugar y su responsabilidad es clara.

### Consecuencias

- Los componentes visuales no deben concentrar llamadas HTTP ni reglas de autorización.
- Las páginas no deben reimplementar acceso a API: consumen hooks y componentes del dominio.
- Las abstracciones compartidas deben tener más de un consumidor real o una responsabilidad transversal clara.
- La estructura sigue una arquitectura funcional por composición; no se fuerza POO basada en clases. React está diseñado alrededor de componentes funcionales, hooks y composición. Los principios de separación de responsabilidades y encapsulación se aplican a módulos y componentes.

## 3. Sesión mediante cookies `HttpOnly`

### Decisión

El backend establece cookies de autenticación `shopcart_access` y `shopcart_refresh`, marcadas `HttpOnly`. El frontend usa `fetch` con `credentials: "include"`; no recibe ni persiste tokens JWT como datos accesibles desde JavaScript.

El access cookie está limitado a `/api` y expira de acuerdo con `JWT_ACCESS_EXPIRES_IN`. El refresh cookie está limitado a `/api/auth` y usa `JWT_REFRESH_EXPIRES_IN`. En producción las cookies se marcan `Secure`; su política `SameSite` se configura con `AUTH_COOKIE_SAME_SITE` (por defecto `lax`).

### Motivo

La implementación previa guardaba los tokens junto con los datos de usuario en almacenamiento accesible al código del navegador. Eso permitía que cualquier script ejecutado en el origen pudiera leer y exfiltrar las credenciales. Con `HttpOnly`, JavaScript no puede leer el valor del token; el navegador lo adjunta a las solicitudes permitidas.

La identidad necesaria para pintar la interfaz se obtiene desde `GET /api/auth/me`. La sesión vive en memoria durante la ejecución de la aplicación y se restaura consultando el backend al iniciar o recargar la SPA.

### Medidas complementarias

- `httpClient.ts` define `credentials: "include"` tanto para solicitudes de negocio como para la renovación.
- El backend permite credenciales CORS solo para el origen definido en `CORS_ORIGIN`.
- El middleware `validateCookieRequestOrigin` comprueba el `Origin` de solicitudes inseguras (`POST`, `PUT`, `PATCH`, `DELETE`) cuando ya existe una cookie de sesión.
- `AUTH_COOKIE_SAME_SITE` agrega una defensa adicional frente a solicitudes cross-site, pero no reemplaza la validación de origen ni la configuración correcta de CORS.
- El flujo de renovación evita que cada pantalla gestione tokens y permite centralizar la repetición de una solicitud protegida después de un refresh exitoso.
- El cliente elimina la antigua clave `shopcart.session` para no conservar sesiones heredadas en `sessionStorage`.

### Decisión separada: identidad de carrito invitado

El token aleatorio `shopcart.guest-token` se mantiene en `localStorage` para identificar el carrito anónimo entre visitas. No es un access token ni un refresh token y no sustituye la autenticación. Al iniciar sesión, el frontend intenta migrar el carrito y elimina el token de invitado cuando esa migración finaliza correctamente.

### Consecuencias y límites

- Una cookie `HttpOnly` reduce la exposición de credenciales ante lectura por JavaScript, pero no hace inocua una vulnerabilidad XSS: un script malicioso aún podría emitir solicitudes desde la sesión abierta.
- Como las cookies se adjuntan automáticamente, la protección contra CSRF depende también de `SameSite`, la revisión de `Origin` y CORS.
- En desarrollo, frontend y backend deben estar configurados para que el navegador pueda enviar credenciales desde el origen esperado. Si se cambia el origen de Vite, se debe alinear `CORS_ORIGIN`.
- No se debe imprimir el contenido de las cookies o tokens en logs ni agregarlos a respuestas que el cliente no necesita.

## 4. Enrutamiento y autorización visible en la interfaz

### Decisión

React Router centraliza las rutas en `src/app/router/AppRouter.tsx`. `RequireAuthentication` protege cuenta y checkout; `RequireRole` protege rutas de operaciones y administración. Los destinos posteriores al login se derivan del rol validado y del portal solicitado.

### Motivo

Separar navegación de las páginas evita replicar reglas de acceso en cada pantalla y permite enviar al usuario al espacio correspondiente después de autenticarse. Los portales de cliente, operador y administrador expresan la intención de acceso; el backend sigue siendo la autoridad que comprueba las credenciales y los permisos.

### Consecuencias

- Ocultar un enlace o bloquear una ruta en React solo mejora la experiencia y no constituye una barrera de seguridad suficiente.
- Todos los endpoints protegidos deben conservar validación de sesión y rol en backend.
- La autenticación se reconsulta después de recargar la página para no depender de estado persistido en el navegador.

## 5. TanStack Query para estado remoto

### Decisión

El estado procedente de la API se administra principalmente con TanStack Query. El estado efímero de interacción (por ejemplo, un sheet abierto, filtros todavía no aplicados o la cantidad de un formulario) permanece local al componente o hook que lo necesita.

### Motivo

El catálogo, inventario, pedidos y perfil necesitan mostrar estados de carga/error, evitar solicitudes repetidas y actualizar vistas después de mutaciones. TanStack Query agrupa estas responsabilidades y mantiene las reglas de caché fuera de los componentes visuales.

### Consecuencias

- Las claves de consulta deben identificar los parámetros que cambian el resultado.
- Las mutaciones invalidan las consultas afectadas en vez de mantener copias de estado remoto manuales en cada pantalla.
- El `QueryClient` se configura en `src/lib/queryClient.ts` y se provee desde `AppProviders`.
- No se usa Query como reemplazo de todo estado React; formularios y controles locales no requieren una consulta remota.

## 6. Búsqueda con debounce

### Decisión

Los campos de búsqueda que disparan consultas usan `useDebouncedValue` antes de enviar el valor al servidor. El valor por defecto del hook es **300 ms**. El header de tienda muestra sugerencias; confirmar la búsqueda navega/aplica filtros del catálogo. En esta implementación no se usa throttling.

### Flujo del buscador de la tienda

El buscador vive en `StoreLayout`, porque el header aparece en las rutas de tienda y debe permanecer disponible al cambiar entre catálogo, detalle y carrito.

1. El texto que se está escribiendo se guarda en estado local (`searchValue`). Cambiar ese estado solo actualiza la interfaz; no navega ni aplica inmediatamente el filtro al listado.
2. `useCatalogSuggestions(searchValue)` normaliza el texto con `trim()` y pasa el valor por `useDebouncedValue`. Mientras el texto todavía cambia, el header muestra «Buscando productos…».
3. La consulta queda habilitada cuando el texto estabilizado tiene al menos **2 caracteres**. Se llama a `fetchProducts` mediante TanStack Query y el endpoint de catálogo, usando `busqueda`, página 1 y orden `RECIENTE`, sin fijar una categoría para encontrar resultados a través de las categorías.
4. El componente de sugerencias muestra el total informado por API, como máximo **5 productos** y para cada uno su nombre, categoría, imagen disponible y precio. Al elegir una sugerencia se navega directamente al detalle de ese producto.
5. Enviar el formulario con el botón Buscar o con Enter aplica el término al catálogo y navega a `/?busqueda=...` o conserva la ruta `/categoria/:id?busqueda=...` si el usuario ya estaba dentro de una categoría. La navegación posiciona la pantalla en `#colecciones`.
6. El botón para limpiar vacía el estado de búsqueda y navega al catálogo sin el parámetro `busqueda`; al encontrarse en una categoría, el estado de categoría se conserva conforme al contexto de navegación.
7. Al perder el foco del formulario hacia un control ajeno al buscador, o al presionar Escape, se cierra el panel de sugerencias. El panel es un dropdown accesible y no reemplaza ni altera la sección de productos que ya se muestra en la página.

Las sugerencias y el listado completo son consultas distintas: las primeras pertenecen al header y son una vista previa acotada; el segundo pertenece a `CatalogPage` y sus secciones por categoría. Así, escribir en el header no hace que el contenido actual se filtre de forma silenciosa. El filtro completo se aplica al confirmar la búsqueda, y su término se refleja en la URL para permitir recarga, compartir el enlace y navegación atrás/adelante.

### Debounce frente a throttling

- **Debounce** espera a que pase un intervalo sin cambios y luego emite el valor más reciente. Es adecuado para una búsqueda textual porque evita consultar por cada tecla y se activa cuando la persona hace una pausa.
- **Throttling** limita la frecuencia a una ejecución por intervalo mientras siguen ocurriendo cambios. Es más útil para eventos continuos como scroll o resize; puede enviar términos intermedios que la persona aún está escribiendo.
- Para los campos de texto del catálogo, administración, pedidos e inventario se eligió debounce. No se agrega una segunda capa de throttle porque se superpondría con el control de frecuencia existente.

### Motivo

Enviar una solicitud por cada tecla produce trabajo redundante, cambios visuales rápidos y presión innecesaria en API y base de datos. El debounce espera a que la persona pause antes de consultar. Las búsquedas de pedidos, inventario y administración siguen el mismo criterio cuando cambian datos remotos.

### Consecuencias

- La UI puede mostrar un estado breve de búsqueda mientras se estabiliza el texto.
- El valor escrito y el valor aplicado pueden diferir temporalmente; deben quedar claros para la persona usuaria.
- El debounce reduce llamadas consecutivas, pero no sustituye paginación, filtros en servidor ni índices de base de datos.
- El hook compartido tiene un retraso configurable por argumento, pero cualquier cambio al valor predeterminado debe revisarse contra la experiencia del buscador y las pruebas con temporizadores.

## 7. Sistema visual, tokens y componentes

### Decisión

Tailwind CSS se utiliza para los estilos de componentes. `src/index.css` concentra imports, base global y tokens del tema; no se crean hojas CSS específicas por pantalla. Los colores de marca se exponen como tokens `dn` (azul, rojo y grises, junto con blanco) y se consumen desde las clases Tailwind configuradas, no mediante valores arbitrarios repetidos en cada vista.

Los componentes accesibles de interfaz se generan/adaptan desde shadcn con Radix UI. Los iconos se toman de `lucide-react`; no se insertan SVGs dibujados manualmente en cada pantalla.

### Motivo

Un conjunto pequeño de tokens mantiene consistencia entre tienda, operaciones y administración. Tailwind hace visibles los estilos cerca del markup sin multiplicar hojas CSS. shadcn/Radix ofrece componentes componibles y controles de accesibilidad, mientras que los componentes adaptados permanecen en el repositorio y se pueden ajustar a la marca.

### Componentes compartidos adoptados

- `PageHeader`: encabezados de sección con eyebrow, título, descripción y contenido adicional como tabs.
- `DataTable` y `TablePagination`: estructura y paginación común de tablas.
- `FormSheet`: contenedor reusable para formularios de alta/edición en un panel lateral.
- `PageState`: estados de carga, error o ausencia de datos.
- `StoreLayout` y `OperationsLayout`: estructura persistente para las áreas pública e interna.

### Consecuencias

- Se evita introducir estilos globales nuevos fuera de `index.css`; Tailwind se usa para estilos locales.
- Los valores de color y tipografía deben derivarse de los tokens del tema.
- El código generado de shadcn también se revisa, prueba y mantiene como código del proyecto.
- Los componentes compartidos reciben props explícitas y no conocen reglas de negocio particulares de una feature.

## 8. URLs de imagen y generación de SKU

### Decisión

En esta versión, la administración de producto persiste URLs de imagen, no cargas de archivos. La edición permite agregar, actualizar, marcar como principal y eliminar esas URLs. Cada variante puede omitir el SKU en el formulario; el backend es responsable de generarlo cuando no se proporciona.

### Motivo

El alcance acordado para imágenes evita introducir almacenamiento de archivos, multipart, proveedor de objetos y operación de infraestructura. La generación de SKU pertenece al backend porque el servidor es el punto de autoridad que crea variantes y puede garantizar el formato y unicidad frente a otros clientes.

### Consecuencias

- La URL debe ser públicamente accesible para que el navegador pueda cargar la imagen.
- La administración de archivos y la validación de contenido no forman parte del flujo actual.
- El frontend trata el SKU como dato recibido y puede mostrarlo; no calcula uno que pueda diferir del valor definitivo del backend.

## 9. Pruebas y automatización de calidad

### Decisión

Las pruebas unitarias/funcionales viven bajo `__test__/` dentro de las áreas que cubren. Vitest y Testing Library verifican componentes, hooks, API client y flujos de interfaz; MSW simula respuestas HTTP. Playwright mantiene recorridos E2E en `frontend/e2e/`. El comando `pnpm run check` reúne lint, typecheck, unitarias, build y E2E.

### Motivo

Separar `__test__/` hace explícito qué código es producto y qué es prueba sin dispersar las pruebas fuera de su módulo. MSW mantiene los tests rápidos y deterministas sin depender de SQL Server. E2E comprueba los recorridos desde navegador y puede interceptar las APIs para aislar los flujos del estado de la base.

### Consecuencias

- Cada cambio de comportamiento de una feature debe actualizar sus pruebas asociadas.
- Las pruebas unitarias no sustituyen las E2E; las E2E tampoco cubren todas las combinaciones de reglas.
- Un `check` completo incluye build y E2E y tarda más que correr solo lint o typecheck.
- El backend actualmente ofrece lint, typecheck y build por `pnpm run check`; no se declara una suite de pruebas automatizadas de backend en sus scripts.

## 10. Decisiones pendientes o revisables

- La aplicación usa `localStorage` para el token identificador de carrito invitado. Si el modelo de amenaza o el contrato del backend cambia, revisar su ciclo de vida y migración.
- Las URLs de imágenes son suficientes para esta versión; incorporar subida de archivos implicaría decidir almacenamiento, tamaño/tipo permitido, autorización y limpieza de recursos.
- Los E2E cubren recorridos centrales, no todas las combinaciones de cada formulario, rol y estado de negocio. Cada nuevo flujo crítico debe agregarse de forma progresiva.
- Los tokens de color se mantienen en el tema global; si se agregan nuevas marcas o temas, revisar naming y contraste.
