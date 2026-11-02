# ADR-002: Generación de Series Temporales Continuas mediante Tally Table (Técnica Ben-Gan)

- **Estado:** Aceptado
- **Fecha:** 2026-10-27
- **Módulos afectados:** Base de Datos (SQL Server - `database/03_functions/`), Backend (Reportes), Frontend (Gráficas Dashboard)

---

## 1. Contexto y Problema

El módulo **RF-08 (Dashboard y reportes)** exige visualizar las ventas por día, semana y mes, tanto en quetzales como en número de pedidos, alimentando gráficas en el frontend.

En SQL relacional, si un día no tiene pedidos registrados (por ejemplo, un domingo o día festivo), una consulta típica con `GROUP BY CAST(FechaCreacion AS DATE)` **omite completamente ese día en el resultado**. Esto causa que en el frontend las gráficas temporales se distorsionen o salten fechas.

Para resolver esto, se requiere un generador de fechas continuas que permita hacer un `LEFT JOIN` con las ventas reales, garantizando que los días sin transacciones se muestren explícitamente con `TotalVentas = 0` y `Pedidos = 0`.

---

## 2. Evaluación de Alternativas Técnicas

### Alternativa A: Bucle Procedural (`WHILE` con Tabla Temporal)
- **Problema:** Los bucles procedurales fila por fila (*RBAR - Row By Agonizing Row*) consumen ciclos excesivos de CPU, realizan escrituras en `tempdb` y **no pueden utilizarse dentro de una Función Tipo Tabla en Línea (*Inline Table-Valued Function - iTVF*)**, ya que SQL Server prohíbe efectos secundarios o sentencias de control dentro de iTVFs.

### Alternativa B: Expresión de Tabla Común Recursiva (*Recursive CTE*)
```sql
WITH Numeros AS (
    SELECT 0 AS N
    UNION ALL
    SELECT N + 1 FROM Numeros WHERE N < DATEDIFF(DAY, @FechaInicio, @FechaFin)
)
```
- **Problema Crítico de SQL Server:** El optimizador de SQL Server impone un límite de seguridad estricto de **100 recursiones por defecto** (`MAXRECURSION 100`).
- Si un usuario solicita un reporte de más de 100 días (por ejemplo, 6 meses, un año o histórico), la consulta falla inmediatamente con el error:  
  *`Msg 530, Level 16: The statement terminated. The maximum recursion 100 has been exhausted before statement completion.`*
- **Limitación en iTVF:** En funciones de tabla en línea (`RETURNS TABLE AS RETURN (...)`), SQL Server **prohíbe el uso de la cláusula `OPTION (MAXRECURSION N)`**, haciendo imposible ampliar el límite dentro de la función.

### Alternativa C: Tabla de Números en Memoria (*Tally Table* / CTEs Cruzadas de Itzik Ben-Gan)
- Se basa en la multiplicación cartesiana de conjuntos en memoria:
  - Nivel 1 ($E1$): 10 filas fijas en memoria.
  - Nivel 2 ($E2 = E1 \times E1$): $10 \times 10 = 100$ filas.
  - Nivel 3 ($E4 = E2 \times E2$): $100 \times 100 = 10,000$ filas (suficiente para ~27 años continuos).
- Asigna un correlativo con `ROW_NUMBER() OVER (ORDER BY (SELECT NULL))`.

---

## 3. Decisión Adoptada

Se adopta formalmente la **Alternativa C (Tally Table basada en CTEs cruzadas)** dentro de la función `FU_Reportes_GenerarSerieFechas`.

```sql
WITH E1(N) AS (
    SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL 
    SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL 
    SELECT 1 UNION ALL SELECT 1 -- 10 filas
),
E2(N) AS (SELECT 1 FROM E1 a CROSS JOIN E1 b), -- 100 filas
E4(N) AS (SELECT 1 FROM E2 a CROSS JOIN E2 b), -- 10,000 filas
Numeros(N) AS (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 FROM E4)
SELECT DATEADD(DAY, N, @FechaInicio) AS Fecha
FROM Numeros
WHERE N <= DATEDIFF(DAY, @FechaInicio, @FechaFin);
```

---

## 4. Consecuencias y Argumentos para la Defensa Técnica

1. **Rendimiento Máximo (Cero I/O en Disco):** No escribe ni lee páginas en disco ni en `tempdb`. La multiplicación cartesiana se resuelve íntegramente en los registros de CPU y memoria caché en menos de 1 milisegundo.
2. **Inlining y Optimización del Plan de Ejecución:** Al ser una función tipo tabla en línea (*Inline TVF*), el motor de SQL Server expande su código directamente en la consulta principal (desdobla el plan de ejecución), permitiendo paralelismo y empuje de predicados.
3. **Escalabilidad y Seguridad:** Soporta cualquier rango de fechas desde 1 día hasta 27 años sin riesgo de agotamiento de recursión (`MAXRECURSION`).
4. **Valor en la Defensa Técnica:** Demuestra al comité evaluador un dominio profundo del motor relacional de SQL Server, evitando las trampas comunes de recursión y mostrando conocimiento de patrones de diseño de alto rendimiento reconocidos en la industria.
