import { Check, ShieldCheck, Truck } from "lucide-react";

export function StoreBenefits() {
  return (
    <section
      aria-label="Beneficios de comprar en Don Arturo"
      className="mx-auto grid max-w-6xl border-b border-dn-gris/20 px-5 sm:grid-cols-3 sm:px-8"
    >
      <div className="flex items-center gap-3 border-b border-dn-gris/20 py-5 sm:justify-center sm:border-b-0 sm:py-7">
        <Truck aria-hidden="true" className="text-dn-azul" size={21} />
        <span>
          <strong className="block text-sm font-semibold">Envío nacional</strong>
          <small className="mt-0.5 block text-xs text-dn-gris/80">
            Hasta tu puerta
          </small>
        </span>
      </div>
      <div className="flex items-center gap-3 border-b border-dn-gris/20 py-5 sm:justify-center sm:border-b-0 sm:border-l sm:py-7">
        <ShieldCheck aria-hidden="true" className="text-dn-azul" size={21} />
        <span>
          <strong className="block text-sm font-semibold">Compra segura</strong>
          <small className="mt-0.5 block text-xs text-dn-gris/80">
            Tu información protegida
          </small>
        </span>
      </div>
      <div className="flex items-center gap-3 py-5 sm:justify-center sm:border-l sm:py-7">
        <Check aria-hidden="true" className="text-dn-rojo" size={21} />
        <span>
          <strong className="block text-sm font-semibold">
            Calidad que se siente
          </strong>
          <small className="mt-0.5 block text-xs text-dn-gris/80">
            Materiales seleccionados
          </small>
        </span>
      </div>
    </section>
  );
}
