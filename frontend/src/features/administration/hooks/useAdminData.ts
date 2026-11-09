import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogQueryKeys } from "../../catalog/api/catalogApi";
import {
  adminQueryKey,
  auditQueryKey,
  createCoupon,
  createProduct,
  createProductImage,
  createVariant,
  deleteProductImage,
  getAdminProductDetail,
  listAdminCategories,
  listAdminProducts,
  listAudit,
  listCoupons,
  listUsers,
  saveCategory,
  setCategoryActive,
  setCouponActive,
  setProductActive,
  setUserActive,
  updateProduct,
  updateProductImage,
} from "../api/adminApi";

export function useAdminCategories() {
  return useQuery({
    queryKey: [...adminQueryKey, "categories"],
    queryFn: listAdminCategories,
  });
}
export function useAdminProducts(
  search: string,
  page: number,
  enabled = true,
  pageSize = 20,
) {
  return useQuery({
    queryKey: [...adminQueryKey, "products", search, page, pageSize],
    queryFn: () => listAdminProducts(search, page, pageSize),
    enabled,
    placeholderData: (previous) => previous,
  });
}
export function useAdminProductDetail(publicCode: string | null) {
  return useQuery({
    queryKey: catalogQueryKeys.product(publicCode ?? ""),
    queryFn: () => getAdminProductDetail(publicCode!),
    enabled: Boolean(publicCode),
  });
}
export function useAdminCoupons(enabled = true) {
  return useQuery({
    queryKey: [...adminQueryKey, "coupons"],
    queryFn: listCoupons,
    enabled,
  });
}
export function useAdminUsers(search: string) {
  return useQuery({
    queryKey: [...adminQueryKey, "users", search],
    queryFn: () => listUsers(search),
  });
}
export function useAudit(params: URLSearchParams, enabled = true) {
  return useQuery({
    queryKey: [...auditQueryKey, params.toString()],
    queryFn: () => listAudit(params),
    enabled,
  });
}

export function useAdminMutation<TInput, TResult = unknown>(
  mutationFn: (input: TInput) => Promise<TResult>,
  section: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: [...adminQueryKey, section] });
      if (["categories", "products", "coupons", "users"].includes(section))
        await client.invalidateQueries({ queryKey: auditQueryKey });
      if (section === "products") {
        await client.invalidateQueries({
          queryKey: ["operations", "inventory"],
        });
        await client.invalidateQueries({
          queryKey: catalogQueryKeys.product("").slice(0, 2),
        });
      }
    },
  });
}
export const adminMutations = {
  saveCategory,
  setCategoryActive,
  createProduct,
  updateProduct,
  createProductImage,
  updateProductImage,
  deleteProductImage,
  setProductActive,
  createVariant,
  createCoupon,
  setCouponActive,
  setUserActive,
};
