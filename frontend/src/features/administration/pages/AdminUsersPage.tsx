import { useState } from "react";
import { LoaderCircle, RefreshCw, Search, UserRound } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Skeleton } from "../../../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { PageState } from "../../../components/feedback/PageState";
import { useAdminMutation, useAdminUsers, adminMutations } from "../hooks/useAdminData";

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const users = useAdminUsers(search);
  const updateState = useAdminMutation((input: { id: number; activo: boolean }) => adminMutations.setUserActive(input.id, input.activo), "users");
  const rows = users.data ?? [];

  return <section className="mx-auto max-w-7xl" aria-labelledby="admin-users-title">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Administración</p>
    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 id="admin-users-title" className="text-3xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-4xl">Usuarios</h1><p className="mt-2 text-sm text-dn-gris">Consulta cuentas y habilita o deshabilita su acceso.</p></div><Badge variant="outline" className="w-fit">{rows.length} usuarios</Badge></div>
    <label className="mt-6 block max-w-lg space-y-1.5 text-xs font-medium text-dn-gris-oscuro"><span>Buscar por nombre, apellido o correo</span><span className="flex h-10 items-center gap-2 rounded-md border border-input px-3"><Search aria-hidden="true" className="size-4 text-dn-gris" /><Input className="h-full border-0 px-0 shadow-none focus-visible:ring-0" value={search} maxLength={100} placeholder="Nombre o correo" onChange={(event) => setSearch(event.target.value)} /></span></label>
    {updateState.error && <p role="alert" className="mt-4 rounded-md border border-dn-rojo/20 bg-dn-rojo/5 p-3 text-sm text-dn-rojo">{updateState.error.message}</p>}
    <div className="mt-5 overflow-hidden rounded-lg border border-dn-gris/20 bg-white">{users.isPending ? <div className="space-y-3 p-4" role="status" aria-label="Cargando usuarios">{Array.from({ length: 5 }, (_, index) => <Skeleton className="h-12 w-full" key={index} />)}</div> : users.isError ? <PageState icon={RefreshCw} title="No pudimos cargar los usuarios" description={users.error.message} tone="error" action={<Button variant="outline" onClick={() => void users.refetch()}>Intentar de nuevo</Button>} /> : rows.length === 0 ? <PageState icon={UserRound} title="No encontramos usuarios" description={search ? "Prueba con otro nombre o correo." : "Aún no hay cuentas registradas."} /> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Teléfono</TableHead><TableHead>Registro</TableHead><TableHead>Estado</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader><TableBody>{rows.map((user) => <TableRow key={user.IDUsuario}><TableCell><strong className="block text-sm text-dn-gris-oscuro">{user.Nombre} {user.Apellido}</strong><span className="text-xs text-dn-gris">{user.Correo}</span></TableCell><TableCell>{user.Rol}</TableCell><TableCell className="text-sm text-dn-gris">{user.Telefono || "—"}</TableCell><TableCell className="whitespace-nowrap text-xs text-dn-gris">{new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(new Date(user.FechaCreacion))}</TableCell><TableCell><Badge variant="outline" className={user.Activo ? "border-dn-azul/25 bg-dn-azul/5 text-dn-azul" : "border-dn-gris/30 bg-dn-gris/5 text-dn-gris"}>{user.Activo ? "Activo" : "Inactivo"}</Badge></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" disabled={updateState.isPending} onClick={() => updateState.mutate({ id: user.IDUsuario, activo: !user.Activo })}>{updateState.isPending && <LoaderCircle className="animate-spin" size={14} />}{user.Activo ? "Desactivar" : "Activar"}</Button></TableCell></TableRow>)}</TableBody></Table></div>}</div>
  </section>;
}
