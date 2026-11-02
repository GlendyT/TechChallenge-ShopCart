# Guía de Pruebas con Swagger UI y Comandos Docker

**Proyecto:** ShopCart (Don Arturo / Grupo Pentandra)  
**Propósito:** Manual paso a paso para el levantamiento de infraestructura con Docker y la ejecución de pruebas funcionales end-to-end (E2E) mediante Swagger UI.

---

## 1. Comandos de Docker y Puesta en Marcha

### A. Requisitos Previos
* Docker y Docker Compose instalados.
* Archivo `.env` en la raíz configurado (copiado desde `.env.docker.example` o `.env.example`).
* Archivo `backend/.env` configurado con los secretos JWT (mínimo 16 caracteres).

### B. Comandos Principales de Docker Compose

```powershell
# 1. Levantar servicios (SQL Server y Backend API) en segundo plano
docker compose up -d

# 2. Verificar el estado de los contenedores (deben figurar como healthy / Up)
docker compose ps

# 3. Ver los logs en tiempo real del backend o la base de datos
docker compose logs -f backend
docker compose logs -f sqlserver

# 4. Detener los servicios conservando los datos persistidos en el volumen
docker compose down

# 5. Detener y borrar volúmenes de datos (reinicio limpio desde cero)
docker compose down -v
```

### C. Comandos de Diagnóstico y Carga SQL con `sqlcmd` en Contenedor

Si se requiere interactuar directamente con la base de datos dentro del contenedor `shopcart-sqlserver`:

```powershell
# Entrar a la consola interactiva de sqlcmd
docker exec -it shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -d ShopCartDB

# Consultar el conteo de tablas, vistas, procedimientos y usuarios
docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -d ShopCartDB -Q "SELECT (SELECT COUNT(*) FROM sys.tables) AS Tablas, (SELECT COUNT(*) FROM sys.views) AS Vistas, (SELECT COUNT(*) FROM sys.procedures) AS Procedimientos, (SELECT COUNT(*) FROM Usuarios) AS Usuarios, (SELECT COUNT(*) FROM Productos) AS Productos, (SELECT COUNT(*) FROM Variantes) AS Variantes;"
```

---

## 2. Acceso a Swagger UI

Una vez levantados los contenedores, abre en tu navegador:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Credenciales de Demostración Sembradas (*Seed*):
| Rol | Correo | Contraseña |
|---|---|---|
| **Administrador** | `admin@shopcart.gt` | `Admin123!` |
| **Operador** | `operador@shopcart.gt` | `Operador123!` |
| **Cliente** | `cliente@shopcart.gt` | `Cliente123!` |

---

## 3. Guía Paso a Paso: Flujo Completo de Compra (E2E)

### Paso 1: Autenticación con Token Bearer (Login)
1. Busca la sección **`RF-01 Auth y Usuarios`** y despliega `POST /api/auth/login`.
2. Haz clic en **Try it out** e ingresa las credenciales de Cliente:
   ```json
   {
     "correo": "cliente@shopcart.gt",
     "password": "Cliente123!"
   }
   ```
3. Presiona **Execute** y copia el valor del `accessToken` de la respuesta JSON (sin comillas).
4. Sube a la esquina superior derecha de Swagger, haz clic en el botón verde **Authorize**, pega el token en el campo *Value* y haz clic en **Authorize** y luego **Close**. Todos los candados quedarán cerrados 🔒.

---

### Paso 2: Exploración de Catálogo y Detalle de Variantes
1. Ve a **`RF-02 Catálogo`** ➔ `GET /api/catalogo/productos`.
2. Presiona **Try it out** ➔ **Execute**.
3. En la lista, copia el `CodigoPublico` de un producto (por ejemplo, el de los *Zapatos Oxford*):
   ```text
   8FCD742A-7C27-4D2D-945A-DB3DD188FDF6
   ```
4. Despliega `GET /api/catalogo/productos/{codigoPublico}`. Pega el UUID en el parámetro y presiona **Execute**.
5. En el arreglo `variantes`, anota el **`IDVariante`** que deseas comprar (por ejemplo, `IDVariante: 6`).

---

### Paso 3: Gestión del Carrito de Compras
1. Ve a **`RF-04 Carrito de Compras`** ➔ `POST /api/carrito/items`.
2. Envía la variante y la cantidad:
   ```json
   {
     "idVariante": 6,
     "cantidad": 2
   }
   ```
3. Presiona **Execute** (devolverá `200 OK`).
4. Consulta `GET /api/carrito` ➔ Verifica que el subtotal y la cantidad de artículos sumen correctamente en Quetzales.

---

### Paso 4: Validación de Cupones de Descuento
1. Ve a **`RF-05 Cupones`** ➔ `POST /api/cupones/validar`.
2. Envía el código de cupón aplicable:
   ```json
   {
     "codigo": "CALZADO15"
   }
   ```
   *(También puedes probar `DONARTURO50` o `BIENVENIDA10`).*
3. Presiona **Execute** ➔ La API responderá con el porcentaje/monto aplicado, el subtotal aplicable y el nuevo total con descuento.

---

### Paso 5: Registro de Dirección de Entrega
1. Ve a **`RF-01 Auth y Usuarios`** ➔ `GET /api/auth/direcciones`.
2. Si no tienes una dirección creada, regístrala en `POST /api/auth/direcciones`:
   ```json
   {
     "nombreDestinatario": "Glendy Cliente",
     "telefonoContacto": "55551234",
     "direccionLinea1": "Avenida Las Américas 12-34 Zona 14",
     "ciudad": "Ciudad de Guatemala",
     "departamento": "Guatemala",
     "codigoPostal": "01014",
     "esPrincipal": true
   }
   ```
3. Anota el **`IDDireccion`** generado (ej. `1`).

---

### Paso 6: Reserva Temporal de Stock por 15 Minutos (RF-06)
1. Ve a **`RF-06 / RF-07 Checkout y Pedidos`** ➔ `POST /api/pedidos/checkout/reserva`.
2. Envía una clave de idempotencia única:
   ```json
   {
     "claveIdempotencia": "mi-reserva-pago-001"
   }
   ```
3. Presiona **Execute** ➔ El motor de base de datos activa el bloqueo pesimista (`UPDLOCK, HOLDLOCK`) y aparta el inventario por 15 minutos exactos.
4. Anota el **`IDReserva`** devuelto.

---

### Paso 7: Confirmación Atómica del Pedido (Checkout Final)
1. Despliega `POST /api/pedidos/checkout/confirmar`.
2. Envía los datos consolidados de la compra:
   ```json
   {
     "idReserva": 1,
     "idDireccionEntrega": 1,
     "codigoCupon": "CALZADO15",
     "metodoPago": "TARJETA_CREDITO",
     "idTransaccionPago": "TXN-PAGO-EXITOSO-777"
   }
   ```
3. Presiona **Execute** ➔ Devuelve `201 Created` con el número de orden generado (`NumeroPedido: "ORD-20261102-0001"`), el estado `"PAGADO"` y el desglose de IVA (12%).

---

### Paso 8: Verificación de Integridad Posterior a la Venta
1. **Carrito Vacío:** Ejecuta `GET /api/carrito` ➔ `TotalArticulos: 0`.
2. **Historial del Cliente:** Ejecuta `GET /api/pedidos/mis-pedidos` ➔ Aparece la nueva compra.
3. **Descuento de Stock en Bodega:** Consulta el detalle del producto (`GET /api/catalogo/productos/{codigoPublico}`) ➔ La variante física habrá disminuido exactamente las unidades adquiridas.

---

## 4. Pruebas de Seguridad y Casos Borde

### A. Prueba de Idempotencia
* Vuelve a ejecutar el Paso 6 con la misma `claveIdempotencia: "mi-reserva-pago-001"`.
* **Resultado:** No crea registros duplicados; devuelve la reserva ya existente.

### B. Prueba de Control de Roles (403 Forbidden)
* Estando autenticado como `Cliente`, intenta consumir:
  * `GET /api/inventario/kardex`
  * `GET /api/bitacora`
* **Resultado:** Recibirás un `403 Forbidden` impidiendo el acceso a paneles exclusivos de Operador o Administrador.

### C. Prueba de Protección contra Sobreventa
* Intenta agregar al carrito `9999` unidades en `POST /api/carrito/items`.
* **Resultado:** El sistema rechaza la petición indicando que no hay existencias suficientes.
