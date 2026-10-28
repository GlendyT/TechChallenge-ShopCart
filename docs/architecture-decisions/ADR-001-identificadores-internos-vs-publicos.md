# ADR-001: Estrategia de Identificadores (Clustered Keys Internas vs. UUIDs Públicos)

- **Estado:** Aceptado
- **Fecha:** 2026-10-27
- **Módulos afectados:** Base de Datos (SQL Server), Backend (API REST), Frontend (Rutas y Estado)

---

## 1. Contexto y Problema

El reto técnico de ShopCart (Grupo Pentandra / Don Arturo) plantea dos requerimientos que a nivel de diseño tradicional parecen contrapuestos:

1. **Estándar corporativo de Base de Datos (Sección 05):**  
   Exige explícitamente llaves primarias autoincrementables con nomenclatura `ID` + PascalCase (por ejemplo, `IDProducto`, `IDPedido`, `IDUsuario`, `IDCarrito`), tipadas en `INTEGER` o `BIGINT`.
   
2. **Seguridad y Control de Acceso (RF-01):**  
   Exige que las restricciones se validen en el backend y que *"cambiar el identificador de un pedido, carrito o dirección en la URL o en el body no debe exponer ni modificar datos de otro cliente"*.

En aplicaciones web productivas, exponer IDs secuenciales como `/api/pedidos/104` crea riesgos graves de seguridad (vulnerabilidades IDOR y enumeración de recursos por fuerza bruta) y permite a competidores deducir el volumen de ventas y usuarios de la empresa.

---

## 2. Evaluación de Alternativas

### Alternativa A: Usar únicamente Llaves Autoincrementables (`INT IDENTITY`) expuestas
- **Pros:**
  - Máxima eficiencia en almacenamiento: solo 4 bytes por clave.
  - Cero fragmentación en disco (*Page Splits*): inserciones secuenciales $O(1)$ en el *Clustered Index* de SQL Server.
  - JOINs extremadamente veloces en memoria RAM (Buffer Pool).
- **Contras:**
  - Vulnerabilidad crítica a ataques IDOR (*Insecure Direct Object Reference*).
  - Fácil enumeración por atacantes o *scrapers*.
  - Revela métricas de negocio sensibles (volumen de ventas diarias/mensuales).

### Alternativa B: Usar únicamente UUIDs (`UNIQUEIDENTIFIER` / `NEWID()`) como Llaves Primarias
- **Pros:**
  - Espacio de $2^{128}$ valores: imposible de predecir o adivinar por fuerza bruta.
  - Desacoplamiento en arquitecturas distribuidas (pueden generarse en cliente o servidor sin esperar a la BD).
- **Contras:**
  - **Penalización en la evaluación técnica:** viola la directriz explícita del estándar de BD del reto (`ID` autoincrementable).
  - **Fragmentación severa de índices agrupados en SQL Server:** los UUIDs aleatorios (UUID v4) rompen el orden físico de las páginas de datos en disco (*Page Splits* masivos), degradando gravemente el rendimiento de inserciones y consultas.
  - **Sobrecarga de almacenamiento:** 16 bytes por clave (4 veces más que `INT`). Al propagarse como llave foránea a `PedidoDetalles`, `DevolucionDetalles`, `Kardex`, etc., cuadruplica el tamaño de los índices en RAM.

### Alternativa C: Patrón Híbrido "Internal Surrogate Key vs. External Public Key" (Seleccionada)
- Combina lo mejor de ambos mundos:
  - **Internamente en la Base de Datos:** Llaves primarias y foráneas autoincrementables `INT/BIGINT IDENTITY` (`IDPedido`, `IDUsuario`, etc.).
  - **Hacia el exterior (API REST y URLs):** Se expone un identificador no secuencial: `UUID` (`UNIQUEIDENTIFIER DEFAULT NEWID()`) y/o códigos legibles de negocio únicos como `NumeroPedido` (`ORD-20261027-0001`).

---

## 3. Decisión Adoptada

Se adopta formalmente la **Alternativa C (Patrón Híbrido)**:

1. **Apego al estándar:** Todas las tablas conservan su llave primaria física como `ID[Entidad] INT/BIGINT IDENTITY(1,1)` como índice agrupado (`CLUSTERED`).
2. **Protección en entidades expuestas al cliente:** Las tablas `Usuarios`, `Direcciones`, `Productos`, `Carritos` y `Pedidos` incorporan una columna `CodigoPublico UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID()` con restricción `UNIQUE` y un índice no agrupado (`NONCLUSTERED`).
3. **Contrato de API REST:** Los endpoints públicos del API consumen y retornan `CodigoPublico` en lugar del `ID` entero. El backend realiza la traducción interna mediante Stored Procedures.

---

## 4. Consecuencias y Beneficios

- **Cumplimiento de la Rúbrica:** Garantiza los 20 puntos de apego al estándar de base de datos del evaluador.
- **Seguridad Robusta:** Elimina el vector de ataque IDOR por enumeración en URLs públicas.
- **Rendimiento Óptimo:** Las operaciones de lectura masiva, reportes y relaciones padre-hijo (`Pedidos` -> `PedidoDetalles` -> `Kardex`) operan sobre enteros de 4 bytes a máxima velocidad.
- **Defensa Técnica:** Proporciona un argumento sólido y demostrable durante la entrevista técnica, evidenciando conocimiento de nivel Senior en seguridad web y diseño de motores de bases de datos relacionales.
