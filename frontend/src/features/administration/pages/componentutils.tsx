
import { type ReactNode } from "react";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export function AdminStatus({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-dn-azul/25 bg-dn-azul/5 text-dn-azul"
          : "border-dn-gris/30 bg-dn-gris/5 text-dn-gris"
      }
    >
      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}
export function ErrorText({ children }: { children?: ReactNode }) {
  return children ? (
    <p className="text-sm text-dn-rojo" role="alert">
      {children}
    </p>
  ) : null;
}
export function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-dn-gris/20 bg-white">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
