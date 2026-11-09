import { useCallback, useState, type FocusEvent, type FormEvent } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LoaderCircle,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useAuth } from "../shared/auth/useAuth";
import { useCart } from "../features/cart/hooks/useCart";
import { useCategories } from "../features/catalog/hooks/useCategories";
import { useCatalogSuggestions } from "../features/catalog/hooks/useCatalogSuggestions";
import type { Product } from "../features/catalog/types/catalogTypes";
import { formatPrice } from "../lib/format";
import { StoreBenefits } from "./StoreBenefits";
import { routePaths } from "../app/router/routePaths";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function StoreLayout() {
  const { user, signOut } = useAuth();
  const cart = useCart();
  const categories = useCategories();
  const location = useLocation();
  const navigate = useNavigate();
  const urlSearch = new URLSearchParams(location.search).get("busqueda") ?? "";
  const [searchValue, setSearchValue] = useState(urlSearch);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const suggestions = useCatalogSuggestions(searchValue);
  const cartCount = cart.data?.TotalArticulos ?? 0;

  const navigateToCatalog = useCallback((search: string, category?: string | null) => {
    const currentParams = new URLSearchParams(location.search);
    const params = new URLSearchParams();
    const trimmedSearch = search.trim();
    if (trimmedSearch) params.set("busqueda", trimmedSearch);
    const pathCategory = location.pathname.match(/^\/categoria\/(\d+)$/)?.[1];
    const selectedCategory =
      category === undefined
        ? pathCategory ?? currentParams.get("categoria")
        : category;
    const query = params.toString();
    navigate({
      pathname: selectedCategory
        ? routePaths.category.replace(":categoryId", encodeURIComponent(selectedCategory))
        : routePaths.home,
      search: query ? `?${query}` : "",
      hash: "#colecciones",
    });
  }, [location.pathname, location.search, navigate]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearchFocused(false);
    navigateToCatalog(searchValue);
  }

  function closeSuggestionsWhenFocusLeaves(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsSearchFocused(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-dn-gris-oscuro">
      <header className="sticky top-0 z-40 border-b border-dn-azul/80 bg-dn-azul text-white shadow-sm">
        <div className="mx-auto grid min-h-16 grid-cols-[auto_auto_auto_auto] grid-rows-[64px_auto] items-center gap-x-2 px-3 sm:min-h-20 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] sm:grid-rows-1 sm:gap-x-3 sm:px-6 lg:px-8">
          <Link
            className="col-start-1 row-start-1 flex shrink-0 items-center gap-2"
            to="/"
            aria-label="Don Arturo, ir al inicio"
          >
            <span className="grid size-9 place-items-center rounded-md bg-white text-sm font-bold tracking-tight text-dn-azul sm:size-10">
              DA
            </span>
            <span className="text-[11px] font-extrabold tracking-[0.1em] text-white sm:text-sm sm:tracking-[0.12em]">
              DON ARTURO
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="col-start-2 row-start-1 gap-1 border-white/40 bg-transparent px-2 text-xs text-white hover:bg-white hover:text-dn-azul aria-expanded:bg-white aria-expanded:text-dn-azul sm:gap-2 sm:px-3 sm:text-sm"
                variant="outline"
                aria-label="Ver categorías"
              >
                <span className="sm:hidden">Cat.</span>
                <span className="hidden sm:inline">Categorías</span>
                <ChevronDown aria-hidden="true" size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Explorar categorías</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => navigateToCatalog(searchValue, null)}
              >
                Todas las categorías
              </DropdownMenuItem>
              {categories.isPending && (
                <DropdownMenuItem disabled>
                  <LoaderCircle className="animate-spin" /> Cargando categorías…
                </DropdownMenuItem>
              )}
              {categories.isError && (
                <DropdownMenuItem disabled>
                  No pudimos cargar categorías
                </DropdownMenuItem>
              )}
              {categories.data?.map((category) => (
                <DropdownMenuItem
                  key={category.IDCategoria}
                  onSelect={() =>
                    navigateToCatalog(searchValue, String(category.IDCategoria))
                  }
                >
                  {category.Nombre}
                </DropdownMenuItem>
              ))}
              {categories.isError && (
                <DropdownMenuItem onSelect={() => void categories.refetch()}>
                  Intentar de nuevo
                </DropdownMenuItem>
              )}
              {!categories.isPending &&
                !categories.isError &&
                categories.data?.length === 0 && (
                  <DropdownMenuItem disabled>
                    No hay categorías disponibles
                  </DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>

          <form
            className="relative col-span-4 row-start-2 mb-3 flex h-10 min-w-0 items-center gap-2 rounded-md border border-white/70 bg-white px-3 text-dn-gris shadow-sm focus-within:border-dn-rojo focus-within:ring-2 focus-within:ring-white/40 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:mb-0"
            role="search"
            onSubmit={submitSearch}
            onBlur={closeSuggestionsWhenFocusLeaves}
          >
            <Search aria-hidden="true" className="shrink-0" size={17} />
            <Input
              className="h-full min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label="Buscar productos"
              placeholder="¿Qué estás buscando?"
              key={urlSearch}
              defaultValue={urlSearch}
              aria-expanded={isSearchFocused && searchValue.trim().length >= 2}
              aria-controls="catalog-search-suggestions"
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsSearchFocused(false);
              }}
            />
            {searchValue && (
              <button
                className="text-lg leading-none text-dn-gris/70 hover:text-dn-rojo"
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setSearchValue("");
                  navigateToCatalog("");
                  setIsSearchFocused(false);
                }}
              >
                ×
              </button>
            )}
            <Button
              className="size-8 shrink-0 bg-dn-rojo text-white hover:bg-dn-rojo/90 hover:text-white"
              size="icon"
              type="submit"
              aria-label="Buscar"
            >
              <Search aria-hidden="true" size={15} />
            </Button>
            {isSearchFocused && searchValue.trim().length >= 2 && (
              <div
                id="catalog-search-suggestions"
                className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-md border border-dn-gris/20 bg-white text-dn-gris-oscuro shadow-lg"
                role="region"
                aria-label="Sugerencias de productos"
                aria-live="polite"
              >
                {suggestions.isDebouncing || suggestions.isPending ? (
                  <p className="px-4 py-3 text-sm text-dn-gris" role="status">
                    Buscando productos…
                  </p>
                ) : suggestions.isError ? (
                  <p className="px-4 py-3 text-sm text-dn-rojo" role="alert">
                    No pudimos cargar sugerencias. Intenta de nuevo.
                  </p>
                ) : suggestions.data?.datos.length ? (
                  <SuggestionList
                    products={suggestions.data.datos.slice(0, 5)}
                    totalResults={suggestions.data.totalRegistros ?? suggestions.data.datos.length}
                    onSelectProduct={() => setIsSearchFocused(false)}
                  />
                ) : (
                  <p className="px-4 py-3 text-sm text-dn-gris" role="status">
                    No encontramos productos para “{searchValue.trim()}”.
                  </p>
                )}
              </div>
            )}
          </form>

          <Button
            className="relative col-start-4 row-start-1 text-white hover:bg-white/15 hover:text-white"
            variant="ghost"
            size="icon"
            asChild
          >
            <Link
              to="/carrito"
              aria-label={`Carrito de compra, ${cartCount} artículos`}
            >
              <ShoppingBag aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-dn-rojo px-1 text-[10px] font-bold leading-4 text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="col-start-5 row-start-1 text-white hover:bg-white/15 hover:text-white"
                  variant="ghost"
                  size="icon"
                  aria-label="Abrir menú de cuenta"
                >
                  <UserRound aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{user.nombre}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/cuenta">Mi cuenta</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void signOut()}>
                  Salir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              className="col-start-5 row-start-1 text-white hover:bg-white/15 hover:text-white"
              variant="ghost"
              size="icon"
              asChild
            >
              <Link to="/acceso" aria-label="Ingresar">
                <UserRound aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main id="contenido-principal">
        <Outlet />
      </main>

      <footer id="historia" className="border-t border-dn-gris/20 bg-dn-gris/5">
        <StoreBenefits />
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-3 sm:items-center sm:px-8">
          <Link
            className="flex w-fit items-center gap-2.5"
            to="/"
            aria-label="Don Arturo, inicio"
          >
            <span className="grid size-9 place-items-center rounded-md bg-dn-azul text-sm font-bold text-white">
              DA
            </span>
            <span className="text-xs font-extrabold tracking-[0.12em]">
              DON ARTURO
            </span>
          </Link>
          <p className="text-sm text-dn-gris sm:text-center">
            Productos para acompañarte cada día.
            <span className="mt-1 block text-xs text-dn-gris/80">
              Calidad para cada momento.
            </span>
          </p>
          <a
            className="text-sm font-semibold text-dn-azul hover:text-dn-azul sm:justify-self-end"
            href="#contenido-principal"
          >
            Volver arriba ↑
          </a>
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

function SuggestionList({
  products,
  totalResults,
  onSelectProduct,
}: {
  products: Product[];
  totalResults: number;
  onSelectProduct: () => void;
}) {
  return (
    <div>
      <p
        className="border-b border-dn-gris/10 px-4 py-2 text-xs font-medium text-dn-gris"
        role="status"
      >
        {totalResults} {totalResults === 1 ? "producto encontrado" : "productos encontrados"}
      </p>
      <ul className="divide-y divide-dn-gris/10">
        {products.map((product) => {
          const price = product.PrecioMinimo ?? product.PrecioMaximo;

          return (
            <li key={product.IDProducto}>
              <Link
                className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-dn-gris/5 focus-visible:bg-dn-gris/5 focus-visible:outline-none"
                to={`/producto/${product.CodigoPublico}`}
                aria-label={`Ver ${product.Nombre}`}
                onClick={onSelectProduct}
              >
                {product.ImagenPrincipal ? (
                  <img
                    className="size-12 shrink-0 rounded object-cover"
                    src={product.ImagenPrincipal}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded bg-dn-gris/10 text-xs font-bold text-dn-azul"
                    aria-hidden="true"
                  >
                    DA
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-dn-gris-oscuro">
                    {product.Nombre}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-dn-gris">
                    {product.Categoria}
                  </span>
                </span>
                <strong className="shrink-0 text-xs font-semibold text-dn-azul">
                  {price === null || price === undefined
                    ? "Consultar precio"
                    : formatPrice(price)}
                </strong>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
