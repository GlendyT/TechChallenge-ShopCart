import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { AuthUser } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { formatPrice } from "../lib/format";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface OrderSummary {
  CodigoPublico: string;
  NumeroPedido: string;
  Estado: string;
  Total: number;
  FechaCreacion: string;
}

interface Address {
  IDDireccion: number;
  NombreDestinatario: string;
  DireccionLinea1: string;
  DireccionLinea2?: string | null;
  Ciudad: string;
  Departamento: string;
  EsPrincipal: boolean;
}

export function AccountPage() {
  const { user } = useAuth();
  const orders = useQuery({
    queryKey: ["my-orders"],
    queryFn: () =>
      apiRequest<OrderSummary[]>("/pedidos/mis-pedidos?pagina=1&limite=5").then(
        (response) => response.datos,
      ),
    retry: false,
  });
  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: () =>
      apiRequest<Address[]>("/auth/direcciones").then(
        (response) => response.datos,
      ),
    retry: false,
  });

  return (
    <section className="mx-auto min-h-[60vh] max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">
        Tu espacio Don Arturo
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-5xl">
        Hola,{" "}
        <span className="text-dn-azul">{user?.nombre.split(" ")[0]}.</span>
      </h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none lg:row-span-2">
          <CardHeader className="border-b border-dn-gris/20 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dn-rojo">
                Tu historia con nosotros
              </p>
              <CardTitle className="mt-1 text-lg">Pedidos recientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {orders.isPending ? (
              <p className="text-sm text-dn-gris/80">Cargando pedidos…</p>
            ) : orders.isError ? (
              <p className="text-sm text-dn-rojo" role="alert">
                No pudimos cargar tus pedidos.
              </p>
            ) : !orders.data?.length ? (
              <div>
                <p className="text-sm leading-6 text-dn-gris">
                  Aún no hay pedidos. Cuando encuentres tu próxima pieza, la
                  verás aquí.
                </p>
                <Button className="mt-4" asChild variant="outline">
                  <Link to="/">Explorar tienda</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-dn-gris/20">
                {orders.data.map((order) => (
                  <div
                    className="grid grid-cols-[1fr_auto] items-center gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:gap-5"
                    key={order.CodigoPublico}
                  >
                    <div>
                      <strong className="block text-sm text-dn-gris-oscuro">
                        {order.NumeroPedido}
                      </strong>
                      <span className="mt-1 block text-xs text-dn-gris/80">
                        {new Date(order.FechaCreacion).toLocaleDateString(
                          "es-GT",
                        )}
                      </span>
                    </div>
                    <span className="rounded-full bg-dn-azul/5 px-2.5 py-1 text-[10px] font-semibold uppercase text-dn-azul">
                      {order.Estado.replaceAll("_", " ")}
                    </span>
                    <strong className="col-span-2 text-sm text-dn-gris-oscuro sm:col-span-1">
                      {formatPrice(order.Total)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none">
          <CardHeader className="border-b border-dn-gris/20 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dn-rojo">
                Entrega personal
              </p>
              <CardTitle className="mt-1 text-lg">Direcciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {addresses.isPending ? (
              <p className="text-sm text-dn-gris/80">Cargando direcciones…</p>
            ) : addresses.isError ? (
              <p className="text-sm text-dn-rojo" role="alert">
                No pudimos cargar tus direcciones.
              </p>
            ) : !addresses.data?.length ? (
              <p className="text-sm text-dn-gris">
                Todavía no tienes direcciones guardadas.
              </p>
            ) : (
              <div className="divide-y divide-dn-gris/20">
                {addresses.data.map((address) => (
                  <div
                    className="py-3 first:pt-0 last:pb-0"
                    key={address.IDDireccion}
                  >
                    <strong className="text-sm text-dn-gris-oscuro">
                      {address.NombreDestinatario}
                      {address.EsPrincipal ? " · Principal" : ""}
                    </strong>
                    <span className="mt-1 block text-xs leading-5 text-dn-gris">
                      {address.DireccionLinea1}
                      {address.DireccionLinea2
                        ? `, ${address.DireccionLinea2}`
                        : ""}
                      <br />
                      {address.Ciudad}, {address.Departamento}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none">
          <CardHeader className="border-b border-dn-gris/20 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dn-rojo">
                Tu perfil
              </p>
              <CardTitle className="mt-1 text-lg">Datos de cuenta</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-[90px_minmax(0,1fr)] gap-x-4 gap-y-3 p-5 text-sm">
            <UserDetails user={user} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function UserDetails({ user }: { user: AuthUser | null }) {
  return (
    <>
      <span className="text-xs text-dn-gris/80">Nombre</span>
      <strong className="break-words font-medium text-dn-gris-oscuro">
        {user ? `${user.nombre} ${user.apellido}` : "—"}
      </strong>
      <span className="text-xs text-dn-gris/80">Correo</span>
      <strong className="break-words font-medium text-dn-gris-oscuro">
        {user?.correo ?? "—"}
      </strong>
      <span className="text-xs text-dn-gris/80">Teléfono</span>
      <strong className="break-words font-medium text-dn-gris-oscuro">
        {user?.telefono || "No registrado"}
      </strong>
    </>
  );
}
