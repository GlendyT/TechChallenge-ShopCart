-- Catálogo de demostración para categorías fuera de ropa y calzado.
-- Ejecutar después de 01_Seed_DatosIniciales.sql. Se puede volver a ejecutar.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

DECLARE @IDUsuarioAdmin INT = (
    SELECT IDUsuario FROM Usuarios WHERE Correo = N'admin@shopcart.gt'
);

IF @IDUsuarioAdmin IS NULL
    THROW 50001, 'Ejecuta primero 01_Seed_DatosIniciales.sql para crear el usuario administrador.', 1;

BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = N'Electrodomésticos')
    INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo)
    VALUES (N'Electrodomésticos', N'Pequeños aparatos para el hogar y la cocina', NULL, 1);

IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = N'Tecnología')
    INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo)
    VALUES (N'Tecnología', N'Accesorios y dispositivos tecnológicos', NULL, 1);

IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = N'Mascotas')
    INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo)
    VALUES (N'Mascotas', N'Artículos para el cuidado y bienestar de mascotas', NULL, 1);

IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = N'Deportes')
    INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo)
    VALUES (N'Deportes', N'Equipo y accesorios para actividad física', NULL, 1);

DECLARE @ProductosAdicionales TABLE (
    Categoria NVARCHAR(100) NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NOT NULL,
    SKU NVARCHAR(50) NOT NULL,
    NombreVariante NVARCHAR(100) NOT NULL,
    Color NVARCHAR(30) NULL,
    Precio DECIMAL(12, 2) NOT NULL,
    Existencia INT NOT NULL,
    ImagenURL NVARCHAR(500) NOT NULL
);

INSERT INTO @ProductosAdicionales
    (Categoria, Nombre, Descripcion, SKU, NombreVariante, Color, Precio, Existencia, ImagenURL)
VALUES
    (N'Electrodomésticos', N'Licuadora Compacta 500 W', N'Licuadora de cinco velocidades con vaso resistente y función de pulso.', N'ELE-LIC-500', N'500 W / 5 velocidades', NULL, 399.00, 12, N'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600'),
    (N'Electrodomésticos', N'Cafetera de Goteo 12 Tazas', N'Cafetera programable con jarra de vidrio y filtro reutilizable.', N'ELE-CAF-12T', N'12 tazas / negro', N'Negro', 475.00, 9, N'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600'),
    (N'Electrodomésticos', N'Hervidor Eléctrico de Acero', N'Hervidor con apagado automático y capacidad de 1.7 litros.', N'ELE-HER-17L', N'1.7 litros / acero', N'Acero inoxidable', 289.00, 14, N'https://images.unsplash.com/photo-1608354580875-30bd4168b351?w=600'),
    (N'Electrodomésticos', N'Ventilador de Mesa 16 Pulgadas', N'Ventilador oscilante de tres velocidades para espacios interiores.', N'ELE-VEN-16P', N'16 pulgadas / blanco', N'Blanco', 525.00, 8, N'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600'),
    (N'Electrodomésticos', N'Tostadora de 2 Rebanadas', N'Tostadora con niveles ajustables y bandeja para migas removible.', N'ELE-TOS-2R', N'2 rebanadas / acero', N'Acero inoxidable', 245.00, 11, N'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600'),
    (N'Tecnología', N'Audífonos Inalámbricos Bluetooth', N'Audífonos Bluetooth con estuche de carga y micrófono integrado.', N'TEC-AUD-BT1', N'Bluetooth / negro', N'Negro', 349.00, 20, N'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'),
    (N'Tecnología', N'Bocina Bluetooth Portátil', N'Bocina portátil recargable con conexión Bluetooth y sonido estéreo.', N'TEC-BOC-BT1', N'Bluetooth / azul', N'Azul', 425.00, 13, N'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'),
    (N'Tecnología', N'Teclado Inalámbrico Compacto', N'Teclado inalámbrico compatible con computadoras y tabletas.', N'TEC-TEC-CMP', N'Compacto / negro', N'Negro', 275.00, 16, N'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'),
    (N'Tecnología', N'Mouse Óptico USB', N'Mouse óptico USB con diseño ergonómico y rueda de desplazamiento.', N'TEC-MOU-USB', N'USB / negro', N'Negro', 89.00, 30, N'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600'),
    (N'Tecnología', N'Cargador Rápido USB-C 30 W', N'Cargador compacto de 30 W con puerto USB-C para dispositivos compatibles.', N'TEC-CAR-30W', N'USB-C / blanco', N'Blanco', 199.00, 18, N'https://images.unsplash.com/photo-1591290619762-c588a7c9708e?w=600'),
    (N'Mascotas', N'Cama Acolchada para Perro', N'Cama lavable con base acolchada para perros pequeños y medianos.', N'MAS-CAM-PER', N'Mediana / gris', N'Gris', 325.00, 10, N'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600'),
    (N'Mascotas', N'Transportadora para Mascotas', N'Transportadora ventilada con asa para perros pequeños y gatos.', N'MAS-TRA-PET', N'Talla mediana / gris', N'Gris', 449.00, 7, N'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600'),
    (N'Mascotas', N'Bebedero Automático para Mascotas', N'Fuente de agua recirculante con filtro reemplazable.', N'MAS-BEB-AUT', N'2 litros / blanco', N'Blanco', 279.00, 12, N'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600'),
    (N'Mascotas', N'Correa Reflectiva para Perro', N'Correa resistente con costuras reflectivas para paseos nocturnos.', N'MAS-COR-REF', N'1.5 m / rojo', N'Rojo', 99.00, 24, N'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=600'),
    (N'Mascotas', N'Rascador Vertical para Gato', N'Rascador con poste de sisal y base estable para gatos.', N'MAS-RAS-GAT', N'60 cm / beige', N'Beige', 389.00, 6, N'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600'),
    (N'Deportes', N'Balón de Fútbol Tamaño 5', N'Balón para entrenamiento y juego recreativo en exteriores.', N'DEP-BAL-FUT5', N'Tamaño 5 / blanco y negro', N'Blanco', 225.00, 18, N'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0f0f?w=600'),
    (N'Deportes', N'Mancuernas Ajustables 10 kg', N'Par de mancuernas ajustables para entrenamiento de fuerza en casa.', N'DEP-MAN-10K', N'Par / 10 kg', NULL, 599.00, 7, N'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600'),
    (N'Deportes', N'Tapete de Yoga Antideslizante', N'Tapete acolchado y antideslizante para yoga y estiramientos.', N'DEP-TAP-YOG', N'6 mm / morado', N'Morado', 199.00, 15, N'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600'),
    (N'Deportes', N'Cuerda para Saltar Ajustable', N'Cuerda ligera con longitud ajustable y mangos ergonómicos.', N'DEP-CUE-SAL', N'Ajustable / negro', N'Negro', 79.00, 25, N'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600'),
    (N'Deportes', N'Botella Deportiva 1 Litro', N'Botella reutilizable de 1 litro con tapa segura para entrenamiento.', N'DEP-BOT-1L', N'1 litro / azul', N'Azul', 89.00, 22, N'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600');

-- Corrige el título del producto original en bases ya inicializadas si perdió la tilde.
UPDATE Productos
SET Nombre = N'Pantalón Chino Casual'
WHERE Nombre COLLATE Latin1_General_100_BIN2 = N'Pantalon Chino Casual' COLLATE Latin1_General_100_BIN2;

UPDATE Productos
SET Nombre = N'Pantalón Chino Casual'
WHERE Nombre COLLATE Latin1_General_100_BIN2 = N'Pantal?n Chino Casual' COLLATE Latin1_General_100_BIN2;

INSERT INTO Productos (IDCategoria, Nombre, Descripcion, Activo)
SELECT c.IDCategoria, seed.Nombre, seed.Descripcion, 1
FROM @ProductosAdicionales AS seed
INNER JOIN Categorias AS c ON c.Nombre = seed.Categoria
WHERE NOT EXISTS (SELECT 1 FROM Productos AS p WHERE p.Nombre = seed.Nombre);

INSERT INTO ProductoImagenes (IDProducto, ImagenURL, EsPrincipal, Orden)
SELECT p.IDProducto, seed.ImagenURL, 1, 1
FROM @ProductosAdicionales AS seed
INNER JOIN Productos AS p ON p.Nombre = seed.Nombre
WHERE NOT EXISTS (
    SELECT 1 FROM ProductoImagenes AS pi
    WHERE pi.IDProducto = p.IDProducto AND pi.EsPrincipal = 1
);

DECLARE @VariantesNuevas TABLE (
    IDVariante INT NOT NULL,
    SKU NVARCHAR(50) NOT NULL
);

INSERT INTO Variantes
    (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)
OUTPUT inserted.IDVariante, inserted.SKU INTO @VariantesNuevas (IDVariante, SKU)
SELECT p.IDProducto, seed.SKU, seed.NombreVariante, NULL, seed.Color, seed.Precio, seed.Existencia, 1
FROM @ProductosAdicionales AS seed
INNER JOIN Productos AS p ON p.Nombre = seed.Nombre
WHERE NOT EXISTS (SELECT 1 FROM Variantes AS v WHERE v.SKU = seed.SKU);

INSERT INTO Kardex
    (IDVariante, IDUsuario, TipoMovimiento, Cantidad, ExistenciaAnterior, ExistenciaNueva, Motivo)
SELECT v.IDVariante, @IDUsuarioAdmin, N'ENTRADA_COMPRA', seed.Existencia, 0, seed.Existencia,
       N'Inventario inicial de apertura'
FROM @VariantesNuevas AS v
INNER JOIN @ProductosAdicionales AS seed ON seed.SKU = v.SKU;

COMMIT TRANSACTION;
GO
