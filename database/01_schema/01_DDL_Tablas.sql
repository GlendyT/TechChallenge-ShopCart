-- ============================================================================
-- PROYECTO: ShopCart
-- SCRIPT: 01_DDL_Tablas.sql
-- DESCRIPCIÓN: Creación de tablas base del sistema.
-- ESTÁNDAR: PK autoincrementable 'IDNombre', tipos DECIMAL/INT (sin FLOAT/REAL).
-- ADR-001: Clustered Keys internas (INT IDENTITY) + UUID público (CodigoPublico).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MODULO: ROLES Y AUTENTICACIÓN (RF-01)
-- ----------------------------------------------------------------------------

CREATE TABLE Roles (
    IDRol INT IDENTITY(1,1) NOT NULL,
    Nombre NVARCHAR(50) NOT NULL,
    Descripcion NVARCHAR(255) NULL,
    CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (IDRol),
    CONSTRAINT UQ_Roles_Nombre UNIQUE (Nombre)
);

CREATE TABLE Usuarios (
    IDUsuario INT IDENTITY(1,1) NOT NULL,
    CodigoPublico UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Usuarios_CodigoPublico DEFAULT (NEWID()),
    IDRol INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    Correo NVARCHAR(150) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Telefono NVARCHAR(20) NULL,
    Activo BIT NOT NULL CONSTRAINT DF_Usuarios_Activo DEFAULT (1),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Usuarios_FechaCreacion DEFAULT (SYSDATETIME()),
    FechaModificacion DATETIME2 NULL,
    CONSTRAINT PK_Usuarios PRIMARY KEY CLUSTERED (IDUsuario),
    CONSTRAINT UQ_Usuarios_CodigoPublico UNIQUE (CodigoPublico),
    CONSTRAINT UQ_Usuarios_Correo UNIQUE (Correo),
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (IDRol) REFERENCES Roles(IDRol)
);

CREATE TABLE RefreshTokens (
    IDRefreshToken INT IDENTITY(1,1) NOT NULL,
    IDUsuario INT NOT NULL,
    TokenHash NVARCHAR(255) NOT NULL,
    FechaExpiracion DATETIME2 NOT NULL,
    Revocado BIT NOT NULL CONSTRAINT DF_RefreshTokens_Revocado DEFAULT (0),
    ReemplazadoPorTokenHash NVARCHAR(255) NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_RefreshTokens_FechaCreacion DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_RefreshTokens PRIMARY KEY CLUSTERED (IDRefreshToken),
    CONSTRAINT UQ_RefreshTokens_TokenHash UNIQUE (TokenHash),
    CONSTRAINT FK_RefreshTokens_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario)
);

CREATE TABLE Direcciones (
    IDDireccion INT IDENTITY(1,1) NOT NULL,
    CodigoPublico UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Direcciones_CodigoPublico DEFAULT (NEWID()),
    IDUsuario INT NOT NULL,
    NombreDestinatario NVARCHAR(150) NOT NULL,
    TelefonoContacto NVARCHAR(20) NOT NULL,
    DireccionLinea1 NVARCHAR(200) NOT NULL,
    DireccionLinea2 NVARCHAR(200) NULL,
    Ciudad NVARCHAR(100) NOT NULL,
    Departamento NVARCHAR(100) NOT NULL,
    CodigoPostal NVARCHAR(10) NULL,
    EsPrincipal BIT NOT NULL CONSTRAINT DF_Direcciones_EsPrincipal DEFAULT (0),
    Activo BIT NOT NULL CONSTRAINT DF_Direcciones_Activo DEFAULT (1),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Direcciones_FechaCreacion DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Direcciones PRIMARY KEY CLUSTERED (IDDireccion),
    CONSTRAINT UQ_Direcciones_CodigoPublico UNIQUE (CodigoPublico),
    CONSTRAINT FK_Direcciones_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario)
);

-- ----------------------------------------------------------------------------
-- 2. MODULO: CATÁLOGO DE PRODUCTOS (RF-02)
-- ----------------------------------------------------------------------------

CREATE TABLE Categorias (
    IDCategoria INT IDENTITY(1,1) NOT NULL,
    IDCategoriaPadre INT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(255) NULL,
    Activo BIT NOT NULL CONSTRAINT DF_Categorias_Activo DEFAULT (1),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Categorias_FechaCreacion DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Categorias PRIMARY KEY CLUSTERED (IDCategoria),
    CONSTRAINT UQ_Categorias_Nombre UNIQUE (Nombre),
    CONSTRAINT FK_Categorias_CategoriasPadre FOREIGN KEY (IDCategoriaPadre) REFERENCES Categorias(IDCategoria)
);

CREATE TABLE Productos (
    IDProducto INT IDENTITY(1,1) NOT NULL,
    CodigoPublico UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Productos_CodigoPublico DEFAULT (NEWID()),
    IDCategoria INT NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(MAX) NOT NULL,
    Activo BIT NOT NULL CONSTRAINT DF_Productos_Activo DEFAULT (1),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Productos_FechaCreacion DEFAULT (SYSDATETIME()),
    FechaModificacion DATETIME2 NULL,
    CONSTRAINT PK_Productos PRIMARY KEY CLUSTERED (IDProducto),
    CONSTRAINT UQ_Productos_CodigoPublico UNIQUE (CodigoPublico),
    CONSTRAINT FK_Productos_Categorias FOREIGN KEY (IDCategoria) REFERENCES Categorias(IDCategoria)
);

CREATE TABLE ProductoImagenes (
    IDProductoImagen INT IDENTITY(1,1) NOT NULL,
    IDProducto INT NOT NULL,
    ImagenURL NVARCHAR(500) NOT NULL,
    EsPrincipal BIT NOT NULL CONSTRAINT DF_ProductoImagenes_EsPrincipal DEFAULT (0),
    Orden INT NOT NULL CONSTRAINT DF_ProductoImagenes_Orden DEFAULT (1),
    CONSTRAINT PK_ProductoImagenes PRIMARY KEY CLUSTERED (IDProductoImagen),
    CONSTRAINT FK_ProductoImagenes_Productos FOREIGN KEY (IDProducto) REFERENCES Productos(IDProducto)
);

CREATE TABLE Variantes (
    IDVariante INT IDENTITY(1,1) NOT NULL,
    IDProducto INT NOT NULL,
    SKU NVARCHAR(50) NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Talla NVARCHAR(20) NULL,
    Color NVARCHAR(30) NULL,
    Precio DECIMAL(12,2) NOT NULL,
    ExistenciaFisica INT NOT NULL CONSTRAINT DF_Variantes_ExistenciaFisica DEFAULT (0),
    Activo BIT NOT NULL CONSTRAINT DF_Variantes_Activo DEFAULT (1),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Variantes_FechaCreacion DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Variantes PRIMARY KEY CLUSTERED (IDVariante),
    CONSTRAINT UQ_Variantes_SKU UNIQUE (SKU),
    CONSTRAINT FK_Variantes_Productos FOREIGN KEY (IDProducto) REFERENCES Productos(IDProducto),
    CONSTRAINT CK_Variantes_Precio CHECK (Precio >= 0),
    CONSTRAINT CK_Variantes_ExistenciaFisica CHECK (ExistenciaFisica >= 0)
);

-- ----------------------------------------------------------------------------
-- 3. MODULO: INVENTARIO Y KARDEX (RF-03)
-- ----------------------------------------------------------------------------

CREATE TABLE Kardex (
    IDKardex BIGINT IDENTITY(1,1) NOT NULL,
    IDVariante INT NOT NULL,
    IDUsuario INT NOT NULL,
    TipoMovimiento NVARCHAR(30) NOT NULL,
    Cantidad INT NOT NULL,
    ExistenciaAnterior INT NOT NULL,
    ExistenciaNueva INT NOT NULL,
    Motivo NVARCHAR(255) NOT NULL,
    IDReferencia INT NULL, -- ID del Pedido, Devolución o Documento de ajuste
    Fecha DATETIME2 NOT NULL CONSTRAINT DF_Kardex_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Kardex PRIMARY KEY CLUSTERED (IDKardex),
    CONSTRAINT FK_Kardex_Variantes FOREIGN KEY (IDVariante) REFERENCES Variantes(IDVariante),
    CONSTRAINT FK_Kardex_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario),
    CONSTRAINT CK_Kardex_TipoMovimiento CHECK (
        TipoMovimiento IN (
            'ENTRADA_COMPRA',
            'SALIDA_VENTA',
            'AJUSTE_POSITIVO',
            'AJUSTE_NEGATIVO',
            'DEVOLUCION_REINTEGRO',
            'CANCELACION_REINTEGRO'
        )
    ),
    CONSTRAINT CK_Kardex_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CK_Kardex_ExistenciaAnterior CHECK (ExistenciaAnterior >= 0),
    CONSTRAINT CK_Kardex_ExistenciaNueva CHECK (ExistenciaNueva >= 0)
);

-- ----------------------------------------------------------------------------
-- 4. MODULO: CARRITO DE COMPRAS (RF-04)
-- ----------------------------------------------------------------------------

CREATE TABLE Carritos (
    IDCarrito INT IDENTITY(1,1) NOT NULL,
    CodigoPublico UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Carritos_CodigoPublico DEFAULT (NEWID()),
    IDUsuario INT NULL, -- NULL para carritos de visitantes invitados
    TokenInvitado NVARCHAR(100) NULL, -- Identificador de sesión anónima
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Carritos_FechaCreacion DEFAULT (SYSDATETIME()),
    FechaUltimaActividad DATETIME2 NOT NULL CONSTRAINT DF_Carritos_FechaUltimaActividad DEFAULT (SYSDATETIME()),
    Activo BIT NOT NULL CONSTRAINT DF_Carritos_Activo DEFAULT (1),
    CONSTRAINT PK_Carritos PRIMARY KEY CLUSTERED (IDCarrito),
    CONSTRAINT UQ_Carritos_CodigoPublico UNIQUE (CodigoPublico),
    CONSTRAINT FK_Carritos_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario)
);

CREATE TABLE CarritoDetalles (
    IDCarritoDetalle INT IDENTITY(1,1) NOT NULL,
    IDCarrito INT NOT NULL,
    IDVariante INT NOT NULL,
    Cantidad INT NOT NULL,
    FechaAgregado DATETIME2 NOT NULL CONSTRAINT DF_CarritoDetalles_FechaAgregado DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_CarritoDetalles PRIMARY KEY CLUSTERED (IDCarritoDetalle),
    CONSTRAINT FK_CarritoDetalles_Carritos FOREIGN KEY (IDCarrito) REFERENCES Carritos(IDCarrito) ON DELETE CASCADE,
    CONSTRAINT FK_CarritoDetalles_Variantes FOREIGN KEY (IDVariante) REFERENCES Variantes(IDVariante),
    CONSTRAINT UQ_CarritoDetalles_Carrito_Variante UNIQUE (IDCarrito, IDVariante),
    CONSTRAINT CK_CarritoDetalles_Cantidad CHECK (Cantidad > 0)
);

-- ----------------------------------------------------------------------------
-- 5. MODULO: CUPONES Y PROMOCIONES (RF-05)
-- ----------------------------------------------------------------------------

CREATE TABLE Cupones (
    IDCupon INT IDENTITY(1,1) NOT NULL,
    Codigo NVARCHAR(30) NOT NULL,
    TipoDescuento NVARCHAR(20) NOT NULL,
    ValorDescuento DECIMAL(12,2) NOT NULL,
    MontoMinimoCompra DECIMAL(12,2) NOT NULL CONSTRAINT DF_Cupones_MontoMinimoCompra DEFAULT (0),
    LimiteUsosTotal INT NOT NULL,
    UsosActuales INT NOT NULL CONSTRAINT DF_Cupones_UsosActuales DEFAULT (0),
    LimiteUsosPorCliente INT NOT NULL CONSTRAINT DF_Cupones_LimiteUsosPorCliente DEFAULT (1),
    IDCategoria INT NULL, -- NULL = Aplica a todo el carrito; con valor = Aplica solo a esa categoría
    FechaInicio DATETIME2 NOT NULL,
    FechaFin DATETIME2 NOT NULL,
    Activo BIT NOT NULL CONSTRAINT DF_Cupones_Activo DEFAULT (1),
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Cupones_FechaCreacion DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Cupones PRIMARY KEY CLUSTERED (IDCupon),
    CONSTRAINT UQ_Cupones_Codigo UNIQUE (Codigo),
    CONSTRAINT FK_Cupones_Categorias FOREIGN KEY (IDCategoria) REFERENCES Categorias(IDCategoria),
    CONSTRAINT CK_Cupones_TipoDescuento CHECK (TipoDescuento IN ('PORCENTAJE', 'MONTO_FIJO')),
    CONSTRAINT CK_Cupones_ValorDescuento CHECK (ValorDescuento > 0),
    CONSTRAINT CK_Cupones_MontoMinimoCompra CHECK (MontoMinimoCompra >= 0),
    CONSTRAINT CK_Cupones_LimiteUsosTotal CHECK (LimiteUsosTotal > 0),
    CONSTRAINT CK_Cupones_UsosActuales CHECK (UsosActuales >= 0 AND UsosActuales <= LimiteUsosTotal),
    CONSTRAINT CK_Cupones_LimiteUsosPorCliente CHECK (LimiteUsosPorCliente > 0),
    CONSTRAINT CK_Cupones_VigenciaFechas CHECK (FechaFin >= FechaInicio)
);

-- ----------------------------------------------------------------------------
-- 6. MODULO: RESERVAS DE EXISTENCIA Y CHECKOUT (RF-06)
-- ----------------------------------------------------------------------------

CREATE TABLE Reservas (
    IDReserva INT IDENTITY(1,1) NOT NULL,
    IDUsuario INT NULL, -- NULL si fue iniciado como invitado antes del login
    ClaveIdempotencia NVARCHAR(100) NOT NULL,
    Estado NVARCHAR(20) NOT NULL CONSTRAINT DF_Reservas_Estado DEFAULT ('ACTIVA'),
    FechaExpiracion DATETIME2 NOT NULL, -- FechaCreacion + 15 minutos
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Reservas_FechaCreacion DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Reservas PRIMARY KEY CLUSTERED (IDReserva),
    CONSTRAINT UQ_Reservas_ClaveIdempotencia UNIQUE (ClaveIdempotencia),
    CONSTRAINT FK_Reservas_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario),
    CONSTRAINT CK_Reservas_Estado CHECK (Estado IN ('ACTIVA', 'CONFIRMADA', 'EXPIRADA', 'CANCELADA'))
);

CREATE TABLE ReservaDetalles (
    IDReservaDetalle INT IDENTITY(1,1) NOT NULL,
    IDReserva INT NOT NULL,
    IDVariante INT NOT NULL,
    Cantidad INT NOT NULL,
    CONSTRAINT PK_ReservaDetalles PRIMARY KEY CLUSTERED (IDReservaDetalle),
    CONSTRAINT FK_ReservaDetalles_Reservas FOREIGN KEY (IDReserva) REFERENCES Reservas(IDReserva) ON DELETE CASCADE,
    CONSTRAINT FK_ReservaDetalles_Variantes FOREIGN KEY (IDVariante) REFERENCES Variantes(IDVariante),
    CONSTRAINT UQ_ReservaDetalles_Reserva_Variante UNIQUE (IDReserva, IDVariante),
    CONSTRAINT CK_ReservaDetalles_Cantidad CHECK (Cantidad > 0)
);

-- ----------------------------------------------------------------------------
-- 7. MODULO: GESTIÓN DE PEDIDOS Y DEVOLUCIONES (RF-07)
-- ----------------------------------------------------------------------------

CREATE TABLE Pedidos (
    IDPedido INT IDENTITY(1,1) NOT NULL,
    CodigoPublico UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Pedidos_CodigoPublico DEFAULT (NEWID()),
    NumeroPedido NVARCHAR(30) NOT NULL,
    IDUsuario INT NOT NULL,
    IDDireccionEntrega INT NOT NULL,
    DireccionEntregaSnapshot NVARCHAR(MAX) NOT NULL,
    IDCupon INT NULL,
    CodigoCuponSnapshot NVARCHAR(30) NULL,
    Subtotal DECIMAL(12,2) NOT NULL,
    Descuento DECIMAL(12,2) NOT NULL CONSTRAINT DF_Pedidos_Descuento DEFAULT (0),
    IVA DECIMAL(12,2) NOT NULL, -- 12% desglosado
    Total DECIMAL(12,2) NOT NULL,
    Estado NVARCHAR(30) NOT NULL,
    ClaveIdempotencia NVARCHAR(100) NOT NULL,
    MetodoPago NVARCHAR(50) NOT NULL,
    IDTransaccionPago NVARCHAR(100) NOT NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Pedidos_FechaCreacion DEFAULT (SYSDATETIME()),
    FechaModificacion DATETIME2 NULL,
    CONSTRAINT PK_Pedidos PRIMARY KEY CLUSTERED (IDPedido),
    CONSTRAINT UQ_Pedidos_CodigoPublico UNIQUE (CodigoPublico),
    CONSTRAINT UQ_Pedidos_NumeroPedido UNIQUE (NumeroPedido),
    CONSTRAINT UQ_Pedidos_ClaveIdempotencia UNIQUE (ClaveIdempotencia),
    CONSTRAINT FK_Pedidos_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario),
    CONSTRAINT FK_Pedidos_Direcciones FOREIGN KEY (IDDireccionEntrega) REFERENCES Direcciones(IDDireccion),
    CONSTRAINT FK_Pedidos_Cupones FOREIGN KEY (IDCupon) REFERENCES Cupones(IDCupon),
    CONSTRAINT CK_Pedidos_Subtotal CHECK (Subtotal >= 0),
    CONSTRAINT CK_Pedidos_Descuento CHECK (Descuento >= 0),
    CONSTRAINT CK_Pedidos_IVA CHECK (IVA >= 0),
    CONSTRAINT CK_Pedidos_Total CHECK (Total >= 0),
    CONSTRAINT CK_Pedidos_Estado CHECK (
        Estado IN (
            'PAGADO',
            'EN_PREPARACION',
            'DESPACHADO',
            'ENTREGADO',
            'CANCELADO',
            'DEVUELTO_PARCIAL',
            'DEVUELTO_TOTAL'
        )
    )
);

CREATE TABLE PedidoDetalles (
    IDPedidoDetalle INT IDENTITY(1,1) NOT NULL,
    IDPedido INT NOT NULL,
    IDVariante INT NOT NULL,
    SKUSnapshot NVARCHAR(50) NOT NULL,
    NombreProductoSnapshot NVARCHAR(150) NOT NULL,
    NombreVarianteSnapshot NVARCHAR(100) NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(12,2) NOT NULL,
    DescuentoUnitario DECIMAL(12,2) NOT NULL CONSTRAINT DF_PedidoDetalles_DescuentoUnitario DEFAULT (0),
    Subtotal DECIMAL(12,2) NOT NULL,
    CantidadDevuelta INT NOT NULL CONSTRAINT DF_PedidoDetalles_CantidadDevuelta DEFAULT (0),
    CONSTRAINT PK_PedidoDetalles PRIMARY KEY CLUSTERED (IDPedidoDetalle),
    CONSTRAINT FK_PedidoDetalles_Pedidos FOREIGN KEY (IDPedido) REFERENCES Pedidos(IDPedido),
    CONSTRAINT FK_PedidoDetalles_Variantes FOREIGN KEY (IDVariante) REFERENCES Variantes(IDVariante),
    CONSTRAINT CK_PedidoDetalles_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CK_PedidoDetalles_PrecioUnitario CHECK (PrecioUnitario >= 0),
    CONSTRAINT CK_PedidoDetalles_DescuentoUnitario CHECK (DescuentoUnitario >= 0),
    CONSTRAINT CK_PedidoDetalles_Subtotal CHECK (Subtotal >= 0),
    CONSTRAINT CK_PedidoDetalles_CantidadDevuelta CHECK (CantidadDevuelta >= 0 AND CantidadDevuelta <= Cantidad)
);

CREATE TABLE PedidoHistorialEstados (
    IDPedidoHistorial INT IDENTITY(1,1) NOT NULL,
    IDPedido INT NOT NULL,
    EstadoAnterior NVARCHAR(30) NULL,
    EstadoNuevo NVARCHAR(30) NOT NULL,
    IDUsuario INT NOT NULL,
    Motivo NVARCHAR(255) NULL,
    Fecha DATETIME2 NOT NULL CONSTRAINT DF_PedidoHistorialEstados_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_PedidoHistorialEstados PRIMARY KEY CLUSTERED (IDPedidoHistorial),
    CONSTRAINT FK_PedidoHistorialEstados_Pedidos FOREIGN KEY (IDPedido) REFERENCES Pedidos(IDPedido),
    CONSTRAINT FK_PedidoHistorialEstados_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario)
);

CREATE TABLE CuponUsos (
    IDCuponUso INT IDENTITY(1,1) NOT NULL,
    IDCupon INT NOT NULL,
    IDUsuario INT NOT NULL,
    IDPedido INT NOT NULL,
    MontoDescontado DECIMAL(12,2) NOT NULL,
    FechaUso DATETIME2 NOT NULL CONSTRAINT DF_CuponUsos_FechaUso DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_CuponUsos PRIMARY KEY CLUSTERED (IDCuponUso),
    CONSTRAINT FK_CuponUsos_Cupones FOREIGN KEY (IDCupon) REFERENCES Cupones(IDCupon),
    CONSTRAINT FK_CuponUsos_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario),
    CONSTRAINT FK_CuponUsos_Pedidos FOREIGN KEY (IDPedido) REFERENCES Pedidos(IDPedido),
    CONSTRAINT CK_CuponUsos_MontoDescontado CHECK (MontoDescontado >= 0)
);

CREATE TABLE Devoluciones (
    IDDevolucion INT IDENTITY(1,1) NOT NULL,
    IDPedido INT NOT NULL,
    IDUsuario INT NOT NULL, -- Operador o Administrador que la procesa
    Motivo NVARCHAR(255) NOT NULL,
    MontoTotalReembolsado DECIMAL(12,2) NOT NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Devoluciones_FechaCreacion DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Devoluciones PRIMARY KEY CLUSTERED (IDDevolucion),
    CONSTRAINT FK_Devoluciones_Pedidos FOREIGN KEY (IDPedido) REFERENCES Pedidos(IDPedido),
    CONSTRAINT FK_Devoluciones_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario),
    CONSTRAINT CK_Devoluciones_MontoTotalReembolsado CHECK (MontoTotalReembolsado >= 0)
);

CREATE TABLE DevolucionDetalles (
    IDDevolucionDetalle INT IDENTITY(1,1) NOT NULL,
    IDDevolucion INT NOT NULL,
    IDPedidoDetalle INT NOT NULL,
    Cantidad INT NOT NULL,
    MontoReembolsado DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_DevolucionDetalles PRIMARY KEY CLUSTERED (IDDevolucionDetalle),
    CONSTRAINT FK_DevolucionDetalles_Devoluciones FOREIGN KEY (IDDevolucion) REFERENCES Devoluciones(IDDevolucion),
    CONSTRAINT FK_DevolucionDetalles_PedidoDetalles FOREIGN KEY (IDPedidoDetalle) REFERENCES PedidoDetalles(IDPedidoDetalle),
    CONSTRAINT CK_DevolucionDetalles_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CK_DevolucionDetalles_MontoReembolsado CHECK (MontoReembolsado >= 0)
);

-- ----------------------------------------------------------------------------
-- 8. MODULO: BITÁCORA DE AUDITORÍA (RF-09)
-- ----------------------------------------------------------------------------

CREATE TABLE Bitacora (
    IDBitacora BIGINT IDENTITY(1,1) NOT NULL,
    Entidad NVARCHAR(50) NOT NULL, -- 'Productos', 'Variantes', 'Cupones', 'Pedidos', 'Inventario', etc.
    IDRegistro NVARCHAR(100) NOT NULL, -- ID del registro afectado
    Accion NVARCHAR(20) NOT NULL,
    ValorAnterior NVARCHAR(MAX) NULL, -- JSON con los datos anteriores
    ValorNuevo NVARCHAR(MAX) NULL, -- JSON con los datos nuevos
    IDUsuario INT NULL,
    DireccionIP NVARCHAR(50) NULL,
    Fecha DATETIME2 NOT NULL CONSTRAINT DF_Bitacora_Fecha DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_Bitacora PRIMARY KEY CLUSTERED (IDBitacora),
    CONSTRAINT FK_Bitacora_Usuarios FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario),
    CONSTRAINT CK_Bitacora_Accion CHECK (
        Accion IN ('CREAR', 'MODIFICAR', 'DESACTIVAR', 'CAMBIO_ESTADO')
    )
);
GO

-- Garantiza que la bitácora sea estrictamente de solo lectura una vez insertado el registro
CREATE TRIGGER TR_Bitacora_Inmutable
ON Bitacora
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('La bitácora de auditoría es inmutable. No se permite modificar ni eliminar registros.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO
