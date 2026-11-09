import { useState, type FormEvent } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { FormSheet } from "../../../components/forms/FormSheet";
import { DataTable } from "../../../components/tables/DataTable";
import type { DataTableColumn } from "../../../components/tables/DataTable";
import { TablePagination } from "../../../components/tables/TablePagination";
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
import { adminMutations, useAdminMutation } from "../hooks/useAdminData";
import type { AdminCategory } from "../types/adminTypes";
import { AdminStatus, ErrorText } from "./componentutils";

function CategoriesSection({ rows }: { rows: AdminCategory[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<AdminCategory | null | false>(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("");
  const [error, setError] = useState("");
  const save = useAdminMutation(
    (data: {
      id: number | null;
      nombre: string;
      descripcion: string | null;
      idCategoriaPadre: number | null;
      activo?: boolean;
    }) => adminMutations.saveCategory(data.id, data),
    "categories",
  );
  const toggle = useAdminMutation(
    (input: { id: number; activo: boolean }) =>
      adminMutations.setCategoryActive(input.id, input.activo),
    "categories",
  );
  function open(category?: AdminCategory) {
    setEditing(category ?? null);
    setName(category?.Nombre ?? "");
    setDescription(category?.Descripcion ?? "");
    setParent(
      category?.IDCategoriaPadre ? String(category.IDCategoriaPadre) : "",
    );
    setError("");
    save.reset();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      parent &&
      Number(parent) ===
        (editing && typeof editing === "object" ? editing.IDCategoria : -1)
    ) {
      setError("Una categoría no puede ser su propia categoría padre.");
      return;
    }
    setError("");
    try {
      await save.mutateAsync({
        id: editing && typeof editing === "object" ? editing.IDCategoria : null,
        nombre: name.trim(),
        descripcion: description.trim() || null,
        idCategoriaPadre: parent ? Number(parent) : null,
        ...(editing && typeof editing === "object"
          ? { activo: editing.Activo }
          : {}),
      });
      setEditing(false);
    } catch {
      /* Se presenta el error dentro del formulario. */
    }
  }
  const columns: DataTableColumn<AdminCategory>[] = [
    {
      id: "name",
      header: "Categoría",
      cellClassName: "font-medium",
      cell: (row) => (
        <>
          {row.Nombre}
          {row.CategoriaPadre && (
            <span className="block text-xs text-dn-gris">
              Subcategoría de {row.CategoriaPadre}
            </span>
          )}
        </>
      ),
    },
    {
      id: "description",
      header: "Descripción",
      cellClassName: "max-w-sm text-xs text-dn-gris",
      cell: (row) => row.Descripcion || "—",
    },
    {
      id: "product-count",
      header: "Productos activos",
      cell: (row) => row.TotalProductosActivos,
    },
    {
      id: "status",
      header: "Estado",
      cell: (row) => <AdminStatus active={row.Activo} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => open(row)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate({ id: row.IDCategoria, activo: !row.Activo })
            }
          >
            {row.Activo ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => open()}>
          <Plus size={15} /> Nueva categoría
        </Button>
      </div>
      <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-md border border-dn-gris/20 bg-white">
        <div className="min-h-0 flex-1 overflow-auto">
          {rows.length > 0 ? (
            <DataTable
              ariaLabel="Categorías del catálogo"
              columns={columns}
              data={visibleRows}
              getRowId={(row) => row.IDCategoria}
              containerClassName="h-full overflow-auto"
            />
          ) : (
            <p className="py-8 text-center text-dn-gris">
              Aún no hay categorías.
            </p>
          )}
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={rows.length}
          pageSize={pageSize}
          itemLabel="categorías"
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
      {toggle.error && <ErrorText>{toggle.error.message}</ErrorText>}
      <FormSheet
        open={editing !== false}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        description="Los cambios se guardarán en el catálogo."
        bodyClassName="space-y-4"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={save.isPending}
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              form="admin-category-form"
              disabled={save.isPending || name.trim().length < 2}
            >
              {save.isPending && (
                <LoaderCircle className="animate-spin" size={15} />
              )}
              Guardar categoría
            </Button>
          </>
        }
        onOpenChange={(open) => {
          if (!open && !save.isPending) setEditing(false);
        }}
      >
        <form
          id="admin-category-form"
          onSubmit={(event) => void submit(event)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-description">Descripción</Label>
            <Textarea
              id="category-description"
              maxLength={255}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-parent">Categoría padre</Label>
            <Select
              value={parent || "NINGUNA"}
              onValueChange={(value) =>
                setParent(value === "NINGUNA" ? "" : value)
              }
            >
              <SelectTrigger id="category-parent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NINGUNA">Sin categoría padre</SelectItem>
                {rows
                  .filter(
                    (row) =>
                      row.Activo &&
                      (!editing ||
                        typeof editing !== "object" ||
                        row.IDCategoria !== editing.IDCategoria),
                  )
                  .map((row) => (
                    <SelectItem
                      key={row.IDCategoria}
                      value={String(row.IDCategoria)}
                    >
                      {row.Nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <ErrorText>{error || save.error?.message}</ErrorText>
        </form>
      </FormSheet>
    </div>
  );
}

export default CategoriesSection;
