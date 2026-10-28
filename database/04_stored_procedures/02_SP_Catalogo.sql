  -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 02_SP_Catalogo.sql                                                                                   
    -- DESCRIPCIÓN: Procedimientos almacenados para categorías, productos y variantes.                              
    -- ESTÁNDAR: Prefijo SP_Modulo_Proceso.                                                                         
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. CRUD DE CATEGORÍAS (RF-02)                                                                                
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Categorias_Listar                                                                  
        @SoloActivas BIT = 1                                                                                        
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        SELECT                                                                                                      
            c.IDCategoria,                                                                                          
            c.IDCategoriaPadre,                                                                                     
            cp.Nombre AS CategoriaPadre,                                                                            
            c.Nombre,                                                                                               
            c.Descripcion,                                                                                          
            c.Activo,                                                                                               
            c.FechaCreacion,                                                                                        
            (SELECT COUNT(1) FROM Productos p WHERE p.IDCategoria = c.IDCategoria AND p.Activo = 1) AS              
            TotalProductosActivos                                                                                   
        FROM Categorias c                                                                                           
        LEFT JOIN Categorias cp ON c.IDCategoriaPadre = cp.IDCategoria                                              
        WHERE (@SoloActivas = 0 OR c.Activo = 1)                                                                    
        ORDER BY c.Nombre ASC;                                                                                      
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Categorias_Crear                                                                   
        @Nombre NVARCHAR(100),                                                                                      
        @Descripcion NVARCHAR(255) = NULL,                                                                          
        @IDCategoriaPadre INT = NULL                                                                                
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        IF EXISTS (SELECT 1 FROM Categorias WHERE Nombre = @Nombre)                                                 
        BEGIN                                                                                                       
            RAISERROR('Ya existe una categoría con ese nombre.', 16, 1);                                            
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @IDCategoriaPadre IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Categorias WHERE IDCategoria =               
        @IDCategoriaPadre)                                                                                          
        BEGIN                                                                                                       
            RAISERROR('La categoría padre especificada no existe.', 16, 1);                                         
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        INSERT INTO Categorias (Nombre, Descripcion, IDCategoriaPadre, Activo)                                      
        OUTPUT                                                                                                      
            inserted.IDCategoria,                                                                                   
            inserted.IDCategoriaPadre,                                                                              
            inserted.Nombre,                                                                                        
            inserted.Descripcion,                                                                                   
            inserted.Activo,                                                                                        
            inserted.FechaCreacion                                                                                  
        VALUES (@Nombre, @Descripcion, @IDCategoriaPadre, 1);                                                       
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Categorias_Actualizar                                                              
        @IDCategoria INT,                                                                                           
        @Nombre NVARCHAR(100),                                                                                      
        @Descripcion NVARCHAR(255) = NULL,                                                                          
        @IDCategoriaPadre INT = NULL,                                                                               
        @Activo BIT = 1                                                                                             
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE IDCategoria = @IDCategoria)                                   
        BEGIN                                                                                                       
            RAISERROR('La categoría no existe.', 16, 1);                                                            
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF EXISTS (SELECT 1 FROM Categorias WHERE Nombre = @Nombre AND IDCategoria <> @IDCategoria)                 
        BEGIN                                                                                                       
            RAISERROR('Ya existe otra categoría con ese nombre.', 16, 1);                                           
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @IDCategoriaPadre = @IDCategoria                                                                         
        BEGIN                                                                                                       
            RAISERROR('Una categoría no puede ser padre de sí misma.', 16, 1);                                      
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        UPDATE Categorias                                                                                           
        SET                                                                                                         
            Nombre = @Nombre,                                                                                       
            Descripcion = @Descripcion,                                                                             
            IDCategoriaPadre = @IDCategoriaPadre,                                                                   
            Activo = @Activo                                                                                        
        WHERE IDCategoria = @IDCategoria;                                                                           
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Categorias_Desactivar                                                              
        @IDCategoria INT,                                                                                           
        @Activo BIT -- 0 para desactivar, 1 para reactivar                                                          
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        UPDATE Categorias                                                                                           
        SET Activo = @Activo                                                                                        
        WHERE IDCategoria = @IDCategoria;                                                                           
                                                                                                                    
        IF @@ROWCOUNT = 0                                                                                           
        BEGIN                                                                                                       
            RAISERROR('La categoría no existe.', 16, 1);                                                            
            RETURN;                                                                                                 
        END                                                                                                         
    END;                                                                                                            
    GO  

       -- ----------------------------------------------------------------------------                                 
    -- 2. LISTADO DE PRODUCTOS CON FILTROS Y PAGINACIÓN (RF-02)                                                     
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Productos_ListarPaginado                                                           
        @Busqueda NVARCHAR(150) = NULL,                                                                             
        @IDCategoria INT = NULL,                                                                                    
        @PrecioMin DECIMAL(12,2) = NULL,                                                                            
        @PrecioMax DECIMAL(12,2) = NULL,                                                                            
        @SoloConStock BIT = 0,                                                                                      
        @SoloActivos BIT = 1,                                                                                       
        @Orden NVARCHAR(20) = 'RECIENTE', -- 'PRECIO_ASC', 'PRECIO_DESC', 'NOMBRE_ASC', 'RECIENTE'                  
        @NumeroPagina INT = 1,                                                                                      
        @TamanoPagina INT = 12                                                                                      
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        -- Validaciones de paginación                                                                               
        IF @NumeroPagina < 1 SET @NumeroPagina = 1;                                                                 
        IF @TamanoPagina < 1 SET @TamanoPagina = 12;                                                                
                                                                                                                    
        DECLARE @Offset INT = (@NumeroPagina - 1) * @TamanoPagina;                                                  
                                                                                                                    
        WITH ResumenVariantes AS (                                                                                  
            SELECT                                                                                                  
                inv.IDProducto,                                                                                     
                MIN(inv.Precio) AS PrecioMinimo,                                                                    
                MAX(inv.Precio) AS PrecioMaximo,                                                                    
                SUM(inv.ExistenciaDisponible) AS TotalStockDisponible,                                              
                COUNT(inv.IDVariante) AS TotalVariantes                                                             
            FROM VW_Inventario_ExistenciasDisponibles inv                                                           
            WHERE (@SoloActivos = 0 OR inv.VarianteActiva = 1)                                                      
            GROUP BY inv.IDProducto                                                                                 
        )                                                                                                           
        SELECT                                                                                                      
            p.IDProducto,                                                                                           
            p.CodigoPublico,                                                                                        
            p.IDCategoria,                                                                                          
            c.Nombre AS Categoria,                                                                                  
            p.Nombre,                                                                                               
            p.Descripcion,                                                                                          
            p.Activo,                                                                                               
            p.FechaCreacion,                                                                                        
            rv.PrecioMinimo,                                                                                        
            rv.PrecioMaximo,                                                                                        
            ISNULL(rv.TotalStockDisponible, 0) AS TotalStockDisponible,                                             
            ISNULL(rv.TotalVariantes, 0) AS TotalVariantes,                                                         
            (                                                                                                       
                SELECT TOP 1 pi.ImagenURL                                                                           
                FROM ProductoImagenes pi                                                                            
                WHERE pi.IDProducto = p.IDProducto                                                                  
                ORDER BY pi.EsPrincipal DESC, pi.Orden ASC                                                          
            ) AS ImagenPrincipal,                                                                                   
            COUNT(1) OVER() AS TotalRegistros                                                                       
        FROM Productos p                                                                                            
        INNER JOIN Categorias c ON p.IDCategoria = c.IDCategoria                                                    
        LEFT JOIN ResumenVariantes rv ON p.IDProducto = rv.IDProducto                                               
        WHERE (@SoloActivos = 0 OR p.Activo = 1)                                                                    
          AND (@IDCategoria IS NULL OR p.IDCategoria = @IDCategoria)                                                
          AND (@Busqueda IS NULL OR p.Nombre LIKE '%' + @Busqueda + '%' OR p.Descripcion LIKE '%' + @Busqueda + '%')
          AND (@PrecioMin IS NULL OR rv.PrecioMaximo >= @PrecioMin)                                                 
          AND (@PrecioMax IS NULL OR rv.PrecioMinimo <= @PrecioMax)                                                 
          AND (@SoloConStock = 0 OR ISNULL(rv.TotalStockDisponible, 0) > 0)                                         
        ORDER BY                                                                                                    
            CASE WHEN @Orden = 'PRECIO_ASC' THEN rv.PrecioMinimo END ASC,                                           
            CASE WHEN @Orden = 'PRECIO_DESC' THEN rv.PrecioMaximo END DESC,                                         
            CASE WHEN @Orden = 'NOMBRE_ASC' THEN p.Nombre END ASC,                                                  
            CASE WHEN @Orden = 'RECIENTE' OR @Orden IS NULL THEN p.FechaCreacion END DESC                           
        OFFSET @Offset ROWS                                                                                         
        FETCH NEXT @TamanoPagina ROWS ONLY;                                                                         
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 3. OBTENER DETALLE COMPLETO DE PRODUCTO (RF-02)                                                              
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Productos_ObtenerPorCodigoPublico                                                  
        @CodigoPublico UNIQUEIDENTIFIER                                                                             
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        DECLARE @IDProducto INT;                                                                                    
        SELECT @IDProducto = IDProducto FROM Productos WHERE CodigoPublico = @CodigoPublico;                        
                                                                                                                    
        IF @IDProducto IS NULL                                                                                      
        BEGIN                                                                                                       
            RAISERROR('El producto no existe.', 16, 1);                                                             
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Resultado 1: Cabecera del Producto                                                                       
        SELECT                                                                                                      
            p.IDProducto,                                                                                           
            p.CodigoPublico,                                                                                        
            p.IDCategoria,                                                                                          
            c.Nombre AS Categoria,                                                                                  
            p.Nombre,                                                                                               
            p.Descripcion,                                                                                          
            p.Activo,                                                                                               
            p.FechaCreacion,                                                                                        
            p.FechaModificacion                                                                                     
        FROM Productos p                                                                                            
        INNER JOIN Categorias c ON p.IDCategoria = c.IDCategoria                                                    
        WHERE p.IDProducto = @IDProducto;                                                                           
                                                                                                                    
        -- Resultado 2: Variantes con stock disponible en tiempo real                                               
        SELECT                                                                                                      
            v.IDVariante,                                                                                           
            v.SKU,                                                                                                  
            v.Nombre,                                                                                               
            v.Talla,                                                                                                
            v.Color,                                                                                                
            v.Precio,                                                                                               
            v.ExistenciaFisica,                                                                                     
            v.UnidadesReservadas,                                                                                   
            v.ExistenciaDisponible,                                                                                 
            v.VarianteActiva AS Activo                                                                              
        FROM VW_Inventario_ExistenciasDisponibles v                                                                 
        WHERE v.IDProducto = @IDProducto                                                                            
        ORDER BY v.Precio ASC, v.SKU ASC;                                                                           
                                                                                                                    
        -- Resultado 3: Imágenes asociadas                                                                          
        SELECT                                                                                                      
            pi.IDProductoImagen,                                                                                    
            pi.ImagenURL,                                                                                           
            pi.EsPrincipal,                                                                                         
            pi.Orden                                                                                                
        FROM ProductoImagenes pi                                                                                    
        WHERE pi.IDProducto = @IDProducto                                                                           
        ORDER BY pi.EsPrincipal DESC, pi.Orden ASC;                                                                 
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 4. CREACIÓN Y ACTUALIZACIÓN DE PRODUCTOS Y VARIANTES (RF-02)                                                 
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Productos_Crear                                                                    
        @IDCategoria INT,                                                                                           
        @Nombre NVARCHAR(150),                                                                                      
        @Descripcion NVARCHAR(MAX)                                                                                  
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE IDCategoria = @IDCategoria AND Activo = 1)                    
        BEGIN                                                                                                       
            RAISERROR('La categoría especificada no existe o no se encuentra activa.', 16, 1);                      
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        INSERT INTO Productos (IDCategoria, Nombre, Descripcion, Activo)                                            
        OUTPUT                                                                                                      
            inserted.IDProducto,                                                                                    
            inserted.CodigoPublico,                                                                                 
            inserted.IDCategoria,                                                                                   
            inserted.Nombre,                                                                                        
            inserted.Descripcion,                                                                                   
            inserted.Activo,                                                                                        
            inserted.FechaCreacion                                                                                  
        VALUES (@IDCategoria, @Nombre, @Descripcion, 1);                                                            
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Variantes_Crear                                                                    
        @IDProducto INT,                                                                                            
        @SKU NVARCHAR(50),                                                                                          
        @Nombre NVARCHAR(100),                                                                                      
        @Talla NVARCHAR(20) = NULL,                                                                                 
        @Color NVARCHAR(30) = NULL,                                                                                 
        @Precio DECIMAL(12,2),                                                                                      
        @ExistenciaFisicaInicial INT = 0,                                                                           
        @IDUsuarioOperador INT = NULL -- Para asentar el movimiento inicial en kardex                               
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        IF EXISTS (SELECT 1 FROM Variantes WHERE SKU = @SKU)                                                        
        BEGIN                                                                                                       
            RAISERROR('Ya existe una variante con el SKU especificado.', 16, 1);                                    
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        IF @Precio < 0                                                                                              
        BEGIN                                                                                                       
            RAISERROR('El precio no puede ser negativo.', 16, 1);                                                   
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        DECLARE @NewIDVariante TABLE (IDVariante INT);                                                              
                                                                                                                    
        INSERT INTO Variantes (IDProducto, SKU, Nombre, Talla, Color, Precio, ExistenciaFisica, Activo)             
        OUTPUT inserted.IDVariante INTO @NewIDVariante                                                              
        VALUES (@IDProducto, @SKU, @Nombre, @Talla, @Color, @Precio, @ExistenciaFisicaInicial, 1);                  
                                                                                                                    
        DECLARE @IDVarianteCreada INT = (SELECT TOP 1 IDVariante FROM @NewIDVariante);                              
                                                                                                                    
        -- Si inicia con existencias, registrar obligatoriamente la entrada en Kardex (RF-03)                       
        IF @ExistenciaFisicaInicial > 0 AND @IDUsuarioOperador IS NOT NULL                                          
        BEGIN                                                                                                       
            INSERT INTO Kardex (                                                                                    
                IDVariante,                                                                                         
                IDUsuario,                                                                                          
                TipoMovimiento,                                                                                     
                Cantidad,                                                                                           
                ExistenciaAnterior,                                                                                 
                ExistenciaNueva,                                                                                    
                Motivo                                                                                              
            )                                                                                                       
            VALUES (                                                                                                
                @IDVarianteCreada,                                                                                  
                @IDUsuarioOperador,                                                                                 
                'ENTRADA_COMPRA',                                                                                   
                @ExistenciaFisicaInicial,                                                                           
                0,                                                                                                  
                @ExistenciaFisicaInicial,                                                                           
                'Inventario inicial al crear la variante'                                                           
            );                                                                                                      
        END                                                                                                         
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
                                                                                                                    
        SELECT                                                                                                      
            v.IDVariante,                                                                                           
            v.IDProducto,                                                                                           
            v.SKU,                                                                                                  
            v.Nombre,                                                                                               
            v.Talla,                                                                                                
            v.Color,                                                                                                
            v.Precio,                                                                                               
            v.ExistenciaFisica,                                                                                     
            v.Activo,                                                                                               
            v.FechaCreacion                                                                                         
        FROM Variantes v                                                                                            
        WHERE v.IDVariante = @IDVarianteCreada;                                                                     
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Productos_Desactivar                                                               
        @IDProducto INT,                                                                                            
        @Activo BIT -- 0 para desactivar, 1 para activar                                                            
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        -- RF-02: Los productos con ventas asociadas nunca se eliminan físicamente; se desactivan.                  
        UPDATE Productos                                                                                            
        SET                                                                                                         
            Activo = @Activo,                                                                                       
            FechaModificacion = SYSDATETIME()                                                                       
        WHERE IDProducto = @IDProducto;                                                                             
                                                                                                                    
        IF @@ROWCOUNT = 0                                                                                           
        BEGIN                                                                                                       
            RAISERROR('El producto no existe.', 16, 1);                                                             
            RETURN;                                                                                                 
        END                                                                                                         
    END;                                                                                                            
    GO                                                                                                              
            