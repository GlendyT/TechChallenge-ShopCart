import { executeSP, sql } from "../../database/db";
import { RolUsuario } from "../../utils/jwt";

export interface UsuarioDB {
  IDUsuario: number;
  CodigoPublico: string;
  IDRol: number;
  Rol: RolUsuario;
  Nombre: string;
  Apellido: string;
  Correo: string;
  PasswordHash: string;
  Telefono: string | null;
  Activo: boolean;
  FechaCreacion: Date;
}

export interface RefreshTokenDB {
  IDRefreshToken: number;
  IDUsuario: number;
  CodigoPublicoUsuario: string;
  Rol: RolUsuario;
  TokenHash: string;
  FechaExpiracion: Date;
  Revocado: boolean;
  ReemplazadoPorTokenHash: string | null;
  UsuarioActivo: boolean;
}

export const authRepository = {
  async registrarCliente(data: {
    nombre: string;
    apellido: string;
    correo: string;
    passwordHash: string;
    telefono?: string | null;
  }) {
    const result = await executeSP<{
      IDUsuario: number;
      CodigoPublico: string;
      Nombre: string;
      Apellido: string;
      Correo: string;
      Activo: boolean;
      FechaCreacion: Date;
    }>("SP_Auth_RegistrarCliente", [
      { name: "Nombre", type: sql.NVarChar(100), value: data.nombre },
      { name: "Apellido", type: sql.NVarChar(100), value: data.apellido },
      { name: "Correo", type: sql.NVarChar(150), value: data.correo },
      {
        name: "PasswordHash",
        type: sql.NVarChar(255),
        value: data.passwordHash,
      },
      {
        name: "Telefono",
        type: sql.NVarChar(20),
        value: data.telefono ?? null,
      },
    ]);
    return result.recordset[0];
  },

  async obtenerPorCorreo(correo: string): Promise<UsuarioDB | undefined> {
    const result = await executeSP<UsuarioDB>("SP_Auth_ObtenerPorCorreo", [
      { name: "Correo", type: sql.NVarChar(150), value: correo },
    ]);
    return result.recordset[0];
  },

  async guardarRefreshToken(
    idUsuario: number,
    tokenHash: string,
    fechaExpiracion: Date,
  ): Promise<void> {
    await executeSP("SP_Auth_GuardarRefreshToken", [
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
      { name: "TokenHash", type: sql.NVarChar(255), value: tokenHash },
      { name: "FechaExpiracion", type: sql.DateTime2, value: fechaExpiracion },
    ]);
  },

  async obtenerRefreshToken(
    tokenHash: string,
  ): Promise<RefreshTokenDB | undefined> {
    const result = await executeSP<RefreshTokenDB>(
      "SP_Auth_ObtenerRefreshToken",
      [{ name: "TokenHash", type: sql.NVarChar(255), value: tokenHash }],
    );
    return result.recordset[0];
  },

  async revocarRefreshToken(
    tokenHash: string,
    reemplazadoPorTokenHash: string | null = null,
  ): Promise<void> {
    await executeSP("SP_Auth_RevocarRefreshToken", [
      { name: "TokenHash", type: sql.NVarChar(255), value: tokenHash },
      {
        name: "ReemplazadoPorTokenHash",
        type: sql.NVarChar(255),
        value: reemplazadoPorTokenHash,
      },
    ]);
  },

  async crearDireccion(
    idUsuario: number,
    data: {
      nombreDestinatario: string;
      telefonoContacto: string;
      direccionLinea1: string;
      direccionLinea2?: string | null;
      ciudad: string;
      departamento: string;
      codigoPostal?: string | null;
      esPrincipal: boolean;
    },
  ) {
    const result = await executeSP("SP_Direcciones_Crear", [
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
      {
        name: "NombreDestinatario",
        type: sql.NVarChar(150),
        value: data.nombreDestinatario,
      },
      {
        name: "TelefonoContacto",
        type: sql.NVarChar(20),
        value: data.telefonoContacto,
      },
      {
        name: "DireccionLinea1",
        type: sql.NVarChar(200),
        value: data.direccionLinea1,
      },
      {
        name: "DireccionLinea2",
        type: sql.NVarChar(200),
        value: data.direccionLinea2 ?? null,
      },
      { name: "Ciudad", type: sql.NVarChar(100), value: data.ciudad },
      {
        name: "Departamento",
        type: sql.NVarChar(100),
        value: data.departamento,
      },
      {
        name: "CodigoPostal",
        type: sql.NVarChar(10),
        value: data.codigoPostal ?? null,
      },
      { name: "EsPrincipal", type: sql.Bit, value: data.esPrincipal ? 1 : 0 },
    ]);
    return result.recordset[0];
  },

  async listarDirecciones(idUsuario: number) {
    const result = await executeSP("SP_Direcciones_ListarPorUsuario", [
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
    ]);
    return result.recordset;
  },

  async actualizarDireccion(
    idDireccion: number,
    idUsuario: number,
    data: {
      nombreDestinatario: string;
      telefonoContacto: string;
      direccionLinea1: string;
      direccionLinea2?: string | null;
      ciudad: string;
      departamento: string;
      codigoPostal?: string | null;
      esPrincipal: boolean;
    },
  ): Promise<void> {
    await executeSP("SP_Direcciones_Actualizar", [
      { name: "IDDireccion", type: sql.Int, value: idDireccion },
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
      {
        name: "NombreDestinatario",
        type: sql.NVarChar(150),
        value: data.nombreDestinatario,
      },
      {
        name: "TelefonoContacto",
        type: sql.NVarChar(20),
        value: data.telefonoContacto,
      },
      {
        name: "DireccionLinea1",
        type: sql.NVarChar(200),
        value: data.direccionLinea1,
      },
      {
        name: "DireccionLinea2",
        type: sql.NVarChar(200),
        value: data.direccionLinea2 ?? null,
      },
      { name: "Ciudad", type: sql.NVarChar(100), value: data.ciudad },
      {
        name: "Departamento",
        type: sql.NVarChar(100),
        value: data.departamento,
      },
      {
        name: "CodigoPostal",
        type: sql.NVarChar(10),
        value: data.codigoPostal ?? null,
      },
      { name: "EsPrincipal", type: sql.Bit, value: data.esPrincipal ? 1 : 0 },
    ]);
  },

  async eliminarDireccion(
    idDireccion: number,
    idUsuario: number,
  ): Promise<void> {
    await executeSP("SP_Direcciones_Eliminar", [
      { name: "IDDireccion", type: sql.Int, value: idDireccion },
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
    ]);
  },

  async listarUsuarios(soloActivos = false, busqueda?: string) {
    const result = await executeSP("SP_Usuarios_Listar", [
      { name: "SoloActivos", type: sql.Bit, value: soloActivos ? 1 : 0 },
      { name: "Busqueda", type: sql.NVarChar(100), value: busqueda || null },
    ]);
    return result.recordset;
  },

  async cambiarEstadoUsuario(
    idUsuario: number,
    activo: boolean,
  ): Promise<void> {
    await executeSP("SP_Usuarios_Desactivar", [
      { name: "IDUsuario", type: sql.Int, value: idUsuario },
      { name: "Activo", type: sql.Bit, value: activo ? 1 : 0 },
    ]);
  },
};
