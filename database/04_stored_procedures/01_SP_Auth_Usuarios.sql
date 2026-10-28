  -- ============================================================================                                 
    -- PROYECTO: ShopCart                                                                                           
    -- SCRIPT: 01_SP_Auth_Usuarios.sql                                                                              
    -- DESCRIPCIÓN: Procedimientos almacenados para autenticación, usuarios y direcciones.                          
    -- ESTÁNDAR: Prefijo SP_Modulo_Proceso.                                                                         
    -- ============================================================================                                 
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 1. REGISTRO DE NUEVO CLIENTE (RF-01)                                                                         
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Auth_RegistrarCliente                                                              
        @Nombre NVARCHAR(100),                                                                                      
        @Apellido NVARCHAR(100),                                                                                    
        @Correo NVARCHAR(150),                                                                                      
        @PasswordHash NVARCHAR(255),                                                                                
        @Telefono NVARCHAR(20) = NULL                                                                               
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        -- Validar si el correo ya existe                                                                           
        IF EXISTS (SELECT 1 FROM Usuarios WHERE Correo = @Correo)                                                   
        BEGIN                                                                                                       
            RAISERROR('El correo electrónico ya se encuentra registrado.', 16, 1);                                  
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        -- Obtener ID del Rol Cliente                                                                               
        DECLARE @IDRolCliente INT;                                                                                  
        SELECT @IDRolCliente = IDRol FROM Roles WHERE Nombre = 'Cliente';                                           
                                                                                                                    
        IF @IDRolCliente IS NULL                                                                                    
        BEGIN                                                                                                       
            RAISERROR('El rol de Cliente no está configurado en el sistema.', 16, 1);                               
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        INSERT INTO Usuarios (IDRol, Nombre, Apellido, Correo, PasswordHash, Telefono, Activo)                      
        OUTPUT                                                                                                      
            inserted.IDUsuario,                                                                                     
            inserted.CodigoPublico,                                                                                 
            inserted.Nombre,                                                                                        
            inserted.Apellido,                                                                                      
            inserted.Correo,                                                                                        
            inserted.Activo,                                                                                        
            inserted.FechaCreacion                                                                                  
        VALUES (@IDRolCliente, @Nombre, @Apellido, @Correo, @PasswordHash, @Telefono, 1);                           
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 2. OBTENER USUARIO POR CORREO PARA LOGIN (RF-01)                                                             
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Auth_ObtenerPorCorreo                                                              
        @Correo NVARCHAR(150)                                                                                       
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        SELECT                                                                                                      
            u.IDUsuario,                                                                                            
            u.CodigoPublico,                                                                                        
            u.IDRol,                                                                                                
            r.Nombre AS Rol,                                                                                        
            u.Nombre,                                                                                               
            u.Apellido,                                                                                             
            u.Correo,                                                                                               
            u.PasswordHash,                                                                                         
            u.Telefono,                                                                                             
            u.Activo,                                                                                               
            u.FechaCreacion                                                                                         
        FROM Usuarios u                                                                                             
        INNER JOIN Roles r ON u.IDRol = r.IDRol                                                                     
        WHERE u.Correo = @Correo;                                                                                   
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 3. GESTIÓN DE REFRESH TOKENS CON ROTACIÓN (RF-01)                                                            
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Auth_GuardarRefreshToken                                                           
        @IDUsuario INT,                                                                                             
        @TokenHash NVARCHAR(255),                                                                                   
        @FechaExpiracion DATETIME2                                                                                  
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        INSERT INTO RefreshTokens (IDUsuario, TokenHash, FechaExpiracion, Revocado)                                 
        VALUES (@IDUsuario, @TokenHash, @FechaExpiracion, 0);                                                       
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Auth_ObtenerRefreshToken                                                           
        @TokenHash NVARCHAR(255)                                                                                    
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        SELECT                                                                                                      
            rt.IDRefreshToken,                                                                                      
            rt.IDUsuario,                                                                                           
            u.CodigoPublico AS CodigoPublicoUsuario,                                                                
            r.Nombre AS Rol,                                                                                        
            rt.TokenHash,                                                                                           
            rt.FechaExpiracion,                                                                                     
            rt.Revocado,                                                                                            
            rt.ReemplazadoPorTokenHash,                                                                             
            u.Activo AS UsuarioActivo                                                                               
        FROM RefreshTokens rt                                                                                       
        INNER JOIN Usuarios u ON rt.IDUsuario = u.IDUsuario                                                         
        INNER JOIN Roles r ON u.IDRol = r.IDRol                                                                     
        WHERE rt.TokenHash = @TokenHash;                                                                            
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Auth_RevocarRefreshToken                                                           
        @TokenHash NVARCHAR(255),                                                                                   
        @ReemplazadoPorTokenHash NVARCHAR(255) = NULL                                                               
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        UPDATE RefreshTokens                                                                                        
        SET                                                                                                         
            Revocado = 1,                                                                                           
            ReemplazadoPorTokenHash = @ReemplazadoPorTokenHash                                                      
        WHERE TokenHash = @TokenHash;                                                                               
    END;                                                                                                            
    GO     


       -- ----------------------------------------------------------------------------                                 
    -- 4. GESTIÓN DE DIRECCIONES DE ENTREGA (RF-01, RF-06)                                                          
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Direcciones_Crear                                                                  
        @IDUsuario INT,                                                                                             
        @NombreDestinatario NVARCHAR(150),                                                                          
        @TelefonoContacto NVARCHAR(20),                                                                             
        @DireccionLinea1 NVARCHAR(200),                                                                             
        @DireccionLinea2 NVARCHAR(200) = NULL,                                                                      
        @Ciudad NVARCHAR(100),                                                                                      
        @Departamento NVARCHAR(100),                                                                                
        @CodigoPostal NVARCHAR(10) = NULL,                                                                          
        @EsPrincipal BIT = 0                                                                                        
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        -- Si se marca como principal, desmarcar las demás del usuario                                              
        IF @EsPrincipal = 1                                                                                         
        BEGIN                                                                                                       
            UPDATE Direcciones                                                                                      
            SET EsPrincipal = 0                                                                                     
            WHERE IDUsuario = @IDUsuario;                                                                           
        END                                                                                                         
        -- Si es la primera dirección registrada del usuario, forzar a que sea principal                            
        ELSE IF NOT EXISTS (SELECT 1 FROM Direcciones WHERE IDUsuario = @IDUsuario AND Activo = 1)                  
        BEGIN                                                                                                       
            SET @EsPrincipal = 1;                                                                                   
        END                                                                                                         
                                                                                                                    
        INSERT INTO Direcciones (                                                                                   
            IDUsuario,                                                                                              
            NombreDestinatario,                                                                                     
            TelefonoContacto,                                                                                       
            DireccionLinea1,                                                                                        
            DireccionLinea2,                                                                                        
            Ciudad,                                                                                                 
            Departamento,                                                                                           
            CodigoPostal,                                                                                           
            EsPrincipal,                                                                                            
            Activo                                                                                                  
        )                                                                                                           
        OUTPUT                                                                                                      
            inserted.IDDireccion,                                                                                   
            inserted.CodigoPublico,                                                                                 
            inserted.IDUsuario,                                                                                     
            inserted.NombreDestinatario,                                                                            
            inserted.TelefonoContacto,                                                                              
            inserted.DireccionLinea1,                                                                               
            inserted.DireccionLinea2,                                                                               
            inserted.Ciudad,                                                                                        
            inserted.Departamento,                                                                                  
            inserted.CodigoPostal,                                                                                  
            inserted.EsPrincipal,                                                                                   
            inserted.Activo,                                                                                        
            inserted.FechaCreacion                                                                                  
        VALUES (                                                                                                    
            @IDUsuario,                                                                                             
            @NombreDestinatario,                                                                                    
            @TelefonoContacto,                                                                                      
            @DireccionLinea1,                                                                                       
            @DireccionLinea2,                                                                                       
            @Ciudad,                                                                                                
            @Departamento,                                                                                          
            @CodigoPostal,                                                                                          
            @EsPrincipal,                                                                                           
            1                                                                                                       
        );                                                                                                          
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Direcciones_ListarPorUsuario                                                       
        @IDUsuario INT                                                                                              
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        SELECT                                                                                                      
            d.IDDireccion,                                                                                          
            d.CodigoPublico,                                                                                        
            d.NombreDestinatario,                                                                                   
            d.TelefonoContacto,                                                                                     
            d.DireccionLinea1,                                                                                      
            d.DireccionLinea2,                                                                                      
            d.Ciudad,                                                                                               
            d.Departamento,                                                                                         
            d.CodigoPostal,                                                                                         
            d.EsPrincipal,                                                                                          
            d.Activo,                                                                                               
            d.FechaCreacion                                                                                         
        FROM Direcciones d                                                                                          
        WHERE d.IDUsuario = @IDUsuario                                                                              
          AND d.Activo = 1                                                                                          
        ORDER BY d.EsPrincipal DESC, d.FechaCreacion DESC;                                                          
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Direcciones_Actualizar                                                             
        @IDDireccion INT,                                                                                           
        @IDUsuario INT,                                                                                             
        @NombreDestinatario NVARCHAR(150),                                                                          
        @TelefonoContacto NVARCHAR(20),                                                                             
        @DireccionLinea1 NVARCHAR(200),                                                                             
        @DireccionLinea2 NVARCHAR(200) = NULL,                                                                      
        @Ciudad NVARCHAR(100),                                                                                      
        @Departamento NVARCHAR(100),                                                                                
        @CodigoPostal NVARCHAR(10) = NULL,                                                                          
        @EsPrincipal BIT = 0                                                                                        
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
        SET XACT_ABORT ON;                                                                                          
                                                                                                                    
        -- Validar que la dirección pertenezca al usuario (evita IDOR)                                              
        IF NOT EXISTS (SELECT 1 FROM Direcciones WHERE IDDireccion = @IDDireccion AND IDUsuario = @IDUsuario)       
        BEGIN                                                                                                       
            RAISERROR('La dirección no existe o no pertenece al usuario autenticado.', 16, 1);                      
            RETURN;                                                                                                 
        END                                                                                                         
                                                                                                                    
        BEGIN TRANSACTION;                                                                                          
                                                                                                                    
        IF @EsPrincipal = 1                                                                                         
        BEGIN                                                                                                       
            UPDATE Direcciones                                                                                      
            SET EsPrincipal = 0                                                                                     
            WHERE IDUsuario = @IDUsuario AND IDDireccion <> @IDDireccion;                                           
        END                                                                                                         
                                                                                                                    
        UPDATE Direcciones                                                                                          
        SET                                                                                                         
            NombreDestinatario = @NombreDestinatario,                                                               
            TelefonoContacto = @TelefonoContacto,                                                                   
            DireccionLinea1 = @DireccionLinea1,                                                                     
            DireccionLinea2 = @DireccionLinea2,                                                                     
            Ciudad = @Ciudad,                                                                                       
            Departamento = @Departamento,                                                                           
            CodigoPostal = @CodigoPostal,                                                                           
            EsPrincipal = @EsPrincipal                                                                              
        WHERE IDDireccion = @IDDireccion AND IDUsuario = @IDUsuario;                                                
                                                                                                                    
        COMMIT TRANSACTION;                                                                                         
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Direcciones_Eliminar                                                               
        @IDDireccion INT,                                                                                           
        @IDUsuario INT                                                                                              
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        -- Desactivación lógica (soft delete) validando pertenencia al usuario                                      
        UPDATE Direcciones                                                                                          
        SET Activo = 0                                                                                              
        WHERE IDDireccion = @IDDireccion                                                                            
          AND IDUsuario = @IDUsuario;                                                                               
                                                                                                                    
        IF @@ROWCOUNT = 0                                                                                           
        BEGIN                                                                                                       
            RAISERROR('La dirección no existe o no pertenece al usuario.', 16, 1);                                  
            RETURN;                                                                                                 
        END                                                                                                         
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    -- ----------------------------------------------------------------------------                                 
    -- 5. ADMINISTRACIÓN DE USUARIOS (RF-01)                                                                        
    -- ----------------------------------------------------------------------------                                 
    CREATE OR ALTER PROCEDURE SP_Usuarios_Listar                                                                    
        @SoloActivos BIT = 0,                                                                                       
        @Busqueda NVARCHAR(100) = NULL                                                                              
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        SELECT                                                                                                      
            u.IDUsuario,                                                                                            
            u.CodigoPublico,                                                                                        
            u.IDRol,                                                                                                
            r.Nombre AS Rol,                                                                                        
            u.Nombre,                                                                                               
            u.Apellido,                                                                                             
            u.Correo,                                                                                               
            u.Telefono,                                                                                             
            u.Activo,                                                                                               
            u.FechaCreacion,                                                                                        
            u.FechaModificacion                                                                                     
        FROM Usuarios u                                                                                             
        INNER JOIN Roles r ON u.IDRol = r.IDRol                                                                     
        WHERE (@SoloActivos = 0 OR u.Activo = 1)                                                                    
          AND (                                                                                                     
              @Busqueda IS NULL                                                                                     
              OR u.Nombre LIKE '%' + @Busqueda + '%'                                                                
              OR u.Apellido LIKE '%' + @Busqueda + '%'                                                              
              OR u.Correo LIKE '%' + @Busqueda + '%'                                                                
          )                                                                                                         
        ORDER BY u.FechaCreacion DESC;                                                                              
    END;                                                                                                            
    GO                                                                                                              
                                                                                                                    
    CREATE OR ALTER PROCEDURE SP_Usuarios_Desactivar                                                                
        @IDUsuario INT,                                                                                             
        @Activo BIT -- 0 para desactivar, 1 para reactivar                                                          
    AS                                                                                                              
    BEGIN                                                                                                           
        SET NOCOUNT ON;                                                                                             
                                                                                                                    
        UPDATE Usuarios                                                                                             
        SET                                                                                                         
            Activo = @Activo,                                                                                       
            FechaModificacion = SYSDATETIME()                                                                       
        WHERE IDUsuario = @IDUsuario;                                                                               
                                                                                                                    
        IF @@ROWCOUNT = 0                                                                                           
        BEGIN                                                                                                       
            RAISERROR('El usuario no existe.', 16, 1);                                                              
            RETURN;                                                                                                 
        END                                                                                                         
    END;                                                                                                            
    GO                                                                                                              
          