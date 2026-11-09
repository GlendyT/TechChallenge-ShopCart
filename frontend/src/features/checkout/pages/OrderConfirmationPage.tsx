import { Link } from "react-router-dom";
import { Link2, PackageCheck } from "lucide-react";
import { formatPrice } from "../../../lib/format";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { useOrder } from "../hooks/useOrder";

export function OrderConfirmationPage({ codigoPublico }: { codigoPublico: string }) {
  const order = useOrder(codigoPublico);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-dn-azul/5 text-dn-azul"><PackageCheck aria-hidden="true" size={30} /></span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Pedido confirmado</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-dn-gris-oscuro">Gracias por elegirnos.</h1>
      {order.isPending ? (
        <div className="mt-4 w-full max-w-sm space-y-3" role="status" aria-label="Cargando el resumen de tu pedido">
          <Skeleton className="mx-auto h-5 w-2/3" aria-hidden="true" />
          <Skeleton className="mx-auto h-4 w-1/3" aria-hidden="true" />
        </div>
      ) : order.isError ? (
        <p className="mt-4 text-sm text-dn-gris" role="status">Tu pedido fue creado. Puedes consultarlo desde tu cuenta.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-dn-gris">Tu número de pedido es <strong className="text-dn-gris-oscuro">{order.data?.NumeroPedido}</strong>.</p>
          <p className="mt-2 text-sm text-dn-gris">Total: <strong className="text-dn-gris-oscuro">{formatPrice(order.data?.Total ?? 0)}</strong></p>
        </>
      )}
      <Button asChild className="mt-6 bg-dn-azul text-white hover:bg-dn-azul"><Link to="/cuenta">Ver mi cuenta<Link2 aria-hidden="true" className="ml-2" size={15} /></Link></Button>
    </section>
  );
}
