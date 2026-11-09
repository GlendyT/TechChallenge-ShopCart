import { useState, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, Save, Trash2 } from "lucide-react";
import { FormSheet } from "../../../components/forms/FormSheet";
import { Button } from "../../../components/ui/button";
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
import { adminMutations, useAdminMutation, useAdminProductDetail } from "../hooks/useAdminData";
import type { AdminCategory, AdminProduct } from "../types/adminTypes";
import { ErrorText } from "../pages/componentutils";

interface ProductEditSheetProps {
  product: AdminProduct | null;
  categories: AdminCategory[];
  onOpenChange: (open: boolean) => void;
}

export function ProductEditSheet({
  product,
  categories,
  onOpenChange,
}: ProductEditSheetProps) {
  const detail = useAdminProductDetail(product?.CodigoPublico ?? null);
  const [name, setName] = useState(product?.Nombre ?? "");
  const [categoryId, setCategoryId] = useState(
    product ? String(product.IDCategoria) : "",
  );
  const description = detail.data?.Descripcion ?? "";
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageIsPrimary, setNewImageIsPrimary] = useState(false);
  const update = useAdminMutation(
    (data: { idCategoria: number; nombre: string; descripcion: string }) =>
      adminMutations.updateProduct(product?.IDProducto ?? 0, data),
    "products",
  );
  const addImage = useAdminMutation(
    (data: { imagenUrl: string; esPrincipal?: boolean }) =>
      adminMutations.createProductImage(product?.IDProducto ?? 0, data),
    "products",
  );

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const form = event.currentTarget;
    const desc = (form.elements.namedItem("edit-product-description") as HTMLTextAreaElement).value;
    try {
      await update.mutateAsync({
        idCategoria: Number(categoryId),
        nombre: name.trim(),
        descripcion: desc.trim(),
      });
    } catch {
      // El error se muestra en el formulario.
    }
  }

  async function submitImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    try {
      await addImage.mutateAsync({
        imagenUrl: newImageUrl.trim(),
        ...(newImageIsPrimary ? { esPrincipal: true } : {}),
      });
      setNewImageUrl("");
      setNewImageIsPrimary(false);
    } catch {
      // El error se muestra junto al campo de URL.
    }
  }

  return (
    <FormSheet
      open={Boolean(product)}
      title={product ? `Editar producto: ${name || product.Nombre}` : "Editar producto"}
      description="Actualiza los datos del producto y administra sus URLs de imagen."
      bodyClassName="space-y-6"
      onOpenChange={(open) => {
        if (!open && !update.isPending && !addImage.isPending) {
          onOpenChange(false);
        }
      }}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={update.isPending || addImage.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            type="submit"
            form="admin-edit-product-form"
            disabled={
              !product ||
              detail.isPending ||
              update.isPending ||
              !categoryId ||
              name.trim().length < 2
            }
          >
            {update.isPending ? (
              <LoaderCircle className="animate-spin" size={15} />
            ) : (
              <Save size={15} />
            )}
            Guardar cambios
          </Button>
        </>
      }
    >
      {!product ? null : detail.isPending ? (
        <p className="text-sm text-dn-gris" role="status">
          Cargando datos e imágenes del producto...
        </p>
      ) : detail.isError ? (
        <ErrorText>{detail.error.message}</ErrorText>
      ) : (
        <>
          <form
            id="admin-edit-product-form"
            onSubmit={(event) => void submitProduct(event)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="edit-product-name">Nombre</Label>
              <Input
                id="edit-product-name"
                minLength={2}
                maxLength={150}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-product-description">Descripción</Label>
              <Textarea
                id="edit-product-description"
                minLength={5}
                defaultValue={description}
                key={description}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-product-category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="edit-product-category">
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
            <ProductError>{update.error?.message}</ProductError>
          </form>

          <section aria-labelledby="product-images-heading" className="space-y-4 border-t pt-5">
            <div>
              <h3 id="product-images-heading" className="font-semibold">
                Imágenes del producto
              </h3>
              <p className="mt-1 text-sm text-dn-gris">
                Agrega URLs públicas. La imagen principal se usa en las tarjetas del catálogo.
              </p>
            </div>

            {detail.data.imagenes.length ? (
              <div className="space-y-4">
                {detail.data.imagenes.map((image) => (
                  <ProductImageRow
                    key={image.IDProductoImagen}
                    productId={product.IDProducto}
                    image={image}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dn-gris/20 bg-dn-gris/5 p-3 text-sm text-dn-gris">
                Este producto todavía no tiene imágenes.
              </p>
            )}

            <form onSubmit={(event) => void submitImage(event)} className="space-y-3 rounded-md border border-dn-gris/20 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-product-image-url">URL de nueva imagen</Label>
                <Input
                  id="new-product-image-url"
                  type="url"
                  maxLength={500}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={newImageUrl}
                  onChange={(event) => setNewImageUrl(event.target.value)}
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  aria-label="Usar como imagen principal"
                  className="size-4 accent-dn-azul"
                  type="checkbox"
                  checked={newImageIsPrimary}
                  onChange={(event) => setNewImageIsPrimary(event.target.checked)}
                />
                Usar como imagen principal
              </label>
              <ProductError>{addImage.error?.message}</ProductError>
              <Button type="submit" disabled={addImage.isPending || !newImageUrl.trim()}>
                {addImage.isPending ? (
                  <LoaderCircle className="animate-spin" size={15} />
                ) : (
                  <ImagePlus size={15} />
                )}
                Agregar URL
              </Button>
            </form>
          </section>
        </>
      )}
    </FormSheet>
  );
}

function ProductImageRow({
  productId,
  image,
}: {
  productId: number;
  image: { IDProductoImagen: number; ImagenURL: string; EsPrincipal: boolean; Orden: number };
}) {
  const [imageUrl, setImageUrl] = useState(image.ImagenURL);
  const [order, setOrder] = useState(String(image.Orden));
  const [isPrimary, setIsPrimary] = useState(image.EsPrincipal);
  const save = useAdminMutation(
    (data: { imagenUrl: string; esPrincipal: boolean; orden: number }) =>
      adminMutations.updateProductImage(productId, image.IDProductoImagen, data),
    "products",
  );
  const remove = useAdminMutation(
    () => adminMutations.deleteProductImage(productId, image.IDProductoImagen),
    "products",
  );

  async function saveImage() {
    try {
      await save.mutateAsync({
        imagenUrl: imageUrl.trim(),
        esPrincipal: isPrimary,
        orden: Number(order),
      });
    } catch {
      // El error se muestra en la fila de la imagen.
    }
  }

  async function deleteImage() {
    try {
      await remove.mutateAsync();
    } catch {
      // El error se muestra en la fila de la imagen.
    }
  }

  return (
    <fieldset
      aria-label={`Imagen ${image.Orden}`}
      className="space-y-3 rounded-md border border-dn-gris/20 p-4"
    >
      <div className="flex items-center gap-3">
        <img
          alt="Vista previa"
          className="size-16 rounded border border-dn-gris/20 object-cover"
          loading="lazy"
          src={imageUrl}
        />
        {image.EsPrincipal && (
          <span className="rounded-full bg-dn-azul/10 px-2 py-1 text-xs font-medium text-dn-azul">
            Principal
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`product-image-url-${image.IDProductoImagen}`}>
          URL de imagen
        </Label>
        <Input
          id={`product-image-url-${image.IDProductoImagen}`}
          type="url"
          maxLength={500}
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`product-image-order-${image.IDProductoImagen}`}>
          Orden
        </Label>
        <Input
          id={`product-image-order-${image.IDProductoImagen}`}
          type="number"
          min={1}
          step={1}
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          aria-label={`Imagen principal ${image.Orden}`}
          className="size-4 accent-dn-azul"
          type="checkbox"
          checked={isPrimary}
          onChange={(event) => setIsPrimary(event.target.checked)}
        />
        Imagen principal
      </label>
      <ProductError>{save.error?.message || remove.error?.message}</ProductError>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          aria-label={`Eliminar imagen ${image.Orden}`}
          type="button"
          variant="outline"
          disabled={remove.isPending || save.isPending}
          onClick={() => void deleteImage()}
        >
          {remove.isPending ? (
            <LoaderCircle className="animate-spin" size={15} />
          ) : (
            <Trash2 size={15} />
          )}
          Eliminar
        </Button>
        <Button
          aria-label={`Guardar imagen ${image.Orden}`}
          type="button"
          disabled={
            save.isPending ||
            remove.isPending ||
            !imageUrl.trim() ||
            !Number.isInteger(Number(order)) ||
            Number(order) < 1
          }
          onClick={() => void saveImage()}
        >
          {save.isPending ? (
            <LoaderCircle className="animate-spin" size={15} />
          ) : (
            <Save size={15} />
          )}
          Guardar
        </Button>
      </div>
    </fieldset>
  );
}

function ProductError({ children }: { children?: string }) {
  return children ? (
    <p className="text-sm text-dn-rojo" role="alert">
      {children}
    </p>
  ) : null;
}
