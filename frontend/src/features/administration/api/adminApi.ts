import { apiRequest } from "../../../shared/api/httpClient";
import type { AdminCategory, AdminCoupon, AdminProduct, AdminProductsPage, AdminUser, AuditRecord } from "../types/adminTypes";

export const adminQueryKey = ["administration"] as const;
export const auditQueryKey = [...adminQueryKey, "audit"] as const;

export const listAdminCategories = async () => (await apiRequest<AdminCategory[]>("/catalogo/categorias?todas=true")).datos;
export const listAdminProducts = async (
  search: string,
  page: number,
  pageSize = 20,
): Promise<AdminProductsPage> => {
  const params = new URLSearchParams({
    pagina: String(page),
    limite: String(pageSize),
    incluirInactivos: "true",
    orden: "NOMBRE_ASC",
  });
  if (search.trim()) params.set("busqueda", search.trim());
  const response = await apiRequest<AdminProduct[]>(`/catalogo/productos?${params}`);
  return { datos: response.datos, totalPaginas: response.totalPaginas ?? 1, totalRegistros: response.totalRegistros ?? 0, paginaActual: response.paginaActual ?? page };
};
export const listCoupons = async () => (await apiRequest<AdminCoupon[]>("/cupones")).datos;
export const listUsers = async (search: string) => {
  const params = new URLSearchParams();
  if (search.trim()) params.set("busqueda", search.trim());
  return apiRequest<AdminUser[]>(`/auth/usuarios?${params}`).then((response) => response.datos);
};
export async function listAudit(params: URLSearchParams) {
  return apiRequest<AuditRecord[]>(`/bitacora?${params}`).then((response) => ({ datos: response.datos, totalRegistros: response.totalRegistros ?? 0, paginaActual: response.paginaActual ?? 1 }));
}

export const saveCategory = (id: number | null, data: { nombre: string; descripcion: string | null; idCategoriaPadre: number | null; activo?: boolean }) =>
  apiRequest(id ? `/catalogo/categorias/${id}` : "/catalogo/categorias", { method: id ? "PUT" : "POST", body: JSON.stringify(data) });
export const setCategoryActive = (id: number, activo: boolean) => apiRequest(`/catalogo/categorias/${id}/estado`, { method: "PATCH", body: JSON.stringify({ activo }) });
export const createProduct = (data: { idCategoria: number; nombre: string; descripcion: string }) => apiRequest<AdminProduct>("/catalogo/productos", { method: "POST", body: JSON.stringify(data) });
export const setProductActive = (id: number, activo: boolean) => apiRequest(`/catalogo/productos/${id}/estado`, { method: "PATCH", body: JSON.stringify({ activo }) });
export const createVariant = (data: { idProducto: number; sku: string; nombre: string; talla: string | null; color: string | null; precio: number; existenciaFisicaInicial: number }) => apiRequest("/catalogo/variantes", { method: "POST", body: JSON.stringify(data) });
export const createCoupon = (data: Record<string, string | number | null>) => apiRequest("/cupones", { method: "POST", body: JSON.stringify(data) });
export const setCouponActive = (id: number, activo: boolean) => apiRequest(`/cupones/${id}/estado`, { method: "PATCH", body: JSON.stringify({ activo }) });
export const setUserActive = (id: number, activo: boolean) => apiRequest(`/auth/usuarios/${id}/estado`, { method: "PATCH", body: JSON.stringify({ activo }) });

