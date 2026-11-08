import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  ReceiptText,
  Settings2,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { UserRole } from "../api/client";

interface NavigationItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    label: "Resumen",
    to: "/operaciones",
    icon: LayoutDashboard,
    roles: ["Operador", "Administrador"],
  },
  {
    label: "Pedidos",
    to: "/operaciones/pedidos",
    icon: ClipboardList,
    roles: ["Operador", "Administrador"],
  },
  {
    label: "Inventario",
    to: "/operaciones/inventario",
    icon: Boxes,
    roles: ["Operador", "Administrador"],
  },
  {
    label: "Reportes",
    to: "/operaciones/reportes",
    icon: ReceiptText,
    roles: ["Operador", "Administrador"],
  },
  {
    label: "Catálogo",
    to: "/administracion/catalogo",
    icon: Settings2,
    roles: ["Administrador"],
  },
  {
    label: "Usuarios",
    to: "/administracion/usuarios",
    icon: UsersRound,
    roles: ["Administrador"],
  },
];

interface RoleNavigationProps {
  role: UserRole;
  onNavigate?: () => void;
}

export function RoleNavigation({ role, onNavigate }: RoleNavigationProps) {
  const items = navigationItems.filter((item) => item.roles.includes(role));

  return (
    <nav
      className="flex flex-col gap-1 py-6"
      aria-label="Navegación de operaciones"
    >
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-dn-gris/70">
        Espacio de trabajo
      </p>
      {items.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition ${isActive ? "bg-dn-azul font-semibold text-white" : "text-dn-gris/20 hover:bg-white/10 hover:text-white"}`
          }
          to={to}
          end={to === "/operaciones"}
          onClick={onNavigate}
        >
          <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
