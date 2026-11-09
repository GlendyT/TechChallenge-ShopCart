import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/auth/useAuth";
import type { UserRole } from "../../../shared/auth/authTypes";
import { routePaths } from "../routePaths";
import { Skeleton } from "../../../components/ui/skeleton";

interface RequireRoleProps {
  allowedRoles: readonly UserRole[];
}

export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-5 sm:px-8" aria-busy="true">
        <Skeleton className="h-10 w-56" />
        <span className="sr-only">Verificando sesión</span>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={routePaths.signIn}
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  if (!allowedRoles.includes(user.rol)) {
    return (
      <section
        className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-5 py-12 sm:px-8"
        role="alert"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">
          Acceso restringido
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-dn-gris-oscuro">
          Tu cuenta no tiene acceso a esta sección.
        </h1>
        <p className="mt-2 text-sm text-dn-gris">
          Inicia sesión con una cuenta autorizada o vuelve a la tienda.
        </p>
        <Link
          className="mt-6 font-semibold text-dn-azul underline underline-offset-4"
          to={routePaths.home}
        >
          Volver a la tienda
        </Link>
      </section>
    );
  }

  return <Outlet />;
}
