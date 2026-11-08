import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminQueryKey, auditQueryKey, createCoupon, createProduct, createVariant, listAdminCategories, listAdminProducts, listAudit, listCoupons, listUsers, saveCategory, setCategoryActive, setCouponActive, setProductActive, setUserActive } from "../api/adminApi";

export function useAdminCategories() { return useQuery({ queryKey: [...adminQueryKey, "categories"], queryFn: listAdminCategories }); }
export function useAdminProducts(search: string, page: number, enabled = true) { return useQuery({ queryKey: [...adminQueryKey, "products", search, page], queryFn: () => listAdminProducts(search, page), enabled, placeholderData: (previous) => previous }); }
export function useAdminCoupons(enabled = true) { return useQuery({ queryKey: [...adminQueryKey, "coupons"], queryFn: listCoupons, enabled }); }
export function useAdminUsers(search: string) { return useQuery({ queryKey: [...adminQueryKey, "users", search], queryFn: () => listUsers(search) }); }
export function useAudit(params: URLSearchParams, enabled = true) { return useQuery({ queryKey: [...auditQueryKey, params.toString()], queryFn: () => listAudit(params), enabled }); }

export function useAdminMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>, section: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: async () => {
    await client.invalidateQueries({ queryKey: [...adminQueryKey, section] });
    if (["categories", "products", "coupons", "users"].includes(section)) await client.invalidateQueries({ queryKey: auditQueryKey });
    if (section === "products") await client.invalidateQueries({ queryKey: ["operations", "inventory"] });
  } });
}
export const adminMutations = { saveCategory, setCategoryActive, createProduct, setProductActive, createVariant, createCoupon, setCouponActive, setUserActive };
