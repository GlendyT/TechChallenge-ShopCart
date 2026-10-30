   -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 05_SP_Cupones.sql                                                                                    
    -- DESCRIPCIÓN: Procedimientos almacenados para administración y validación de cupones.                         
    -- ESTÁNDAR: Prefijo SP_Modulo_Proceso.                                                                         
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. CRUD DE CUPONES (RF-05)                                                                                   
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Cupones_Listar                                                                     
        @SoloActivos BIT = 0                                                                                        
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        SELECT                                                                                                      
            c.IDCupon,                                                                                              
            c.Codigo,                                                                                               
            c.TipoDescuento,                                                                                        
            c.ValorDescuento,                                                                                       
            c.MontoMinimoCompra,                                                                                    
            c.LimiteUsosTotal,                                                                                      
            c.UsosActuales,                                                                                         
            (c.LimiteUsosTotal - c.UsosActuales) AS UsosDisponibles,                                                
            c.LimiteUsosPorCliente,                                                                                 
            c.IDCategoria,                                                                                          
            cat.Nombre AS CategoriaRestringida,                                                                     
            c.FechaInicio,                                                                                          
            c.FechaFin,                                                                                             
            c.Activo,                                                                                               
            CASE                                                                                                    
                WHEN c.Activo = 0 THEN 'INACTIVO'                                                                   
                WHEN SYSDATETIME() < c.FechaInicio THEN 'PROGRAMADO'                                                
                WHEN SYSDATETIME() > c.FechaFin THEN 'VENCIDO'                                                      
                WHEN c.UsosActuales >= c.LimiteUsosTotal THEN 'AGOTADO'                                             
                ELSE 'VIGENTE'                                                                                      
            END AS EstadoVigencia,                                                                                  
            c.FechaCreacion                                                                                         
        FROM Cupones c                                                                                              
        LEFT JOIN Categorias cat ON c.IDCategoria = cat.IDCategoria                                                 
        WHERE (@SoloActivos = 0 OR c.Activo = 1)                                                                    
        ORDER BY c.FechaCreacion DESC;                                                                              
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Cupones_Crear                                                                      
        @Codigo NVARCHAR(30),                                                                                       
        @TipoDescuento NVARCHAR(20),                                                                                
        @ValorDescuento DECIMAL(12,2),                                                                              
        @MontoMinimoCompra DECIMAL(12,2) = 0,                                                                       
        @LimiteUsosTotal INT,                                                                                       
        @LimiteUsosPorCliente INT = 1,                                                                              
        @IDCategoria INT = NULL,                                                                                    
        @FechaInicio DATETIME2,                                                                                     
        @FechaFin DATETIME2                                                                                         
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        -- Validaciones de reglas de negocio                                                                        
        IF EXISTS (SELECT 1 FROM Cupones WHERE Codigo = @Codigo)                                                    
        BEGIN                                                                                                       
            RAISERROR('Ya existe un cupón con ese código.', 16, 1);                                                 
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @TipoDescuento NOT IN ('PORCENTAJE', 'MONTO_FIJO')                                                       
        BEGIN                                                                                                       
            RAISERROR('El tipo de descuento debe ser PORCENTAJE o MONTO_FIJO.', 16, 1);                             
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @TipoDescuento = 'PORCENTAJE' AND (@ValorDescuento <= 0 OR @ValorDescuento > 100)                        
        BEGIN                                                                                                       
            RAISERROR('El porcentaje de descuento debe estar entre 0.01 y 100.', 16, 1);                            
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @TipoDescuento = 'MONTO_FIJO' AND @ValorDescuento <= 0                                                   
        BEGIN                                                                                                       
            RAISERROR('El monto fijo de descuento debe ser mayor a cero.', 16, 1);                                  
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @FechaFin < @FechaInicio                                                                                 
        BEGIN                                                                                                       
            RAISERROR('La fecha de fin no puede ser anterior a la fecha de inicio.', 16, 1);                        
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @LimiteUsosTotal <= 0 OR @LimiteUsosPorCliente <= 0                                                      
        BEGIN                                                                                                       
            RAISERROR('Los límites de usos deben ser enteros mayores a cero.', 16, 1);                              
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        INSERT INTO Cupones (                                                                                       
            Codigo,                                                                                                 
            TipoDescuento,                                                                                          
            ValorDescuento,                                                                                         
            MontoMinimoCompra,                                                                                      
            LimiteUsosTotal,                                                                                        
            UsosActuales,                                                                                           
            LimiteUsosPorCliente,                                                                                   
            IDCategoria,                                                                                            
            FechaInicio,                                                                                            
            FechaFin,                                                                                               
            Activo                                                                                                  
        )                                                                                                           
        OUTPUT                                                                                                      
            inserted.IDCupon,                                                                                       
            inserted.Codigo,                                                                                        
            inserted.TipoDescuento,                                                                                 
            inserted.ValorDescuento,                                                                                
            inserted.MontoMinimoCompra,                                                                             
            inserted.LimiteUsosTotal,                                                                               
            inserted.LimiteUsosPorCliente,                                                                          
            inserted.Activo,                                                                                        
            inserted.FechaCreacion                                                                                  
        VALUES (                                                                                                    
            UPPER(LTRIM(RTRIM(@Codigo))),                                                                           
            @TipoDescuento,                                                                                         
            @ValorDescuento,                                                                                        
            @MontoMinimoCompra,                                                                                     
            @LimiteUsosTotal,                                                                                       
            0,                                                                                                      
            @LimiteUsosPorCliente,                                                                                  
            @IDCategoria,                                                                                           
            @FechaInicio,                                                                                           
            @FechaFin,                                                                                              
            1                                                                                                       
        );                                                                                                          
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Cupones_Desactivar                                                                 
        @IDCupon INT,                                                                                               
        @Activo BIT                                                                                                 
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        UPDATE Cupones                                                                                              
        SET Activo = @Activo                                                                                        
        WHERE IDCupon = @IDCupon;                                                                                   
                                                                                                                    
        IF @@ROWCOUNT = 0                                                                                           
        BEGIN                                                                                                       
            RAISERROR('El cupón no existe.', 16, 1);                                                                
            RETURN;                                                                                                 
        END                                                                                                         
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. VALIDAR Y CALCULAR CUPÓN SOBRE UN CARRITO (RF-05)                                                         
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Cupones_ValidarYAplicar                                                            
        @Codigo NVARCHAR(30),                                                                                       
        @IDUsuario INT,                                                                                             
        @IDCarrito INT                                                                                              
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        DECLARE @IDCupon INT;                                                                                       
        DECLARE @TipoDescuento NVARCHAR(20);                                                                        
        DECLARE @ValorDescuento DECIMAL(12,2);                                                                      
        DECLARE @MontoMinimoCompra DECIMAL(12,2);                                                                   
        DECLARE @LimiteUsosTotal INT;                                                                               
        DECLARE @UsosActuales INT;                                                                                  
        DECLARE @LimiteUsosPorCliente INT;                                                                          
        DECLARE @IDCategoriaRestringida INT;                                                                        
        DECLARE @FechaInicio DATETIME2;                                                                             
        DECLARE @FechaFin DATETIME2;                                                                                
        DECLARE @Activo BIT;                                                                                        
                                                                                                                    
        -- Buscar el cupón                                                                                          
        SELECT                                                                                                      
            @IDCupon = IDCupon,                                                                                     
            @TipoDescuento = TipoDescuento,                                                                         
            @ValorDescuento = ValorDescuento,                                                                       
            @MontoMinimoCompra = MontoMinimoCompra,                                                                 
            @LimiteUsosTotal = LimiteUsosTotal,                                                                     
            @UsosActuales = UsosActuales,                                                                           
            @LimiteUsosPorCliente = LimiteUsosPorCliente,                                                           
            @IDCategoriaRestringida = IDCategoria,                                                                  
            @FechaInicio = FechaInicio,                                                                             
            @FechaFin = FechaFin,                                                                                   
            @Activo = Activo                                                                                        
        FROM Cupones                                                                                                
        WHERE Codigo = UPPER(LTRIM(RTRIM(@Codigo)));                                                                
                                                                                                                    
        -- Criterios de aceptación RF-05: Mensajes específicos ante cada rechazo                                    
        IF @IDCupon IS NULL                                                                                         
        BEGIN                                                                                                       
            RAISERROR('El código de cupón ingresado no existe.', 16, 1);                                            
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @Activo = 0                                                                                              
        BEGIN                                                                                                       
            RAISERROR('El cupón se encuentra inactivo.', 16, 1);                                                    
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF SYSDATETIME() < @FechaInicio                                                                             
        BEGIN                                                                                                       
            RAISERROR('El cupón aún no entra en vigencia.', 16, 1);                                                 
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF SYSDATETIME() > @FechaFin                                                                                
        BEGIN                                                                                                       
            RAISERROR('El cupón ha vencido.', 16, 1);                                                               
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @UsosActuales >= @LimiteUsosTotal                                                                        
        BEGIN                                                                                                       
            RAISERROR('El cupón ha alcanzado su límite total de usos disponibles.', 16, 1);                         
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Validar límite de usos por cliente                                                                       
        DECLARE @UsosCliente INT = 0;                                                                               
        SELECT @UsosCliente = COUNT(1)                                                                              
        FROM CuponUsos                                                                                              
        WHERE IDCupon = @IDCupon AND IDUsuario = @IDUsuario;                                                        
                                                                                                                    
        IF @UsosCliente >= @LimiteUsosPorCliente                                                                    
        BEGIN                                                                                                       
            RAISERROR('Ya has alcanzado el límite máximo de usos permitido para este cupón.', 16, 1);               
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Calcular el subtotal aplicable del carrito                                                               
        DECLARE @SubtotalAplicable DECIMAL(12,2) = 0.00;                                                            
                                                                                                                    
        IF @IDCategoriaRestringida IS NULL                                                                          
        BEGIN                                                                                                       
            -- Aplica a todo el carrito                                                                             
            SELECT @SubtotalAplicable = ISNULL(SUM(cd.Cantidad * v.Precio), 0.00)                                   
            FROM CarritoDetalles cd                                                                                 
            INNER JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                  
            WHERE cd.IDCarrito = @IDCarrito;                                                                        
        END                                                                                                         
        ELSE                                                                                                        
        BEGIN                                                                                                       
            -- Aplica solo a productos de la categoría indicada                                                     
            SELECT @SubtotalAplicable = ISNULL(SUM(cd.Cantidad * v.Precio), 0.00)                                   
            FROM CarritoDetalles cd                                                                                 
            INNER JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                  
            INNER JOIN Productos pr ON v.IDProducto = pr.IDProducto                                                 
            WHERE cd.IDCarrito = @IDCarrito AND pr.IDCategoria = @IDCategoriaRestringida;                           
                                                                                                                    
            IF @SubtotalAplicable <= 0
            BEGIN
                RAISERROR('El cupón aplica exclusivamente a productos de una categoría que no está en tu carrito.', 16, 1);
                RETURN;
            END
        END

        -- Validar monto mínimo de compra
        IF @SubtotalAplicable < @MontoMinimoCompra
        BEGIN
            DECLARE @MsgMinimo NVARCHAR(200) = FORMATMESSAGE('El cupón requiere una compra mínima aplicable de Q%s (actual: Q%s).',                                                                                        
                CONVERT(NVARCHAR(20), @MontoMinimoCompra),                                                          
                CONVERT(NVARCHAR(20), @SubtotalAplicable)                                                           
            );                                                                                                      
            RAISERROR(@MsgMinimo, 16, 1);                                                                           
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Calcular monto de descuento                                                                              
        DECLARE @MontoDescuento DECIMAL(12,2) = 0.00;                                                               
                                                                                                                    
        IF @TipoDescuento = 'PORCENTAJE'                                                                            
        BEGIN                                                                                                       
            SET @MontoDescuento = ROUND((@SubtotalAplicable * (@ValorDescuento / 100.0)), 2);                       
        END                                                                                                         
        ELSE -- MONTO_FIJO                                                                                          
        BEGIN                                                                                                       
            -- Criterio de aceptación RF-05: El descuento nunca deja el total por debajo de cero                    
            IF @ValorDescuento > @SubtotalAplicable                                                                 
                SET @MontoDescuento = @SubtotalAplicable;                                                           
            ELSE                                                                                                    
                SET @MontoDescuento = @ValorDescuento;                                                              
        END                                                                                                         
                                                                                                                    
        -- Retornar resultado exitoso                                                                               
        SELECT                                                                                                      
            @IDCupon AS IDCupon,                                                                                    
            @Codigo AS Codigo,                                                                                      
            @TipoDescuento AS TipoDescuento,                                                                        
            @ValorDescuento AS ValorDescuento,                                                                      
            @SubtotalAplicable AS SubtotalAplicable,                                                                
            @MontoDescuento AS MontoDescuento,                                                                      
            CAST((@SubtotalAplicable - @MontoDescuento) AS DECIMAL(12,2)) AS TotalConDescuento;                     
    END;                                                                                                            
    GO 