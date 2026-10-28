  -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 04_SP_Carrito.sql                                                                                    
    -- DESCRIPCIÓN: Procedimientos almacenados para carrito de compras e items.                                     
    -- ESTÁNDAR: Prefijo SP_Modulo_Proceso.                                                                         
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. OBTENER O CREAR CARRITO (RF-04)                                                                           
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Carrito_ObtenerOCrear                                                              
        @IDUsuario INT = NULL,                                                                                      
        @TokenInvitado NVARCHAR(100) = NULL                                                                         
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        IF @IDUsuario IS NULL AND (@TokenInvitado IS NULL OR LTRIM(RTRIM(@TokenInvitado)) = '')                     
        BEGIN                                                                                                       
            RAISERROR('Debe proporcionar un ID de usuario o un Token de invitado válido.', 16, 1);                  
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        DECLARE @IDCarrito INT;                                                                                     
                                                                                                                    
        -- Buscar carrito activo existente                                                                          
        IF @IDUsuario IS NOT NULL                                                                                   
        BEGIN                                                                                                       
            SELECT TOP 1 @IDCarrito = IDCarrito                                                                     
            FROM Carritos                                                                                           
            WHERE IDUsuario = @IDUsuario AND Activo = 1                                                             
            ORDER BY FechaUltimaActividad DESC;                                                                     
        END                                                                                                         
        ELSE                                                                                                        
        BEGIN                                                                                                       
            SELECT TOP 1 @IDCarrito = IDCarrito                                                                     
            FROM Carritos                                                                                           
            WHERE TokenInvitado = @TokenInvitado AND Activo = 1;                                                    
        END                                                                                                         
                                                                                                                    
        -- Si no existe, crearlo de forma atómica                                                                   
        IF @IDCarrito IS NULL                                                                                       
        BEGIN                                                                                                       
            BEGIN TRANSACTION;                                                                                      
                                                                                                                    
            DECLARE @NewCart TABLE (IDCarrito INT);                                                                 
                                                                                                                    
            INSERT INTO Carritos (IDUsuario, TokenInvitado, FechaCreacion, FechaUltimaActividad, Activo)            
            OUTPUT inserted.IDCarrito INTO @NewCart                                                                 
            VALUES (@IDUsuario, @TokenInvitado, SYSDATETIME(), SYSDATETIME(), 1);                                   
                                                                                                                    
            SET @IDCarrito = (SELECT TOP 1 IDCarrito FROM @NewCart);                                                
                                                                                                                    
            COMMIT TRANSACTION;                                                                                     
        END                                                                                                         
        ELSE                                                                                                        
        BEGIN                                                                                                       
            -- Actualizar timestamp de actividad                                                                    
            UPDATE Carritos                                                                                         
            SET FechaUltimaActividad = SYSDATETIME()                                                                
            WHERE IDCarrito = @IDCarrito;                                                                           
        END                                                                                                         
                                                                                                                    
        -- Resultado 1: Cabecera y totales del Carrito                                                              
        SELECT                                                                                                      
            c.IDCarrito,                                                                                            
            c.CodigoPublico,                                                                                        
            c.IDUsuario,                                                                                            
            c.TokenInvitado,                                                                                        
            c.FechaCreacion,                                                                                        
            c.FechaUltimaActividad,                                                                                 
            ISNULL(SUM(cd.Cantidad), 0) AS TotalArticulos,                                                          
            ISNULL(SUM(cd.Cantidad * v.Precio), 0.00) AS Subtotal                                                   
        FROM Carritos c                                                                                             
        LEFT JOIN CarritoDetalles cd ON c.IDCarrito = cd.IDCarrito                                                  
        LEFT JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                       
        WHERE c.IDCarrito = @IDCarrito                                                                              
        GROUP BY                                                                                                    
            c.IDCarrito,                                                                                            
            c.CodigoPublico,                                                                                        
            c.IDUsuario,                                                                                            
            c.TokenInvitado,                                                                                        
            c.FechaCreacion,                                                                                        
            c.FechaUltimaActividad;                                                                                 
                                                                                                                    
        -- Resultado 2: Líneas de detalle del Carrito                                                               
        SELECT                                                                                                      
            cd.IDCarritoDetalle,                                                                                    
            cd.IDVariante,                                                                                          
            v.IDProducto,                                                                                           
            pr.CodigoPublico AS CodigoPublicoProducto,                                                              
            pr.Nombre AS NombreProducto,                                                                            
            v.SKU,                                                                                                  
            v.Nombre AS NombreVariante,                                                                             
            v.Talla,                                                                                                
            v.Color,                                                                                                
            v.Precio AS PrecioUnitario,                                                                             
            cd.Cantidad,                                                                                            
            CAST((cd.Cantidad * v.Precio) AS DECIMAL(12,2)) AS SubtotalLinea,                                       
            inv.ExistenciaDisponible,                                                                               
            (                                                                                                       
                SELECT TOP 1 pi.ImagenURL                                                                           
                FROM ProductoImagenes pi                                                                            
                WHERE pi.IDProducto = pr.IDProducto                                                                 
                ORDER BY pi.EsPrincipal DESC, pi.Orden ASC                                                          
            ) AS ImagenURL,                                                                                         
            cd.FechaAgregado                                                                                        
        FROM CarritoDetalles cd                                                                                     
        INNER JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                      
        INNER JOIN Productos pr ON v.IDProducto = pr.IDProducto                                                     
        OUTER APPLY FU_Inventario_ConsultarDisponibilidad(v.IDVariante) inv                                         
        WHERE cd.IDCarrito = @IDCarrito                                                                             
        ORDER BY cd.FechaAgregado ASC;                                                                              
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. AGREGAR O MODIFICAR CANTIDAD DE ITEM EN EL CARRITO (RF-04)                                                
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Carrito_AgregarOActualizarItem                                                     
        @IDCarrito INT,                                                                                             
        @IDVariante INT,                                                                                            
        @Cantidad INT -- Cantidad exacta deseada                                                                    
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        IF @Cantidad <= 0                                                                                           
        BEGIN                                                                                                       
            -- Si la cantidad es <= 0, equivale a eliminar el item                                                  
            EXEC SP_Carrito_EliminarItem @IDCarrito = @IDCarrito, @IDVariante = @IDVariante;                        
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Validar existencia disponible (Criterio de aceptación RF-04)                                             
        DECLARE @StockDisponible INT;                                                                               
        SELECT @StockDisponible = ExistenciaDisponible                                                              
        FROM FU_Inventario_ConsultarDisponibilidad(@IDVariante);                                                    
                                                                                                                    
        IF @StockDisponible IS NULL                                                                                 
        BEGIN                                                                                                       
            RAISERROR('La variante seleccionada no existe.', 16, 1);                                                
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @Cantidad > @StockDisponible                                                                             
        BEGIN                                                                                                       
            DECLARE @MsgError NVARCHAR(200) = FORMATMESSAGE('No es posible agregar %d unidades. Solo hay %d         
            disponibles.', @Cantidad, @StockDisponible);                                                            
            RAISERROR(@MsgError, 16, 1);                                                                            
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        IF EXISTS (SELECT 1 FROM CarritoDetalles WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante)         
        BEGIN                                                                                                       
            UPDATE CarritoDetalles                                                                                  
            SET Cantidad = @Cantidad                                                                                
            WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;                                              
        END                                                                                                         
        ELSE                                                                                                        
        BEGIN                                                                                                       
            INSERT INTO CarritoDetalles (IDCarrito, IDVariante, Cantidad, FechaAgregado)                            
            VALUES (@IDCarrito, @IDVariante, @Cantidad, SYSDATETIME());                                             
        END                                                                                                         
                                                                                                                    
        UPDATE Carritos                                                                                             
        SET FechaUltimaActividad = SYSDATETIME()                                                                    
        WHERE IDCarrito = @IDCarrito;                                                                               
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
                                                                                                                    
        -- Retornar el detalle actualizado del item                                                                 
        SELECT                                                                                                      
            cd.IDCarritoDetalle,                                                                                    
            cd.IDCarrito,                                                                                           
            cd.IDVariante,                                                                                          
            cd.Cantidad,                                                                                            
            @StockDisponible AS ExistenciaDisponible                                                                
        FROM CarritoDetalles cd                                                                                     
        WHERE cd.IDCarrito = @IDCarrito AND cd.IDVariante = @IDVariante;                                            
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 3. ELIMINAR ITEM Y VACIAR CARRITO (RF-04)                                                                    
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Carrito_EliminarItem                                                               
        @IDCarrito INT,                                                                                             
        @IDVariante INT                                                                                             
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        DELETE FROM CarritoDetalles                                                                                 
        WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;                                                  
                                                                                                                    
        UPDATE Carritos                                                                                             
        SET FechaUltimaActividad = SYSDATETIME()                                                                    
        WHERE IDCarrito = @IDCarrito;                                                                               
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Carrito_Vaciar                                                                     
        @IDCarrito INT                                                                                              
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        DELETE FROM CarritoDetalles                                                                                 
        WHERE IDCarrito = @IDCarrito;                                                                               
                                                                                                                    
        UPDATE Carritos                                                                                             
        SET FechaUltimaActividad = SYSDATETIME()                                                                    
        WHERE IDCarrito = @IDCarrito;                                                                               
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 4. FUSIONAR CARRITO DE INVITADO A USUARIO LOGUEADO (RF-04)                                                   
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Carrito_MigrarInvitadoAUsuario                                                     
        @TokenInvitado NVARCHAR(100),                                                                               
        @IDUsuario INT                                                                                              
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        DECLARE @IDCarritoInvitado INT;                                                                             
        DECLARE @IDCarritoUsuario INT;                                                                              
                                                                                                                    
        SELECT @IDCarritoInvitado = IDCarrito FROM Carritos WHERE TokenInvitado = @TokenInvitado AND Activo = 1;    
                                                                                                                    
        -- Si no hay carrito de invitado con ese token, no hay nada que fusionar                                    
        IF @IDCarritoInvitado IS NULL RETURN;                                                                       
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        -- Obtener o crear el carrito persistente del usuario                                                       
        SELECT TOP 1 @IDCarritoUsuario = IDCarrito FROM Carritos WHERE IDUsuario = @IDUsuario AND Activo = 1;       
                                                                                                                    
        IF @IDCarritoUsuario IS NULL                                                                                
        BEGIN                                                                                                       
            -- Si el usuario no tenía carrito, simplemente convertimos el carrito de invitado en el del usuario     
            UPDATE Carritos                                                                                         
            SET                                                                                                     
                IDUsuario = @IDUsuario,                                                                             
                TokenInvitado = NULL,                                                                               
                FechaUltimaActividad = SYSDATETIME()                                                                
            WHERE IDCarrito = @IDCarritoInvitado;                                                                   
        END                                                                                                         
        ELSE                                                                                                        
        BEGIN                                                                                                       
            -- Fusionar los items del carrito de invitado al carrito del usuario                                    
            MERGE CarritoDetalles AS target                                                                         
            USING (SELECT IDVariante, Cantidad FROM CarritoDetalles WHERE IDCarrito = @IDCarritoInvitado) AS source 
            ON (target.IDCarrito = @IDCarritoUsuario AND target.IDVariante = source.IDVariante)                     
            WHEN MATCHED THEN                                                                                       
                UPDATE SET target.Cantidad = target.Cantidad + source.Cantidad                                      
            WHEN NOT MATCHED THEN                                                                                   
                INSERT (IDCarrito, IDVariante, Cantidad, FechaAgregado)                                             
                VALUES (@IDCarritoUsuario, source.IDVariante, source.Cantidad, SYSDATETIME());                      
                                                                                                                    
            -- Desactivar el carrito de invitado una vez fusionado                                                  
            UPDATE Carritos SET Activo = 0 WHERE IDCarrito = @IDCarritoInvitado;                                    
        END                                                                                                         
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
    END;                                                                                                            
    GO          