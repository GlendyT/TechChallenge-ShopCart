/*
    Corrige la unicidad de TokenInvitado en Carritos.
    Los carritos de usuarios tienen TokenInvitado = NULL, por lo que el indice
    debe aplicar unicidad solamente a tokens de invitado no nulos.
*/
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
BEGIN TRANSACTION;

IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = N'UQ_Carritos_TokenInvitado'
      AND parent_object_id = OBJECT_ID(N'dbo.Carritos')
)
BEGIN
    ALTER TABLE dbo.Carritos
    DROP CONSTRAINT UQ_Carritos_TokenInvitado;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UQ_Carritos_TokenInvitado'
      AND object_id = OBJECT_ID(N'dbo.Carritos')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Carritos_TokenInvitado
        ON dbo.Carritos(TokenInvitado)
        WHERE TokenInvitado IS NOT NULL;
END;

COMMIT TRANSACTION;
GO
