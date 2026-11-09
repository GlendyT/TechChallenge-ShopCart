import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  className?: string;
  titleContent?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  titleId,
  className = "",
  titleContent,
  children,
}: PageHeaderProps) {
  const titleContentLayout = titleContent
    ? "lg:max-w-none lg:flex-1"
    : "lg:max-w-[45%] lg:flex-none";

  return (
    <header
      className={`flex flex-col justify-between gap-4 lg:flex-row lg:items-end ${className}`}
      aria-labelledby={titleId}
    >
      <div
        className={`flex w-full min-w-0 flex-1 flex-row flex-wrap items-end justify-between gap-6 lg:w-auto ${titleContentLayout}`}
      >
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">
            {eyebrow}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
            <h1
              id={titleId}
              className="text-3xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-4xl"
            >
              {title}
            </h1>
          </div>
          <p className="mt-2 text-sm text-dn-gris">{description}</p>
        </div>
        {titleContent}
      </div>
      {children && (
        <div className="flex min-w-0 w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:justify-start">
          {children}
        </div>
      )}
    </header>
  );
}
