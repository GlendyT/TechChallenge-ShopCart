export type UserRole = "Administrador" | "Operador" | "Cliente";

export interface AuthUser {
  idUsuario: number;
  codigoPublico: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string | null;
  rol: UserRole;
}

export interface AuthSession {
  usuario: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  correo: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  nombre: string;
  apellido: string;
  telefono?: string;
}
