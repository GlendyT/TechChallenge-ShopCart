import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { PageState } from "../../../components/feedback/PageState";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../../components/ui/carousel";
import { Skeleton } from "../../../components/ui/skeleton";
import { catalogQueryKeys, fetchProducts } from "../api/catalogApi";
import type { Category, CatalogFilters } from "../types/catalogTypes";
import { ProductCard } from "./ProductCard";

const CATEGORY_PRODUCT_LIMIT = 6;

interface CategoryProductSectionProps {
  category: Category;
  search: string;
}

export function CategoryProductSection({
  category,
  search,
}: CategoryProductSectionProps) {
  const filters: CatalogFilters = {
    search,
    category: String(category.IDCategoria),
    order: "RECIENTE",
    page: 1,
    inStock: false,
    priceRange: "all",
  };
  const products = useQuery({
    queryKey: catalogQueryKeys.products(filters, CATEGORY_PRODUCT_LIMIT),
    queryFn: () => fetchProducts(filters, CATEGORY_PRODUCT_LIMIT),
    staleTime: 60_000,
  });
  const rows = products.data?.datos ?? [];

  return (
    <section aria-labelledby={`category-products-${category.IDCategoria}`}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2
            id={`category-products-${category.IDCategoria}`}
            className="text-2xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-3xl"
          >
            {category.Nombre}
          </h2>
          {category.Descripcion && (
            <p className="mt-1 max-w-2xl text-sm text-dn-gris/80">
              {category.Descripcion}
            </p>
          )}
        </div>
        {products.isFetching && !products.isPending && (
          <span className="shrink-0 text-xs text-dn-azul" role="status">
            Actualizando…
          </span>
        )}
      </div>

      {products.isPending ? (
        <div
          className="flex gap-4 overflow-hidden"
          role="status"
          aria-label={`Cargando productos de ${category.Nombre}`}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              className="aspect-[4/5] w-[58%] shrink-0 rounded-md sm:w-[32%] lg:w-[23%]"
              key={index}
            />
          ))}
        </div>
      ) : products.isError ? (
        <PageState
          icon={RefreshCw}
          tone="error"
          title={`No pudimos cargar ${category.Nombre.toLocaleLowerCase("es-GT")}`}
          description={products.error.message || "Comprueba tu conexión e inténtalo de nuevo."}
          action={
            <button
              className="text-sm font-semibold text-dn-azul underline underline-offset-4"
              type="button"
              onClick={() => void products.refetch()}
            >
              Intentar de nuevo
            </button>
          }
        />
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dn-gris/20 bg-dn-gris/5 p-5 text-sm text-dn-gris/80">
          No encontramos productos en esta categoría.
        </p>
      ) : (
        <Carousel
          aria-label={`Productos de ${category.Nombre}`}
          className="px-1"
          opts={{ align: "start" }}
        >
          <CarouselContent className="-ml-4 py-1">
            {rows.map((product) => (
              <CarouselItem
                className="basis-[62%] pl-4 sm:basis-1/3 lg:basis-1/4"
                key={product.IDProducto}
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {rows.length > 2 && (
            <>
              <CarouselPrevious
                aria-label={`Productos anteriores de ${category.Nombre}`}
                className="-left-2 sm:-left-4"
                variant="outline"
              />
              <CarouselNext
                aria-label={`Más productos de ${category.Nombre}`}
                className="-right-2 sm:-right-4"
                variant="outline"
              />
            </>
          )}
        </Carousel>
      )}
    </section>
  );
}
