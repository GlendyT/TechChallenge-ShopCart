   -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 08_SP_Bitacora.sql                                                                                   
    -- DESCRIPCIÓN: Procedimientos almacenados para registro y consulta de bitácora.                                
    -- ESTÁNDAR: Prefijo SP_Modulo_Proceso.                                                                         
    -- CRITERIO RF-09: Trazabilidad inmutable de productos, existencias, cupones y pedidos.                         
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. REGISTRAR EVENTO EN BITÁCORA (RF-09)                                                                      
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Bitacora_Registrar                                                                 
        @Entidad NVARCHAR(50), -- 'Productos', 'Variantes', 'Cupones', 'Pedidos', 'Inventario', 'Usuarios'          
        @IDRegistro NVARCHAR(100),                                                                                  
        @Accion NVARCHAR(20), -- 'CREAR', 'MODIFICAR', 'DESACTIVAR', 'CAMBIO_ESTADO'                                
        @ValorAnterior NVARCHAR(MAX) = NULL,                                                                        
        @ValorNuevo NVARCHAR(MAX) = NULL,                                                                           
        @IDUsuario INT = NULL,                                                                                      
        @DireccionIP NVARCHAR(50) = NULL                                                                            
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        -- Validar acción permitida                                                                                 
        IF @Accion NOT IN ('CREAR', 'MODIFICAR', 'DESACTIVAR', 'CAMBIO_ESTADO')                                     
        BEGIN                                                                                                       
            RAISERROR('Acción de bitácora no válida. Debe ser CREAR, MODIFICAR, DESACTIVAR o CAMBIO_ESTADO.', 16,   
            1);                                                                                                     
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        INSERT INTO Bitacora (                                                                                      
            Entidad,                                                                                                
            IDRegistro,                                                                                             
            Accion,                                                                                                 
            ValorAnterior,                                                                                          
            ValorNuevo,                                                                                             
            IDUsuario,                                                                                              
            DireccionIP,                                                                                            
            Fecha                                                                                                   
        )                                                                                                           
        OUTPUT                                                                                                      
            inserted.IDBitacora,                                                                                    
            inserted.Entidad,                                                                                       
            inserted.IDRegistro,                                                                                    
            inserted.Accion,                                                                                        
            inserted.Fecha                                                                                          
        VALUES (                                                                                                    
            @Entidad,                                                                                               
            @IDRegistro,                                                                                            
            @Accion,                                                                                                
            @ValorAnterior,                                                                                         
            @ValorNuevo,                                                                                            
            @IDUsuario,                                                                                             
            @DireccionIP,                                                                                           
            SYSDATETIME()                                                                                           
        );                                                                                                          
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. CONSULTAR BITÁCORA CON FILTRO POR MÓDULO Y PAGINACIÓN (RF-09)                                             
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Bitacora_Consultar                                                                 
        @Entidad NVARCHAR(50) = NULL, -- Filtro por módulo                                                          
        @Accion NVARCHAR(20) = NULL,                                                                                
        @IDUsuario INT = NULL,                                                                                      
        @FechaInicio DATETIME2 = NULL,                                                                              
        @FechaFin DATETIME2 = NULL,                                                                                 
        @NumeroPagina INT = 1,                                                                                      
        @TamanoPagina INT = 25                                                                                      
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        IF @NumeroPagina < 1 SET @NumeroPagina = 1;                                                                 
        IF @TamanoPagina < 1 SET @TamanoPagina = 25;                                                                
                                                                                                                    
        DECLARE @Offset INT = (@NumeroPagina - 1) * @TamanoPagina;                                                  
                                                                                                                    
        SELECT                                                                                                      
            b.IDBitacora,                                                                                           
            b.Entidad,                                                                                              
            b.IDRegistro,                                                                                           
            b.Accion,                                                                                               
            b.ValorAnterior,                                                                                        
            b.ValorNuevo,                                                                                           
            b.IDUsuario,                                                                                            
            ISNULL(u.Nombre + ' ' + u.Apellido, 'Sistema / Anónimo') AS NombreUsuario,                              
            u.Correo AS CorreoUsuario,                                                                              
            b.DireccionIP,                                                                                          
            b.Fecha,                                                                                                
            COUNT(1) OVER() AS TotalRegistros                                                                       
        FROM Bitacora b                                                                                             
        LEFT JOIN Usuarios u ON b.IDUsuario = u.IDUsuario                                                           
        WHERE (@Entidad IS NULL OR b.Entidad = @Entidad)                                                            
          AND (@Accion IS NULL OR b.Accion = @Accion)                                                               
          AND (@IDUsuario IS NULL OR b.IDUsuario = @IDUsuario)                                                      
          AND (@FechaInicio IS NULL OR b.Fecha >= @FechaInicio)                                                     
          AND (@FechaFin IS NULL OR b.Fecha <= @FechaFin)                                                           
        ORDER BY b.Fecha DESC, b.IDBitacora DESC                                                                    
        OFFSET @Offset ROWS                                                                                         
        FETCH NEXT @TamanoPagina ROWS ONLY;                                                                         
    END;                                                                                                            
    GO   