import bcrypt from "bcryptjs";
import { authRepository } from "./auth.repository";
import { bitacoraRepository } from "../bitacora/bitacora.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  JwtUserPayload,
} from "../../utils/jwt";
import { AppError } from "../../errors/AppError";

const REFRESH_TOKEN_EXPIRATION_DAYS = 7;

const calcularExpiracionRefreshToken = (): Date => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);
  return fecha;
};

export const authService = {
  async registrarCliente(
    data: {
      nombre: string;
      apellido: string;
      correo: string;
      password: string;
      telefono?: string | null;
    },
    ip?: string,
  ) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const nuevoUsuario = await authRepository.registrarCliente({
      nombre: data.nombre,
      apellido: data.apellido,
      correo: data.correo.toLowerCase(),
      passwordHash,
      telefono: data.telefono,
    });

    if (!nuevoUsuario) {
      throw new AppError(
        "No fue posible completar el registro del usuario.",
        500,
      );
    }

    await bitacoraRepository.registrar({
      entidad: "Usuarios",
      idRegistro: nuevoUsuario.IDUsuario,
      accion: "CREAR",
      valorNuevo: {
        correo: nuevoUsuario.Correo,
        nombre: `${nuevoUsuario.Nombre} ${nuevoUsuario.Apellido}`,
        rol: "Cliente",
      },
      idUsuario: nuevoUsuario.IDUsuario,
      direccionIP: ip,
    });

    const payload: JwtUserPayload = {
      idUsuario: nuevoUsuario.IDUsuario,
      codigoPublico: nuevoUsuario.CodigoPublico,
      correo: nuevoUsuario.Correo,
      rol: "Cliente",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await authRepository.guardarRefreshToken(
      nuevoUsuario.IDUsuario,
      hashToken(refreshToken),
      calcularExpiracionRefreshToken(),
    );

    return {
      usuario: {
        idUsuario: nuevoUsuario.IDUsuario,
        codigoPublico: nuevoUsuario.CodigoPublico,
        nombre: nuevoUsuario.Nombre,
        apellido: nuevoUsuario.Apellido,
        correo: nuevoUsuario.Correo,
        rol: "Cliente" as const,
      },
      accessToken,
      refreshToken,
    };
  },

  async login(correo: string, password: string) {
    const usuario = await authRepository.obtenerPorCorreo(correo.toLowerCase());

    if (!usuario) {
      throw new AppError("Credenciales inválidas.", 401);
    }

    if (!usuario.Activo) {
      // Criterio RF-01: Usuario desactivado no puede iniciar sesión
      throw new AppError(
        "Tu cuenta ha sido desactivada. Contacta al administrador.",
        403,
      );
    }

    const passwordValido = await bcrypt.compare(password, usuario.PasswordHash);
    if (!passwordValido) {
      throw new AppError("Credenciales inválidas.", 401);
    }

    const payload: JwtUserPayload = {
      idUsuario: usuario.IDUsuario,
      codigoPublico: usuario.CodigoPublico,
      correo: usuario.Correo,
      rol: usuario.Rol,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await authRepository.guardarRefreshToken(
      usuario.IDUsuario,
      hashToken(refreshToken),
      calcularExpiracionRefreshToken(),
    );

    return {
      usuario: {
        idUsuario: usuario.IDUsuario,
        codigoPublico: usuario.CodigoPublico,
        nombre: usuario.Nombre,
        apellido: usuario.Apellido,
        correo: usuario.Correo,
        telefono: usuario.Telefono,
        rol: usuario.Rol,
      },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshTokenRaw: string) {
    const payload = verifyRefreshToken(refreshTokenRaw);
    const tokenHashActual = hashToken(refreshTokenRaw);

    const tokenRegistrado =
      await authRepository.obtenerRefreshToken(tokenHashActual);

    if (!tokenRegistrado) {
      throw new AppError("Refresh token no reconocido.", 401);
    }

    if (tokenRegistrado.Revocado) {
      throw new AppError("El refresh token ya fue utilizado o revocado.", 401);
    }

    if (new Date(tokenRegistrado.FechaExpiracion) <= new Date()) {
      throw new AppError("El refresh token ha expirado.", 401);
    }

    if (!tokenRegistrado.UsuarioActivo) {
      // Criterio RF-01: Usuario desactivado no puede renovar token
      throw new AppError(
        "La cuenta del usuario se encuentra desactivada.",
        403,
      );
    }

    const nuevoPayload: JwtUserPayload = {
      idUsuario: payload.idUsuario,
      codigoPublico: tokenRegistrado.CodigoPublicoUsuario,
      correo: payload.correo,
      rol: tokenRegistrado.Rol,
    };

    const nuevoAccessToken = generateAccessToken(nuevoPayload);
    const nuevoRefreshToken = generateRefreshToken(nuevoPayload);
    const nuevoTokenHash = hashToken(nuevoRefreshToken);

    // Rotación de Refresh Token: revocar el anterior y guardar el nuevo
    await authRepository.revocarRefreshToken(tokenHashActual, nuevoTokenHash);
    await authRepository.guardarRefreshToken(
      payload.idUsuario,
      nuevoTokenHash,
      calcularExpiracionRefreshToken(),
    );

    return {
      accessToken: nuevoAccessToken,
      refreshToken: nuevoRefreshToken,
    };
  },

  async logout(refreshTokenRaw: string): Promise<void> {
    const tokenHashActual = hashToken(refreshTokenRaw);
    await authRepository.revocarRefreshToken(tokenHashActual, null);
  },

  async cambiarEstadoUsuario(
    idUsuarioObjetivo: number,
    activo: boolean,
    idAdmin: number,
    ip?: string,
  ): Promise<void> {
    if (idUsuarioObjetivo === idAdmin && !activo) {
      throw new AppError(
        "No puedes desactivar tu propia cuenta de administrador.",
        400,
      );
    }

    await authRepository.cambiarEstadoUsuario(idUsuarioObjetivo, activo);

    await bitacoraRepository.registrar({
      entidad: "Usuarios",
      idRegistro: idUsuarioObjetivo,
      accion: activo ? "MODIFICAR" : "DESACTIVAR",
      valorNuevo: { activo },
      idUsuario: idAdmin,
      direccionIP: ip,
    });
  },
};
