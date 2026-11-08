import { ArrowUpRight, ImageOff } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../catalog/types";
import { formatPrice } from "../lib/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const price = product.PrecioMinimo ?? product.PrecioMaximo;
  const productUrl = `/producto/${product.CodigoPublico}`;
  const available = product.TotalStockDisponible > 0;

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-dn-gris/10">
        <Link
          className="block size-full"
          to={productUrl}
          aria-label={`Ver ${product.Nombre}`}
        >
          {product.ImagenPrincipal ? (
            <img
              className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
              src={product.ImagenPrincipal}
              alt={product.Nombre}
              loading="lazy"
            />
          ) : (
            <span
              className="flex size-full flex-col items-center justify-center gap-2 text-dn-gris/70"
              aria-hidden="true"
            >
              <ImageOff size={25} strokeWidth={1.5} />
              <span className="text-[9px] font-semibold tracking-[0.16em]">
                DON ARTURO
              </span>
            </span>
          )}
        </Link>
        <Badge
          variant={available ? "secondary" : "destructive"}
          className="absolute left-3 top-3 border-0 bg-white/95 text-xs text-dn-gris-oscuro shadow-sm"
        >
          <span
            className={`mr-1.5 size-1.5 rounded-full ${available ? "bg-dn-azul" : "bg-dn-rojo"}`}
            aria-hidden="true"
          />
          {available ? "Disponible" : "Agotado"}
        </Badge>
        <Button
          className="absolute bottom-3 right-3 size-9 rounded-full bg-white text-dn-azul opacity-100 shadow-sm transition hover:bg-dn-azul hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
          variant="secondary"
          size="icon"
          asChild
        >
          <Link to={productUrl} aria-label={`Descubrir ${product.Nombre}`}>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="pt-3">
        <div className="flex justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-dn-gris/80">
          <span className="truncate">{product.Categoria}</span>
          <span className="shrink-0">
            {product.TotalVariantes}{" "}
            {product.TotalVariantes === 1 ? "opción" : "opciones"}
          </span>
        </div>
        <h3 className="mt-1.5 text-sm font-semibold leading-5 text-dn-gris-oscuro sm:text-base">
          <Link className="hover:text-dn-azul" to={productUrl}>
            {product.Nombre}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
          <strong className="text-sm font-bold text-dn-azul">
            {price === null || price === undefined
              ? "Consultar precio"
              : formatPrice(price)}
          </strong>
          <span className="text-[10px] text-dn-gris/80">IVA incluido</span>
        </div>
      </div>
    </article>
  );
}
