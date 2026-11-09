import { useMemo, useState } from "react";
import {
  RefreshCw,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { PageHeader } from "../../../components/PageHeader";
import { Skeleton } from "../../../components/ui/skeleton";
import { PageState } from "../../../components/feedback/PageState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import {
  useAdminCategories,
  useAdminCoupons,
  useAdminProducts,
  useAudit,
} from "../hooks/useAdminData";
import CategoriesSection from "./CategoriesSection";
import ProductsSection from "./ProductsSection";
import CouponsSection from "./CouponsSection";
import AuditSection from "./AuditSection";

type CatalogTab = "categorias" | "productos" | "cupones" | "bitacora";
const tabs: { id: CatalogTab; label: string }[] = [
  { id: "categorias", label: "Categorías" },
  { id: "productos", label: "Productos y variantes" },
  { id: "cupones", label: "Cupones" },
  { id: "bitacora", label: "Bitácora" },
];

function isCatalogTab(value: string): value is CatalogTab {
  return tabs.some((item) => item.id === value);
}


export function AdminCatalogPage() {
  const [tab, setTab] = useState<CatalogTab>("categorias");
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebouncedValue(productSearch);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(20);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(20);
  const [auditEntity, setAuditEntity] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [auditStart, setAuditStart] = useState("");
  const [auditEnd, setAuditEnd] = useState("");
  const categories = useAdminCategories();
  const products = useAdminProducts(
    debouncedProductSearch,
    productPage,
    tab === "productos",
    productPageSize,
  );
  const coupons = useAdminCoupons(tab === "cupones");
  const auditParams = useMemo(() => {
    const params = new URLSearchParams({
      pagina: String(auditPage),
      limite: String(auditPageSize),
    });
    if (auditEntity) params.set("entidad", auditEntity);
    if (auditAction) params.set("accion", auditAction);
    if (auditStart) params.set("fechaInicio", `${auditStart}T00:00:00.000`);
    if (auditEnd) params.set("fechaFin", `${auditEnd}T23:59:59.999`);
    return params;
  }, [auditPage, auditPageSize, auditEntity, auditAction, auditStart, auditEnd]);
  const audit = useAudit(auditParams, tab === "bitacora");
  const sectionQueries = {
    categorias: categories,
    productos: products,
    cupones: coupons,
    bitacora: audit,
  };
  const activeQuery = sectionQueries[tab];
  return (
    <section aria-labelledby="admin-catalog-title">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (isCatalogTab(value)) setTab(value);
        }}
        className="gap-5"
      >
      <PageHeader
        className=""
        eyebrow="Administración"
        title="Catálogo y configuración"
        titleId="admin-catalog-title"
        titleContent={
          <TabsList aria-label="Secciones de administración">
            {tabs.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        }
        description="Gestiona categorías, productos, variantes, cupones y consulta la bitácora de auditoría."
      />
      <TabsContent value={tab}>
        {activeQuery.isPending ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        ) : activeQuery.isError ? (
        <div className="mt-5">
          <PageState
            icon={RefreshCw}
            title="No pudimos cargar esta sección"
            description={activeQuery.error.message}
            tone="error"
            action={
              <Button
                variant="outline"
                onClick={() => void activeQuery.refetch()}
              >
                Intentar de nuevo
              </Button>
            }
          />
        </div>
        ) : (
        <div className="">
          {tab === "categorias" && (
            <CategoriesSection rows={categories.data ?? []} />
          )}
          {tab === "productos" && (
            <ProductsSection
              categories={categories.data ?? []}
              products={products.data?.datos ?? []}
              total={products.data?.totalRegistros ?? 0}
              totalPages={products.data?.totalPaginas ?? 1}
              page={productPage}
              pageSize={productPageSize}
              isLoading={products.isFetching}
              onPageChange={setProductPage}
              onPageSizeChange={(size) => {
                setProductPageSize(size);
                setProductPage(1);
              }}
              search={productSearch}
              onSearch={(value) => {
                setProductSearch(value);
                setProductPage(1);
              }}
            />
          )}
          {tab === "cupones" && (
            <CouponsSection
              rows={coupons.data ?? []}
              categories={categories.data ?? []}
            />
          )}
          {tab === "bitacora" && (
            <AuditSection
              rows={audit.data?.datos ?? []}
              total={audit.data?.totalRegistros ?? 0}
              page={auditPage}
              pageSize={auditPageSize}
              isLoading={audit.isFetching}
              totalPages={
                Math.max(
                  1,
                  Math.ceil((audit.data?.totalRegistros ?? 0) / auditPageSize),
                )
              }
              onPageChange={setAuditPage}
              onPageSizeChange={(size) => {
                setAuditPageSize(size);
                setAuditPage(1);
              }}
              entity={auditEntity}
              onEntityChange={(value) => {
                setAuditEntity(value);
                setAuditPage(1);
              }}
              action={auditAction}
              onActionChange={(value) => {
                setAuditAction(value);
                setAuditPage(1);
              }}
              start={auditStart}
              onStartChange={(value) => {
                setAuditStart(value);
                setAuditPage(1);
              }}
              end={auditEnd}
              onEndChange={(value) => {
                setAuditEnd(value);
                setAuditPage(1);
              }}
            />
          )}
        </div>
        )}
      </TabsContent>
      </Tabs>
    </section>
  );
}
