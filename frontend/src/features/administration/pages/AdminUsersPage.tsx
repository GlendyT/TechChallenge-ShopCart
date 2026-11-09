import { useState } from "react";
import { LoaderCircle, RefreshCw, Search, UserRound } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { DataTable } from "../../../components/tables/DataTable";
import type { DataTableColumn } from "../../../components/tables/DataTable";
import { TablePagination } from "../../../components/tables/TablePagination";
import { PageHeader } from "../../../components/PageHeader";
import { Input } from "../../../components/ui/input";
import { Skeleton } from "../../../components/ui/skeleton";
import { PageState } from "../../../components/feedback/PageState";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import type { AdminUser } from "../types/adminTypes";
import { AdminStatus, ErrorText } from "./componentutils";
import {
  useAdminMutation,
  useAdminUsers,
  adminMutations,
} from "../hooks/useAdminData";

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebouncedValue(search);
  const users = useAdminUsers(debouncedSearch);
  const updateState = useAdminMutation(
    (input: { id: number; activo: boolean }) =>
      adminMutations.setUserActive(input.id, input.activo),
    "users",
    (_result, input) =>
      input.activo
        ? "Usuario activado correctamente."
        : "Usuario desactivado correctamente.",
  );
  const rows = users.data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const dateFormatter = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
  });
  const columns: DataTableColumn<AdminUser>[] = [
    {
      id: "user",
      header: "Usuario",
      cell: (user) => (
        <>
          <strong className="block text-sm text-dn-gris-oscuro">
            {user.Nombre} {user.Apellido}
          </strong>
          <span className="text-xs text-dn-gris">{user.Correo}</span>
        </>
      ),
    },
    { id: "role", header: "Rol", cell: (user) => user.Rol },
    {
      id: "phone",
      header: "Teléfono",
      cellClassName: "text-sm text-dn-gris",
      cell: (user) => user.Telefono || "—",
    },
    {
      id: "created",
      header: "Registro",
      cellClassName: "whitespace-nowrap text-xs text-dn-gris",
      cell: (user) => dateFormatter.format(new Date(user.FechaCreacion)),
    },
    {
      id: "status",
      header: "Estado",
      cell: (user) => <AdminStatus active={user.Activo} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (user) => (
        <Button
          size="sm"
          variant="outline"
          disabled={updateState.isPending}
          onClick={() =>
            updateState.mutate({
              id: user.IDUsuario,
              activo: !user.Activo,
            })
          }
        >
          {updateState.isPending && (
            <LoaderCircle className="animate-spin" size={14} />
          )}
          {user.Activo ? "Desactivar" : "Activar"}
        </Button>
      ),
    },
  ];

  return (
    <section className="" aria-labelledby="admin-users-title">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        titleId="admin-users-title"
        description="Consulta cuentas y habilita o deshabilita su acceso."
      >
        <label className="w-full min-w-0 flex-1 space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
        
          <span className="flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-input px-3">
            <Search aria-hidden="true" className="size-4 shrink-0 text-dn-gris" />
            <Input
              className="h-full min-w-0 flex-1 border-0 px-0 shadow-none focus-visible:ring-0"
              value={search}
              maxLength={100}
              placeholder="Nombre o correo"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </span>
        </label>
      </PageHeader>

      <ErrorText>{updateState.error?.message}</ErrorText>

      <div className="mt-5 flex min-h-[28rem] flex-col overflow-hidden rounded-lg border border-dn-gris/20 bg-white">
        <div className="min-h-0 flex-1 overflow-auto">
          {users.isPending ? (
            <div
              className="space-y-3 p-4"
              role="status"
              aria-label="Cargando usuarios"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton className="h-12 w-full" key={index} />
              ))}
            </div>
          ) : users.isError ? (
            <PageState
              icon={RefreshCw}
              title="No pudimos cargar los usuarios"
              description={users.error.message}
              tone="error"
              action={
                <Button variant="outline" onClick={() => void users.refetch()}>
                  Intentar de nuevo
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <PageState
              icon={UserRound}
              title="No encontramos usuarios"
              description={
                search
                  ? "Prueba con otro nombre o correo."
                  : "Aún no hay cuentas registradas."
              }
            />
          ) : (
            <DataTable
              ariaLabel="Usuarios de administración"
              columns={columns}
              data={visibleRows}
              getRowId={(user) => user.IDUsuario}
              containerClassName="h-full overflow-auto"
            />
          )}
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={rows.length}
          pageSize={pageSize}
          itemLabel="usuarios"
          isLoading={users.isFetching}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </section>
  );
}
