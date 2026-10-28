   -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 07_SP_Reportes_Dashboard.sql                                                                         
    -- DESCRIPCIÓN: Procedimientos almacenados para analítica, reportes y métricas.                                 
    -- ESTÁNDAR: Prefijo SP_Modulo_Proceso.                                                                         
    -- CRITERIO RF-08: Excluye cancelados y descuenta devoluciones de los totales.                                  
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. VENTAS POR DÍA, SEMANA O MES CON TICKET PROMEDIO (RF-08)                                                  
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Reportes_VentasPeriodo                                                             
        @FechaInicio DATE,                                                                                          
        @FechaFin DATE,                                                                                             
        @Agrupacion NVARCHAR(10) = 'DIA' -- 'DIA', 'SEMANA', 'MES'                                                  
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        -- Subconsulta de ventas netas efectivas por pedido                                                         
        WITH VentasNetasPedido AS (                                                                                 
            SELECT                                                                                                  
                p.IDPedido,                                                                                         
                CAST(p.FechaCreacion AS DATE) AS FechaPedido,                                                       
                SUM((pd.Cantidad - pd.CantidadDevuelta) * (pd.PrecioUnitario - pd.DescuentoUnitario)) AS            
                MontoNetoEfectivo                                                                                   
            FROM Pedidos p                                                                                          
            INNER JOIN PedidoDetalles pd ON p.IDPedido = pd.IDPedido                                                
            WHERE p.Estado NOT IN ('CANCELADO')                                                                     
              AND CAST(p.FechaCreacion AS DATE) BETWEEN @FechaInicio AND @FechaFin                                  
            GROUP BY p.IDPedido, CAST(p.FechaCreacion AS DATE)                                                      
            HAVING SUM(pd.Cantidad - pd.CantidadDevuelta) > 0                                                       
        ),                                                                                                          
        -- Calendario continuo con Tally Table para no omitir días con 0 ventas                                     
        SerieFechas AS (                                                                                            
            SELECT Fecha                                                                                            
            FROM FU_Reportes_GenerarSerieFechas(@FechaInicio, @FechaFin)                                            
        )                                                                                                           
        SELECT                                                                                                      
            CASE                                                                                                    
                WHEN @Agrupacion = 'MES' THEN FORMAT(sf.Fecha, 'yyyy-MM')                                           
                WHEN @Agrupacion = 'SEMANA' THEN 'Semana ' + CAST(DATEPART(WEEK, sf.Fecha) AS NVARCHAR(2)) + ' (' + 
                CAST(YEAR(sf.Fecha) AS NVARCHAR(4)) + ')'                                                           
                ELSE CONVERT(NVARCHAR(10), sf.Fecha, 120) -- DIA                                                    
            END AS Periodo,                                                                                         
            ISNULL(COUNT(DISTINCT vnp.IDPedido), 0) AS TotalPedidos,                                                
            ISNULL(SUM(vnp.MontoNetoEfectivo), 0.00) AS TotalVentasNetas,                                           
            CASE                                                                                                    
                WHEN COUNT(DISTINCT vnp.IDPedido) > 0 THEN                                                          
                    ROUND(ISNULL(SUM(vnp.MontoNetoEfectivo), 0.00) / COUNT(DISTINCT vnp.IDPedido), 2)               
                ELSE 0.00                                                                                           
            END AS TicketPromedio                                                                                   
        FROM SerieFechas sf                                                                                         
        LEFT JOIN VentasNetasPedido vnp ON sf.Fecha = vnp.FechaPedido                                               
        GROUP BY                                                                                                    
            CASE                                                                                                    
                WHEN @Agrupacion = 'MES' THEN FORMAT(sf.Fecha, 'yyyy-MM')                                           
                WHEN @Agrupacion = 'SEMANA' THEN 'Semana ' + CAST(DATEPART(WEEK, sf.Fecha) AS NVARCHAR(2)) + ' (' + 
                CAST(YEAR(sf.Fecha) AS NVARCHAR(4)) + ')'                                                           
                ELSE CONVERT(NVARCHAR(10), sf.Fecha, 120)                                                           
            END                                                                                                     
        ORDER BY MIN(sf.Fecha) ASC;                                                                                 
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. TOP 10 PRODUCTOS MÁS VENDIDOS DEL PERIODO (RF-08)                                                         
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Reportes_Top10ProductosMasVendidos                                                 
        @FechaInicio DATETIME2 = NULL,                                                                              
        @FechaFin DATETIME2 = NULL                                                                                  
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        SELECT TOP 10                                                                                               
            pr.IDProducto,                                                                                          
            pr.CodigoPublico AS CodigoPublicoProducto,                                                              
            pr.Nombre AS NombreProducto,                                                                            
            c.Nombre AS Categoria,                                                                                  
            SUM(pd.Cantidad - pd.CantidadDevuelta) AS UnidadesNetasVendidas,                                        
            SUM((pd.Cantidad - pd.CantidadDevuelta) * (pd.PrecioUnitario - pd.DescuentoUnitario)) AS                
            IngresoNetoTotal,                                                                                       
            (                                                                                                       
                SELECT TOP 1 pi.ImagenURL                                                                           
                FROM ProductoImagenes pi                                                                            
                WHERE pi.IDProducto = pr.IDProducto                                                                 
                ORDER BY pi.EsPrincipal DESC, pi.Orden ASC                                                          
            ) AS ImagenURL                                                                                          
        FROM Pedidos p                                                                                              
        INNER JOIN PedidoDetalles pd ON p.IDPedido = pd.IDPedido                                                    
        INNER JOIN Variantes v ON pd.IDVariante = v.IDVariante                                                      
        INNER JOIN Productos pr ON v.IDProducto = pr.IDProducto                                                     
        INNER JOIN Categorias c ON pr.IDCategoria = c.IDCategoria                                                   
        WHERE p.Estado NOT IN ('CANCELADO')                                                                         
          AND (@FechaInicio IS NULL OR p.FechaCreacion >= @FechaInicio)                                             
          AND (@FechaFin IS NULL OR p.FechaCreacion <= @FechaFin)                                                   
        GROUP BY                                                                                                    
            pr.IDProducto,                                                                                          
            pr.CodigoPublico,                                                                                       
            pr.Nombre,                                                                                              
            c.Nombre                                                                                                
        HAVING SUM(pd.Cantidad - pd.CantidadDevuelta) > 0                                                           
        ORDER BY UnidadesNetasVendidas DESC, IngresoNetoTotal DESC;                                                 
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 3. VENTAS POR CATEGORÍA DEL PERIODO (RF-08)                                                                  
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Reportes_VentasPorCategoria                                                        
        @FechaInicio DATETIME2 = NULL,                                                                              
        @FechaFin DATETIME2 = NULL                                                                                  
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        WITH VentasCategorias AS (                                                                                  
            SELECT                                                                                                  
                c.IDCategoria,                                                                                      
                c.Nombre AS Categoria,                                                                              
                COUNT(DISTINCT p.IDPedido) AS CantidadPedidos,                                                      
                SUM(pd.Cantidad - pd.CantidadDevuelta) AS UnidadesNetasVendidas,                                    
                SUM((pd.Cantidad - pd.CantidadDevuelta) * (pd.PrecioUnitario - pd.DescuentoUnitario)) AS            
                MontoNetoVendido                                                                                    
            FROM Pedidos p                                                                                          
            INNER JOIN PedidoDetalles pd ON p.IDPedido = pd.IDPedido                                                
            INNER JOIN Variantes v ON pd.IDVariante = v.IDVariante                                                  
            INNER JOIN Productos pr ON v.IDProducto = pr.IDProducto                                                 
            INNER JOIN Categorias c ON pr.IDCategoria = c.IDCategoria                                               
            WHERE p.Estado NOT IN ('CANCELADO')                                                                     
              AND (@FechaInicio IS NULL OR p.FechaCreacion >= @FechaInicio)                                         
              AND (@FechaFin IS NULL OR p.FechaCreacion <= @FechaFin)                                               
            GROUP BY                                                                                                
                c.IDCategoria,                                                                                      
                c.Nombre                                                                                            
            HAVING SUM(pd.Cantidad - pd.CantidadDevuelta) > 0                                                       
        )                                                                                                           
        SELECT                                                                                                      
            vc.IDCategoria,                                                                                         
            vc.Categoria,                                                                                           
            vc.CantidadPedidos,                                                                                     
            vc.UnidadesNetasVendidas,                                                                               
            vc.MontoNetoVendido,                                                                                    
            CAST(ROUND((vc.MontoNetoVendido * 100.0) / NULLIF(SUM(vc.MontoNetoVendido) OVER(), 0), 2) AS            
            DECIMAL(5,2)) AS PorcentajeParticipacion                                                                
        FROM VentasCategorias vc                                                                                    
        ORDER BY vc.MontoNetoVendido DESC;                                                                          
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 4. REPORTE DE CARRITOS ABANDONADOS (RF-08, Glosario)                                                         
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Reportes_CarritosAbandonados                                                       
        @MinutosInactividad INT = 1440 -- Por defecto 24 horas (1440 min)                                           
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        SELECT                                                                                                      
            c.IDCarrito,                                                                                            
            c.CodigoPublico,                                                                                        
            c.IDUsuario,                                                                                            
            ISNULL(u.Nombre + ' ' + u.Apellido, 'Visitante Invitado') AS NombreCliente,                             
            ISNULL(u.Correo, 'Sin correo registrado') AS CorreoCliente,                                             
            c.FechaCreacion,                                                                                        
            c.FechaUltimaActividad,                                                                                 
            DATEDIFF(MINUTE, c.FechaUltimaActividad, SYSDATETIME()) AS MinutosInactivo,                             
            COUNT(cd.IDCarritoDetalle) AS TotalLineas,                                                              
            SUM(cd.Cantidad) AS TotalUnidades,                                                                      
            SUM(cd.Cantidad * v.Precio) AS ValorEstimadoCarrito                                                     
        FROM Carritos c                                                                                             
        INNER JOIN CarritoDetalles cd ON c.IDCarrito = cd.IDCarrito                                                 
        INNER JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                      
        LEFT JOIN Usuarios u ON c.IDUsuario = u.IDUsuario                                                           
        WHERE c.Activo = 1                                                                                          
          AND DATEDIFF(MINUTE, c.FechaUltimaActividad, SYSDATETIME()) >= @MinutosInactividad                        
        GROUP BY                                                                                                    
            c.IDCarrito,                                                                                            
            c.CodigoPublico,                                                                                        
            c.IDUsuario,                                                                                            
            u.Nombre,                                                                                               
            u.Apellido,                                                                                             
            u.Correo,                                                                                               
            c.FechaCreacion,                                                                                        
            c.FechaUltimaActividad                                                                                  
        ORDER BY c.FechaUltimaActividad DESC;                                                                       
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 5. LISTADO DE PEDIDOS CON FILTROS Y PAGINACIÓN EN SERVIDOR (RF-07, RF-08)                                    
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Pedidos_ListarConFiltros                                                           
        @Estado NVARCHAR(30) = NULL,                                                                                
        @IDUsuario INT = NULL,                                                                                      
        @FechaInicio DATETIME2 = NULL,                                                                              
        @FechaFin DATETIME2 = NULL,                                                                                 
        @Busqueda NVARCHAR(100) = NULL, -- Busca en NumeroPedido o NombreCliente                                    
        @NumeroPagina INT = 1,                                                                                      
        @TamanoPagina INT = 20                                                                                      
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        IF @NumeroPagina < 1 SET @NumeroPagina = 1;                                                                 
        IF @TamanoPagina < 1 SET @TamanoPagina = 20;                                                                
                                                                                                                    
        DECLARE @Offset INT = (@NumeroPagina - 1) * @TamanoPagina;                                                  
                                                                                                                    
        SELECT                                                                                                      
            p.IDPedido,                                                                                             
            p.CodigoPublico,                                                                                        
            p.NumeroPedido,                                                                                         
            p.IDUsuario,                                                                                            
            u.Nombre + ' ' + u.Apellido AS NombreCliente,                                                           
            u.Correo AS CorreoCliente,                                                                              
            p.Subtotal,                                                                                             
            p.Descuento,                                                                                            
            p.IVA,                                                                                                  
            p.Total,                                                                                                
            p.Estado,                                                                                               
            p.MetodoPago,                                                                                           
            p.FechaCreacion,                                                                                        
            p.FechaModificacion,                                                                                    
            COUNT(1) OVER() AS TotalRegistros                                                                       
        FROM Pedidos p                                                                                              
        INNER JOIN Usuarios u ON p.IDUsuario = u.IDUsuario                                                          
        WHERE (@Estado IS NULL OR p.Estado = @Estado)                                                               
          AND (@IDUsuario IS NULL OR p.IDUsuario = @IDUsuario)                                                      
          AND (@FechaInicio IS NULL OR p.FechaCreacion >= @FechaInicio)                                             
          AND (@FechaFin IS NULL OR p.FechaCreacion <= @FechaFin)                                                   
          AND (                                                                                                     
              @Busqueda IS NULL                                                                                     
              OR p.NumeroPedido LIKE '%' + @Busqueda + '%'                                                          
              OR u.Nombre LIKE '%' + @Busqueda + '%'                                                                
              OR u.Apellido LIKE '%' + @Busqueda + '%'                                                              
              OR u.Correo LIKE '%' + @Busqueda + '%'                                                                
          )                                                                                                         
        ORDER BY p.FechaCreacion DESC                                                                               
        OFFSET @Offset ROWS                                                                                         
        FETCH NEXT @TamanoPagina ROWS ONLY;                                                                         
    END;                                                                                                            
    GO    