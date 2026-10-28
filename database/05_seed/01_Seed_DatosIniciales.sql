   -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 01_Seed_DatosIniciales.sql                                                                           
    -- DESCRIPCIÓN: Datos semilla iniciales (Roles, Usuarios, Catálogo, Kardex y Cupones).                          
    -- CREDENCIALES DE PRUEBA:                                                                                      
    --   Admin:    admin@shopcart.gt    / Admin123!                                                                 
    --   Operador: operador@shopcart.gt / Operador123!                                                              
    --   Cliente:  cliente@shopcart.gt  / Cliente123!                                                               
    -- HASH BCRYPT: Generados con costo 10 para compatibilidad inmediata con bcryptjs.                              
    -- ============================================================================                                 
                                                                                                                    
    SET NOCOUNT ON;                                                                                                 
    SET XACT_ABORT ON;                                                                                              
                                                                                                                    
    BEGIN TRANSACTION;                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. SEED: ROLES DEL SISTEMA (RF-01)                                                                           
    -- ----------------------------------------------------------------------------                                 
    IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Administrador')                                              
        INSERT INTO Roles (Nombre, Descripcion) VALUES ('Administrador', 'Control total de catálogo, precios,       
        usuarios, cupones y bitácora');                                                                             
                                                                                                                    
    IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Operador')                                                   
        INSERT INTO Roles (Nombre, Descripcion) VALUES ('Operador', 'Gestión operativa de pedidos, inventario y     
        despachos');                                                                                                
                                                                                                                    
    IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Cliente')                                                    
        INSERT INTO Roles (Nombre, Descripcion) VALUES ('Cliente', 'Usuario comprador de la tienda en línea');      
                                                                                                                    
    DECLARE @IDRolAdmin INT = (SELECT IDRol FROM Roles WHERE Nombre = 'Administrador');                             
    DECLARE @IDRolOperador INT = (SELECT IDRol FROM Roles WHERE Nombre = 'Operador');                               
    DECLARE @IDRolCliente INT = (SELECT IDRol FROM Roles WHERE Nombre = 'Cliente');                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. SEED: USUARIOS INICIALES (RF-01)                                                                          
    -- Hashes bcrypt correspondientes a 'Admin123!', 'Operador123!' y 'Cliente123!'                                 
    -- ----------------------------------------------------------------------------                                 
    DECLARE @HashAdmin NVARCHAR(255) = '$2a$10$fWn5g72kK/yS01s2V.O6/O4o2Tsk5R5J8c7eF8vU.QpI3mF6GzD9e'; -- Admin123! 
    DECLARE @HashOperador NVARCHAR(255) = '$2a$10$wO3mY2eL0vF9rP.K5xZ2reY1gQ9wA4uB8vX3yZ7oP.QeI1mK4GyEe'; --        
    Operador123!                                                                                                    
    DECLARE @HashCliente NVARCHAR(255) = '$2a$10$yN1vX9dL8kP7mQ.T3vZ5yeW3hR7zA2uC6wY1xX5nO.PeI9mL2GyDe'; --         
    Cliente123!                                                                                                     
                                                                                                                    
    -- Usuario Administrador                                                                                        
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'admin@shopcart.gt')                                       
    BEGIN                                                                                                           
        INSERT INTO Usuarios (IDRol, Nombre, Apellido, Correo, PasswordHash, Telefono, Activo)                      
        VALUES (@IDRolAdmin, 'Don Arturo', 'Administrador', 'admin@shopcart.gt', @HashAdmin, '50255551000', 1);     
    END                                                                                                             
                                                                                                                    
    -- Usuario Operador                                                                                             
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'operador@shopcart.gt')                                    
    BEGIN                                                                                                           
        INSERT INTO Usuarios (IDRol, Nombre, Apellido, Correo, PasswordHash, Telefono, Activo)                      
        VALUES (@IDRolOperador, 'Carlos', 'Logística', 'operador@shopcart.gt', @HashOperador, '50255552000', 1);    
    END                                                                                                             
                                                                                                                    
    -- Usuario Cliente                                                                                              
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'cliente@shopcart.gt')                                     
    BEGIN                                                                                                           
        INSERT INTO Usuarios (IDRol, Nombre, Apellido, Correo, PasswordHash, Telefono, Activo)                      
        VALUES (@IDRolCliente, 'Mario', 'Gómez', 'cliente@shopcart.gt', @HashCliente, '50255553000', 1);            
    END                                                                                                             
                                                                                                                    
    DECLARE @IDUsuarioAdmin INT = (SELECT IDUsuario FROM Usuarios WHERE Correo = 'admin@shopcart.gt');              
    DECLARE @IDUsuarioOperador INT = (SELECT IDUsuario FROM Usuarios WHERE Correo = 'operador@shopcart.gt');        
    DECLARE @IDUsuarioCliente INT = (SELECT IDUsuario FROM Usuarios WHERE Correo = 'cliente@shopcart.gt');          
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 3. SEED: DIRECCIÓN DE ENTREGA PARA EL CLIENTE (RF-01)                                                        
    -- ----------------------------------------------------------------------------                                 
    IF NOT EXISTS (SELECT 1 FROM Direcciones WHERE IDUsuario = @IDUsuarioCliente)                                   
    BEGIN                                                                                                           
        INSERT INTO Direcciones (                                                                                   
            IDUsuario, NombreDestinatario, TelefonoContacto, DireccionLinea1, DireccionLinea2,                      
            Ciudad, Departamento, CodigoPostal, EsPrincipal, Activo                                                 
        )                                                                                                           
        VALUES (                                                                                                    
            @IDUsuarioCliente, 'Mario Gómez', '50255553000', '7a Avenida 12-23 Zona 10', 'Edificio Reforma Nivel 5',
                                                                                                                    
            'Ciudad de Guatemala', 'Guatemala', '01010', 1, 1                                                       
        );                                                                                                          
    END                                                                                                             
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 4. SEED: CATEGORÍAS DEL CATÁLOGO (RF-02)                                                                     
    -- ----------------------------------------------------------------------------                                 
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = 'Caballeros')                                            
        INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo) VALUES ('Caballeros', 'Prendas y moda
        para hombres', NULL, 1);                                                                                    
                                                                                                                    
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = 'Damas')                                                 
        INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo) VALUES ('Damas', 'Colecciones de moda
        femenina', NULL, 1);                                                                                        
                                                                                                                    
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = 'Calzado')                                               
        INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo) VALUES ('Calzado', 'Zapatos casuales,
        formales y deportivos', NULL, 1);                                                                           
                                                                                                                    
    IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = 'Accesorios')                                            
        INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo) VALUES ('Accesorios', 'Cinturones,   
        billeteras, relojes y gorras', NULL, 1);                                                                    
                                                                                                                    
    DECLARE @IDCategoriaCaballeros INT = (SELECT IDCategoria FROM Categorias WHERE Nombre = 'Caballeros');          
    DECLARE @IDCategoriaDamas INT = (SELECT IDCategoria FROM Categorias WHERE Nombre = 'Damas');                    
    DECLARE @IDCategoriaCalzado INT = (SELECT IDCategoria FROM Categorias WHERE Nombre = 'Calzado');                
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 5. SEED: PRODUCTOS, VARIANTES Y KARDEX INICIAL (RF-02, RF-03)                                                
    -- Precios en Quetzales con IVA del 12% incluido                                                                
    -- ----------------------------------------------------------------------------                                 
                                                                                                                    
    -- Producto 1: Camisa Oxford Slim Fit                                                                           
    DECLARE @IDProd1 INT;                                                                                           
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE Nombre = 'Camisa Oxford Slim Fit')                                 
    BEGIN                                                                                                           
        INSERT INTO Productos (IDCategoria, Nombre, Descripcion, Activo)                                            
        VALUES (@IDCategoriaCaballeros, 'Camisa Oxford Slim Fit', 'Camisa manga larga de algodón 100% corte moderno,
        ideal para uso casual o de oficina.', 1);                                                                   
        SET @IDProd1 = SCOPE_IDENTITY();                                                                            
                                                                                                                    
        INSERT INTO ProductoImagenes (IDProducto, ImagenURL, EsPrincipal, Orden)                                    
        VALUES (@IDProd1, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', 1, 1);              
                                                                                                                    
        -- Variantes                                                                                                
        INSERT INTO Variantes (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)             
        VALUES (@IDProd1, 'CAM-OXF-AZU-M', 'Azul / Talla M', 'M', 'Azul', 249.00, 25, 1);                           
        INSERT INTO Kardex (IDVariante, IDUsuario, TipoMovimiento, Cantidad, ExistenciaAnterior, ExistenciaNueva,   
        Motivo)                                                                                                     
        VALUES (SCOPE_IDENTITY(), @IDUsuarioAdmin, 'ENTRADA_COMPRA', 25, 0, 25, 'Inventario inicial de apertura');  
                                                                                                                    
        INSERT INTO Variantes (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)             
        VALUES (@IDProd1, 'CAM-OXF-AZU-L', 'Azul / Talla L', 'L', 'Azul', 249.00, 20, 1);                           
        INSERT INTO Kardex (IDVariante, IDUsuario, TipoMovimiento, Cantidad, ExistenciaAnterior, ExistenciaNueva,   
        Motivo)                                                                                                     
        VALUES (SCOPE_IDENTITY(), @IDUsuarioAdmin, 'ENTRADA_COMPRA', 20, 0, 20, 'Inventario inicial de apertura');  
                                                                                                                    
        INSERT INTO Variantes (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)             
        VALUES (@IDProd1, 'CAM-OXF-BLA-M', 'Blanco / Talla M', 'M', 'Blanco', 249.00, 30, 1);                       
        INSERT INTO Kardex (IDVariante, IDUsuario, TipoMovimiento, Cantidad, ExistenciaAnterior, ExistenciaNueva,   
        Motivo)                                                                                                     
        VALUES (SCOPE_IDENTITY(), @IDUsuarioAdmin, 'ENTRADA_COMPRA', 30, 0, 30, 'Inventario inicial de apertura');  
    END                                                                                                             
                                                                                                                    
    -- Producto 2: Pantalón Chino Casual                                                                            
    DECLARE @IDProd2 INT;                                                                                           
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE Nombre = 'Pantalón Chino Casual')                                  
    BEGIN                                                                                                           
        INSERT INTO Productos (IDCategoria, Nombre, Descripcion, Activo)                                            
        VALUES (@IDCategoriaCaballeros, 'Pantalón Chino Casual', 'Pantalón estilo chino confeccionado con tela      
        stretch para máxima comodidad.', 1);                                                                        
        SET @IDProd2 = SCOPE_IDENTITY();                                                                            
                                                                                                                    
        INSERT INTO ProductoImagenes (IDProducto, ImagenURL, EsPrincipal, Orden)                                    
        VALUES (@IDProd2, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600', 1, 1);              
                                                                                                                    
        -- Variantes                                                                                                
        INSERT INTO Variantes (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)             
        VALUES (@IDProd2, 'PAN-CHI-BEI-32', 'Beige / Talla 32', '32', 'Beige', 299.00, 15, 1);                      
        INSERT INTO Kardex (IDVariante, IDUsuario, TipoMovimiento, Cantidad, ExistenciaAnterior, ExistenciaNueva,   
        Motivo)                                                                                                     
        VALUES (SCOPE_IDENTITY(), @IDUsuarioAdmin, 'ENTRADA_COMPRA', 15, 0, 15, 'Inventario inicial de apertura');  
                                                                                                                    
        INSERT INTO Variantes (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)             
        VALUES (@IDProd2, 'PAN-CHI-AZU-32', 'Azul Marino / Talla 32', '32', 'Azul Marino', 299.00, 18, 1);          
        INSERT INTO Kardex (IDVariante, IDUsuario, TipoMovimiento, Cantidad, ExistenciaAnterior, ExistenciaNueva,   
        Motivo)                                                                                                     
        VALUES (SCOPE_IDENTITY(), @IDUsuarioAdmin, 'ENTRADA_COMPRA', 18, 0, 18, 'Inventario inicial de apertura');  
    END                                                                                                             
                                                                                                                    
    -- Producto 3: Zapatos de Cuero Oxford                                                                          
    DECLARE @IDProd3 INT;                                                                                           
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE Nombre = 'Zapatos de Cuero Oxford')                                
    BEGIN                                                                                                           
        INSERT INTO Productos (IDCategoria, Nombre, Descripcion, Activo)                                            
        VALUES (@IDCategoriaCalzado, 'Zapatos de Cuero Oxford', 'Calzado elegante 100% cuero genuino con suela      
        antideslizante para caballero.', 1);                                                                        
        SET @IDProd3 = SCOPE_IDENTITY();                                                                            
                                                                                                                    
        INSERT INTO ProductoImagenes (IDProducto, ImagenURL, EsPrincipal, Orden)                                    
        VALUES (@IDProd3, 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600', 1, 1);              
                                                                                                                    
        -- Variantes                                                                                                
        INSERT INTO Variantes (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)             
        VALUES (@IDProd3, 'ZAP-OXF-CAF-41', 'Café / Talla 41', '41', 'Café', 549.00, 10, 1);                        
        INSERT INTO Kardex (IDVariante, IDUsuario, TipoMovimiento, Cantidad, ExistenciaAnterior, ExistenciaNueva,   
        Motivo)                                                                                                     
        VALUES (SCOPE_IDENTITY(), @IDUsuarioAdmin, 'ENTRADA_COMPRA', 10, 0, 10, 'Inventario inicial de apertura');  
                                                                                                                    
        INSERT INTO Variantes (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)             
        VALUES (@IDProd3, 'ZAP-OXF-NEG-41', 'Negro / Talla 41', '41', 'Negro', 549.00, 12, 1);                      
        INSERT INTO Kardex (IDVariante, IDUsuario, TipoMovimiento, Cantidad, ExistenciaAnterior, ExistenciaNueva,   
        Motivo)                                                                                                     
        VALUES (SCOPE_IDENTITY(), @IDUsuarioAdmin, 'ENTRADA_COMPRA', 12, 0, 12, 'Inventario inicial de apertura');  
    END                                                                                                             
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 6. SEED: CUPONES DE DESCUENTO (RF-05)                                                                        
    -- ----------------------------------------------------------------------------                                 
    -- Cupón 1: 10% en toda la tienda para nuevos clientes                                                          
    IF NOT EXISTS (SELECT 1 FROM Cupones WHERE Codigo = 'BIENVENIDA10')                                             
    BEGIN                                                                                                           
        INSERT INTO Cupones (                                                                                       
            Codigo, TipoDescuento, ValorDescuento, MontoMinimoCompra, LimiteUsosTotal,                              
            UsosActuales, LimiteUsosPorCliente, IDCategoria, FechaInicio, FechaFin, Activo                          
        )                                                                                                           
        VALUES (                                                                                                    
            'BIENVENIDA10', 'PORCENTAJE', 10.00, 100.00, 500,                                                       
            0, 1, NULL, '2026-10-01', '2026-12-31', 1                                                               
        );                                                                                                          
    END                                                                                                             
                                                                                                                    
    -- Cupón 2: Monto fijo de Q50 de Don Arturo en compras mayores a Q300                                           
    IF NOT EXISTS (SELECT 1 FROM Cupones WHERE Codigo = 'DONARTURO50')                                              
    BEGIN                                                                                                           
        INSERT INTO Cupones (                                                                                       
            Codigo, TipoDescuento, ValorDescuento, MontoMinimoCompra, LimiteUsosTotal,                              
            UsosActuales, LimiteUsosPorCliente, IDCategoria, FechaInicio, FechaFin, Activo                          
        )                                                                                                           
        VALUES (                                                                                                    
            'DONARTURO50', 'MONTO_FIJO', 50.00, 300.00, 200,                                                        
            0, 1, NULL, '2026-10-01', '2026-12-31', 1                                                               
        );                                                                                                          
    END                                                                                                             
                                                                                                                    
    -- Cupón 3: 15% exclusivo para Calzado                                                                          
    IF NOT EXISTS (SELECT 1 FROM Cupones WHERE Codigo = 'CALZADO15')                                                
    BEGIN                                                                                                           
        INSERT INTO Cupones (                                                                                       
            Codigo, TipoDescuento, ValorDescuento, MontoMinimoCompra, LimiteUsosTotal,                              
            UsosActuales, LimiteUsosPorCliente, IDCategoria, FechaInicio, FechaFin, Activo                          
        )                                                                                                           
        VALUES (                                                                                                    
            'CALZADO15', 'PORCENTAJE', 15.00, 200.00, 100,                                                          
            0, 1, @IDCategoriaCalzado, '2026-10-01', '2026-12-31', 1                                                
        );                                                                                                          
    END                                                                                                             
                                                                                                                    
    COMMIT TRANSACTION;                                                                                             
    GO                                                                                                              
           