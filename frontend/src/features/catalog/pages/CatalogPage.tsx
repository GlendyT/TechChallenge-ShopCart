import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  RefreshCw,
  Search,
  SearchX,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { PageState } from "../../../components/feedback/PageState";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Skeleton } from "../../../components/ui/skeleton";
import type { CatalogSortOrder } from "../types/catalogTypes";
import { useCategories } from "../hooks/useCategories";
import { useCatalogFilters, priceRanges } from "../hooks/useCatalogFilters";
import { useCatalogProducts } from "../hooks/useCatalogProducts";

export function CatalogPage() {
  const {
    filters,
    searchInput: search,
    setSearchInput: setSearch,
    category,
    setCategory,
    order,
    setOrder,
    page,
    setPage,
    inStock,
    setInStock,
    priceRange,
    setPriceRange,
    clearFilters,
  } = useCatalogFilters();
  const categories = useCategories();
  const products = useCatalogProducts(filters);
  const productRows = products.data?.datos ?? [];
  const totalPages = products.data?.totalPaginas ?? 1;
  const totalResults = products.data?.totalRegistros ?? 0;
  const activeFilters =
    Number(Boolean(category)) + Number(inStock) + Number(priceRange !== "all");
  return (
    <>
      <section className="mx-auto grid max-w-7xl overflow-hidden bg-dn-gris/10 lg:min-h-[560px] lg:grid-cols-2">
        <div className="flex flex-col items-start justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14 xl:px-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-dn-azul shadow-sm">
            <span className="size-2 rounded-full bg-dn-rojo" />
            Una marca guatemalteca · Desde 1987
          </span>
          <h1 id="hero-title" className="mt-6 max-w-xl text-5xl font-semibold leading-[1.03] tracking-[-0.055em] text-dn-gris-oscuro sm:text-6xl xl:text-7xl">
            Los buenos momentos <span className="text-dn-azul">también se visten.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-dn-gris">
            Prendas versátiles y diseño para acompañarte en todo lo que viene.
          </p>
          <Button asChild className="mt-7 gap-3 bg-dn-azul px-5 text-white hover:bg-dn-azul">
            <a href="#colecciones">Descubrir colección <ArrowUpRight aria-hidden="true" size={17} /></a>
          </Button>
          <a className="mt-4 text-sm font-medium text-dn-gris underline decoration-dn-rojo underline-offset-4 hover:text-dn-azul" href="#historia">
            Conoce nuestra historia
          </a>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-dn-gris">
            <span className="inline-flex items-center gap-2"><Check className="text-dn-azul" size={15} /> Hecho para durar</span>
            <span className="inline-flex items-center gap-2"><Check className="text-dn-azul" size={15} /> Envíos a todo el país</span>
          </div>
        </div>
        <div className="relative min-h-80 bg-dn-gris/60 sm:min-h-[420px] lg:min-h-full">
          <img
            className="absolute inset-0 size-full object-cover object-center"
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=85"
            alt="Estilo de vida Don Arturo, prendas para todos los días"
          />
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 bg-white p-4 sm:inset-x-6 sm:bottom-6 sm:p-5">
            <span><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-dn-gris/80">Esenciales para</span><strong className="mt-1 block text-xl font-semibold tracking-tight text-dn-gris-oscuro">la vida real</strong></span>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-dn-rojo text-white"><ArrowUpRight aria-hidden="true" size={19} /></span>
          </div>
          <span className="absolute right-4 top-4 bg-dn-azul/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white sm:right-6 sm:top-6">Colección 2026</span>
        </div>
      </section>

      <section aria-label="Beneficios de comprar en Don Arturo" className="mx-auto grid max-w-6xl border-b border-dn-gris/20 px-5 sm:grid-cols-3 sm:px-8">
        <div className="flex items-center gap-3 border-b border-dn-gris/20 py-5 sm:justify-center sm:border-b-0 sm:py-7"><Truck className="text-dn-azul" size={21} /><span><strong className="block text-sm font-semibold">Envío nacional</strong><small className="mt-0.5 block text-xs text-dn-gris/80">Hasta tu puerta</small></span></div>
        <div className="flex items-center gap-3 border-b border-dn-gris/20 py-5 sm:justify-center sm:border-b-0 sm:border-l sm:py-7"><ShieldCheck className="text-dn-azul" size={21} /><span><strong className="block text-sm font-semibold">Compra segura</strong><small className="mt-0.5 block text-xs text-dn-gris/80">Tu información protegida</small></span></div>
        <div className="flex items-center gap-3 py-5 sm:justify-center sm:border-l sm:py-7"><Check className="text-dn-rojo" size={21} /><span><strong className="block text-sm font-semibold">Calidad que se siente</strong><small className="mt-0.5 block text-xs text-dn-gris/80">Materiales seleccionados</small></span></div>
      </section>

      <section id="colecciones" aria-labelledby="catalog-title" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-dn-rojo">La colección</p>
            <h2 id="catalog-title" className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-dn-gris-oscuro sm:text-5xl">Encuentra tu <span className="text-dn-azul">esencial.</span></h2>
          </div>
          <p className="text-sm leading-6 text-dn-gris/80 sm:text-right">Menos ruido. Más intención.<br />Prendas que se quedan contigo.</p>
        </div>

        <div className="flex flex-col justify-between gap-3 border-y border-dn-gris/20 py-3 sm:flex-row sm:items-center">
          <div className="flex gap-1 overflow-x-auto pb-1" role="group" aria-label="Filtrar por categoría">
            <button className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition ${!category ? "bg-dn-azul text-white" : "text-dn-gris hover:bg-dn-gris/10 hover:text-dn-azul"}`} type="button" aria-pressed={!category} onClick={() => { setCategory(""); setPage(1); }}>Todo</button>
            {categories.isPending && <div className="flex items-center px-3" role="status" aria-label="Cargando categorías"><Skeleton className="h-8 w-24" aria-hidden="true" /></div>}
            {categories.isError && <span className="self-center px-3 text-xs text-dn-rojo" role="alert">No pudimos cargar las categorías. <button className="font-semibold underline underline-offset-2" type="button" onClick={() => void categories.refetch()}>Reintentar</button></span>}
            {!categories.isPending && !categories.isError && categories.data?.length === 0 && <span className="self-center px-3 text-xs text-dn-gris/80" role="status">No hay categorías disponibles.</span>}
            {categories.data?.map((item) => (
              <button key={item.IDCategoria} className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition ${category === String(item.IDCategoria) ? "bg-dn-azul text-white" : "text-dn-gris hover:bg-dn-gris/10 hover:text-dn-azul"}`} type="button" aria-pressed={category === String(item.IDCategoria)} onClick={() => { setCategory(String(item.IDCategoria)); setPage(1); }}>{item.Nombre}</button>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-2 text-xs text-dn-gris/80"><Search aria-hidden="true" size={15} />{activeFilters ? `${activeFilters} filtro${activeFilters > 1 ? "s" : ""} aplicado${activeFilters > 1 ? "s" : ""}` : "Filtrar y ordenar"}</span>
        </div>

        <div className="grid gap-3 border-b border-dn-gris/20 py-4 md:grid-cols-[minmax(220px,1fr)_auto] md:items-center">
          <label id="buscar" className="flex h-10 items-center gap-2 rounded-md border border-dn-gris/60 bg-white px-3 text-dn-gris/80 focus-within:border-dn-azul focus-within:ring-2 focus-within:ring-dn-azul/15">
            <Search aria-hidden="true" size={17} className="shrink-0" />
            <span className="sr-only">Buscar productos</span>
            <Input className="h-full border-0 px-0 shadow-none focus-visible:ring-0" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="¿Qué estás buscando?" aria-label="Buscar productos" />
            {search && <button className="text-xl leading-none text-dn-gris/80 hover:text-dn-rojo" type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch("")}>×</button>}
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <label className="flex items-center gap-2 text-xs text-dn-gris/80"><span>Precio</span><span className="relative"><select className="h-9 max-w-36 appearance-none rounded-md border border-dn-gris/60 bg-white py-1 pl-3 pr-8 text-xs font-medium text-dn-gris-oscuro focus:border-dn-azul focus:outline-none focus:ring-2 focus:ring-dn-azul/15" aria-label="Filtrar por precio" value={priceRange} onChange={(event) => { setPriceRange(event.target.value as typeof priceRange); setPage(1); }}>{priceRanges.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-dn-gris/80" size={14} /></span></label>
            <label className="flex items-center gap-2 text-xs text-dn-gris/80"><span>Orden</span><span className="relative"><select className="h-9 max-w-40 appearance-none rounded-md border border-dn-gris/60 bg-white py-1 pl-3 pr-8 text-xs font-medium text-dn-gris-oscuro focus:border-dn-azul focus:outline-none focus:ring-2 focus:ring-dn-azul/15" aria-label="Ordenar productos" value={order} onChange={(event) => { setOrder(event.target.value as CatalogSortOrder); setPage(1); }}><option value="RECIENTE">Más recientes</option><option value="PRECIO_ASC">Precio: menor a mayor</option><option value="PRECIO_DESC">Precio: mayor a menor</option><option value="NOMBRE_ASC">Nombre</option></select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-dn-gris/80" size={14} /></span></label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-dn-gris-oscuro"><input className="size-4 accent-dn-azul focus:ring-dn-azul" type="checkbox" checked={inStock} onChange={(event) => { setInStock(event.target.checked); setPage(1); }} /> Solo disponibles</label>
          </div>
        </div>

        <div aria-live="polite" aria-busy={products.isFetching} className="pt-5">
          {products.isPending ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              <span className="sr-only" role="status">Cargando productos</span>
              {Array.from({ length: 8 }, (_, index) => (
                <div className="min-w-0" key={index} aria-hidden="true">
                  <Skeleton className="aspect-[4/5] rounded-md" />
                  <Skeleton className="mt-3 h-3 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-4/5" />
                  <Skeleton className="mt-3 h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : products.isError ? (
            <PageState icon={RefreshCw} tone="error" title="No pudimos cargar la colección" description={products.error.message || "Comprueba tu conexión e inténtalo de nuevo."} action={<Button variant="outline" onClick={() => void products.refetch()}>Intentar de nuevo</Button>} />
          ) : productRows.length === 0 ? (
            <PageState icon={SearchX} title="No encontramos esa pieza" description="Prueba con otra búsqueda o elimina algunos filtros para explorar la colección." action={<Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>} />
          ) : (
            <>
              <div className="mb-4 flex min-h-8 items-center justify-between gap-3 text-xs text-dn-gris/80"><p><strong className="text-dn-gris-oscuro">{totalResults}</strong> {totalResults === 1 ? "pieza" : "piezas"} para descubrir</p>{products.isFetching && <span className="text-dn-azul">Actualizando colección…</span>}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
                {productRows.map((product) => <ProductCard key={product.IDProducto} product={product} />)}
              </div>
              <div className="mt-10 flex items-center justify-between border-t border-dn-gris/20 pt-4 text-sm text-dn-gris/80">
                <span>Página {page.toString().padStart(2, "0")} <span className="px-1 text-dn-gris/60">/</span> {totalPages.toString().padStart(2, "0")}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft aria-hidden="true" /></Button>
                  <Button variant="outline" size="icon" type="button" aria-label="Página siguiente" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}><ArrowRight aria-hidden="true" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-dn-azul px-5 py-14 text-center text-white sm:py-20">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-dn-rojo/80">Don Arturo · Guatemala</span>
        <p className="mx-auto mt-4 max-w-3xl text-3xl font-medium tracking-tight sm:text-4xl">Diseñamos para acompañarte,<br /><span className="text-dn-gris/60">no para llamar la atención.</span></p>
      </section>
    </>
  );
}
