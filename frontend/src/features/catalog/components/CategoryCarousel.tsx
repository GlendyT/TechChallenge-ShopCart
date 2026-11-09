import { ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../../components/ui/carousel";
import { Skeleton } from "../../../components/ui/skeleton";
import type { Category } from "../types/catalogTypes";

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategory: string;
  isLoading: boolean;
  isError: boolean;
  onSelectCategory: (categoryId: number) => void;
  onRetry: () => void;
}

const fallbackCategoryImage =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80";

const categoryImages: Record<string, string> = {
  caballeros:
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80",
  damas:
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
  calzado:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  accesorios:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  electrodomesticos:
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80",
  tecnologia:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  mascotas:
    "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=900&q=80",
  deportes:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
};

function normalizeCategoryName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-GT");
}

function getCategoryImage(name: string): string {
  return categoryImages[normalizeCategoryName(name)] ?? fallbackCategoryImage;
}

export function CategoryCarousel({
  categories,
  selectedCategory,
  isLoading,
  isError,
  onSelectCategory,
  onRetry,
}: CategoryCarouselProps) {
  const sideCategory = categories[1];
  const primaryCategories = sideCategory
    ? categories.filter(
        (category) => category.IDCategoria !== sideCategory.IDCategoria,
      )
    : categories;

  return (
    <section
      aria-label="Categorías de productos"
      className=" px-2 py-8 sm:px-6 sm:py-10"
    >
      {isLoading ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="status"
          aria-label="Cargando categorías"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-56 rounded-xl" key={index} />
          ))}
        </div>
      ) : isError ? (
        <div
          className="rounded-xl border border-dn-rojo/20 bg-dn-rojo/5 p-6 text-sm text-dn-rojo"
          role="alert"
        >
          <p>No pudimos cargar las categorías.</p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={onRetry}
          >
            Intentar de nuevo
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <p
          className="rounded-xl border border-dn-gris/20 bg-dn-gris/5 p-6 text-sm text-dn-gris"
          role="status"
        >
          No hay categorías disponibles por el momento.
        </p>
      ) : (
        <div className="grid items-center gap-4 pr-1 md:grid-cols-[minmax(0,2fr)_minmax(15rem,0.85fr)]">
          <Carousel
            aria-label="Categorías principales"
            className="px-1 sm:px-0"
            opts={{ align: "start", loop: primaryCategories.length > 1 }}
          >
            <CarouselContent className="py-1">
              {primaryCategories.map((category) => (
                <CarouselItem
                  className="basis-full"
                  key={category.IDCategoria}
                >
                  <CategoryCard
                    category={category}
                    selected={selectedCategory === String(category.IDCategoria)}
                    size="large"
                    onSelect={onSelectCategory}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {primaryCategories.length > 1 && (
              <>
                <CarouselPrevious
                  aria-label="Categorías anteriores"
                  className="left-3 sm:left-5"
                  variant="outline"
                />
                <CarouselNext
                  aria-label="Categorías siguientes"
                  className="right-3 sm:right-5"
                  variant="outline"
                />
              </>
            )}
          </Carousel>
          {sideCategory && (
            <CategoryCard
              category={sideCategory}
              selected={selectedCategory === String(sideCategory.IDCategoria)}
              size="small"
              onSelect={onSelectCategory}
            />
          )}
        </div>
      )}
    </section>
  );
}

function CategoryCard({
  category,
  selected,
  size,
  onSelect,
}: {
  category: Category;
  selected: boolean;
  size: "large" | "small";
  onSelect: (categoryId: number) => void;
}) {
  const image = getCategoryImage(category.Nombre);
  const description =
    category.Descripcion?.trim() ||
    `Descubre los productos disponibles en ${category.Nombre.toLocaleLowerCase("es-GT")}.`;

  return (
    <button
      aria-label={`Explorar categoría ${category.Nombre}`}
      aria-pressed={selected}
      className={`group relative flex min-h-64 w-full overflow-hidden rounded-xl border bg-dn-gris-oscuro text-left shadow-sm transition duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dn-azul focus-visible:ring-offset-2 ${size === "large" ? "md:min-h-[25rem]" : "self-center md:min-h-[19rem]"} ${selected ? "border-dn-azul ring-2 ring-dn-azul" : "border-dn-gris/20"}`}
      type="button"
      onClick={() => onSelect(category.IDCategoria)}
    >
      <img
        alt=""
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
        src={image}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackCategoryImage;
        }}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      <span
        className={`relative mt-auto flex w-full flex-col p-5 text-white sm:p-7 ${size === "large" ? "md:p-10" : "md:p-6"}`}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
          Descubre la categoría
        </span>
        <span
          className={`${size === "large" ? "mt-2 text-3xl sm:text-4xl md:text-5xl" : "mt-2 text-2xl md:text-3xl"} font-semibold tracking-tight`}
        >
          {category.Nombre}
        </span>
        <span
          className={`mt-2 line-clamp-2 text-sm leading-5 text-white/85 ${size === "small" ? "md:max-w-64" : "md:max-w-xl md:text-base"}`}
        >
          {description}
        </span>
        <span className="mt-5 flex items-center gap-2 text-sm font-semibold">
          Explorar categoría
          <ArrowRight aria-hidden="true" size={16} />
        </span>
      </span>
    </button>
  );
}
