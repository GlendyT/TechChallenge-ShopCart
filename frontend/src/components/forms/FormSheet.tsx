import type { ReactNode } from "react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
  bodyClassName,
  footerClassName,
}: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "w-full gap-0 overflow-hidden p-0 sm:max-w-xl",
          className,
        )}
      >
        <SheetHeader className="border-b p-5 pr-14">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto p-5",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer && (
          <SheetFooter
            className={cn(
              "border-t p-4 sm:flex-row sm:justify-end",
              footerClassName,
            )}
          >
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
