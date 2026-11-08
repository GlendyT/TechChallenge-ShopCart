import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageState } from "../../../components/feedback/PageState";
import { Skeleton } from "../../../components/ui/skeleton";
import { useCategories } from "../hooks/useCategories";
import { useCatalogFilters } from "../hooks/useCatalogFilters";
import { CategoryCarousel } from "../components/CategoryCarousel";
import { CategoryProductSection } from "../components/CategoryProductSection";

const CATEGORY_BATCH_SIZE = 5;

export function CatalogPage() {
  const { filters, category, setCategory } = useCatalogFilters();
  const categories = useCategories();
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(
    CATEGORY_BATCH_SIZE,
  );
  const [prevResetKey, setPrevResetKey] = useState({ category, search: filters.search });
  if (prevResetKey.category !== category || prevResetKey.search !== filters.search) {
    setPrevResetKey({ category, search: filters.search });
    setVisibleCategoryCount(CATEGORY_BATCH_SIZE);
  }
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const visibleCategories = useMemo(() => {
    const matchingCategories = category
      ? (categories.data ?? []).filter(
          (item) => String(item.IDCategoria) === category,
        )
      : (categories.data ?? []);

    return matchingCategories.slice(0, visibleCategoryCount);
  }, [categories.data, category, visibleCategoryCount]);
  const matchingCategoryCount = category
    ? (categories.data ?? []).filter(
        (item) => String(item.IDCategoria) === category,
      ).length
    : (categories.data?.length ?? 0);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (
      !target ||
      visibleCategoryCount >= matchingCategoryCount ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCategoryCount((current) =>
            Math.min(current + CATEGORY_BATCH_SIZE, matchingCategoryCount),
          );
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [matchingCategoryCount, visibleCategoryCount]);

  return (
    <>
      <CategoryCarousel
        categories={categories.data ?? []}
        selectedCategory={category}
        isLoading={categories.isPending}
        isError={categories.isError}
        onSelectCategory={(categoryId) => setCategory(String(categoryId))}
        onRetry={() => void categories.refetch()}
      />

      <section
        id="colecciones"
        aria-label="Productos por categoría"
        className="mx-auto max-w-7xl scroll-mt-24 space-y-14 px-5 pb-16 sm:space-y-20 sm:px-8 sm:pb-20"
      >
        {categories.isPending ? (
          <CategorySectionsSkeleton />
        ) : categories.isError ? (
          <PageState
            icon={RefreshCw}
            tone="error"
            title="No pudimos cargar las categorías"
            description={categories.error.message || "Inténtalo de nuevo."}
            action={
              <button
                className="text-sm font-semibold text-dn-azul underline underline-offset-4"
                type="button"
                onClick={() => void categories.refetch()}
              >
                Intentar de nuevo
              </button>
            }
          />
        ) : visibleCategories.length === 0 ? (
          <p className="py-12 text-center text-sm text-dn-gris">
            No hay categorías disponibles por el momento.
          </p>
        ) : (
          <>
            {visibleCategories.map((item) => (
              <CategoryProductSection
                key={item.IDCategoria}
                category={item}
                search={filters.search}
              />
            ))}
            {visibleCategoryCount < matchingCategoryCount && (
              <div
                ref={loadMoreRef}
                className="h-1"
                aria-label="Cargar más categorías al desplazarse"
              />
            )}
          </>
        )}
      </section>
    </>
  );
}

function CategorySectionsSkeleton() {
  return (
    <div className="space-y-14" role="status" aria-label="Cargando categorías">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index}>
          <Skeleton className="mb-5 h-7 w-48" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, cardIndex) => (
              <Skeleton
                className="aspect-[4/5] rounded-md"
                key={cardIndex}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
