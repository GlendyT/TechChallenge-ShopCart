import { Badge } from "../../../components/ui/badge";
import { DataTable } from "../../../components/tables/DataTable";
import type { DataTableColumn } from "../../../components/tables/DataTable";
import { TablePagination } from "../../../components/tables/TablePagination";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import type { AuditRecord } from "../types/adminTypes";
import { formatDate } from "@/lib/utils";

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function AuditSection({
  rows,
  total,
  page,
  pageSize,
  isLoading,
  totalPages,
  onPageChange,
  onPageSizeChange,
  entity,
  onEntityChange,
  action,
  onActionChange,
  start,
  onStartChange,
  end,
  onEndChange,
}: {
  rows: AuditRecord[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  entity: string;
  onEntityChange: (value: string) => void;
  action: string;
  onActionChange: (value: string) => void;
  start: string;
  onStartChange: (value: string) => void;
  end: string;
  onEndChange: (value: string) => void;
}) {
  const entities = [
    "Productos",
    "Variantes",
    "Cupones",
    "Pedidos",
    "Inventario",
    "Usuarios",
  ];
  const actions = ["CREAR", "MODIFICAR", "DESACTIVAR", "CAMBIO_ESTADO"];
  const columns: DataTableColumn<AuditRecord>[] = [
    {
      id: "date",
      header: "Fecha",
      cellClassName: "whitespace-nowrap text-xs",
      cell: (row) => formatDate(row.Fecha),
    },
    {
      id: "user",
      header: "Usuario",
      cell: (row) => (
        <>
          <span className="block text-xs">{row.NombreUsuario}</span>
          <span className="text-xs text-dn-gris">{row.CorreoUsuario}</span>
        </>
      ),
    },
    {
      id: "record",
      header: "Entidad / registro",
      cell: (row) => (
        <>
          {row.Entidad}
          <span className="block text-xs text-dn-gris">#{row.IDRegistro}</span>
        </>
      ),
    },
    {
      id: "action",
      header: "Acción",
      cell: (row) => <Badge variant="outline">{row.Accion}</Badge>,
    },
    {
      id: "values",
      header: "Valores",
      cellClassName: "max-w-sm",
      cell: (row) => (
        <details>
          <summary className="cursor-pointer text-xs text-dn-azul">
            Ver cambios
          </summary>
          <pre className="mt-2 max-h-32 max-w-sm overflow-auto whitespace-pre-wrap break-all rounded bg-dn-gris/5 p-2 text-[10px]">
            {JSON.stringify(
              {
                anterior: row.ValorAnterior
                  ? safeJson(row.ValorAnterior)
                  : null,
                nuevo: row.ValorNuevo ? safeJson(row.ValorNuevo) : null,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ),
    },
  ];
  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Entidad</span>
          <Select
            value={entity || "TODAS"}
            onValueChange={(value) =>
              onEntityChange(value === "TODAS" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las entidades</SelectItem>
              {entities.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Acción</span>
          <Select
            value={action || "TODAS"}
            onValueChange={(value) =>
              onActionChange(value === "TODAS" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las acciones</SelectItem>
              {actions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Desde</span>
          <Input
            type="date"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Hasta</span>
          <Input
            type="date"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
          />
        </label>
      </div>
      <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-md border border-dn-gris/20 bg-white">
        <div className="min-h-0 flex-1 overflow-auto">
          {rows.length > 0 ? (
            <DataTable
              ariaLabel="Bitácora de auditoría"
              columns={columns}
              data={rows}
              getRowId={(row) => row.IDBitacora}
              containerClassName="h-full overflow-auto"
            />
          ) : (
            <p className="py-8 text-center text-dn-gris">
              No hay registros de auditoría con esos filtros.
            </p>
          )}
        </div>
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          itemLabel="registros"
          isLoading={isLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </>
  );
}
export default AuditSection;
