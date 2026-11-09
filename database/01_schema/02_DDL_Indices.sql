  -- ============================================================================                                    
    -- PROYECTO: ShopCart                                                                                              
    -- SCRIPT: 02_DDL_Indices.sql                                                                                      
    -- DESCRIPCIÓN: Índices no agrupados para Foreign Keys y optimización de consultas.                                
    -- OBJETIVO: Cumplir con el RNF de respuesta en menos de 1 segundo.                                                
    -- ============================================================================                                    

    SET ANSI_NULLS ON;
    SET QUOTED_IDENTIFIER ON;
    SET ANSI_PADDING ON;
    SET ANSI_WARNINGS ON;
    SET ARITHABORT ON;
    SET CONCAT_NULL_YIELDS_NULL ON;
    SET NUMERIC_ROUNDABORT OFF;
                                                                                                                       
    -- ----------------------------------------------------------------------------                                    
    -- 1. ÍNDICES SOBRE LLAVES FORÁNEAS (Evitan Table Scans en JOINs)                                                  
    -- ----------------------------------------------------------------------------                                    
                                                                                                                       
    -- Usuarios y Seguridad                                                                                            
    CREATE NONCLUSTERED INDEX IX_Usuarios_IDRol                                                                        
    ON Usuarios(IDRol);                                                                                                
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_IDUsuario                                                               
    ON RefreshTokens(IDUsuario);                                                                                       
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Direcciones_IDUsuario                                                                 
    ON Direcciones(IDUsuario);                                                                                         
                                                                                                                       
    -- Catálogo de Productos                                                                                           
    CREATE NONCLUSTERED INDEX IX_Categorias_IDCategoriaPadre                                                           
    ON Categorias(IDCategoriaPadre) WHERE IDCategoriaPadre IS NOT NULL;                                                
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Productos_IDCategoria                                                                 
    ON Productos(IDCategoria);                                                                                         
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_ProductoImagenes_IDProducto                                                           
    ON ProductoImagenes(IDProducto, Orden);                                                                            
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Variantes_IDProducto                                                                  
    ON Variantes(IDProducto);                                                                                          
                                                                                                                       
    -- Inventario y Kardex                                                                                             
    CREATE NONCLUSTERED INDEX IX_Kardex_IDVariante                                                                     
    ON Kardex(IDVariante);                                                                                             
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Kardex_IDUsuario                                                                      
    ON Kardex(IDUsuario);                                                                                              
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Kardex_Fecha                                                                          
    ON Kardex(Fecha DESC);                                                                                             
                                                                                                                       
    -- Carritos                                                                                                        
    CREATE NONCLUSTERED INDEX IX_Carritos_IDUsuario                                                                    
    ON Carritos(IDUsuario) WHERE IDUsuario IS NOT NULL;                                                                
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_CarritoDetalles_IDVariante                                                            
    ON CarritoDetalles(IDVariante);                                                                                    
                                                                                                                       
    -- Reservas                                                                                                        
    CREATE NONCLUSTERED INDEX IX_Reservas_IDUsuario                                                                    
    ON Reservas(IDUsuario) WHERE IDUsuario IS NOT NULL;                                                                
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_ReservaDetalles_IDVariante                                                            
    ON ReservaDetalles(IDVariante);                                                                                    
                                                                                                                       
    -- Pedidos y Devoluciones                                                                                          
    CREATE NONCLUSTERED INDEX IX_Pedidos_IDUsuario                                                                     
    ON Pedidos(IDUsuario);                                                                                             
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Pedidos_IDDireccionEntrega                                                            
    ON Pedidos(IDDireccionEntrega);                                                                                    
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Pedidos_IDCupon                                                                       
    ON Pedidos(IDCupon) WHERE IDCupon IS NOT NULL;                                                                     
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_PedidoDetalles_IDPedido                                                               
    ON PedidoDetalles(IDPedido);                                                                                       
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_PedidoDetalles_IDVariante                                                             
    ON PedidoDetalles(IDVariante);                                                                                     
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_PedidoHistorialEstados_IDPedido                                                       
    ON PedidoHistorialEstados(IDPedido);                                                                               
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_CuponUsos_IDCupon_IDUsuario                                                           
    ON CuponUsos(IDCupon, IDUsuario);                                                                                  
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Devoluciones_IDPedido                                                                 
    ON Devoluciones(IDPedido);                                                                                         
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_DevolucionDetalles_IDDevolucion                                                       
    ON DevolucionDetalles(IDDevolucion);                                                                               
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_DevolucionDetalles_IDPedidoDetalle                                                    
    ON DevolucionDetalles(IDPedidoDetalle);                                                                            
                                                                                                                       
    CREATE NONCLUSTERED INDEX IX_Bitacora_IDUsuario                                                                    
    ON Bitacora(IDUsuario) WHERE IDUsuario IS NOT NULL; 


       -- ----------------------------------------------------------------------------                                    
    -- 2. ÍNDICES DE RENDIMIENTO PARA CATÁLOGO, CHECKOUT Y REPORTES                                                    
    -- ----------------------------------------------------------------------------                                    
                                                                                                                       
    -- Catálogo: Búsqueda de productos activos por nombre y categoría                                                  
    CREATE NONCLUSTERED INDEX IX_Productos_Activo_Nombre                                                               
    ON Productos(Activo, Nombre)                                                                                       
    INCLUDE (IDCategoria, CodigoPublico, FechaCreacion);                                                               
                                                                                                                       
    -- Catálogo: Filtro de variantes activas por rango de precio y existencia                                          
    CREATE NONCLUSTERED INDEX IX_Variantes_Filtros_Precio                                                              
    ON Variantes(Activo, Precio)                                                                                       
    INCLUDE (IDProducto, SKU, ExistenciaFisica, Talla, Color);                                                         
                                                                                                                       
    -- Carrito: Detección rápida de carritos activos y abandonados por inactividad                                     
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Carritos_TokenInvitado
    ON Carritos(TokenInvitado) WHERE TokenInvitado IS NOT NULL;

    CREATE NONCLUSTERED INDEX IX_Carritos_Actividad                                                                    
    ON Carritos(Activo, FechaUltimaActividad)                                                                          
    INCLUDE (CodigoPublico, IDUsuario, TokenInvitado);                                                                 
                                                                                                                       
    -- Checkout: Índice filtrado para cálculo ultrarrápido de reservas activas                                         
    -- Solo indexa las filas que realmente bloquean inventario en este momento                                         
    CREATE NONCLUSTERED INDEX IX_Reservas_Activas_Expiracion                                                           
    ON Reservas(Estado, FechaExpiracion)                                                                               
    INCLUDE (IDReserva)                                                                                                
    WHERE Estado = 'ACTIVA';                                                                                           
                                                                                                                       
    -- Dashboard y Reportes: Cálculo de ventas por rango de fechas y estado                                            
    CREATE NONCLUSTERED INDEX IX_Pedidos_Reportes_Ventas                                                               
    ON Pedidos(Estado, FechaCreacion)                                                                                  
    INCLUDE (Subtotal, Descuento, IVA, Total, IDUsuario, CodigoPublico);                                               
                                                                                                                       
    -- Listado de Pedidos: Filtros de cliente y fecha en el panel de usuario/admin                                     
    CREATE NONCLUSTERED INDEX IX_Pedidos_Filtro_Cliente_Fecha                                                          
    ON Pedidos(IDUsuario, FechaCreacion DESC)                                                                          
    INCLUDE (NumeroPedido, Estado, Total);                                                                             
                                                                                                                       
    -- Bitácora: Filtro por entidad (módulo) y orden cronológico descendente                                           
    CREATE NONCLUSTERED INDEX IX_Bitacora_Entidad_Fecha                                                                
    ON Bitacora(Entidad, Fecha DESC)                                                                                   
    INCLUDE (Accion, IDRegistro, IDUsuario, DireccionIP);
