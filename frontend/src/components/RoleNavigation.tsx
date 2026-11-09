import { memo } from "react";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  ReceiptText,
  Settings2,
  UsersRound,
} from "lucide-react";
import { NavLink, useMatch } from "react-router-dom";
import type { UserRole } from "../shared/auth/authTypes";
import { routePaths } from "../app/router/routePaths";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

interface NavigationItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    label: "Resumen",
    to: routePaths.operations,
    icon: LayoutDashboard,
    roles: ["Operador", "Administrador"],
  },
  {
    label: "Pedidos",
    to: routePaths.operationsOrders,
    icon: ClipboardList,
    roles: ["Operador", "Administrador"],
  },
  {
    label: "Inventario",
    to: routePaths.operationsInventory,
    icon: Boxes,
    roles: ["Operador", "Administrador"],
  },
  {
    label: "Reportes",
    to: routePaths.operationsReports,
    icon: ReceiptText,
    roles: ["Operador", "Administrador"],
  },
  {
    label: "Catálogo",
    to: routePaths.administrationCatalog,
    icon: Settings2,
    roles: ["Administrador"],
  },
  {
    label: "Usuarios",
    to: routePaths.administrationUsers,
    icon: UsersRound,
    roles: ["Administrador"],
  },
];

interface RoleNavigationProps {
  role: UserRole;
  onNavigate?: () => void;
}

export const RoleNavigation = memo(function RoleNavigation({
  role,
  onNavigate,
}: RoleNavigationProps) {
  const items = navigationItems.filter((item) => item.roles.includes(role));

  return (
    <SidebarGroup className="px-3 py-4 group-data-[collapsible=icon]:px-1">
      <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60 group-data-[collapsible=icon]:hidden">
        Espacio de trabajo
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <nav aria-label="Navegación de operaciones">
          <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
            {items.map(({ label, to, icon: Icon }) => (
              <NavigationItem
                key={to}
                label={label}
                to={to}
                Icon={Icon}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

function NavigationItem({
  label,
  to,
  Icon,
  onNavigate,
}: {
  label: string;
  to: string;
  Icon: NavigationItem["icon"];
  onNavigate?: () => void;
}) {
  const isActive = useMatch({ path: to, end: to === routePaths.operations });

  return (
    <SidebarMenuItem className="group-data-[collapsible=icon]:w-8">
      <SidebarMenuButton
        asChild
        isActive={Boolean(isActive)}
        size="lg"
        tooltip={label}
        className="h-11 text-white/80 hover:bg-white/10 hover:text-white data-active:bg-white/15 data-active:font-semibold data-active:text-white group-data-[collapsible=icon]:justify-center"
      >
        <NavLink
          to={to}
          end={to === routePaths.operations}
          onClick={onNavigate}
          className="flex items-center gap-2"
        >
          <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
          <span className="group-data-[collapsible=icon]:hidden">{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
