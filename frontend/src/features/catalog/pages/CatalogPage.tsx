import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { routePaths } from "../../../app/router/routePaths";
import { PageState } from "../../../components/feedback/PageState";
import { Skeleton } from "../../../components/ui/skeleton";
import { useCategories } from "../hooks/useCategories";
import { useCatalogFilters } from "../hooks/useCatalogFilters";
import { CategoryCarousel } from "../components/CategoryCarousel";
import { CategoryProductSection } from "../components/CategoryProductSection";

const CATEGORY_BATCH_SIZE = 5;

export function CatalogPage() {
  const { filters, category } = useCatalogFilters();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const selectedCategory = categoryId ?? category;
  const categories = useCategories();
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(
    CATEGORY_BATCH_SIZE,
  );
  const [prevResetKey, setPrevResetKey] = useState(
    `${filters.search}|${selectedCategory}`,
  );
  const resetKey = `${filters.search}|${selectedCategory}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setVisibleCategoryCount(CATEGORY_BATCH_SIZE);
  }
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const visibleCategories = useMemo(() => {
    const matchingCategories = selectedCategory
      ? (categories.data ?? []).filter(
          (item) => String(item.IDCategoria) === selectedCategory,
        )
      : (categories.data ?? []);

    return matchingCategories.slice(0, visibleCategoryCount);
  }, [categories.data, selectedCategory, visibleCategoryCount]);
  const matchingCategoryCount = selectedCategory
    ? (categories.data ?? []).filter(
        (item) => String(item.IDCategoria) === selectedCategory,
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
      {!categoryId && (
        <CategoryCarousel
          categories={categories.data ?? []}
          selectedCategory={selectedCategory}
          isLoading={categories.isPending}
          isError={categories.isError}
          onSelectCategory={(id) =>
            navigate(
              `${routePaths.category.replace(":categoryId", String(id))}#colecciones`,
            )
          }
          onRetry={() => void categories.refetch()}
        />
      )}

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
            {selectedCategory
              ? "No encontramos esta categoría."
              : "No hay categorías disponibles por el momento."}
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
