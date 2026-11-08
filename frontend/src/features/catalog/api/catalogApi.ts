import { apiRequest } from "../../../shared/api/httpClient";
import type { ApiEnvelope } from "../../../shared/api/apiTypes";
import type { Category, CatalogFilters, Product, ProductDetail } from "../types/catalogTypes";

const PAGE_SIZE = 9;

const priceRangeBounds = {
  all: {},
  "under-200": { precioMax: 200 },
  "200-400": { precioMin: 200, precioMax: 400 },
  "over-400": { precioMin: 400 },
} satisfies Record<CatalogFilters["priceRange"], Record<string, number>>;

export const catalogQueryKeys = {
  all: ["catalog"] as const,
  categories: ["catalog", "categories"] as const,
  products: (filters: CatalogFilters) => ["catalog", "products", filters] as const,
  product: (publicCode: string) => ["catalog", "product", publicCode] as const,
};

export function buildCatalogSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams({
    pagina: String(filters.page),
    limite: String(PAGE_SIZE),
    orden: filters.order,
  });
  if (filters.search) params.set("busqueda", filters.search);
  if (filters.category) params.set("idCategoria", filters.category);
  if (filters.inStock) params.set("soloConStock", "true");
  for (const [key, value] of Object.entries(priceRangeBounds[filters.priceRange])) {
    params.set(key, String(value));
  }
  return params;
}

export function fetchCategories(): Promise<Category[]> {
  return apiRequest<Category[]>("/catalogo/categorias").then(({ datos }) => datos);
}

export function fetchProducts(filters: CatalogFilters): Promise<ApiEnvelope<Product[]>> {
  const params = buildCatalogSearchParams(filters);
  return apiRequest<Product[]>(`/catalogo/productos?${params}`);
}

export function fetchProduct(publicCode: string): Promise<ProductDetail> {
  return apiRequest<ProductDetail>(`/catalogo/productos/${encodeURIComponent(publicCode)}`)
    .then(({ datos }) => datos);
}
