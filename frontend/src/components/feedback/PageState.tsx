import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "default" | "error";
}

export function PageState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
}: PageStateProps) {
  return (
    <section
      className="flex min-h-64 flex-col items-center justify-center border border-dashed border-dn-gris/60 bg-dn-gris/5 px-6 py-10 text-center"
      aria-live="polite"
    >
      <span
        className={`mb-4 grid size-12 place-items-center rounded-full ${tone === "error" ? "bg-dn-rojo/5 text-dn-rojo" : "bg-dn-azul/5 text-dn-azul"}`}
        aria-hidden="true"
      >
        <Icon size={21} strokeWidth={1.7} />
      </span>
      <h3 className="text-lg font-semibold tracking-tight text-dn-gris-oscuro">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-dn-gris">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
