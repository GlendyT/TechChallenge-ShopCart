import { LogOut } from "lucide-react";
import { useCallback } from "react";
import type { CSSProperties } from "react";
import { Link, Navigate, Outlet, type LinkProps } from "react-router-dom";
import { routePaths } from "../app/router/routePaths";
import { useAuth } from "../shared/auth/useAuth";
import type { AuthUser } from "../shared/auth/authTypes";
import { RoleNavigation } from "./RoleNavigation";
import { Button } from "./ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "./ui/sidebar";
import { useSidebar } from "./ui/sidebar-context";
import { TooltipProvider } from "./ui/tooltip";

export function OperationsLayout() {
  const { user, signOut } = useAuth();

  if (!user) return <Navigate to={routePaths.signIn} replace />;
  if (user.rol === "Cliente") return <Navigate to={routePaths.home} replace />;

  return (
    <TooltipProvider>
      <SidebarProvider
        className="[&_[data-slot=sidebar-gap]]:transition-none"
        style={
          {
            "--sidebar": "var(--dn-azul)",
            "--sidebar-foreground": "var(--primary-foreground)",
            "--sidebar-primary": "var(--primary-foreground)",
            "--sidebar-primary-foreground": "var(--dn-azul)",
            "--sidebar-accent":
              "color-mix(in srgb, var(--primary-foreground) 15%, transparent)",
            "--sidebar-accent-foreground": "var(--primary-foreground)",
            "--sidebar-border":
              "color-mix(in srgb, var(--primary-foreground) 15%, transparent)",
            "--sidebar-ring": "var(--primary-foreground)",
          } as CSSProperties
        }
      >
        <OperationsSidebar user={user} onSignOut={() => void signOut()} />
        <SidebarInset className="min-h-svh min-w-0 bg-dn-gris/5">
          <header className="flex min-h-16 items-center gap-3 border-b border-dn-gris/20 bg-white px-4 text-sm font-semibold sm:px-8">
            <span>Panel de operaciones</span>
            <span className="ml-auto rounded-full bg-dn-azul/5 px-3 py-1.5 text-xs font-medium text-dn-azul">
              {user.rol}
            </span>
          </header>
          <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function OperationsSidebar({
  user,
  onSignOut,
}: {
  user: AuthUser;
  onSignOut: () => void;
}) {
  return (
    <Sidebar collapsible="icon" className="text-white">
      <SidebarHeader className="flex-row items-center justify-between p-2 sm:p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <SidebarHomeLink
          className="flex items-center gap-3 px-1 py-2 group-data-[collapsible=icon]:hidden"
          to={routePaths.home}
          aria-label="Don Arturo, volver a tienda"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white font-bold text-dn-azul">
            DA
          </span>
          <span className="min-w-0 text-xs font-extrabold tracking-[0.12em] text-white">
            DON ARTURO
            <small className="mt-1 block text-[9px] font-medium tracking-[0.14em] text-white/65">
              GESTIÓN DE TIENDA
            </small>
          </span>
        </SidebarHomeLink>
        <SidebarTrigger
          aria-label="Alternar navegación de operaciones"
          className="shrink-0 text-white hover:bg-white/15 hover:text-white"
        />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <OperationsNavigation role={user.rol} />
      </SidebarContent>
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:px-1">
        <SidebarSeparator />
        <div className="flex items-center gap-3 px-1 pt-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">
            {user.nombre.slice(0, 1)}
            {user.apellido.slice(0, 1)}
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="block truncate text-xs font-semibold text-white">
              {user.nombre} {user.apellido}
            </strong>
            <small className="text-[10px] text-white/65">{user.rol}</small>
          </div>
        </div>
        <Button
          className="justify-start gap-3 text-white/75 hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          aria-label="Cerrar sesión"
          type="button"
          variant="ghost"
          onClick={onSignOut}
        >
          <LogOut aria-hidden="true" size={17} />
          <span className="group-data-[collapsible=icon]:hidden">
            Cerrar sesión
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function OperationsNavigation({ role }: { role: AuthUser["rol"] }) {
  const { setOpenMobile } = useSidebar();
  const closeMobileNavigation = useCallback(
    () => setOpenMobile(false),
    [setOpenMobile],
  );

  return <RoleNavigation role={role} onNavigate={closeMobileNavigation} />;
}

function SidebarHomeLink({
  onClick,
  ...props
}: LinkProps) {
  const { setOpenMobile } = useSidebar();

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        setOpenMobile(false);
      }}
    />
  );
}
