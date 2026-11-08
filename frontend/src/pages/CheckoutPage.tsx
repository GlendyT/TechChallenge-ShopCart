import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Link2, MapPin, PackageCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import { cartQueryKey, fetchCart } from "../catalog/cart";
import { formatPrice } from "../lib/format";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

interface Address {
  IDDireccion: number;
  NombreDestinatario: string;
  TelefonoContacto: string;
  DireccionLinea1: string;
  DireccionLinea2?: string | null;
  Ciudad: string;
  Departamento: string;
  EsPrincipal: boolean;
}

interface CreatedOrder {
  CodigoPublico: string;
  NumeroPedido: string;
  Total: number;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const cart = useQuery({ queryKey: cartQueryKey, queryFn: fetchCart, retry: false });
  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: () => apiRequest<Address[]>("/auth/direcciones").then((response) => response.datos),
    retry: false,
  });

  const applyCoupon = useMutation({
    mutationFn: () => apiRequest<{ MontoDescuento?: number }>("/cupones/validar", { method: "POST", body: JSON.stringify({ codigo: coupon.trim() }) }),
    onSuccess: (response) => setCouponMessage(response.mensaje ?? "Cupón válido."),
    onError: (error) => setCouponMessage(error instanceof Error ? error.message : "No pudimos validar el cupón."),
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selectedAddress) throw new Error("Selecciona una dirección de entrega.");
      await apiRequest("/pedidos/checkout/reserva", { method: "POST", body: JSON.stringify({ claveIdempotencia: idempotencyKey }) });
      const response = await apiRequest<CreatedOrder>("/pedidos/checkout/confirmar", {
        method: "POST",
        body: JSON.stringify({
          idDireccionEntrega: selectedAddress,
          claveIdempotencia: idempotencyKey,
          metodoPago: "TARJETA_CREDITO",
          codigoCupon: coupon.trim() || null,
          simularResultadoPago: "APROBADO",
        }),
      });
      return response.datos;
    },
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: cartQueryKey });
      navigate(`/pedido-confirmado/${order.CodigoPublico}`, { replace: true });
    },
  });

  return (
    <section className="mx-auto min-h-[60vh] max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Ruta de navegación" className="mb-7 flex items-center gap-2 text-xs text-dn-gris/80"><Link className="hover:text-dn-azul" to="/">Tienda</Link><span>/</span><Link className="hover:text-dn-azul" to="/carrito">Tu bolsa</Link><span>/</span><span className="font-medium text-dn-gris-oscuro">Checkout</span></nav>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Un último detalle</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-5xl">Confirmar pedido.</h1>

      {cart.isPending || addresses.isPending ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_350px]"><div className="h-96 animate-pulse rounded-lg bg-dn-gris/10" /><div className="h-72 animate-pulse rounded-lg bg-dn-gris/10" /></div>
      ) : cart.isError || addresses.isError ? (
        <div className="mt-8 rounded-lg border border-dn-rojo/25 bg-dn-rojo/5 p-6" role="alert"><h2 className="font-semibold text-dn-gris-oscuro">No pudimos cargar los datos</h2><p className="mt-2 text-sm text-dn-gris">{cart.error?.message ?? addresses.error?.message}</p></div>
      ) : !cart.data?.items.length ? (
        <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dn-gris/20 bg-dn-gris/5 text-center"><h2 className="text-xl font-semibold">Tu bolsa está vacía.</h2><Button asChild className="mt-4"><Link to="/">Volver a la tienda</Link></Button></div>
      ) : (
        <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-5">
            <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none">
              <CardHeader className="border-b border-dn-gris/20 px-5 py-4"><div className="flex items-start gap-3"><span className="grid size-8 place-items-center rounded-full bg-dn-azul/5 text-sm font-bold text-dn-azul">01</span><div><CardTitle className="text-base">Dirección de entrega</CardTitle><p className="mt-1 text-xs text-dn-gris/80">Elige dónde recibir tu pedido.</p></div></div></CardHeader>
              <CardContent className="p-5">
                {!addresses.data?.length ? <p className="rounded-md bg-dn-gris/5 p-4 text-sm text-dn-gris">Necesitas guardar una dirección antes de confirmar. <Link className="font-semibold text-dn-azul hover:text-dn-azul" to="/cuenta">Ir a mi cuenta</Link></p> : <div className="space-y-2">{addresses.data.map((address) => <label className={`flex cursor-pointer gap-3 rounded-md border p-4 transition ${selectedAddress === address.IDDireccion ? "border-dn-azul bg-dn-azul/5" : "border-dn-gris/20 hover:border-dn-gris/70"}`} key={address.IDDireccion}><input className="mt-1 size-4 accent-dn-azul" type="radio" name="address" value={address.IDDireccion} checked={selectedAddress === address.IDDireccion} onChange={() => setSelectedAddress(address.IDDireccion)} /><MapPin className="mt-0.5 shrink-0 text-dn-azul" size={17} /><span><strong className="text-sm text-dn-gris-oscuro">{address.NombreDestinatario}{address.EsPrincipal ? " · Principal" : ""}</strong><small className="mt-1 block text-xs leading-5 text-dn-gris">{address.DireccionLinea1}{address.DireccionLinea2 ? `, ${address.DireccionLinea2}` : ""}<br />{address.Ciudad}, {address.Departamento} · {address.TelefonoContacto}</small></span></label>)}</div>}
              </CardContent>
            </Card>

            <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none">
              <CardHeader className="border-b border-dn-gris/20 px-5 py-4"><div className="flex items-start gap-3"><span className="grid size-8 place-items-center rounded-full bg-dn-azul/5 text-sm font-bold text-dn-azul">02</span><div><CardTitle className="text-base">Promoción</CardTitle><p className="mt-1 text-xs text-dn-gris/80">¿Tienes un código de descuento?</p></div></div></CardHeader>
              <CardContent className="p-5"><div className="flex gap-2"><Input className="h-10" aria-label="Código de cupón" placeholder="Escribe tu código" value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} /><Button variant="outline" type="button" disabled={!coupon.trim() || applyCoupon.isPending} onClick={() => applyCoupon.mutate()}>{applyCoupon.isPending ? "Validando…" : "Aplicar"}</Button></div>{couponMessage && <p className={`mt-3 text-sm ${applyCoupon.isError ? "text-dn-rojo" : "text-dn-azul"}`} role="status">{couponMessage}</p>}</CardContent>
            </Card>

            <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none">
              <CardHeader className="border-b border-dn-gris/20 px-5 py-4"><div className="flex items-start gap-3"><span className="grid size-8 place-items-center rounded-full bg-dn-azul/5 text-sm font-bold text-dn-azul">03</span><div><CardTitle className="text-base">Pago simulado</CardTitle><p className="mt-1 text-xs leading-5 text-dn-gris/80">La confirmación usa el flujo de demostración del reto; no se realizará un cobro real.</p></div></div></CardHeader>
              <CardContent className="p-5"><div className="flex items-center gap-3 rounded-md border border-dn-azul/25 bg-dn-azul/5 p-4"><CreditCard className="text-dn-azul" size={20} /><span className="flex-1"><strong className="block text-sm text-dn-gris-oscuro">Tarjeta de crédito</strong><small className="text-xs text-dn-gris">Autorización de demostración</small></span><Check className="text-dn-azul" size={18} /></div></CardContent>
            </Card>
            {placeOrder.error && <p className="text-sm text-dn-rojo" role="alert">{placeOrder.error.message}</p>}
          </div>

          <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none lg:sticky lg:top-24">
            <CardHeader className="border-b border-dn-gris/20 px-5 py-4"><CardTitle className="text-base">Resumen de compra</CardTitle></CardHeader>
            <CardContent className="p-5">
              <div className="max-h-64 divide-y divide-dn-gris/10 overflow-y-auto">{cart.data.items.map((item) => <div className="flex justify-between gap-3 py-3 first:pt-0" key={item.IDVariante}><span className="text-xs text-dn-gris-oscuro">{item.Cantidad} × {item.NombreProducto}<small className="mt-1 block text-dn-gris/80">{item.NombreVariante}</small></span><strong className="shrink-0 text-xs text-dn-gris-oscuro">{formatPrice(item.SubtotalLinea)}</strong></div>)}</div>
              <div className="mt-3 flex justify-between border-t border-dn-gris/20 py-3 text-sm text-dn-gris"><span>Subtotal</span><span>{formatPrice(cart.data.Subtotal)}</span></div>
              <div className="flex justify-between border-b border-dn-gris/20 pb-3 text-sm text-dn-gris"><span>Envío</span><span>Por confirmar</span></div>
              <div className="flex justify-between py-4 font-bold text-dn-gris-oscuro"><span>Total estimado</span><span>{formatPrice(cart.data.Subtotal)}</span></div>
              <Button className="h-11 w-full bg-dn-azul text-white hover:bg-dn-azul" type="button" disabled={!selectedAddress || placeOrder.isPending || !addresses.data?.length} onClick={() => placeOrder.mutate()}>{placeOrder.isPending ? "Confirmando…" : "Confirmar pedido"}</Button>
              <p className="mt-3 text-center text-xs leading-5 text-dn-gris/80">Al confirmar, reservaremos tus piezas por 15 minutos y registraremos tu pedido.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

export function OrderConfirmationPage() {
  const { codigoPublico = "" } = useParams();
  const order = useQuery({
    queryKey: ["order", codigoPublico],
    queryFn: () => apiRequest<CreatedOrder>(`/pedidos/${codigoPublico}`).then((response) => response.datos),
    enabled: Boolean(codigoPublico),
    retry: false,
  });

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-dn-azul/5 text-dn-azul"><PackageCheck size={30} /></span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Pedido confirmado</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-dn-gris-oscuro">Gracias por elegirnos.</h1>
      {order.isPending ? <p className="mt-4 text-sm text-dn-gris/80">Cargando el resumen de tu pedido…</p> : order.isError ? <p className="mt-4 text-sm text-dn-gris">Tu pedido fue creado. Puedes consultarlo desde tu cuenta.</p> : <><p className="mt-4 text-sm text-dn-gris">Tu número de pedido es <strong className="text-dn-gris-oscuro">{order.data?.NumeroPedido}</strong>.</p><p className="mt-2 text-sm text-dn-gris">Total: <strong className="text-dn-gris-oscuro">{formatPrice(order.data?.Total ?? 0)}</strong></p></>}
      <Button asChild className="mt-6 bg-dn-azul text-white hover:bg-dn-azul"><Link to="/cuenta">Ver mi cuenta<Link2 className="ml-2" size={15} /></Link></Button>
    </section>
  );
}
