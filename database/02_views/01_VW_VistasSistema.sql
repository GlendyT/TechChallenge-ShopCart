   -- ============================================================================                                    
    -- PROYECTO: ShopCart                                                                                              
    -- SCRIPT: 01_VW_VistasSistema.sql                                                                                 
    -- DESCRIPCIÓN: Vistas del sistema para consulta de inventario, pedidos y reportes.                                
    -- ESTÁNDAR: Prefijo VW_Modulo_Proceso.                                                                            
    -- ============================================================================                                    
                                                                                                                       
    -- ----------------------------------------------------------------------------                                    
    -- 1. VISTA DE EXISTENCIAS E INVENTARIO DISPONIBLE (RF-03, RF-06)                                                  
    -- ----------------------------------------------------------------------------                                    
    -- Calcula la existencia disponible = Existencia Física - Reservas Activas vigentes                                
    CREATE OR ALTER VIEW VW_Inventario_ExistenciasDisponibles                                                          
    AS                                                                                                                 
    SELECT                                                                                                             
        v.IDVariante,                                                                                                  
        v.IDProducto,                                                                                                  
        p.CodigoPublico AS CodigoPublicoProducto,                                                                      
        p.Nombre AS NombreProducto,                                                                                    
        c.Nombre AS Categoria,                                                                                         
        v.SKU,                                                                                                         
        v.Nombre AS NombreVariante,                                                                                    
        v.Talla,                                                                                                       
        v.Color,                                                                                                       
        v.Precio,                                                                                                      
        v.ExistenciaFisica,                                                                                            
        ISNULL(r.TotalReservado, 0) AS UnidadesReservadas,                                                             
        CASE                                                                                                           
            WHEN (v.ExistenciaFisica - ISNULL(r.TotalReservado, 0)) < 0 THEN 0                                         
            ELSE (v.ExistenciaFisica - ISNULL(r.TotalReservado, 0))                                                    
        END AS ExistenciaDisponible,                                                                                   
        v.Activo AS VarianteActiva,                                                                                    
        p.Activo AS ProductoActivo                                                                                     
    FROM Variantes v                                                                                                   
    INNER JOIN Productos p ON v.IDProducto = p.IDProducto                                                              
    INNER JOIN Categorias c ON p.IDCategoria = c.IDCategoria                                                           
    LEFT JOIN (                                                                                                        
        -- Suma de unidades en reservas activas no expiradas                                                           
        SELECT                                                                                                         
            rd.IDVariante,                                                                                             
            SUM(rd.Cantidad) AS TotalReservado                                                                         
        FROM ReservaDetalles rd                                                                                        
        INNER JOIN Reservas res ON rd.IDReserva = res.IDReserva                                                        
        WHERE res.Estado = 'ACTIVA'                                                                                    
          AND res.FechaExpiracion > SYSDATETIME()                                                                      
        GROUP BY rd.IDVariante                                                                                         
    ) r ON v.IDVariante = r.IDVariante;                                                                                
    GO                                                                                                                 
                                                                                                                       
    -- ----------------------------------------------------------------------------                                    
    -- 2. VISTA CONSOLIDADA DE LISTADO DE PEDIDOS (RF-07)                                                              
    -- ----------------------------------------------------------------------------                                    
    CREATE OR ALTER VIEW VW_Pedidos_ResumenListado                                                                     
    AS                                                                                                                 
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
        COUNT(pd.IDPedidoDetalle) AS TotalLineas,                                                                      
        SUM(pd.Cantidad - pd.CantidadDevuelta) AS TotalArticulosEfectivos                                              
    FROM Pedidos p                                                                                                     
    INNER JOIN Usuarios u ON p.IDUsuario = u.IDUsuario                                                                 
    LEFT JOIN PedidoDetalles pd ON p.IDPedido = pd.IDPedido                                                            
    GROUP BY                                                                                                           
        p.IDPedido,                                                                                                    
        p.CodigoPublico,                                                                                               
        p.NumeroPedido,                                                                                                
        p.IDUsuario,                                                                                                   
        u.Nombre,                                                                                                      
        u.Apellido,                                                                                                    
        u.Correo,                                                                                                      
        p.Subtotal,                                                                                                    
        p.Descuento,                                                                                                   
        p.IVA,                                                                                                         
        p.Total,                                                                                                       
        p.Estado,                                                                                                      
        p.MetodoPago,                                                                                                  
        p.FechaCreacion,                                                                                               
        p.FechaModificacion;                                                                                           
    GO      


      -- ----------------------------------------------------------------------------                                    
    -- 3. VISTAS DEL DASHBOARD Y REPORTES (RF-08)                                                                      
    -- ----------------------------------------------------------------------------                                    
                                                                                                                       
    -- A. Ventas Netas por Categoría (excluye cancelados y descuenta devoluciones)                                     
    CREATE OR ALTER VIEW VW_Dashboard_VentasPorCategoria                                                               
    AS                                                                                                                 
    SELECT                                                                                                             
        c.IDCategoria,                                                                                                 
        c.Nombre AS Categoria,                                                                                         
        COUNT(DISTINCT p.IDPedido) AS CantidadPedidos,                                                                 
        SUM(pd.Cantidad - pd.CantidadDevuelta) AS UnidadesNetasVendidas,                                               
        SUM((pd.Cantidad - pd.CantidadDevuelta) * (pd.PrecioUnitario - pd.DescuentoUnitario)) AS MontoNetoVendido      
    FROM Pedidos p                                                                                                     
    INNER JOIN PedidoDetalles pd ON p.IDPedido = pd.IDPedido                                                           
    INNER JOIN Variantes v ON pd.IDVariante = v.IDVariante                                                             
    INNER JOIN Productos pr ON v.IDProducto = pr.IDProducto                                                            
    INNER JOIN Categorias c ON pr.IDCategoria = c.IDCategoria                                                          
    WHERE p.Estado NOT IN ('CANCELADO')                                                                                
      AND (pd.Cantidad - pd.CantidadDevuelta) > 0                                                                      
    GROUP BY                                                                                                           
        c.IDCategoria,                                                                                                 
        c.Nombre;                                                                                                      
    GO                                                                                                                 
                                                                                                                       
    -- B. Productos Más Vendidos Histórico (para ranking del periodo)                                                  
    CREATE OR ALTER VIEW VW_Dashboard_ProductosMasVendidos                                                             
    AS                                                                                                                 
    SELECT                                                                                                             
        pr.IDProducto,                                                                                                 
        pr.CodigoPublico AS CodigoPublicoProducto,                                                                     
        pr.Nombre AS NombreProducto,                                                                                   
        c.Nombre AS Categoria,                                                                                         
        v.SKU,                                                                                                         
        v.Nombre AS NombreVariante,                                                                                    
        SUM(pd.Cantidad - pd.CantidadDevuelta) AS UnidadesNetasVendidas,                                               
        SUM((pd.Cantidad - pd.CantidadDevuelta) * (pd.PrecioUnitario - pd.DescuentoUnitario)) AS IngresoNetoTotal      
    FROM Pedidos p                                                                                                     
    INNER JOIN PedidoDetalles pd ON p.IDPedido = pd.IDPedido                                                           
    INNER JOIN Variantes v ON pd.IDVariante = v.IDVariante                                                             
    INNER JOIN Productos pr ON v.IDProducto = pr.IDProducto                                                            
    INNER JOIN Categorias c ON pr.IDCategoria = c.IDCategoria                                                          
    WHERE p.Estado NOT IN ('CANCELADO')                                                                                
    GROUP BY                                                                                                           
        pr.IDProducto,                                                                                                 
        pr.CodigoPublico,                                                                                              
        pr.Nombre,                                                                                                     
        c.Nombre,                                                                                                      
        v.SKU,                                                                                                         
        v.Nombre                                                                                                       
    HAVING SUM(pd.Cantidad - pd.CantidadDevuelta) > 0;                                                                 
    GO                                                                                                                 
                                                                                                                       
    -- C. Detección de Carritos con Productos (base para análisis de carritos abandonados)                             
    CREATE OR ALTER VIEW VW_Dashboard_CarritosConDetalle                                                               
    AS                                                                                                                 
    SELECT                                                                                                             
        c.IDCarrito,                                                                                                   
        c.CodigoPublico AS CodigoPublicoCarrito,                                                                       
        c.IDUsuario,                                                                                                   
        u.Nombre + ' ' + u.Apellido AS NombreCliente,                                                                  
        u.Correo AS CorreoCliente,                                                                                     
        c.TokenInvitado,                                                                                               
        c.FechaCreacion,                                                                                               
        c.FechaUltimaActividad,                                                                                        
        DATEDIFF(MINUTE, c.FechaUltimaActividad, SYSDATETIME()) AS MinutosInactividad,                                 
        COUNT(cd.IDCarritoDetalle) AS TotalLineas,                                                                     
        SUM(cd.Cantidad) AS TotalArticulos,                                                                            
        SUM(cd.Cantidad * v.Precio) AS ValorEstimadoCarrito                                                            
    FROM Carritos c                                                                                                    
    INNER JOIN CarritoDetalles cd ON c.IDCarrito = cd.IDCarrito                                                        
    INNER JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                             
    LEFT JOIN Usuarios u ON c.IDUsuario = u.IDUsuario                                                                  
    WHERE c.Activo = 1                                                                                                 
    GROUP BY                                                                                                           
        c.IDCarrito,                                                                                                   
        c.CodigoPublico,                                                                                               
        c.IDUsuario,                                                                                                   
        u.Nombre,                                                                                                      
        u.Apellido,                                                                                                    
        u.Correo,                                                                                                      
        c.TokenInvitado,                                                                                               
        c.FechaCreacion,                                                                                               
        c.FechaUltimaActividad;                                                                                        
    GO  