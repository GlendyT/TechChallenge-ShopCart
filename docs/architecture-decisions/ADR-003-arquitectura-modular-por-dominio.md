# ADR-003: Organización del Backend mediante Arquitectura Modular por Dominio (Feature-Based / Vertical Slices) vs. Agrupación por Tipo Técnico

- **Estado:** Aceptado
- **Fecha:** Octubre 2026
- **Contexto:** Diseño de la arquitectura del Backend REST en Node.js + TypeScript + Express para la plataforma *ShopCart* (*Tech Challenge 360 - Grupo Pentandra*).

---

## 1. Contexto y Problema

Al estructurar el código fuente del Backend (`backend/src/`), existen dos enfoques principales en el ecosistema Node.js/TypeScript:

1. **Agrupación por Tipo Técnico (Horizontal / Package-by-Layer):**
   Organizar las carpetas según el rol técnico del archivo (`src/controllers/`, `src/services/`, `src/repositories/`, `src/routes/`, `src/schemas/`).
2. **Agrupación por Módulo o Dominio de Negocio (Vertical / Feature-Based / Screaming Architecture):**
   Organizar las carpetas según el dominio funcional del negocio (`src/modules/auth/`, `src/modules/catalogo/`, `src/modules/inventario/`, `src/modules/carrito/`, `src/modules/cupones/`, `src/modules/pedidos/`, `src/modules/reportes/`, `src/modules/bitacora/`), manteniendo las capas (`schema`, `repository`, `service`, `controller`, `routes`) cohesionadas dentro de cada módulo.

Dado que *ShopCart* abarca **9 Requerimientos Funcionales (`RF-01` a `RF-09`)**, **18 tablas relacionales** y más de **40 Procedimientos Almacenados**, se requería elegir la estructura que maximizara la mantenibilidad, la trazabilidad frente al enunciado y la separación de responsabilidades.

---

## 2. Decisión

Se eligió una **Arquitectura Híbrida Modular por Dominio (Modular Monolith con Capas Internas)**:

1. **Módulos de Dominio (`src/modules/<dominio>/`):**
   Cada dominio funcional encapsula sus propias capas:
   - `<dominio>.schema.ts`: Contratos de validación de entrada con `Zod`.
   - `<dominio>.repository.ts`: Capa de acceso a datos que invoca exclusivamente Procedimientos Almacenados (`SP_Modulo_Proceso`) mediante parámetros tipados.
   - `<dominio>.service.ts` *(cuando aplica lógica de orquestación)*: Reglas de aplicación, criptografía (`bcrypt`, `JWT`) y coordinación entre repositorios.
   - `<dominio>.controller.ts`: Adaptador HTTP (extrae `req`, invoca la lógica y devuelve códigos de estado HTTP semánticos).
   - `<dominio>.routes.ts`: Definición de endpoints REST y aplicación de middlewares de autenticación, roles (`Cliente`, `Operador`, `Administrador`) y validación.

2. **Infraestructura Transversal (`src/config/`, `src/database/`, `src/middlewares/`, `src/errors/`, `src/utils/`):**
   Los componentes que no pertenecen a un único dominio de negocio sino a toda la plataforma (Pool de SQL Server, manejo global de errores `AppError`, verificación JWT, configuración de variables de entorno y documentación OpenAPI/Swagger) se ubican en carpetas transversales en la raíz de `src/`.

---

## 3. Justificación Técnica (Argumentos para Defensa Técnica)

| Criterio | Por Módulo / Dominio (`src/modules/<dominio>/`) | Por Tipo Técnico (`src/controllers/`, `src/repositories/`) |
| :--- | :--- | :--- |
| **Principio de Alta Cohesión y Bajo Acoplamiento** | **Alto:** Todo lo que cambia junto permanece junto (*Common Closure Principle*). Si cambia una regla del Checkout (`RF-06`), el desarrollador trabaja únicamente dentro de `src/modules/pedidos/`. | **Bajo:** Modificar un solo requerimiento obliga a navegar y editar archivos dispersos en 4 o 5 directorios distintos. |
| **Alineación con el Estándar de Base de Datos (`SP_Modulo_Proceso`)** | **1 a 1:** Existe una correspondencia directa entre los paquetes de Stored Procedures (`02_SP_Catalogo.sql`, `03_SP_Inventario_Kardex.sql`, `06_SP_Checkout_Pedidos.sql`) y las carpetas de `src/modules/`. | **Difusa:** Las fronteras del dominio se diluyen entre decenas de controladores y repositorios en una misma carpeta. |
| **Screaming Architecture (Robert C. Martin)** | Al abrir `src/modules/`, la estructura de carpetas "grita" qué hace el negocio (*Catálogo, Inventario, Carrito, Cupones, Pedidos, Reportes, Bitácora*). | Al abrir `src/`, la estructura solo dice que es una aplicación MVC/Express genérica, sin revelar el dominio del negocio. |
| **Escalabilidad y Preparación para Microservicios** | Si en el futuro el módulo de `Reportes` o `Checkout` requiere extraerse a un microservicio independiente, sus contratos, rutas y acceso a datos ya están aislados en un único directorio con fronteras claras. | Extraer un dominio requiere desacoplar manualmente archivos entrelazados en múltiples carpetas globales. |

---

## 4. Estructura Final Adoptada

```text
backend/src/
├── config/                 # Configuración transversal (env.ts con Zod, swagger.ts OpenAPI 3.0)
├── database/               # Pool de conexiones mssql y ejecutor tipado executeSP (db.ts)
├── errors/                 # Clase base de errores operacionales (AppError.ts)
├── middlewares/            # Autenticación JWT/RBAC, validador Zod y manejador central de errores
├── utils/                  # Utilidades criptográficas y emisión/verificación de tokens JWT
├── modules/                # Dominios de negocio (Vertical Slices)
│   ├── auth/               # RF-01: Registro, Login, Refresh Token Rotation, Direcciones y Usuarios
│   ├── catalogo/           # RF-02: Categorías, Productos paginados y Variantes
│   ├── inventario/         # RF-03: Existencias reales/disponibles, Kardex y Ajustes manuales
│   ├── carrito/            # RF-04: Carrito híbrido (Invitado/Autenticado) y Fusión (MERGE)
│   ├── cupones/            # RF-05: CRUD y motor de validación de cupones sobre el carrito
│   ├── pedidos/            # RF-06 y RF-07: Reserva 15m, Checkout atómico, Ciclo de vida y Devoluciones
│   ├── reportes/           # RF-08: Analítica de ventas, Top 10 productos y Carritos abandonados
│   └── bitacora/           # RF-09: Registro y consulta de auditoría inmutable
├── app.ts                  # Configuración del pipeline Express y montaje de rutas
└── server.ts               # Bootstrap del servidor y verificación del pool de SQL Server
```

---

## 5. Consecuencias

- **Positivas:**
  - Lectura e inspección inmediata por parte de los evaluadores técnicos al revisar cada Requerimiento Funcional (`RF-01` a `RF-09`).
  - Cumplimiento estricto de separación de capas (ningún controlador habla directo con `mssql`; todo pasa por su respectivo `repository` hacia los `SP_Modulo_Proceso`).
  - Reducción de conflictos en control de versiones (`Git`) cuando varios desarrolladores trabajan en distintos módulos simultáneamente.
- **Mitigación de dependencias cruzadas:**
  - El único módulo transversal de negocio consumido por otros módulos es `bitacora` (`bitacoraRepository.registrar`), lo cual es intencional por tratarse del componente de auditoría transversal exigido en el `RF-09`.
