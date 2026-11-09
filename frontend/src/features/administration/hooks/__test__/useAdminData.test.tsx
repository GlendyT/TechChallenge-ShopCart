import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogQueryKeys } from "../../../catalog/api/catalogApi";
import { adminQueryKey, auditQueryKey } from "../../api/adminApi";
import {
  useAdminCategories,
  useAdminCoupons,
  useAdminMutation,
  useAdminProductDetail,
  useAdminProducts,
  useAdminUsers,
  useAudit,
} from "../useAdminData";

const mocks = vi.hoisted(() => ({
  listAdminCategories: vi.fn(),
  listAdminProducts: vi.fn(),
  getAdminProductDetail: vi.fn(),
  listCoupons: vi.fn(),
  listUsers: vi.fn(),
  listAudit: vi.fn(),
  createCoupon: vi.fn(),
  createProduct: vi.fn(),
  createProductImage: vi.fn(),
  createVariant: vi.fn(),
  deleteProductImage: vi.fn(),
  saveCategory: vi.fn(),
  setCategoryActive: vi.fn(),
  setCouponActive: vi.fn(),
  setProductActive: vi.fn(),
  setUserActive: vi.fn(),
  updateProduct: vi.fn(),
  updateProductImage: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../../api/adminApi", () => ({
  adminQueryKey: ["administration"],
  auditQueryKey: ["administration", "audit"],
  listAdminCategories: mocks.listAdminCategories,
  listAdminProducts: mocks.listAdminProducts,
  getAdminProductDetail: mocks.getAdminProductDetail,
  listCoupons: mocks.listCoupons,
  listUsers: mocks.listUsers,
  listAudit: mocks.listAudit,
  createCoupon: mocks.createCoupon,
  createProduct: mocks.createProduct,
  createProductImage: mocks.createProductImage,
  createVariant: mocks.createVariant,
  deleteProductImage: mocks.deleteProductImage,
  saveCategory: mocks.saveCategory,
  setCategoryActive: mocks.setCategoryActive,
  setCouponActive: mocks.setCouponActive,
  setProductActive: mocks.setProductActive,
  setUserActive: mocks.setUserActive,
  updateProduct: mocks.updateProduct,
  updateProductImage: mocks.updateProductImage,
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe("useAdminData queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listAdminCategories.mockResolvedValue([]);
    mocks.listAdminProducts.mockResolvedValue({
      datos: [],
      totalPaginas: 1,
      totalRegistros: 0,
      paginaActual: 1,
    });
    mocks.getAdminProductDetail.mockResolvedValue({
      CodigoPublico: "product-code",
    });
    mocks.listCoupons.mockResolvedValue([]);
    mocks.listUsers.mockResolvedValue([]);
    mocks.listAudit.mockResolvedValue({
      datos: [],
      totalRegistros: 0,
      paginaActual: 1,
    });
  });

  it("uses domain keys and forwards each query's current filters", async () => {
    const { Wrapper, queryClient } = createWrapper();

    const categories = renderHook(() => useAdminCategories(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(categories.result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData([...adminQueryKey, "categories"])).toEqual(
      [],
    );

    const products = renderHook(
      () => useAdminProducts("teclado", 3, true, 50),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => expect(products.result.current.isSuccess).toBe(true));
    expect(mocks.listAdminProducts).toHaveBeenCalledWith("teclado", 3, 50);

    const users = renderHook(() => useAdminUsers("Ana"), { wrapper: Wrapper });
    await waitFor(() => expect(users.result.current.isSuccess).toBe(true));
    expect(mocks.listUsers).toHaveBeenCalledWith("Ana");

    const coupons = renderHook(() => useAdminCoupons(false), {
      wrapper: Wrapper,
    });
    expect(coupons.result.current.fetchStatus).toBe("idle");
    expect(mocks.listCoupons).not.toHaveBeenCalled();

    const detail = renderHook(
      ({ publicCode }: { publicCode: string | null }) =>
        useAdminProductDetail(publicCode),
      { wrapper: Wrapper, initialProps: { publicCode: null as string | null } },
    );
    expect(detail.result.current.fetchStatus).toBe("idle");
    await detail.rerender({ publicCode: "product-code" });
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true));
    expect(mocks.getAdminProductDetail).toHaveBeenCalledWith("product-code");
    expect(
      queryClient.getQueryData(catalogQueryKeys.product("product-code")),
    ).toEqual({
      CodigoPublico: "product-code",
    });

    const auditParams = new URLSearchParams({ pagina: "2", limite: "30" });
    const audit = renderHook(() => useAudit(auditParams), { wrapper: Wrapper });
    await waitFor(() => expect(audit.result.current.isSuccess).toBe(true));
    expect(mocks.listAudit).toHaveBeenCalledWith(auditParams);
  });
});

describe("useAdminMutation", () => {
  it("invalidates product, audit, inventory and catalog queries and shows a contextual toast", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const mutationFn = vi.fn(async (input: { id: number }) => ({
      nombre: `Teclado ${input.id}`,
    }));
    const { result } = renderHook(
      () =>
        useAdminMutation(
          mutationFn,
          "products",
          (data, input) => `${data.nombre} #${input.id} guardado.`,
        ),
      { wrapper: Wrapper },
    );

    await result.current.mutateAsync({ id: 12 });

    expect(mutationFn.mock.calls[0]?.[0]).toEqual({ id: 12 });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...adminQueryKey, "products"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: auditQueryKey });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["operations", "inventory"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: catalogQueryKeys.product("").slice(0, 2),
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Teclado 12 #12 guardado.");
  });
});
