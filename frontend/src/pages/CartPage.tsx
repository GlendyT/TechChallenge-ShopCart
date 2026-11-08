import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { cartQueryKey, fetchCart, removeCartItem, updateCartItem } from "../catalog/cart";
import { formatPrice } from "../lib/format";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function CartPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const cart = useQuery({ queryKey: cartQueryKey, queryFn: fetchCart, retry: false });
  const changeQuantity = useMutation({
    mutationFn: ({ idVariante, cantidad }: { idVariante: number; cantidad: number }) => updateCartItem(idVariante, cantidad),
    onSuccess: (updated) => queryClient.setQueryData(cartQueryKey, updated),
  });
  const removeItem = useMutation({
    mutationFn: removeCartItem,
    onSuccess: (updated) => queryClient.setQueryData(cartQueryKey, updated),
  });
  const error = changeQuantity.error ?? removeItem.error ?? cart.error;
  const errorMessage = error instanceof ApiError ? error.message : error?.message;

  return (
    <section className="mx-auto min-h-[60vh] max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Ruta de navegación" className="mb-7 flex items-center gap-2 text-xs text-dn-gris/80"><Link className="hover:text-dn-azul" to="/">Tienda</Link><span>/</span><span className="font-medium text-dn-gris-oscuro">Tu bolsa</span></nav>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Tu selección</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-5xl">Tu bolsa.</h1></div>
        <span className="text-sm text-dn-gris/80">{cart.data?.TotalArticulos ?? 0} artículos</span>
      </div>

      {cart.isPending ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]"><div className="h-72 animate-pulse rounded-lg bg-dn-gris/10" /><div className="h-64 animate-pulse rounded-lg bg-dn-gris/10" /></div>
      ) : cart.isError ? (
        <div className="rounded-lg border border-dn-rojo/25 bg-dn-rojo/5 p-6 text-center" role="alert"><h2 className="font-semibold text-dn-gris-oscuro">No pudimos abrir tu bolsa</h2><p className="mt-2 text-sm text-dn-gris">{cart.error.message}</p><Button className="mt-4" variant="outline" onClick={() => void cart.refetch()}>Intentar de nuevo</Button></div>
      ) : !cart.data?.items.length ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-dn-gris/60 bg-dn-gris/5 px-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-dn-azul/5 text-dn-azul"><ShoppingBag aria-hidden="true" size={23} /></span>
          <h2 className="mt-4 text-xl font-semibold text-dn-gris-oscuro">Tu próxima pieza te espera.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-dn-gris">Aún no has agregado nada. Explora la colección y encuentra eso que se siente como tú.</p>
          <Button asChild className="mt-5 bg-dn-azul text-white hover:bg-dn-azul"><Link to="/">Explorar la tienda</Link></Button>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
          <div>
            <div className="hidden grid-cols-[minmax(0,1fr)_100px_120px_100px] gap-4 border-y border-dn-gris/20 py-3 text-[11px] font-semibold uppercase tracking-wide text-dn-gris/80 sm:grid"><span>Pieza</span><span>Precio</span><span>Cantidad</span><span className="text-right">Total</span></div>
            <div className="divide-y divide-dn-gris/20 border-b border-dn-gris/20">
              {cart.data.items.map((item) => (
                <article className="grid grid-cols-[76px_minmax(0,1fr)_auto] gap-x-3 gap-y-3 py-4 sm:grid-cols-[minmax(0,1fr)_100px_120px_100px] sm:items-center sm:gap-4" key={item.IDVariante}>
                  <Link to={`/producto/${item.CodigoPublicoProducto}`} className="row-span-2 h-24 w-[76px] overflow-hidden rounded-md bg-dn-gris/10 sm:row-span-1">{item.ImagenURL ? <img className="size-full object-cover" src={item.ImagenURL} alt="" /> : <span className="grid size-full place-items-center text-xl font-bold text-dn-gris/60">DA</span>}</Link>
                  <div className="row-span-2 flex min-w-0 flex-col justify-center sm:row-span-1"><Link className="font-semibold text-dn-gris-oscuro hover:text-dn-azul" to={`/producto/${item.CodigoPublicoProducto}`}>{item.NombreProducto}</Link><span className="mt-1 text-xs text-dn-gris/80">{item.NombreVariante}{item.SKU ? ` · ${item.SKU}` : ""}</span><button className="mt-2 inline-flex w-fit items-center gap-1 text-xs font-medium text-dn-rojo hover:text-dn-rojo disabled:opacity-50" type="button" onClick={() => removeItem.mutate(item.IDVariante)} disabled={removeItem.isPending}><Trash2 size={13} /> Quitar</button></div>
                  <span className="hidden text-sm text-dn-gris-oscuro sm:block">{formatPrice(item.PrecioUnitario)}</span>
                  <div className="col-start-2 flex h-9 w-fit items-center rounded-md border border-dn-gris/60 sm:col-start-auto"><button className="grid size-8 place-items-center text-dn-gris hover:text-dn-azul disabled:opacity-40" type="button" aria-label={`Disminuir cantidad de ${item.NombreProducto}`} disabled={item.Cantidad <= 1 || changeQuantity.isPending} onClick={() => changeQuantity.mutate({ idVariante: item.IDVariante, cantidad: item.Cantidad - 1 })}><Minus size={14} /></button><span className="min-w-7 text-center text-sm">{item.Cantidad}</span><button className="grid size-8 place-items-center text-dn-gris hover:text-dn-azul disabled:opacity-40" type="button" aria-label={`Aumentar cantidad de ${item.NombreProducto}`} disabled={item.Cantidad >= item.ExistenciaDisponible || changeQuantity.isPending} onClick={() => changeQuantity.mutate({ idVariante: item.IDVariante, cantidad: item.Cantidad + 1 })}><Plus size={14} /></button></div>
                  <strong className="col-start-3 row-start-2 text-right text-sm text-dn-gris-oscuro sm:col-start-auto sm:row-start-auto">{formatPrice(item.SubtotalLinea)}</strong>
                </article>
              ))}
            </div>
            {errorMessage && <p className="mt-4 text-sm text-dn-rojo" role="alert">{errorMessage}</p>}
            <Link className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-dn-azul hover:text-dn-azul" to="/"><ArrowLeft size={16} /> Seguir explorando</Link>
          </div>

          <Card className="gap-0 rounded-lg border-dn-gris/20 shadow-none">
            <CardHeader className="border-b border-dn-gris/20 px-5 py-4"><CardTitle className="text-base">Resumen de compra</CardTitle></CardHeader>
            <CardContent className="p-5">
              <div className="flex justify-between py-2 text-sm text-dn-gris"><span>Subtotal</span><span>{formatPrice(cart.data.Subtotal)}</span></div>
              <div className="flex justify-between gap-4 border-b border-dn-gris/20 py-3 text-sm text-dn-gris"><span>Envío</span><span className="text-right">Se calcula al confirmar</span></div>
              <div className="flex justify-between py-4 text-base font-bold text-dn-gris-oscuro"><span>Total</span><span>{formatPrice(cart.data.Subtotal)}</span></div>
              <p className="mb-4 text-xs leading-5 text-dn-gris/80">Los precios incluyen IVA. El costo de envío se confirma durante el checkout.</p>
              <Button asChild className="h-11 w-full bg-dn-azul text-white hover:bg-dn-azul"><Link to={isAuthenticated ? "/checkout" : "/acceso?next=/checkout"}>Continuar al checkout</Link></Button>
              <p className="mt-3 text-center text-[11px] text-dn-gris/80">Inventario reservado por 15 minutos durante el checkout.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
