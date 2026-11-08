import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../shared/auth/useAuth";
import { useCart } from "../features/cart/hooks/useCart";
import { Button } from "./ui/button";

export function StoreLayout() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cart = useCart();
  const cartCount = cart.data?.TotalArticulos ?? 0;
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-white text-dn-gris-oscuro">
      <div className="flex min-h-9 items-center justify-center gap-2 bg-dn-azul px-4 text-center text-xs text-white">
        <span className="font-semibold text-dn-rojo/80">Don Arturo Guatemala</span>
        <span className="hidden text-dn-gris/60 sm:inline">· Envíos a todo el país</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-dn-gris/20 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            type="button"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            aria-controls="store-navigation"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>

          <Link
            className="flex shrink-0 items-center gap-2.5"
            to="/"
            aria-label="Don Arturo, ir al inicio"
            onClick={closeMenu}
          >
            <span className="grid size-10 place-items-center rounded-md bg-dn-azul font-bold tracking-tight text-white">
              DA
            </span>
            <span className="text-sm font-extrabold tracking-[0.12em] sm:text-base">
              DON ARTURO
              <span className="mt-0.5 block text-[9px] font-medium tracking-[0.16em] text-dn-gris/80">
                GUATEMALA · 1987
              </span>
            </span>
          </Link>

          <nav
            id="store-navigation"
            aria-label="Navegación principal"
            className={`${isMenuOpen ? "absolute inset-x-0 top-full flex border-b border-dn-gris/20 bg-white px-5 py-3 shadow-lg" : "hidden"} flex-col gap-1 lg:static lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
          >
            <NavLink
              className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium transition hover:bg-dn-gris/10 hover:text-dn-azul ${isActive ? "text-dn-azul" : "text-dn-gris"}`}
              to="/"
              end
              onClick={closeMenu}
            >
              Tienda
            </NavLink>
            <a className="rounded-md px-3 py-2 text-sm font-medium text-dn-gris transition hover:bg-dn-gris/10 hover:text-dn-azul" href="/#colecciones" onClick={closeMenu}>
              Colección
            </a>
            <a className="rounded-md px-3 py-2 text-sm font-medium text-dn-gris transition hover:bg-dn-gris/10 hover:text-dn-azul" href="/#historia" onClick={closeMenu}>
              Nuestra historia
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Button className="hidden sm:inline-flex" variant="ghost" size="icon" asChild>
              <a href="/#buscar" aria-label="Buscar productos"><Search aria-hidden="true" /></a>
            </Button>
            {user ? (
              <>
                <Button className="hidden sm:inline-flex" variant="ghost" asChild>
                  <Link to="/cuenta"><UserRound aria-hidden="true" /> <span>Mi cuenta</span></Link>
                </Button>
                <button className="hidden text-xs font-medium text-dn-gris/80 hover:text-dn-rojo md:inline" type="button" onClick={() => void signOut()}>
                  Salir
                </button>
              </>
            ) : (
              <Button className="hidden sm:inline-flex" variant="ghost" asChild>
                <Link to="/acceso"><UserRound aria-hidden="true" /> <span>Ingresar</span></Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link to="/carrito" aria-label={`Bolsa de compra, ${cartCount} artículos`} className="relative">
                <ShoppingBag aria-hidden="true" />
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-dn-rojo px-1 text-[10px] font-bold leading-4 text-white">
                  {cartCount}
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido-principal"><Outlet /></main>

      <footer id="historia" className="border-t border-dn-gris/20 bg-dn-gris/5">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-3 sm:items-center sm:px-8">
          <Link className="flex w-fit items-center gap-2.5" to="/" aria-label="Don Arturo, inicio">
            <span className="grid size-9 place-items-center rounded-md bg-dn-azul text-sm font-bold text-white">DA</span>
            <span className="text-xs font-extrabold tracking-[0.12em]">DON ARTURO<span className="mt-0.5 block text-[9px] font-medium text-dn-gris/80">GUATEMALA · 1987</span></span>
          </Link>
          <p className="text-sm text-dn-gris sm:text-center">Ropa para moverte a tu manera.<span className="mt-1 block text-xs text-dn-gris/80">Diseñada aquí. Hecha para durar.</span></p>
          <a className="text-sm font-semibold text-dn-azul hover:text-dn-azul sm:justify-self-end" href="#contenido-principal">Volver arriba ↑</a>
        </div>
        <div className="border-t border-dn-gris/20 px-5 py-4 text-xs text-dn-gris/80 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 sm:flex-row">
            <span>© {new Date().getFullYear()} Don Arturo Guatemala</span>
            <span>Quetzales GTQ · IVA incluido</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
