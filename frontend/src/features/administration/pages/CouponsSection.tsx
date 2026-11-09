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
import { formatPrice } from "../../../lib/format";
import { adminMutations } from "../hooks/useAdminData";
import { useAdminMutation } from "../hooks/useAdminData";
import type { AdminCategory, AdminCoupon } from "../types/adminTypes";
import { formatDate } from "@/lib/utils";
import {  AdminStatus, ErrorText } from "./componentutils";

function CouponsSection({
  rows,
  categories,
}: {
  rows: AdminCoupon[];
  categories: AdminCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PORCENTAJE" | "MONTO_FIJO">("PORCENTAJE");
  const [value, setValue] = useState("");
  const [minimum, setMinimum] = useState("0");
  const [limit, setLimit] = useState("100");
  const [perCustomer, setPerCustomer] = useState("1");
  const [category, setCategory] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const create = useAdminMutation(
    adminMutations.createCoupon,
    "coupons",
    "Cupón creado correctamente.",
  );
  const toggle = useAdminMutation(
    (input: { id: number; activo: boolean }) =>
      adminMutations.setCouponActive(input.id, input.activo),
    "coupons",
    "Estado del cupón actualizado.",
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (start >= end) return;
    try {
      await create.mutateAsync({
        codigo: code.trim().toUpperCase(),
        tipoDescuento: type,
        valorDescuento: Number(value),
        montoMinimoCompra: Number(minimum),
        limiteUsosTotal: Number(limit),
        limiteUsosPorCliente: Number(perCustomer),
        idCategoria: category ? Number(category) : null,
        fechaInicio: new Date(start).toISOString(),
        fechaFin: new Date(end).toISOString(),
      });
      setOpen(false);
      setCode("");
      setValue("");
    } catch {
      /* Error visible en el formulario. */
    }
  }
  const columns: DataTableColumn<AdminCoupon>[] = [
    {
      id: "code",
      header: "Código",
      cellClassName: "font-semibold",
      cell: (row) => (
        <>
          {row.Codigo}
          <span className="block text-xs font-normal text-dn-gris">
            {row.CategoriaRestringida || "Todas las categorías"}
          </span>
        </>
      ),
    },
    {
      id: "discount",
      header: "Descuento",
      cell: (row) =>
        row.TipoDescuento === "PORCENTAJE"
          ? `${row.ValorDescuento}%`
          : formatPrice(row.ValorDescuento),
    },
    {
      id: "usage",
      header: "Usos",
      cell: (row) => `${row.UsosActuales} / ${row.LimiteUsosTotal}`,
    },
    {
      id: "validity",
      header: "Vigencia",
      cellClassName: "whitespace-nowrap text-xs",
      cell: (row) => (
        <>
          {formatDate(row.FechaInicio)}
          <span className="block">a {formatDate(row.FechaFin)}</span>
        </>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: (row) => (
        <>
          <AdminStatus active={row.Activo} />
          <span className="mt-1 block text-xs text-dn-gris">
            {row.EstadoVigencia}
          </span>
        </>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          disabled={toggle.isPending}
          onClick={() =>
            toggle.mutate({ id: row.IDCupon, activo: !row.Activo })
          }
        >
          {row.Activo ? "Desactivar" : "Activar"}
        </Button>
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
        <Button onClick={() => setOpen(true)}>
          <Plus size={15} /> Nuevo cupón
        </Button>
      </div>
      <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-md border border-dn-gris/20 bg-white">
        <div className="min-h-0 flex-1 overflow-auto">
          {rows.length > 0 ? (
            <DataTable
              ariaLabel="Cupones"
              columns={columns}
              data={visibleRows}
              getRowId={(row) => row.IDCupon}
              containerClassName="h-full overflow-auto"
            />
          ) : (
            <p className="py-8 text-center text-dn-gris">Aún no hay cupones.</p>
          )}
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={rows.length}
          pageSize={pageSize}
          itemLabel="cupones"
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
      <ErrorText>{toggle.error?.message}</ErrorText>

      <FormSheet
        open={open}
        title="Crear cupón"
        description="Configura el descuento, límites y periodo de vigencia."
        className="sm:max-w-2xl"
        bodyClassName="space-y-4"
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              disabled={create.isPending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="admin-coupon-form"
              disabled={
                create.isPending || (Boolean(start && end) && start >= end)
              }
            >
              {create.isPending && (
                <LoaderCircle className="animate-spin" size={15} />
              )}
              Crear cupón
            </Button>
          </>
        }
        onOpenChange={(next) => {
          if (!create.isPending) setOpen(next);
        }}
      >
        <form
          id="admin-coupon-form"
          onSubmit={(event) => void submit(event)}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="coupon-code">Código</Label>
            <Input
              id="coupon-code"
              minLength={3}
              maxLength={30}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-type">Tipo</Label>
            <Select
              value={type}
              onValueChange={(next) => setType(next as typeof type)}
            >
              <SelectTrigger id="coupon-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PORCENTAJE">Porcentaje</SelectItem>
                <SelectItem value="MONTO_FIJO">Monto fijo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-value">Valor</Label>
            <Input
              id="coupon-value"
              type="number"
              min="0.01"
              max={type === "PORCENTAJE" ? 100 : undefined}
              step="0.01"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-minimum">Compra mínima</Label>
            <Input
              id="coupon-minimum"
              type="number"
              min="0"
              step="0.01"
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-limit">Usos totales</Label>
            <Input
              id="coupon-limit"
              type="number"
              min="1"
              step="1"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-per-customer">Usos por cliente</Label>
            <Input
              id="coupon-per-customer"
              type="number"
              min="1"
              step="1"
              value={perCustomer}
              onChange={(event) => setPerCustomer(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-category">Categoría (opcional)</Label>
            <Select
              value={category || "TODAS"}
              onValueChange={(next) =>
                setCategory(next === "TODAS" ? "" : next)
              }
            >
              <SelectTrigger id="coupon-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas las categorías</SelectItem>
                {categories
                  .filter((item) => item.Activo)
                  .map((item) => (
                    <SelectItem
                      key={item.IDCategoria}
                      value={String(item.IDCategoria)}
                    >
                      {item.Nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-start">Inicio</Label>
            <Input
              id="coupon-start"
              type="datetime-local"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-end">Fin</Label>
            <Input
              id="coupon-end"
              type="datetime-local"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <ErrorText>
              {create.error?.message ||
                (start && end && start >= end
                  ? "La fecha final debe ser posterior a la fecha de inicio."
                  : undefined)}
            </ErrorText>
          </div>
        </form>
      </FormSheet>
    </div>
  );
}

export default CouponsSection;
