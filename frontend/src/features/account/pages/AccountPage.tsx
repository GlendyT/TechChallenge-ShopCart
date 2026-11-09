import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth/useAuth";
import { formatPrice } from "../../../lib/format";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { AddressManager } from "../components/AddressManager";
import { useAccountProfile } from "../hooks/useAccountProfile";
import { useAddresses } from "../hooks/useAddresses";
import { useMyOrders } from "../hooks/useMyOrders";

export function AccountPage() {
  const { user } = useAuth();
  const orders = useMyOrders();
  const addresses = useAddresses(user?.idUsuario ?? null);
  const profile = useAccountProfile(user?.idUsuario ?? null);

  return <section className="mx-auto min-h-[60vh] max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Tu espacio Don Arturo</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-5xl">Hola, <span className="text-dn-azul">{profile.data?.nombre.split(" ")[0] ?? user?.nombre.split(" ")[0]}.</span></h1>
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none lg:row-span-2">
        <CardHeader className="border-b border-dn-gris/20 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dn-rojo">Tu historia con nosotros</p><CardTitle className="mt-1 text-lg">Pedidos recientes</CardTitle></div></CardHeader>
        <CardContent className="p-5">{orders.isPending ? <div className="space-y-3" role="status" aria-label="Cargando pedidos"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/3" /></div> : orders.isError ? <div role="alert"><p className="text-sm text-dn-rojo">No pudimos cargar tus pedidos.</p><button className="mt-2 text-sm font-semibold text-dn-azul underline" type="button" onClick={() => void orders.refetch()}>Reintentar</button></div> : !orders.data?.length ? <div><p className="text-sm leading-6 text-dn-gris">Aún no hay pedidos. Cuando encuentres tu próxima pieza, la verás aquí.</p><Button className="mt-4" asChild variant="outline"><Link to="/">Explorar tienda</Link></Button></div> : <div className="divide-y divide-dn-gris/20">{orders.data.map((order) => <div className="grid grid-cols-[1fr_auto] items-center gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:gap-5" key={order.CodigoPublico}><div><strong className="block text-sm text-dn-gris-oscuro">{order.NumeroPedido}</strong><span className="mt-1 block text-xs text-dn-gris/80">{new Date(order.FechaCreacion).toLocaleDateString("es-GT")}</span></div><span className="rounded-full bg-dn-azul/5 px-2.5 py-1 text-[10px] font-semibold uppercase text-dn-azul">{order.Estado.replaceAll("_", " ")}</span><strong className="col-span-2 text-sm text-dn-gris-oscuro sm:col-span-1">{formatPrice(order.Total)}</strong></div>)}</div>}</CardContent>
      </Card>

      <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none">
        <CardHeader className="border-b border-dn-gris/20 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dn-rojo">Entrega personal</p><CardTitle className="mt-1 text-lg">Direcciones</CardTitle></div></CardHeader>
        <CardContent className="p-5">{addresses.isPending ? <div className="space-y-3" role="status" aria-label="Cargando direcciones"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div> : addresses.isError ? <div role="alert"><p className="text-sm text-dn-rojo">No pudimos cargar tus direcciones.</p><button className="mt-2 text-sm font-semibold text-dn-azul underline" type="button" onClick={() => void addresses.refetch()}>Reintentar</button></div> : <AddressManager addresses={addresses.data ?? []} />}</CardContent>
      </Card>

      <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none">
        <CardHeader className="border-b border-dn-gris/20 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dn-rojo">Tu perfil</p><CardTitle className="mt-1 text-lg">Datos de cuenta</CardTitle></div></CardHeader>
        <CardContent className="grid grid-cols-[90px_minmax(0,1fr)] gap-x-4 gap-y-3 p-5 text-sm">{profile.isPending ? <><span className="col-span-2 text-sm text-dn-gris" role="status">Cargando perfil…</span><Skeleton className="h-4 w-14" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-14" /><Skeleton className="h-4 w-48" /></> : profile.isError ? <p className="col-span-2 text-sm text-dn-rojo" role="alert">No pudimos cargar los datos de tu cuenta. <button className="font-semibold underline" type="button" onClick={() => void profile.refetch()}>Reintentar</button></p> : profile.data ? <><span className="text-xs text-dn-gris/80">Nombre</span><strong className="break-words font-medium text-dn-gris-oscuro">{profile.data.nombre} {profile.data.apellido}</strong><span className="text-xs text-dn-gris/80">Correo</span><strong className="break-words font-medium text-dn-gris-oscuro">{profile.data.correo}</strong><span className="text-xs text-dn-gris/80">Teléfono</span><strong className="break-words font-medium text-dn-gris-oscuro">{profile.data.telefono || "No registrado"}</strong><span className="text-xs text-dn-gris/80">Cuenta</span><strong className="font-medium text-dn-gris-oscuro">{profile.data.activo ? "Activa" : "Inactiva"}</strong></> : null}</CardContent>
      </Card>
    </div>
  </section>;
}
