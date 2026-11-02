docker exec shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -Q "CREATE DATABASE ShopCartDB;"

TABLAS
Get-Content "database\01_schema\01_DDL_Tablas.sql" -Raw | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -d ShopCartDB

INDICES
Get-Content "database\01_schema\02_DDL_Indices.sql" -Raw | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -d ShopCartDB

COMANDO 2 DE INDICES YA QUE EL #1 FALLO
Get-Content "database\01_schema\02_DDL_Indices.sql" -Raw | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -I -d ShopCartDB

VISTAS
Get-Content "database\02_views\01_VW_VistasSistema.sql" -Raw | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -I -d ShopCartDB

FUNCIONES
Get-Content "database\03_functions\01_FU_FuncionesTabla.sql" -Raw | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -I -d ShopCartDB

LIMPIADOR DE INDICES QUE SE CREARON A MEDIAS
docker exec shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -d ShopCartDB -Q "DROP INDEX IF EXISTS IX_Usuarios_IDRol ON Usuarios; DROP INDEX IF EXISTS IX_RefreshTokens_IDUsuario ON RefreshTokens; DROP INDEX IF EXISTS IX_Direcciones_IDUsuario ON Direcciones;"

AUTH Y USUARIOS
Get-Content "database\04_stored_procedures\01_SP_Auth_Usuarios.sql" -Raw | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -I -d ShopCartDB

CATALOGO
Get-Content "database\04_stored_procedures\02_SP_Catalogo.sql" -Raw | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -I -d ShopCartDB

STORE PROCEDURES Y DATOS SEMILLA
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-ChildItem "database\04*stored_procedures\*.sql", "database\05_seed\*.sql" | ForEach-Object { Write-Host "Ejecutando $($*.Name)..." -ForegroundColor Cyan; (Get-Content $\_.FullName -Raw -Encoding UTF8) -replace '','' | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -I -d ShopCartDB }

sEGUNDO INTENTO DE STORE PROCEDURES Y DATOS SEMILLA
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-ChildItem "database\04*stored_procedures\03_SP_Inventario_Kardex.sql", "database\04_stored_procedures\05_SP_Cupones.sql", "database\05_seed\01_Seed_DatosIniciales.sql" | ForEach-Object { Write-Host "Ejecutando $($*.Name)..." -ForegroundColor Cyan; (Get-Content $\_.FullName -Raw -Encoding UTF8).Replace([string][char]0xFFF9, '') | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -I -x -d ShopCartDB }

//
CONSTULA DE DOCKER PARA VER LA BASE DE DATOS
docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -d ShopCartDB -Q "SELECT (SELECT COUNT(_) FROM sys.tables) AS Tablas, (SELECT COUNT(_) FROM sys.views)
AS Vistas, (SELECT COUNT(_) FROM sys.procedures) AS SPs, (SELECT COUNT(_) FROM Usuarios) AS Usuarios, (SELECT COUNT(_) FROM Productos) AS Productos, (SELECT COUNT(_) FROM Variantes) AS Variantes;"

COMANDO PARA VALIDAR LAS CONTRASEÑAS RELAES AL 100% TANTO PARA EL CONTENEDOR CON EL ACTUAL SCRIPT DEL SEED
node -e "const b = require('bcryptjs'); const hA = b.hashSync('Admin123!', 10); const hO = b.hashSync('Operador123!', 10); const hC = b.hashSync('Cliente123!', 10); console.log(JSON.stringify({hA, hO, hC}));"


COMANDO PARA ACTUALIZAR LOS HASHES 
 Get-Content "database\05_seed\01_Seed_DatosIniciales.sql" -Raw -Encoding UTF8 | docker exec -i shopcart-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "TuPasswordSeguro123!" -C -I -x -d ShopCartDB  