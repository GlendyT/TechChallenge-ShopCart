import { useState, type FormEvent } from "react";
import { LoaderCircle, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { FormSheet } from "../../../components/forms/FormSheet";
import { DataTable } from "../../../components/tables/DataTable";
import type { DataTableColumn } from "../../../components/tables/DataTable";
import { TablePagination } from "../../../components/tables/TablePagination";
import { ProductEditSheet } from "../components/ProductEditSheet";

import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { ApiError } from "../../../shared/api/apiError";
import { adminMutations, useAdminMutation } from "../hooks/useAdminData";
import type { AdminCategory, AdminProduct } from "../types/adminTypes";
import { AdminStatus, ErrorText } from "./componentutils";

function ProductsSection({
  categories,
  products,
  total,
  totalPages,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  search,
  onSearch,
}: {
  categories: AdminCategory[];
  products: AdminProduct[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  search: string;
  onSearch: (value: string) => void;
}) {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [variantProductId, setVariantProductId] = useState("");
  const [sku, setSku] = useState("");
  const [variantName, setVariantName] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const create = useAdminMutation(
    adminMutations.createProduct,
    "products",
    "Producto creado. Ahora puedes agregar sus variantes.",
  );
  const variant = useAdminMutation(
    adminMutations.createVariant,
    "products",
    (result) => `Variante creada correctamente. SKU: ${result.datos.SKU}`,
  );
  const toggle = useAdminMutation(
    (input: { id: number; activo: boolean }) =>
      adminMutations.setProductActive(input.id, input.activo),
    "products",
    (_result, input) =>
      input.activo
        ? "Producto activado correctamente."
        : "Producto desactivado correctamente.",
  );
  function openProductForm() {
    create.reset();
    setName("");
    setDescription("");
    setCategoryId("");
    setShowProductForm(true);
  }

  function openVariantForm(id: number) {
    variant.reset();
    setVariantProductId(String(id));
    setProductId(String(id));
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await create.mutateAsync({
        idCategoria: Number(categoryId),
        nombre: name.trim(),
        descripcion: description.trim(),
      });
      setVariantProductId(String(result.datos.IDProducto));
      setShowProductForm(false);
      setName("");
      setDescription("");
      variant.reset();
      setProductId(String(result.datos.IDProducto));
    } catch {
      /* Error visible en formulario. */
    }
  }
  async function submitVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      idProducto: Number(variantProductId),
      ...(sku.trim() ? { sku: sku.trim() } : {}),
      nombre: variantName.trim(),
      talla: size.trim() || null,
      color: color.trim() || null,
      precio: Number(price),
      existenciaFisicaInicial: Number(stock),
    };

    try {
      await variant.mutateAsync(payload);
      setSku("");
      setVariantName("");
      setSize("");
      setColor("");
      setPrice("");
      setStock("0");
      setProductId("");
    } catch (error) {
      console.error("[AdminCatalog] Error al crear variante", {
        endpoint: "POST /catalogo/variantes",
        payload,
        status: error instanceof ApiError ? error.status : undefined,
        message: error instanceof Error ? error.message : error,
        validationFields: error instanceof ApiError ? error.fields : undefined,
      });
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo crear la variante. Inténtalo de nuevo.",
        {
          description:
            error instanceof ApiError && error.fields?.length
              ? error.fields
                  .map(({ campo, mensaje }) => `${campo}: ${mensaje}`)
                  .join(" · ")
              : undefined,
        },
      );
    }
  }
  const columns: DataTableColumn<AdminProduct>[] = [
    {
      id: "product",
      header: "Producto",
      cell: (item) => (
        <>
          <strong className="block text-sm">{item.Nombre}</strong>
          <span className="text-xs text-dn-gris">{item.CodigoPublico}</span>
        </>
      ),
    },
    { id: "category", header: "Categoría", cell: (item) => item.Categoria },
    {
      id: "variants",
      header: "Variantes",
      cell: (item) => item.TotalVariantes,
    },
    {
      id: "stock",
      header: "Stock disponible",
      cell: (item) => item.TotalStockDisponible,
    },
    {
      id: "status",
      header: "Estado",
      cell: (item) => <AdminStatus active={item.Activo} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingProduct(item)}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openVariantForm(item.IDProducto)}
          >
            Añadir variante
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate({ id: item.IDProducto, activo: !item.Activo })
            }
          >
            {item.Activo ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="w-full space-y-1.5 text-xs font-medium text-dn-gris-oscuro sm:max-w-sm">
          <span>Buscar productos</span>
          <span className="flex h-9 items-center gap-2 rounded-md border border-input px-3">
            <Search size={15} className="text-dn-gris" />
            <Input
              className="h-full border-0 px-0 shadow-none focus-visible:ring-0"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Nombre del producto"
            />
          </span>
        </label>
        <Button
          onClick={openProductForm}
          type="button"
        >
          <Plus size={15} /> Nuevo producto
        </Button>
      </div>
      {products.length > 0 ? (
        <DataTable
          ariaLabel="Productos de administración"
          columns={columns}
          data={products}
          getRowId={(item) => item.IDProducto}
        />
      ) : (
        <p className="py-8 text-center text-dn-gris">
          No se encontraron productos.
        </p>
      )}
      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        itemLabel="productos"
        isLoading={isLoading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
      <ErrorText>{toggle.error?.message}</ErrorText>

      <ProductEditSheet
        key={editingProduct?.IDProducto ?? "closed"}
        product={editingProduct}
        categories={categories}
        onOpenChange={(open) => {
          if (!open) setEditingProduct(null);
        }}
      />

      <FormSheet
        open={showProductForm}
        title="Crear producto"
        description="El registro inicial crea el producto dentro de una categoría."
        bodyClassName="space-y-3"
        onOpenChange={(open) => {
          if (!open && create.isPending) return;
          setShowProductForm(open);
        }}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={create.isPending}
              onClick={() => setShowProductForm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="admin-product-form"
              disabled={create.isPending || !categoryId}
            >
              {create.isPending && (
                <LoaderCircle className="animate-spin" size={15} />
              )}
              Crear producto
            </Button>
          </>
        }
      >
        <form
          id="admin-product-form"
          onSubmit={(event) => void submitProduct(event)}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-product-name">Nombre</Label>
            <Input
              id="new-product-name"
              minLength={2}
              maxLength={150}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-product-description">Descripción</Label>
            <Textarea
              id="new-product-description"
              minLength={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-product-category">Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="new-product-category">
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((category) => category.Activo)
                  .map((category) => (
                    <SelectItem
                      key={category.IDCategoria}
                      value={String(category.IDCategoria)}
                    >
                      {category.Nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <ErrorText>{create.error?.message}</ErrorText>
        </form>
      </FormSheet>

      <FormSheet
        open={Boolean(productId)}
        title="Añadir variante"
        description="El stock inicial se registra como movimiento de inventario."
        bodyClassName="space-y-3"
        onOpenChange={(open) => {
          if (!open && !variant.isPending) setProductId("");
        }}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={variant.isPending}
              onClick={() => setProductId("")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="admin-variant-form"
              disabled={variant.isPending || !variantProductId}
            >
              {variant.isPending && (
                <LoaderCircle className="animate-spin" size={15} />
              )}
              Crear variante
            </Button>
          </>
        }
      >
        <form
          id="admin-variant-form"
          onSubmit={(event) => void submitVariant(event)}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="variant-product">Producto</Label>
            <Select value={variantProductId} onValueChange={setVariantProductId}>
              <SelectTrigger id="variant-product">
                <SelectValue placeholder="Selecciona producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((item) => (
                  <SelectItem
                    key={item.IDProducto}
                    value={String(item.IDProducto)}
                  >
                    {item.Nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant-sku">SKU</Label>
            <Input
              id="variant-sku"
              minLength={3}
              maxLength={50}
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="Se genera automáticamente"
            />
            <p className="text-xs text-dn-gris">
              Opcional. Déjalo vacío para que el sistema genere el SKU.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant-name">Nombre de variante</Label>
            <Input
              id="variant-name"
              minLength={2}
              maxLength={100}
              value={variantName}
              onChange={(event) => setVariantName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant-size">Talla (opcional)</Label>
            <Input
              id="variant-size"
              maxLength={20}
              value={size}
              onChange={(event) => setSize(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant-color">Color (opcional)</Label>
            <Input
              id="variant-color"
              maxLength={30}
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant-price">Precio</Label>
            <Input
              id="variant-price"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant-stock">Existencia inicial</Label>
            <Input
              id="variant-stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              required
            />
          </div>
        </form>
      </FormSheet>
    </div>
  );
}
export default ProductsSection;
