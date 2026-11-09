import { ArrowLeft, ArrowUpRight, LoaderCircle, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { routePaths } from "../../../app/router/routePaths";
import { formatPrice } from "../../../lib/format";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { useAddToCart } from "../hooks/useAddToCart";
import { useProduct } from "../hooks/useProduct";

export function ProductPage({ codigoPublico }: { codigoPublico: string }) {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const product = useProduct(codigoPublico);
  const addItem = useAddToCart();
  const { notice } = addItem;

  if (product.isPending) {
    return (
      <div
        className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-2 sm:px-8"
        role="status"
        aria-label="Cargando producto"
      >
        <Skeleton className="aspect-[4/5] rounded-lg" />
        <div className="space-y-4 py-8">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (product.isError || !product.data) {
    return (
      <section
        className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-5 text-center"
        role="alert"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">
          Producto no disponible
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-dn-gris-oscuro">
          No encontramos este producto
        </h1>
        <p className="mt-2 text-sm text-dn-gris">{product.error?.message}</p>
        <Button asChild className="mt-6">
          <Link to="/">Volver a la tienda</Link>
        </Button>
      </section>
    );
  }

  const item = product.data;
  const activeVariants = item.variantes.filter((variant) => variant.Activo);
  const selected =
    activeVariants.find((variant) => variant.IDVariante === selectedVariant) ??
    activeVariants[0];
  const image =
    item.imagenes.find((photo) => photo.EsPrincipal)?.ImagenURL ??
    item.imagenes[0]?.ImagenURL ??
    item.ImagenPrincipal;

  return (
    <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
      <nav
        aria-label="Ruta de navegación"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-dn-gris/80"
      >
        <Link className="hover:text-dn-azul" to="/">
          Tienda
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          className="hover:text-dn-azul"
          to={`${routePaths.category.replace(":categoryId", String(item.IDCategoria))}#colecciones`}
        >
          {item.Categoria}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-dn-gris-oscuro">{item.Nombre}</span>
      </nav>
      <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="relative overflow-hidden rounded-lg bg-dn-gris/10">
          {image ? (
            <img
              className="aspect-[4/5] w-full object-cover"
              src={image}
              alt={item.Nombre}
            />
          ) : (
            <div className="grid aspect-[4/5] place-items-center text-5xl font-bold text-dn-gris/60">
              DA
            </div>
          )}
          <Badge className="absolute left-4 top-4 bg-white text-dn-gris-oscuro hover:bg-white">
            Colección Don Arturo
          </Badge>
        </div>
        <div className="py-2 lg:py-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">
            {item.Categoria} · Esencial DA
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-5xl">
            {item.Nombre}
          </h1>
          <p className="mt-4 text-2xl font-bold text-dn-azul">
            {selected
              ? formatPrice(selected.Precio)
              : "Sin variantes disponibles"}
          </p>
          <p className="mt-5 max-w-xl text-sm leading-7 text-dn-gris">
            {item.Descripcion}
          </p>

          <div className="my-7 border-t border-dn-gris/20" />
          <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-dn-gris-oscuro">
            <span>Elige tu opción</span>
            <span className="font-normal text-dn-gris/80">
              {selected?.Color ?? ""}
            </span>
          </div>
          {activeVariants.length === 0 && (
            <p className="mb-3 text-sm text-dn-gris" role="status">
              Este producto no tiene variantes disponibles por el momento.
            </p>
          )}
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="Variantes disponibles"
          >
            {activeVariants.map((variant) => {
              const isSelected = selected?.IDVariante === variant.IDVariante;
              return (
                <button
                  key={variant.IDVariante}
                  className={`flex min-h-16 flex-col items-start justify-center rounded-md border px-3 py-2 text-left transition ${isSelected ? "border-dn-azul bg-dn-azul/5 ring-1 ring-dn-azul" : "border-dn-gris/60 bg-white hover:border-dn-azul"} disabled:cursor-not-allowed disabled:opacity-50`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={variant.ExistenciaDisponible < 1}
                  onClick={() => setSelectedVariant(variant.IDVariante)}
                >
                  <span className="text-sm font-semibold text-dn-gris-oscuro">
                    {variant.Nombre}
                  </span>
                  <small className="mt-1 text-xs text-dn-gris/80">
                    {variant.ExistenciaDisponible > 0
                      ? `${variant.ExistenciaDisponible} disponibles`
                      : "Agotado"}
                  </small>
                </button>
              );
            })}
          </div>

          {addItem.isError && (
            <p className="mt-4 text-sm text-dn-rojo" role="alert">
              {addItem.error.message}
            </p>
          )}
          {notice && (
            <p
              className="mt-4 rounded-md bg-dn-azul/5 px-3 py-2 text-sm text-dn-azul"
              role="status"
            >
              {notice}
            </p>
          )}
          <Button
            className="mt-5 h-12 w-full justify-between bg-dn-azul px-5 text-white hover:bg-dn-azul"
            type="button"
            disabled={
              !selected ||
              selected.ExistenciaDisponible < 1 ||
              addItem.isPending
            }
            onClick={() => selected && addItem.mutate(selected.IDVariante)}
          >
            {addItem.isPending ? (
              <><LoaderCircle aria-hidden="true" className="animate-spin" size={18} /><span>Agregando…</span></>
            ) : (
              <><span>Agregar a mi bolsa</span><ArrowUpRight aria-hidden="true" size={18} /></>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-dn-gris/80">
            Precios en quetzales · IVA incluido
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-dn-gris/20 pt-5">
            <div className="flex gap-2 text-xs text-dn-gris">
              <Truck className="shrink-0 text-dn-azul" size={17} />
              <span>
                <strong className="block text-dn-gris-oscuro">
                  Envío nacional
                </strong>
                <small className="mt-1 block">
                  Seguimiento hasta tu puerta
                </small>
              </span>
            </div>
            <div className="flex gap-2 text-xs text-dn-gris">
              <ShieldCheck className="shrink-0 text-dn-azul" size={17} />
              <span>
                <strong className="block text-dn-gris-oscuro">
                  Compra segura
                </strong>
                <small className="mt-1 block">Pago protegido</small>
              </span>
            </div>
          </div>
          <Link
            className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-dn-azul hover:text-dn-azul"
            to="/"
          >
            <ArrowLeft size={16} /> Seguir explorando
          </Link>
        </div>
      </div>
    </section>
  );
}
