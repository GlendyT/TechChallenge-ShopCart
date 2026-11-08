import { ArrowUpRight, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { routePaths } from "../../../app/router/routePaths";

interface OperationsSectionPageProps {
  title: string;
  description: string;
}

export function OperationsSectionPage({ title, description }: OperationsSectionPageProps) {
  return (
    <section className="mx-auto max-w-5xl" aria-labelledby="operations-section-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">Gestión de tienda</p>
      <h1 id="operations-section-title" className="mt-2 text-3xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-dn-gris">{description}</p>
      <div className="mt-8 rounded-lg border border-dn-gris/20 bg-white p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-full bg-dn-azul/5 text-dn-azul">
          <LayoutDashboard aria-hidden="true" size={22} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-dn-gris-oscuro">Panel de operaciones</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-dn-gris">Esta sección todavía no tiene contenido disponible.</p>
        <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-dn-azul hover:underline" to={routePaths.home}>Ir a la tienda <ArrowUpRight aria-hidden="true" size={16} /></Link>
      </div>
    </section>
  );
}
