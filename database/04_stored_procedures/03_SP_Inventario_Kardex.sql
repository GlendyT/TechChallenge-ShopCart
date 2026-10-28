   -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 03_SP_Inventario_Kardex.sql                                                                          
    -- DESCRIPCIÓN: Procedimientos almacenados para gestión de existencias y kardex.                                
    -- ESTÁNDAR: Prefijo SP_Modulo_Proceso.                                                                         
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. REGISTRO DE AJUSTE MANUAL DE INVENTARIO (RF-03)                                                           
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Inventario_RegistrarAjusteManual                                                   
        @IDVariante INT,                                                                                            
        @IDUsuario INT,                                                                                             
        @TipoAjuste NVARCHAR(20), -- 'POSITIVO' o 'NEGATIVO'                                                        
        @Cantidad INT,                                                                                              
        @Motivo NVARCHAR(255)                                                                                       
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        -- Validaciones de entrada (Criterios de aceptación RF-03)                                                  
        IF @Cantidad <= 0                                                                                           
        BEGIN                                                                                                       
            RAISERROR('La cantidad a ajustar debe ser mayor a cero.', 16, 1);                                       
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @Motivo IS NULL OR LTRIM(RTRIM(@Motivo)) = ''                                                            
        BEGIN                                                                                                       
            RAISERROR('El motivo del ajuste es estrictamente obligatorio.', 16, 1);                                 
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @TipoAjuste NOT IN ('POSITIVO', 'NEGATIVO')                                                              
        BEGIN                                                                                                       
            RAISERROR('El tipo de ajuste debe ser POSITIVO o NEGATIVO.', 16, 1);                                    
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        -- Bloqueo pesimista de fila para prevenir lecturas sucias en concurrencia                                  
        DECLARE @ExistenciaActual INT;                                                                              
        SELECT @ExistenciaActual = ExistenciaFisica                                                                 
        FROM Variantes WITH (UPDLOCK, ROWLOCK)                                                                      
        WHERE IDVariante = @IDVariante;                                                                             
                                                                                                                    
        IF @ExistenciaActual IS NULL                                                                                
        BEGIN                                                                                                       
            ROLLBACK TRANSACTION;                                                                                   
            RAISERROR('La variante especificada no existe.', 16, 1);                                                
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        DECLARE @NuevaExistencia INT;                                                                               
        DECLARE @TipoMovimientoKardex NVARCHAR(30);                                                                 
                                                                                                                    
        IF @TipoAjuste = 'POSITIVO'                                                                                 
        BEGIN                                                                                                       
            SET @NuevaExistencia = @ExistenciaActual + @Cantidad;                                                   
            SET @TipoMovimientoKardex = 'AJUSTE_POSITIVO';                                                          
        END                                                                                                         
        ELSE -- NEGATIVO                                                                                            
        BEGIN                                                                                                       
            -- Criterio de aceptación RF-03: Un ajuste manual no puede dejar la existencia en negativo              
            IF (@ExistenciaActual - @Cantidad) < 0                                                                  
            BEGIN                                                                                                   
                ROLLBACK TRANSACTION;                                                                               
                RAISERROR('El ajuste negativo no puede dejar la existencia física por debajo de cero.', 16, 1);     
                RETURN;                                                                                             
            END                                                                                                     
                                                                                                                    
            SET @NuevaExistencia = @ExistenciaActual - @Cantidad;                                                   
            SET @TipoMovimientoKardex = 'AJUSTE_NEGATIVO';                                                          
        END                                                                                                         
                                                                                                                    
        -- 1. Actualizar stock físico en la variante                                                                
        UPDATE Variantes                                                                                            
        SET ExistenciaFisica = @NuevaExistencia                                                                     
        WHERE IDVariante = @IDVariante;                                                                             
                                                                                                                    
        -- 2. Asentar movimiento en el Kardex                                                                       
        INSERT INTO Kardex (                                                                                        
            IDVariante,                                                                                             
            IDUsuario,                                                                                              
            TipoMovimiento,                                                                                         
            Cantidad,                                                                                               
            ExistenciaAnterior,                                                                                     
            ExistenciaNueva,                                                                                        
            Motivo,                                                                                                 
            IDReferencia                                                                                            
        )                                                                                                           
        OUTPUT                                                                                                      
            inserted.IDKardex,                                                                                      
            inserted.IDVariante,                                                                                    
            inserted.TipoMovimiento,                                                                                
            inserted.Cantidad,                                                                                      
            inserted.ExistenciaAnterior,                                                                            
            inserted.ExistenciaNueva,                                                                               
            inserted.Motivo,                                                                                        
            inserted.Fecha                                                                                          
        VALUES (                                                                                                    
            @IDVariante,                                                                                            
            @IDUsuario,                                                                                             
            @TipoMovimientoKardex,                                                                                  
            @Cantidad,                                                                                              
            @ExistenciaActual,                                                                                      
            @NuevaExistencia,                                                                                       
            @Motivo,                                                                                                
            NULL                                                                                                    
        );                                                                                                          
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. CONSULTAR HISTORIAL DE KARDEX (RF-03)                                                                     
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Inventario_ConsultarKardex                                                         
        @IDVariante INT = NULL,                                                                                     
        @TipoMovimiento NVARCHAR(30) = NULL,                                                                        
        @FechaInicio DATETIME2 = NULL,                                                                              
        @FechaFin DATETIME2 = NULL,                                                                                 
        @NumeroPagina INT = 1,                                                                                      
        @TamanoPagina INT = 20                                                                                      
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        IF @NumeroPagina < 1 SET @NumeroPagina = 1;                                                                 
        IF @TamanoPagina < 1 SET @TamanoPagina = 20;                                                                
                                                                                                                    
        DECLARE @Offset INT = (@NumeroPagina - 1) * @TamanoPagina;                                                  
                                                                                                                    
        SELECT                                                                                                      
            k.IDKardex,                                                                                             
            k.IDVariante,                                                                                           
            v.SKU,                                                                                                  
            pr.Nombre AS NombreProducto,                                                                            
            v.Nombre AS NombreVariante,                                                                             
            k.IDUsuario,                                                                                            
            u.Nombre + ' ' + u.Apellido AS NombreUsuario,                                                           
            k.TipoMovimiento,                                                                                       
            k.Cantidad,                                                                                             
            k.ExistenciaAnterior,                                                                                   
            k.ExistenciaNueva,                                                                                      
            k.Motivo,                                                                                               
            k.IDReferencia,                                                                                         
            k.Fecha,                                                                                                
            COUNT(1) OVER() AS TotalRegistros                                                                       
        FROM Kardex k                                                                                               
        INNER JOIN Variantes v ON k.IDVariante = v.IDVariante                                                       
        INNER JOIN Productos pr ON v.IDProducto = pr.IDProducto                                                     
        INNER JOIN Usuarios u ON k.IDUsuario = u.IDUsuario                                                          
        WHERE (@IDVariante IS NULL OR k.IDVariante = @IDVariante)                                                   
          AND (@TipoMovimiento IS NULL OR k.TipoMovimiento = @TipoMovimiento)                                       
          AND (@FechaInicio IS NULL OR k.Fecha >= @FechaInicio)                                                     
          AND (@FechaFin IS NULL OR k.Fecha <= @FechaFin)                                                           
        ORDER BY k.Fecha DESC, k.IDKardex DESC                                                                      
        OFFSET @Offset ROWS                                                                                         
        FETCH NEXT @TamanoPagina ROWS ONLY;                                                                         
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 3. LISTADO DE EXISTENCIAS DISPONIBLES Y FÍSICAS (RF-03, RF-06)                                               
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Inventario_ListarExistencias                                                       
        @Busqueda NVARCHAR(100) = NULL,                                                                             
        @IDCategoria INT = NULL,                                                                                    
        @SoloBajoStock BIT = 0, -- Por ejemplo variantes con disponible <= 5                                        
        @NumeroPagina INT = 1,                                                                                      
        @TamanoPagina INT = 20                                                                                      
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        IF @NumeroPagina < 1 SET @NumeroPagina = 1;                                                                 
        IF @TamanoPagina < 1 SET @TamanoPagina = 20;                                                                
                                                                                                                    
        DECLARE @Offset INT = (@NumeroPagina - 1) * @TamanoPagina;                                                  
                                                                                                                    
        SELECT                                                                                                      
            inv.IDVariante,                                                                                         
            inv.IDProducto,                                                                                         
            inv.CodigoPublicoProducto,                                                                              
            inv.NombreProducto,                                                                                     
            inv.Categoria,                                                                                          
            inv.SKU,                                                                                                
            inv.NombreVariante,                                                                                     
            inv.Talla,                                                                                              
            inv.Color,                                                                                              
            inv.Precio,                                                                                             
            inv.ExistenciaFisica,                                                                                   
            inv.UnidadesReservadas,                                                                                 
            inv.ExistenciaDisponible,                                                                               
            inv.VarianteActiva,                                                                                     
            COUNT(1) OVER() AS TotalRegistros                                                                       
        FROM VW_Inventario_ExistenciasDisponibles inv                                                               
        WHERE (@IDCategoria IS NULL OR inv.IDProducto IN (SELECT p.IDProducto FROM Productos p WHERE p.IDCategoria =
        ￹@IDCategoria))                                                                                              
          AND (@Busqueda IS NULL OR inv.SKU LIKE '%' + @Busqueda + '%' OR inv.NombreProducto LIKE '%' + @Busqueda + 
          ￹'%')                                                                                                      
          AND (@SoloBajoStock = 0 OR inv.ExistenciaDisponible <= 5)                                                 
        ORDER BY inv.ExistenciaDisponible ASC, inv.NombreProducto ASC                                               
        OFFSET @Offset ROWS                                                                                         
        FETCH NEXT @TamanoPagina ROWS ONLY;                                                                         
    END;                                                                                                            
    GO                    