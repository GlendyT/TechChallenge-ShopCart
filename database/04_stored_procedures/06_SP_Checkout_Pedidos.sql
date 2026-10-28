  -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 06_SP_Checkout_Pedidos.sql                                                                           
    -- DESCRIPCIÓN: Procedimientos almacenados para checkout, pedidos y devoluciones.                               
    -- ESTÁNDAR: Prefijo SP_Modulo_Proceso.                                                                         
    -- CONCURRENCIA: Bloqueo pesimista (UPDLOCK, HOLDLOCK) contra sobreventa.                                       
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. INICIAR RESERVA DE EXISTENCIAS POR 15 MINUTOS (RF-06)                                                     
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Checkout_IniciarReserva                                                            
        @IDUsuario INT,                                                                                             
        @IDCarrito INT,                                                                                             
        @ClaveIdempotencia NVARCHAR(100)                                                                            
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        -- 1. Validar Idempotencia de la reserva                                                                    
        DECLARE @IDReservaExistente INT;                                                                            
        SELECT @IDReservaExistente = IDReserva                                                                      
        FROM Reservas                                                                                               
        WHERE ClaveIdempotencia = @ClaveIdempotencia;                                                               
                                                                                                                    
        IF @IDReservaExistente IS NOT NULL                                                                          
        BEGIN                                                                                                       
            -- Si ya existe, retornar la reserva previamente creada                                                 
            SELECT                                                                                                  
                IDReserva,                                                                                          
                IDUsuario,                                                                                          
                ClaveIdempotencia,                                                                                  
                Estado,                                                                                             
                FechaExpiracion,                                                                                    
                FechaCreacion                                                                                       
            FROM Reservas                                                                                           
            WHERE IDReserva = @IDReservaExistente;                                                                  
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- 2. Validar que el carrito tenga artículos                                                                
        IF NOT EXISTS (SELECT 1 FROM CarritoDetalles WHERE IDCarrito = @IDCarrito)                                  
        BEGIN                                                                                                       
            RAISERROR('El carrito de compras se encuentra vacío.', 16, 1);                                          
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        -- Bloqueo pesimista sobre las variantes del carrito para validar stock sin sobreventa                      
        -- Criterio de aceptación RF-06: Si 2 clientes intentan comprar la última unidad, solo uno lo logra         
        DECLARE @VarianteSinStock NVARCHAR(100);                                                                    
        DECLARE @StockDisponible INT;                                                                               
                                                                                                                    
        SELECT TOP 1                                                                                                
            @VarianteSinStock = v.Nombre,                                                                           
            @StockDisponible = (                                                                                    
                v.ExistenciaFisica - ISNULL((                                                                       
                    SELECT SUM(rd.Cantidad)                                                                         
                    FROM ReservaDetalles rd                                                                         
                    INNER JOIN Reservas r ON rd.IDReserva = r.IDReserva                                             
                    WHERE rd.IDVariante = v.IDVariante                                                              
                      AND r.Estado = 'ACTIVA'                                                                       
                      AND r.FechaExpiracion > SYSDATETIME()                                                         
                ), 0)                                                                                               
            )                                                                                                       
        FROM CarritoDetalles cd                                                                                     
        INNER JOIN Variantes v WITH (UPDLOCK, HOLDLOCK) ON cd.IDVariante = v.IDVariante                             
        WHERE cd.IDCarrito = @IDCarrito                                                                             
          AND cd.Cantidad > (                                                                                       
                v.ExistenciaFisica - ISNULL((                                                                       
                    SELECT SUM(rd.Cantidad)                                                                         
                    FROM ReservaDetalles rd                                                                         
                    INNER JOIN Reservas r ON rd.IDReserva = r.IDReserva                                             
                    WHERE rd.IDVariante = v.IDVariante                                                              
                      AND r.Estado = 'ACTIVA'                                                                       
                      AND r.FechaExpiracion > SYSDATETIME()                                                         
                ), 0)                                                                                               
          );                                                                                                        
                                                                                                                    
        IF @VarianteSinStock IS NOT NULL                                                                            
        BEGIN                                                                                                       
            ROLLBACK TRANSACTION;                                                                                   
            DECLARE @MsgSinStock NVARCHAR(250) = FORMATMESSAGE('No hay existencias disponibles suficientes para el  
            producto: %s.', @VarianteSinStock);                                                                     
            RAISERROR(@MsgSinStock, 16, 1);                                                                         
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- 3. Crear cabecera de la Reserva con expiración a 15 minutos                                              
        DECLARE @FechaExpiracion DATETIME2 = DATEADD(MINUTE, 15, SYSDATETIME());                                    
        DECLARE @NewReserva TABLE (IDReserva INT);                                                                  
                                                                                                                    
        INSERT INTO Reservas (IDUsuario, ClaveIdempotencia, Estado, FechaExpiracion, FechaCreacion)                 
        OUTPUT inserted.IDReserva INTO @NewReserva                                                                  
        VALUES (@IDUsuario, @ClaveIdempotencia, 'ACTIVA', @FechaExpiracion, SYSDATETIME());                         
                                                                                                                    
        DECLARE @IDReservaNueva INT = (SELECT TOP 1 IDReserva FROM @NewReserva);                                    
                                                                                                                    
        -- 4. Apartar las cantidades en ReservaDetalles                                                             
        INSERT INTO ReservaDetalles (IDReserva, IDVariante, Cantidad)                                               
        SELECT @IDReservaNueva, cd.IDVariante, cd.Cantidad                                                          
        FROM CarritoDetalles cd                                                                                     
        WHERE cd.IDCarrito = @IDCarrito;                                                                            
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
                                                                                                                    
        -- Retornar la reserva creada                                                                               
        SELECT                                                                                                      
            IDReserva,                                                                                              
            IDUsuario,                                                                                              
            ClaveIdempotencia,                                                                                      
            Estado,                                                                                                 
            FechaExpiracion,                                                                                        
            FechaCreacion                                                                                           
        FROM Reservas                                                                                               
        WHERE IDReserva = @IDReservaNueva;                                                                          
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. CONFIRMAR CHECKOUT Y CREAR PEDIDO ATÓMICO (RF-06)                                                         
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Checkout_ConfirmarPedido                                                           
        @IDUsuario INT,                                                                                             
        @IDDireccionEntrega INT,                                                                                    
        @IDCarrito INT,                                                                                             
        @ClaveIdempotencia NVARCHAR(100),                                                                           
        @MetodoPago NVARCHAR(50),                                                                                   
        @IDTransaccionPago NVARCHAR(100),                                                                           
        @CodigoCupon NVARCHAR(30) = NULL                                                                            
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        -- 1. Idempotencia: Si la clave ya fue procesada, retornar el pedido existente                              
        DECLARE @IDPedidoExistente INT;                                                                             
        SELECT @IDPedidoExistente = IDPedido                                                                        
        FROM Pedidos                                                                                                
        WHERE ClaveIdempotencia = @ClaveIdempotencia;                                                               
                                                                                                                    
        IF @IDPedidoExistente IS NOT NULL                                                                           
        BEGIN                                                                                                       
            SELECT                                                                                                  
                p.IDPedido,                                                                                         
                p.CodigoPublico,                                                                                    
                p.NumeroPedido,                                                                                     
                p.Estado,                                                                                           
                p.Total,                                                                                            
                p.FechaCreacion,                                                                                    
                'PEDIDO_PREVIAMENTE_PROCESADO' AS Mensaje                                                           
            FROM Pedidos p                                                                                          
            WHERE p.IDPedido = @IDPedidoExistente;                                                                  
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- 2. Validar que la dirección pertenezca al usuario                                                        
        DECLARE @SnapshotDireccion NVARCHAR(MAX);                                                                   
        SELECT @SnapshotDireccion =                                                                                 
            d.NombreDestinatario + ', Tel: ' + d.TelefonoContacto + CHAR(13) + CHAR(10) +                           
            d.DireccionLinea1 + ISNULL(', ' + d.DireccionLinea2, '') + CHAR(13) + CHAR(10) +                        
            d.Ciudad + ', ' + d.Departamento + ISNULL(' CP: ' + d.CodigoPostal, '')                                 
        FROM Direcciones d                                                                                          
        WHERE d.IDDireccion = @IDDireccionEntrega AND d.IDUsuario = @IDUsuario AND d.Activo = 1;                    
                                                                                                                    
        IF @SnapshotDireccion IS NULL                                                                               
        BEGIN                                                                                                       
            RAISERROR('La dirección de entrega seleccionada no es válida o no pertenece al cliente.', 16, 1);       
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- 3. Validar contenido del carrito                                                                         
        IF NOT EXISTS (SELECT 1 FROM CarritoDetalles WHERE IDCarrito = @IDCarrito)                                  
        BEGIN                                                                                                       
            RAISERROR('El carrito está vacío. No se puede generar un pedido.', 16, 1);                              
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        -- 4. Validar y bloquear existencias físicas de cada variante en el carrito                                 
        DECLARE @VarianteAgotada NVARCHAR(100);                                                                     
        SELECT TOP 1 @VarianteAgotada = v.Nombre                                                                    
        FROM CarritoDetalles cd                                                                                     
        INNER JOIN Variantes v WITH (UPDLOCK, HOLDLOCK) ON cd.IDVariante = v.IDVariante                             
        WHERE cd.IDCarrito = @IDCarrito AND v.ExistenciaFisica < cd.Cantidad;                                       
                                                                                                                    
        IF @VarianteAgotada IS NOT NULL                                                                             
        BEGIN                                                                                                       
            ROLLBACK TRANSACTION;                                                                                   
            DECLARE @MsgAgotado NVARCHAR(250) = FORMATMESSAGE('No hay inventario físico suficiente para: %s.',      
            @VarianteAgotada);                                                                                      
            RAISERROR(@MsgAgotado, 16, 1);                                                                          
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- 5. Calcular Subtotal del carrito                                                                         
        DECLARE @Subtotal DECIMAL(12,2) = 0.00;                                                                     
        SELECT @Subtotal = SUM(cd.Cantidad * v.Precio)                                                              
        FROM CarritoDetalles cd                                                                                     
        INNER JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                      
        WHERE cd.IDCarrito = @IDCarrito;                                                                            
                                                                                                                    
        -- 6. Validar y aplicar cupón si se proporcionó                                                             
        DECLARE @IDCupon INT = NULL;                                                                                
        DECLARE @Descuento DECIMAL(12,2) = 0.00;                                                                    
                                                                                                                    
        IF @CodigoCupon IS NOT NULL AND LTRIM(RTRIM(@CodigoCupon)) <> ''                                            
        BEGIN                                                                                                       
            SELECT                                                                                                  
                @IDCupon = c.IDCupon                                                                                
            FROM Cupones c WITH (UPDLOCK, HOLDLOCK) -- Bloqueo de cupón para respetar concurrencia de límite total  
            WHERE c.Codigo = UPPER(LTRIM(RTRIM(@CodigoCupon)))                                                      
              AND c.Activo = 1                                                                                      
              AND SYSDATETIME() BETWEEN c.FechaInicio AND c.FechaFin                                                
              AND c.UsosActuales < c.LimiteUsosTotal;                                                               
                                                                                                                    
            IF @IDCupon IS NULL                                                                                     
            BEGIN                                                                                                   
                ROLLBACK TRANSACTION;                                                                               
                RAISERROR('El cupón ingresado no es válido, está vencido o agotado.', 16, 1);                       
                RETURN;                                                                                             
            END                                                                                                     
                                                                                                                    
            -- Validar límite de usos por cliente                                                                   
            IF (SELECT COUNT(1) FROM CuponUsos WHERE IDCupon = @IDCupon AND IDUsuario = @IDUsuario) >=              
               (SELECT LimiteUsosPorCliente FROM Cupones WHERE IDCupon = @IDCupon)                                  
            BEGIN                                                                                                   
                ROLLBACK TRANSACTION;                                                                               
                RAISERROR('Has alcanzado el límite de usos permitido para este cupón.', 16, 1);                     
                RETURN;                                                                                             
            END                                                                                                     
                                                                                                                    
            -- Calcular descuento del cupón                                                                         
            SELECT @Descuento = MontoDescuento                                                                      
            FROM FU_Cupones_CalculoDescuento(@IDCupon, @Subtotal);                                                  
                                                                                                                    
            -- Incrementar uso del cupón                                                                            
            UPDATE Cupones                                                                                          
            SET UsosActuales = UsosActuales + 1                                                                     
            WHERE IDCupon = @IDCupon;                                                                               
        END                                                                                                         
                                                                                                                    
        -- 7. Totales (Precios con IVA 12% incluido en quetzales)                                                   
        DECLARE @Total DECIMAL(12,2) = @Subtotal - @Descuento;                                                      
        IF @Total < 0 SET @Total = 0.00;                                                                            
                                                                                                                    
        -- El IVA incluido desglosado es: Total - (Total / 1.12)                                                    
        DECLARE @IVA DECIMAL(12,2) = ROUND(@Total - (@Total / 1.12), 2);                                            
                                                                                                                    
        -- Generar Número de Pedido único tipo ORD-YYYYMMDD-XXXX                                                    
        DECLARE @FechaHoyStr NVARCHAR(8) = CONVERT(NVARCHAR(8), GETDATE(), 112);                                    
        DECLARE @CorrelativoDia INT;                                                                                
                                                                                                                    
        SELECT @CorrelativoDia = COUNT(1) + 1                                                                       
        FROM Pedidos                                                                                                
        WHERE CAST(FechaCreacion AS DATE) = CAST(GETDATE() AS DATE);                                                
                                                                                                                    
        DECLARE @NumeroPedido NVARCHAR(30) = 'ORD-' + @FechaHoyStr + '-' + RIGHT('0000' + CAST(@CorrelativoDia AS   
        NVARCHAR(10)), 4);                                                                                          
                                                                                                                    
        -- 8. Insertar cabecera del Pedido                                                                          
        DECLARE @NewPedido TABLE (IDPedido INT, CodigoPublico UNIQUEIDENTIFIER);                                    
                                                                                                                    
        INSERT INTO Pedidos (                                                                                       
            NumeroPedido,                                                                                           
            IDUsuario,                                                                                              
            IDDireccionEntrega,                                                                                     
            DireccionEntregaSnapshot,                                                                               
            IDCupon,                                                                                                
            CodigoCuponSnapshot,                                                                                    
            Subtotal,                                                                                               
            Descuento,                                                                                              
            IVA,                                                                                                    
            Total,                                                                                                  
            Estado,                                                                                                 
            ClaveIdempotencia,                                                                                      
            MetodoPago,                                                                                             
            IDTransaccionPago,                                                                                      
            FechaCreacion                                                                                           
        )                                                                                                           
        OUTPUT inserted.IDPedido, inserted.CodigoPublico INTO @NewPedido                                            
        VALUES (                                                                                                    
            @NumeroPedido,                                                                                          
            @IDUsuario,                                                                                             
            @IDDireccionEntrega,                                                                                    
            @SnapshotDireccion,                                                                                     
            @IDCupon,                                                                                               
            @CodigoCupon,                                                                                           
            @Subtotal,                                                                                              
            @Descuento,                                                                                             
            @IVA,                                                                                                   
            @Total,                                                                                                 
            'PAGADO', -- Estado inicial tras confirmación exitosa de pago                                           
            @ClaveIdempotencia,                                                                                     
            @MetodoPago,                                                                                            
            @IDTransaccionPago,                                                                                     
            SYSDATETIME()                                                                                           
        );                                                                                                          
                                                                                                                    
        DECLARE @IDPedidoNuevo INT = (SELECT TOP 1 IDPedido FROM @NewPedido);                                       
        DECLARE @CodigoPublicoPedido UNIQUEIDENTIFIER = (SELECT TOP 1 CodigoPublico FROM @NewPedido);               
                                                                                                                    
        -- 9. Congelar detalles del Pedido (precios, descripciones y SKU snapshots)                                 
        INSERT INTO PedidoDetalles (                                                                                
            IDPedido,                                                                                               
            IDVariante,                                                                                             
            SKUSnapshot,                                                                                            
            NombreProductoSnapshot,                                                                                 
            NombreVarianteSnapshot,                                                                                 
            Cantidad,                                                                                               
            PrecioUnitario,                                                                                         
            DescuentoUnitario,                                                                                      
            Subtotal,                                                                                               
            CantidadDevuelta                                                                                        
        )                                                                                                           
        SELECT                                                                                                      
            @IDPedidoNuevo,                                                                                         
            cd.IDVariante,                                                                                          
            v.SKU,                                                                                                  
            pr.Nombre,                                                                                              
            v.Nombre,                                                                                               
            cd.Cantidad,                                                                                            
            v.Precio,                                                                                               
            0.00,                                                                                                   
            CAST((cd.Cantidad * v.Precio) AS DECIMAL(12,2)),                                                        
            0                                                                                                       
        FROM CarritoDetalles cd                                                                                     
        INNER JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                      
        INNER JOIN Productos pr ON v.IDProducto = pr.IDProducto                                                     
        WHERE cd.IDCarrito = @IDCarrito;                                                                            
                                                                                                                    
        -- 10. Descontar Existencia Física y Registrar Salida en Kardex por cada Variante                           
        DECLARE curItems CURSOR LOCAL FAST_FORWARD FOR                                                              
            SELECT cd.IDVariante, cd.Cantidad, v.ExistenciaFisica                                                   
            FROM CarritoDetalles cd                                                                                 
            INNER JOIN Variantes v ON cd.IDVariante = v.IDVariante                                                  
            WHERE cd.IDCarrito = @IDCarrito;                                                                        
                                                                                                                    
        OPEN curItems;                                                                                              
        DECLARE @VarID INT, @VarCant INT, @VarStockActual INT;                                                      
                                                                                                                    
        FETCH NEXT FROM curItems INTO @VarID, @VarCant, @VarStockActual;                                            
        WHILE @@FETCH_STATUS = 0                                                                                    
        BEGIN                                                                                                       
            -- Descontar inventario físico                                                                          
            UPDATE Variantes                                                                                        
            SET ExistenciaFisica = ExistenciaFisica - @VarCant                                                      
            WHERE IDVariante = @VarID;                                                                              
                                                                                                                    
            -- Registrar movimiento en Kardex                                                                       
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
            VALUES (                                                                                                
                @VarID,                                                                                             
                @IDUsuario,                                                                                         
                'SALIDA_VENTA',                                                                                     
                @VarCant,                                                                                           
                @VarStockActual,                                                                                    
                (@VarStockActual - @VarCant),                                                                       
                'Venta en Pedido: ' + @NumeroPedido,                                                                
                @IDPedidoNuevo                                                                                      
            );                                                                                                      
                                                                                                                    
            FETCH NEXT FROM curItems INTO @VarID, @VarCant, @VarStockActual;                                        
        END;                                                                                                        
                                                                                                                    
        CLOSE curItems;                                                                                             
        DEALLOCATE curItems;                                                                                        
                                                                                                                    
        -- 11. Registrar uso de cupón si aplicó                                                                     
        IF @IDCupon IS NOT NULL AND @Descuento > 0                                                                  
        BEGIN                                                                                                       
            INSERT INTO CuponUsos (IDCupon, IDUsuario, IDPedido, MontoDescontado, FechaUso)                         
            VALUES (@IDCupon, @IDUsuario, @IDPedidoNuevo, @Descuento, SYSDATETIME());                               
        END                                                                                                         
                                                                                                                    
        -- 12. Registrar estado inicial en el Historial de Pedidos                                                  
        INSERT INTO PedidoHistorialEstados (IDPedido, EstadoAnterior, EstadoNuevo, IDUsuario, Motivo, Fecha)        
        VALUES (@IDPedidoNuevo, NULL, 'PAGADO', @IDUsuario, 'Pedido creado y pagado exitosamente', SYSDATETIME());  
                                                                                                                    
        -- 13. Marcar reservas activas del usuario como CONFIRMADAS                                                 
        UPDATE Reservas                                                                                             
        SET Estado = 'CONFIRMADA'                                                                                   
        WHERE IDUsuario = @IDUsuario AND Estado = 'ACTIVA';                                                         
                                                                                                                    
        -- 14. Vaciar el carrito de compras                                                                         
        DELETE FROM CarritoDetalles WHERE IDCarrito = @IDCarrito;                                                   
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
                                                                                                                    
        -- Retornar el Pedido Confirmado                                                                            
        SELECT                                                                                                      
            p.IDPedido,                                                                                             
            p.CodigoPublico,                                                                                        
            p.NumeroPedido,                                                                                         
            p.Estado,                                                                                               
            p.Subtotal,                                                                                             
            p.Descuento,                                                                                            
            p.IVA,                                                                                                  
            p.Total,                                                                                                
            p.MetodoPago,                                                                                           
            p.FechaCreacion,                                                                                        
            'PEDIDO_CREADO_EXITOSAMENTE' AS Mensaje                                                                 
        FROM Pedidos p                                                                                              
        WHERE p.IDPedido = @IDPedidoNuevo;                                                                          
    END;                                                                                                            
    GO       

       -- ----------------------------------------------------------------------------                                 
    -- 3. CAMBIO DE ESTADO DEL PEDIDO Y VALIDACIÓN DE CICLO DE VIDA (RF-07)                                         
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Pedidos_CambiarEstado                                                              
        @IDPedido INT,                                                                                              
        @EstadoNuevo NVARCHAR(30),                                                                                  
        @IDUsuarioOperador INT,                                                                                     
        @Motivo NVARCHAR(255) = NULL                                                                                
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        DECLARE @EstadoActual NVARCHAR(30);                                                                         
        SELECT @EstadoActual = Estado                                                                               
        FROM Pedidos                                                                                                
        WHERE IDPedido = @IDPedido;                                                                                 
                                                                                                                    
        IF @EstadoActual IS NULL                                                                                    
        BEGIN                                                                                                       
            RAISERROR('El pedido no existe.', 16, 1);                                                               
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Validación estricta del ciclo de vida (RF-07)                                                            
        -- Transiciones permitidas:                                                                                 
        -- PAGADO -> EN_PREPARACION                                                                                 
        -- EN_PREPARACION -> DESPACHADO                                                                             
        -- DESPACHADO -> ENTREGADO                                                                                  
        DECLARE @EsValido BIT = 0;                                                                                  
                                                                                                                    
        IF @EstadoActual = 'PAGADO' AND @EstadoNuevo = 'EN_PREPARACION' SET @EsValido = 1;                          
        IF @EstadoActual = 'EN_PREPARACION' AND @EstadoNuevo = 'DESPACHADO' SET @EsValido = 1;                      
        IF @EstadoActual = 'DESPACHADO' AND @EstadoNuevo = 'ENTREGADO' SET @EsValido = 1;                           
                                                                                                                    
        IF @EsValido = 0                                                                                            
        BEGIN                                                                                                       
            DECLARE @MsgTransicion NVARCHAR(200) = FORMATMESSAGE('Transición no permitida: No es posible pasar un   
            pedido de "%s" a "%s".', @EstadoActual, @EstadoNuevo);                                                  
            RAISERROR(@MsgTransicion, 16, 1);                                                                       
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        UPDATE Pedidos                                                                                              
        SET                                                                                                         
            Estado = @EstadoNuevo,                                                                                  
            FechaModificacion = SYSDATETIME()                                                                       
        WHERE IDPedido = @IDPedido;                                                                                 
                                                                                                                    
        INSERT INTO PedidoHistorialEstados (IDPedido, EstadoAnterior, EstadoNuevo, IDUsuario, Motivo, Fecha)        
        VALUES (@IDPedido, @EstadoActual, @EstadoNuevo, @IDUsuarioOperador, @Motivo, SYSDATETIME());                
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
                                                                                                                    
        SELECT @IDPedido AS IDPedido, @EstadoNuevo AS EstadoNuevo, 'ESTADO_ACTUALIZADO_EXITOSAMENTE' AS Mensaje;    
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 4. CANCELACIÓN DE PEDIDO CON REINTEGRO A KARDEX (RF-07)                                                      
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Pedidos_Cancelar                                                                   
        @IDPedido INT,                                                                                              
        @IDUsuario INT,                                                                                             
        @Motivo NVARCHAR(255)                                                                                       
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        IF @Motivo IS NULL OR LTRIM(RTRIM(@Motivo)) = ''                                                            
        BEGIN                                                                                                       
            RAISERROR('Debe indicar un motivo obligatorio para cancelar el pedido.', 16, 1);                        
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        DECLARE @EstadoActual NVARCHAR(30);                                                                         
        DECLARE @NumeroPedido NVARCHAR(30);                                                                         
                                                                                                                    
        SELECT                                                                                                      
            @EstadoActual = Estado,                                                                                 
            @NumeroPedido = NumeroPedido                                                                            
        FROM Pedidos                                                                                                
        WHERE IDPedido = @IDPedido;                                                                                 
                                                                                                                    
        IF @EstadoActual IS NULL                                                                                    
        BEGIN                                                                                                       
            RAISERROR('El pedido no existe.', 16, 1);                                                               
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Criterio de aceptación RF-07: Un pedido solo puede cancelarse antes de ser despachado                    
        IF @EstadoActual NOT IN ('PAGADO', 'EN_PREPARACION')                                                        
        BEGIN                                                                                                       
            DECLARE @MsgCancelError NVARCHAR(200) = FORMATMESSAGE('No se puede cancelar el pedido porque se         
            encuentra en estado "%s" (solo se cancela antes de ser despachado).', @EstadoActual);                   
            RAISERROR(@MsgCancelError, 16, 1);                                                                      
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        -- 1. Actualizar estado del pedido a CANCELADO                                                              
        UPDATE Pedidos                                                                                              
        SET                                                                                                         
            Estado = 'CANCELADO',                                                                                   
            FechaModificacion = SYSDATETIME()                                                                       
        WHERE IDPedido = @IDPedido;                                                                                 
                                                                                                                    
        -- 2. Reintegrar existencias al inventario y asentar en Kardex (RF-07)                                      
        DECLARE curReintegro CURSOR LOCAL FAST_FORWARD FOR                                                          
            SELECT pd.IDVariante, pd.Cantidad, v.ExistenciaFisica                                                   
            FROM PedidoDetalles pd                                                                                  
            INNER JOIN Variantes v ON pd.IDVariante = v.IDVariante                                                  
            WHERE pd.IDPedido = @IDPedido;                                                                          
                                                                                                                    
        OPEN curReintegro;                                                                                          
        DECLARE @VarID INT, @VarCant INT, @VarStockActual INT;                                                      
                                                                                                                    
        FETCH NEXT FROM curReintegro INTO @VarID, @VarCant, @VarStockActual;                                        
        WHILE @@FETCH_STATUS = 0                                                                                    
        BEGIN                                                                                                       
            -- Incrementar stock físico                                                                             
            UPDATE Variantes                                                                                        
            SET ExistenciaFisica = ExistenciaFisica + @VarCant                                                      
            WHERE IDVariante = @VarID;                                                                              
                                                                                                                    
            -- Registrar entrada de reintegro en Kardex                                                             
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
            VALUES (                                                                                                
                @VarID,                                                                                             
                @IDUsuario,                                                                                         
                'CANCELACION_REINTEGRO',                                                                            
                @VarCant,                                                                                           
                @VarStockActual,                                                                                    
                (@VarStockActual + @VarCant),                                                                       
                'Cancelación de pedido ' + @NumeroPedido + '. Motivo: ' + @Motivo,                                  
                @IDPedido                                                                                           
            );                                                                                                      
                                                                                                                    
            FETCH NEXT FROM curReintegro INTO @VarID, @VarCant, @VarStockActual;                                    
        END;                                                                                                        
                                                                                                                    
        CLOSE curReintegro;                                                                                         
        DEALLOCATE curReintegro;                                                                                    
                                                                                                                    
        -- 3. Registrar en Historial de Estados                                                                     
        INSERT INTO PedidoHistorialEstados (IDPedido, EstadoAnterior, EstadoNuevo, IDUsuario, Motivo, Fecha)        
        VALUES (@IDPedido, @EstadoActual, 'CANCELADO', @IDUsuario, @Motivo, SYSDATETIME());                         
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
                                                                                                                    
        SELECT @IDPedido AS IDPedido, 'CANCELADO' AS Estado, 'PEDIDO_CANCELADO_Y_STOCK_REINTEGRADO' AS Mensaje;     
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 5. DEVOLUCIONES TOTALES O PARCIALES (RF-07)                                                                  
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Pedidos_ProcesarDevolucion                                                         
        @IDPedido INT,                                                                                              
        @IDPedidoDetalle INT,                                                                                       
        @CantidadADevolver INT,                                                                                     
        @IDUsuarioOperador INT,                                                                                     
        @Motivo NVARCHAR(255)                                                                                       
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        IF @CantidadADevolver <= 0                                                                                  
        BEGIN                                                                                                       
            RAISERROR('La cantidad a devolver debe ser mayor a cero.', 16, 1);                                      
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @Motivo IS NULL OR LTRIM(RTRIM(@Motivo)) = ''                                                            
        BEGIN                                                                                                       
            RAISERROR('El motivo de la devolución es obligatorio.', 16, 1);                                         
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Validar que el pedido esté en estado ENTREGADO o DEVUELTO_PARCIAL                                        
        DECLARE @EstadoPedido NVARCHAR(30);                                                                         
        DECLARE @NumeroPedido NVARCHAR(30);                                                                         
        SELECT @EstadoPedido = Estado, @NumeroPedido = NumeroPedido                                                 
        FROM Pedidos WHERE IDPedido = @IDPedido;                                                                    
                                                                                                                    
        IF @EstadoPedido NOT IN ('ENTREGADO', 'DEVUELTO_PARCIAL')                                                   
        BEGIN                                                                                                       
            RAISERROR('Solo es posible registrar devoluciones sobre pedidos entregados.', 16, 1);                   
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Validar la línea de pedido y no exceder lo comprado (Criterio de aceptación RF-07)                       
        DECLARE @IDVariante INT;                                                                                    
        DECLARE @CantidadComprada INT;                                                                              
        DECLARE @CantidadYaDevuelta INT;                                                                            
        DECLARE @PrecioUnitario DECIMAL(12,2);                                                                      
                                                                                                                    
        SELECT                                                                                                      
            @IDVariante = IDVariante,                                                                               
            @CantidadComprada = Cantidad,                                                                           
            @CantidadYaDevuelta = CantidadDevuelta,                                                                 
            @PrecioUnitario = PrecioUnitario                                                                        
        FROM PedidoDetalles                                                                                         
        WHERE IDPedidoDetalle = @IDPedidoDetalle AND IDPedido = @IDPedido;                                          
                                                                                                                    
        IF @IDVariante IS NULL                                                                                      
        BEGIN                                                                                                       
            RAISERROR('La línea de pedido especificada no existe en este pedido.', 16, 1);                          
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF (@CantidadYaDevuelta + @CantidadADevolver) > @CantidadComprada                                           
        BEGIN                                                                                                       
            DECLARE @DisponiblesParaDevolver INT = @CantidadComprada - @CantidadYaDevuelta;                         
            DECLARE @MsgDevError NVARCHAR(200) = FORMATMESSAGE('No se puede devolver más de lo comprado. Cantidad   
            máxima retornable para esta línea: %d.', @DisponiblesParaDevolver);                                     
            RAISERROR(@MsgDevError, 16, 1);                                                                         
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        DECLARE @MontoReembolsoLinea DECIMAL(12,2) = @CantidadADevolver * @PrecioUnitario;                          
                                                                                                                    
        -- 1. Crear cabecera de Devolución                                                                          
        DECLARE @NewDev TABLE (IDDevolucion INT);                                                                   
        INSERT INTO Devoluciones (IDPedido, IDUsuario, Motivo, MontoTotalReembolsado, FechaCreacion)                
        OUTPUT inserted.IDDevolucion INTO @NewDev                                                                   
        VALUES (@IDPedido, @IDUsuarioOperador, @Motivo, @MontoReembolsoLinea, SYSDATETIME());                       
                                                                                                                    
        DECLARE @IDDevolucionCreada INT = (SELECT TOP 1 IDDevolucion FROM @NewDev);                                 
                                                                                                                    
        -- 2. Crear detalle de Devolución                                                                           
        INSERT INTO DevolucionDetalles (IDDevolucion, IDPedidoDetalle, Cantidad, MontoReembolsado)                  
        VALUES (@IDDevolucionCreada, @IDPedidoDetalle, @CantidadADevolver, @MontoReembolsoLinea);                   
                                                                                                                    
        -- 3. Actualizar cantidad devuelta en la línea del pedido                                                   
        UPDATE PedidoDetalles                                                                                       
        SET CantidadDevuelta = CantidadDevuelta + @CantidadADevolver                                                
        WHERE IDPedidoDetalle = @IDPedidoDetalle;                                                                   
                                                                                                                    
        -- 4. Reintegrar stock físico a Variantes y asentar en Kardex                                               
        DECLARE @StockActual INT;                                                                                   
        SELECT @StockActual = ExistenciaFisica FROM Variantes WHERE IDVariante = @IDVariante;                       
                                                                                                                    
        UPDATE Variantes                                                                                            
        SET ExistenciaFisica = ExistenciaFisica + @CantidadADevolver                                                
        WHERE IDVariante = @IDVariante;                                                                             
                                                                                                                    
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
        VALUES (                                                                                                    
            @IDVariante,                                                                                            
            @IDUsuarioOperador,                                                                                     
            'DEVOLUCION_REINTEGRO',                                                                                 
            @CantidadADevolver,                                                                                     
            @StockActual,                                                                                           
            (@StockActual + @CantidadADevolver),                                                                    
            'Devolución de Pedido ' + @NumeroPedido + '. Motivo: ' + @Motivo,                                       
            @IDDevolucionCreada                                                                                     
        );                                                                                                          
                                                                                                                    
        -- 5. Evaluar si la devolución fue parcial o total para actualizar el estado del Pedido                     
        DECLARE @TotalComprado INT;                                                                                 
        DECLARE @TotalDevuelto INT;                                                                                 
                                                                                                                    
        SELECT                                                                                                      
            @TotalComprado = SUM(Cantidad),                                                                         
            @TotalDevuelto = SUM(CantidadDevuelta)                                                                  
        FROM PedidoDetalles                                                                                         
        WHERE IDPedido = @IDPedido;                                                                                 
                                                                                                                    
        DECLARE @EstadoNuevo NVARCHAR(30);                                                                          
        IF @TotalDevuelto >= @TotalComprado                                                                         
            SET @EstadoNuevo = 'DEVUELTO_TOTAL';                                                                    
        ELSE                                                                                                        
            SET @EstadoNuevo = 'DEVUELTO_PARCIAL';                                                                  
                                                                                                                    
        UPDATE Pedidos                                                                                              
        SET                                                                                                         
            Estado = @EstadoNuevo,                                                                                  
            FechaModificacion = SYSDATETIME()                                                                       
        WHERE IDPedido = @IDPedido;                                                                                 
                                                                                                                    
        INSERT INTO PedidoHistorialEstados (IDPedido, EstadoAnterior, EstadoNuevo, IDUsuario, Motivo, Fecha)        
        VALUES (@IDPedido, @EstadoPedido, @EstadoNuevo, @IDUsuarioOperador, 'Devolución procesada: ' + @Motivo,     
        SYSDATETIME());                                                                                             
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
                                                                                                                    
        SELECT                                                                                                      
            @IDDevolucionCreada AS IDDevolucion,                                                                    
            @IDPedido AS IDPedido,                                                                                  
            @EstadoNuevo AS EstadoPedido,                                                                           
            @MontoReembolsoLinea AS MontoReembolsado,                                                               
            'DEVOLUCION_PROCESADA_EXITOSAMENTE' AS Mensaje;                                                         
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 6. CONSULTAR DETALLE COMPLETO DE UN PEDIDO (RF-01, RF-07)                                                    
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Pedidos_ObtenerPorCodigoPublico                                                    
        @CodigoPublico UNIQUEIDENTIFIER,                                                                            
        @IDUsuarioAutenticado INT = NULL, -- Si es Cliente, se valida que sea suyo (evita IDOR)                     
        @EsOperadorOAdmin BIT = 0                                                                                   
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        DECLARE @IDPedido INT;                                                                                      
        DECLARE @IDUsuarioDuenio INT;                                                                               
                                                                                                                    
        SELECT                                                                                                      
            @IDPedido = IDPedido,                                                                                   
            @IDUsuarioDuenio = IDUsuario                                                                            
        FROM Pedidos                                                                                                
        WHERE CodigoPublico = @CodigoPublico;                                                                       
                                                                                                                    
        IF @IDPedido IS NULL                                                                                        
        BEGIN                                                                                                       
            RAISERROR('El pedido solicitado no existe.', 16, 1);                                                    
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Validación anti-IDOR para clientes                                                                       
        IF @EsOperadorOAdmin = 0 AND (@IDUsuarioAutenticado IS NULL OR @IDUsuarioAutenticado <> @IDUsuarioDuenio)   
        BEGIN                                                                                                       
            RAISERROR('No tienes autorización para consultar la información de este pedido.', 16, 1);               
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Resultado 1: Cabecera del Pedido                                                                         
        SELECT                                                                                                      
            p.IDPedido,                                                                                             
            p.CodigoPublico,                                                                                        
            p.NumeroPedido,                                                                                         
            p.IDUsuario,                                                                                            
            u.Nombre + ' ' + u.Apellido AS NombreCliente,                                                           
            u.Correo AS CorreoCliente,                                                                              
            p.DireccionEntregaSnapshot,                                                                             
            p.CodigoCuponSnapshot,                                                                                  
            p.Subtotal,                                                                                             
            p.Descuento,                                                                                            
            p.IVA,                                                                                                  
            p.Total,                                                                                                
            p.Estado,                                                                                               
            p.MetodoPago,                                                                                           
            p.FechaCreacion,                                                                                        
            p.FechaModificacion                                                                                     
        FROM Pedidos p                                                                                              
        INNER JOIN Usuarios u ON p.IDUsuario = u.IDUsuario                                                          
        WHERE p.IDPedido = @IDPedido;                                                                               
                                                                                                                    
        -- Resultado 2: Líneas de detalle con precios congelados                                                    
        SELECT                                                                                                      
            pd.IDPedidoDetalle,                                                                                     
            pd.IDVariante,                                                                                          
            pd.SKUSnapshot,                                                                                         
            pd.NombreProductoSnapshot,                                                                              
            pd.NombreVarianteSnapshot,                                                                              
            pd.Cantidad,                                                                                            
            pd.PrecioUnitario,                                                                                      
            pd.DescuentoUnitario,                                                                                   
            pd.Subtotal,                                                                                            
            pd.CantidadDevuelta,                                                                                    
            (pd.Cantidad - pd.CantidadDevuelta) AS CantidadEfectiva                                                 
        FROM PedidoDetalles pd                                                                                      
        WHERE pd.IDPedido = @IDPedido;                                                                              
                                                                                                                    
        -- Resultado 3: Historial de Estados (Trazabilidad)                                                         
        SELECT                                                                                                      
            phe.IDPedidoHistorial,                                                                                  
            phe.EstadoAnterior,                                                                                     
            phe.EstadoNuevo,                                                                                        
            u.Nombre + ' ' + u.Apellido AS UsuarioResponsable,                                                      
            phe.Motivo,                                                                                             
            phe.Fecha                                                                                               
        FROM PedidoHistorialEstados phe                                                                             
        INNER JOIN Usuarios u ON phe.IDUsuario = u.IDUsuario                                                        
        WHERE phe.IDPedido = @IDPedido                                                                              
        ORDER BY phe.Fecha ASC;                                                                                     
    END;                                                                                                            
    GO                                                                                                              
           