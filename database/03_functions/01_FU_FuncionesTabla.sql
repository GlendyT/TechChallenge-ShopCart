    -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 01_FU_FuncionesTabla.sql                                                                             
    -- DESCRIPCIÓN: Funciones tipo tabla (Inline Table-Valued Functions).                                           
    -- ESTÁNDAR: Prefijo FU_Modulo_Proceso.                                                                         
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. CÁLCULO Y VALIDACIÓN DE DESCUENTO POR CUPÓN (RF-05)                                                       
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER FUNCTION FU_Cupones_CalculoDescuento                                                            
    (                                                                                                               
        @IDCupon INT,                                                                                               
        @SubtotalAplicable DECIMAL(12,2)                                                                            
    )                                                                                                               
    RETURNS TABLE                                                                                                   
    AS                                                                                                              
    RETURN                                                                                                          
    (                                                                                                               
        SELECT                                                                                                      
            c.IDCupon,                                                                                              
            c.Codigo,                                                                                               
            c.TipoDescuento,                                                                                        
            c.ValorDescuento,                                                                                       
            -- Validación de estado y vigencia                                                                      
            CASE                                                                                                    
                WHEN c.Activo = 0 THEN 0                                                                            
                WHEN SYSDATETIME() < c.FechaInicio THEN 0                                                           
                WHEN SYSDATETIME() > c.FechaFin THEN 0                                                              
                WHEN c.UsosActuales >= c.LimiteUsosTotal THEN 0                                                     
                WHEN @SubtotalAplicable < c.MontoMinimoCompra THEN 0                                                
                ELSE 1                                                                                              
            END AS EsValido,                                                                                        
            -- Mensaje explicativo en caso de rechazo                                                               
            CASE                                                                                                    
                WHEN c.Activo = 0 THEN 'El cupón se encuentra inactivo.'                                            
                WHEN SYSDATETIME() < c.FechaInicio THEN 'El cupón aún no entra en vigencia.'                        
                WHEN SYSDATETIME() > c.FechaFin THEN 'El cupón se encuentra vencido.'                               
                WHEN c.UsosActuales >= c.LimiteUsosTotal THEN 'El cupón ha agotado su límite total de usos.'        
                WHEN @SubtotalAplicable < c.MontoMinimoCompra THEN 'El monto de compra no alcanza el mínimo         
                requerido para este cupón.'                                                                         
                ELSE 'Cupón aplicable.'                                                                             
            END AS MensajeResultado,                                                                                
            -- Cálculo matemático del monto a descontar (no excede el subtotal)                                     
            CASE                                                                                                    
                WHEN c.Activo = 1                                                                                   
                     AND SYSDATETIME() BETWEEN c.FechaInicio AND c.FechaFin                                         
                     AND c.UsosActuales < c.LimiteUsosTotal                                                         
                     AND @SubtotalAplicable >= c.MontoMinimoCompra THEN                                             
                    CASE                                                                                            
                        WHEN c.TipoDescuento = 'PORCENTAJE' THEN                                                    
                            ROUND((@SubtotalAplicable * (c.ValorDescuento / 100.0)), 2)                             
                        WHEN c.TipoDescuento = 'MONTO_FIJO' THEN                                                    
                            CASE                                                                                    
                                WHEN c.ValorDescuento > @SubtotalAplicable THEN @SubtotalAplicable                  
                                ELSE c.ValorDescuento                                                               
                            END                                                                                     
                        ELSE 0.00                                                                                   
                    END                                                                                             
                ELSE 0.00                                                                                           
            END AS MontoDescuento                                                                                   
        FROM Cupones c                                                                                              
        WHERE c.IDCupon = @IDCupon                                                                                  
    );                                                                                                              
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. CONSULTA DE DISPONIBILIDAD DE VARIANTE (RF-03, RF-06)                                                     
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER FUNCTION FU_Inventario_ConsultarDisponibilidad                                                  
    (                                                                                                               
        @IDVariante INT                                                                                             
    )                                                                                                               
    RETURNS TABLE                                                                                                   
    AS                                                                                                              
    RETURN                                                                                                          
    (                                                                                                               
        SELECT                                                                                                      
            v.IDVariante,                                                                                           
            v.SKU,                                                                                                  
            v.ExistenciaFisica,                                                                                     
            ISNULL(res.TotalReservado, 0) AS UnidadesReservadas,                                                    
            CASE                                                                                                    
                WHEN (v.ExistenciaFisica - ISNULL(res.TotalReservado, 0)) < 0 THEN 0                                
                ELSE (v.ExistenciaFisica - ISNULL(res.TotalReservado, 0))                                           
            END AS ExistenciaDisponible,                                                                            
            v.Activo                                                                                                
        FROM Variantes v                                                                                            
        LEFT JOIN (                                                                                                 
            SELECT                                                                                                  
                rd.IDVariante,                                                                                      
                SUM(rd.Cantidad) AS TotalReservado                                                                  
            FROM ReservaDetalles rd                                                                                 
            INNER JOIN Reservas r ON rd.IDReserva = r.IDReserva                                                     
            WHERE r.Estado = 'ACTIVA'                                                                               
              AND r.FechaExpiracion > SYSDATETIME()                                                                 
            GROUP BY rd.IDVariante                                                                                  
        ) res ON v.IDVariante = res.IDVariante                                                                      
        WHERE v.IDVariante = @IDVariante                                                                            
    );                                                                                                              
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 3. GENERADOR DE SERIE DE FECHAS PARA REPORTES CONTINUOS (RF-08)                                              
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER FUNCTION FU_Reportes_GenerarSerieFechas                                                         
    (                                                                                                               
        @FechaInicio DATE,                                                                                          
        @FechaFin DATE                                                                                              
    )                                                                                                               
    RETURNS TABLE                                                                                                   
    AS                                                                                                              
    RETURN                                                                                                          
    (                                                                                                               
        WITH E1(N) AS (                                                                                             
            SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL                             
            SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL                             
            SELECT 1 UNION ALL SELECT 1 -- 10 filas                                                                 
        ),                                                                                                          
        E2(N) AS (SELECT 1 FROM E1 a CROSS JOIN E1 b), -- 100 filas                                                 
        E4(N) AS (SELECT 1 FROM E2 a CROSS JOIN E2 b), -- 10,000 filas                                              
        Numeros(N) AS (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 FROM E4)                               
        SELECT                                                                                                      
            DATEADD(DAY, N, @FechaInicio) AS Fecha                                                                  
        FROM Numeros                                                                                                
        WHERE N <= DATEDIFF(DAY, @FechaInicio, @FechaFin)                                                           
    );                                                                                                              
    GO  