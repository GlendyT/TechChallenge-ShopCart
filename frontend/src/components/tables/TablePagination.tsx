import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { TABLE_PAGE_SIZES } from "./tablePaginationConstants";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  className?: string;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  className,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  return (
    <footer
      className={cn(
        "mt-auto flex shrink-0 flex-col gap-3 border-t border-dn-gris/20 bg-white px-4 py-3 text-sm text-dn-gris/80 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span>
        Página {currentPage} de {totalPages} · {totalItems} {itemLabel}
      </span>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <label className="flex items-center gap-2 text-xs">
          <span>Filas por página</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              aria-label="Filas por página"
              className="h-8 w-[4.5rem]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TABLE_PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <nav aria-label="Paginación de tabla" className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            type="button"
            aria-label="Página anterior"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            type="button"
            aria-label="Página siguiente"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          >
            <ArrowRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </footer>
  );
}
