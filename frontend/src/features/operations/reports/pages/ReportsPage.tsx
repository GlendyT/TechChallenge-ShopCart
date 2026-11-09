import { useState, type FormEvent } from "react";
import {
  Activity,
  CalendarDays,
  ChartNoAxesCombined,
  LoaderCircle,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Skeleton } from "../../../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { PageState } from "../../../../components/feedback/PageState";
import { formatPrice } from "../../../../lib/format";
import { useReports } from "../hooks/useReports";
import type { ReportFilters, ReportGrouping, CategorySalesRow } from "../types/reportTypes";

const CHART_COLORS = ["#005297", "#e73326", "#7c7c7d"];
const dateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
function initialFilters(): ReportFilters {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 30);
  return {
    fechaInicio: dateString(start),
    fechaFin: dateString(today),
    agrupacion: "DIA",
    minutosInactividad: 1440,
  };
}
function daySpan(start: string, end: string) {
  return (
    Math.floor(
      (new Date(`${end}T00:00:00`).getTime() -
        new Date(`${start}T00:00:00`).getTime()) /
        86_400_000,
    ) + 1
  );
}
const tickPrice = (value: number) =>
  `Q${new Intl.NumberFormat("es-GT", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
const tooltipPrice = (value: number) => formatPrice(value);

interface MetricCardProps {
  label: string;
  value: string;
  caption: string;
  icon: typeof Activity;
}
function MetricCard({ label, value, caption, icon: Icon }: MetricCardProps) {
  return (
    <Card className="border-dn-gris/20 bg-white">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-dn-gris">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-dn-gris-oscuro">
            {value}
          </p>
          <p className="mt-1 text-xs text-dn-gris/80">{caption}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-dn-azul/5 text-dn-azul">
          <Icon aria-hidden="true" size={19} />
        </span>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const initial = initialFilters();
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [filterError, setFilterError] = useState("");
  const reports = useReports(filters);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.fechaInicio > draft.fechaFin) {
      setFilterError(
        "La fecha inicial debe ser anterior o igual a la fecha final.",
      );
      return;
    }
    const span = daySpan(draft.fechaInicio, draft.fechaFin);
    if (span > 100) {
      setFilterError("El reporte de ventas admite rangos de hasta 100 días.");
      return;
    }
    if (span < 1) {
      setFilterError("Selecciona un rango de fechas válido.");
      return;
    }
    setFilterError("");
    setFilters(draft);
  }

  const data = reports.data;
  const revenue =
    data?.ventasPeriodo.reduce(
      (sum, row) => sum + Number(row.TotalVentasNetas),
      0,
    ) ?? 0;
  const orders =
    data?.ventasPeriodo.reduce(
      (sum, row) => sum + Number(row.TotalPedidos),
      0,
    ) ?? 0;
  const averageTicket = orders ? revenue / orders : 0;
  const netUnits =
    data?.ventasCategoria.reduce(
      (sum, row) => sum + Number(row.UnidadesNetasVendidas),
      0,
    ) ?? 0;
  const abandonedValue =
    data?.carritosAbandonados.reduce(
      (sum, cart) => sum + Number(cart.ValorEstimadoCarrito),
      0,
    ) ?? 0;

  return (
    <section className="" aria-labelledby="reports-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-dn-rojo">
        Gestión de tienda
      </p>
      <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1
            id="reports-title"
            className="text-3xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-4xl"
          >
            Dashboard y reportes
          </h1>
          <p className="mt-2 text-sm text-dn-gris">
            Ventas netas, productos destacados, categorías y carritos que
            requieren seguimiento.
          </p>
        </div>
        {reports.isFetching && (
          <span
            className="inline-flex items-center gap-2 text-xs text-dn-gris"
            role="status"
          >
            <LoaderCircle className="animate-spin" size={14} /> Actualizando
          </span>
        )}
      </div>

      <form
        onSubmit={applyFilters}
        className="mt-6 grid gap-3 rounded-lg border border-dn-gris/20 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto] lg:items-end"
      >
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Desde</span>
          <Input
            type="date"
            value={draft.fechaInicio}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                fechaInicio: event.target.value,
              }))
            }
            required
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Hasta</span>
          <Input
            type="date"
            value={draft.fechaFin}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                fechaFin: event.target.value,
              }))
            }
            required
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Agrupar ventas</span>
          <Select
            value={draft.agrupacion}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                agrupacion: value as ReportGrouping,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DIA">Por día</SelectItem>
              <SelectItem value="SEMANA">Por semana</SelectItem>
              <SelectItem value="MES">Por mes</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-dn-gris-oscuro">
          <span>Carrito abandonado tras</span>
          <Select
            value={String(draft.minutosInactividad)}
            onValueChange={(value) =>
              setDraft((current) => ({
                ...current,
                minutosInactividad: Number(value),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="360">6 horas</SelectItem>
              <SelectItem value="720">12 horas</SelectItem>
              <SelectItem value="1440">24 horas</SelectItem>
              <SelectItem value="2880">48 horas</SelectItem>
              <SelectItem value="10080">7 días</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <Button type="submit">
          <CalendarDays aria-hidden="true" size={15} /> Aplicar
        </Button>
        {filterError && (
          <p
            className="text-xs text-dn-rojo sm:col-span-2 lg:col-span-5"
            role="alert"
          >
            {filterError}
          </p>
        )}
      </form>

      {reports.isPending ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : reports.isError ? (
        <div className="mt-5">
          <PageState
            icon={RefreshCw}
            title="No pudimos cargar los reportes"
            description={reports.error.message}
            tone="error"
            action={
              <Button variant="outline" onClick={() => void reports.refetch()}>
                Intentar de nuevo
              </Button>
            }
          />
        </div>
      ) : (
        data && (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Ventas netas"
                value={formatPrice(revenue)}
                caption={`${filters.fechaInicio} a ${filters.fechaFin}`}
                icon={ChartNoAxesCombined}
              />
              <MetricCard
                label="Pedidos con venta"
                value={new Intl.NumberFormat("es-GT").format(orders)}
                caption="Pedidos netos en el periodo"
                icon={ShoppingCart}
              />
              <MetricCard
                label="Ticket promedio"
                value={formatPrice(averageTicket)}
                caption="Ventas netas por pedido"
                icon={Activity}
              />
              <MetricCard
                label="Carritos abandonados"
                value={new Intl.NumberFormat("es-GT").format(
                  data.carritosAbandonados.length,
                )}
                caption={`${formatPrice(abandonedValue)} en valor estimado`}
                icon={Users}
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
              <Card className="border-dn-gris/20 bg-white">
                <CardHeader>
                  <CardTitle>Ventas y pedidos</CardTitle>
                  <CardDescription>
                    Serie neta por{" "}
                    {filters.agrupacion === "DIA"
                      ? "día"
                      : filters.agrupacion === "SEMANA"
                        ? "semana"
                        : "mes"}{" "}
                    (incluye periodos sin ventas).
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80 pl-1 pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.ventasPeriodo}
                      margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="Periodo"
                        tick={{ fontSize: 11, fill: "#7c7c7d" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={20}
                      />
                      <YAxis
                        yAxisId="sales"
                        tickFormatter={tickPrice}
                        tick={{ fontSize: 11, fill: "#7c7c7d" }}
                        tickLine={false}
                        axisLine={false}
                        width={55}
                      />
                      <YAxis
                        yAxisId="orders"
                        orientation="right"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#7c7c7d" }}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                      />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "Ventas netas"
                            ? tooltipPrice(Number(value))
                            : Number(value)
                        }
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: "#e5e7eb",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        yAxisId="sales"
                        type="monotone"
                        dataKey="TotalVentasNetas"
                        name="Ventas netas"
                        stroke="#005297"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="orders"
                        type="monotone"
                        dataKey="TotalPedidos"
                        name="Pedidos"
                        stroke="#e73326"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-dn-gris/20 bg-white">
                <CardHeader>
                  <CardTitle>Ventas por categoría</CardTitle>
                  <CardDescription>
                    Participación en ventas netas.{" "}
                    {new Intl.NumberFormat("es-GT").format(netUnits)} unidades
                    netas vendidas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.ventasCategoria}
                        dataKey="MontoNetoVendido"
                        nameKey="Categoria"
                        cx="50%"
                        cy="48%"
                        innerRadius={60}
                        outerRadius={105}
                        paddingAngle={2}
                        label={(props) => {
                          const { Categoria, PorcentajeParticipacion } = props as unknown as CategorySalesRow;
                          return `${Categoria} ${PorcentajeParticipacion}%`;
                        }}
                        labelLine={false}
                      >
                        {data.ventasCategoria.map((entry, index) => (
                          <Cell
                            key={entry.IDCategoria}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => tooltipPrice(Number(value))}
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: "#e5e7eb",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Card className="border-dn-gris/20 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package
                      aria-hidden="true"
                      size={18}
                      className="text-dn-azul"
                    />{" "}
                    Top 10 productos
                  </CardTitle>
                  <CardDescription>
                    Unidades netas vendidas e ingresos netos durante el rango
                    seleccionado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.topProductos.length === 0 ? (
                    <p className="py-12 text-center text-sm text-dn-gris">
                      Sin ventas para este periodo.
                    </p>
                  ) : (
                    <div className="h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.topProductos}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: "#7c7c7d" }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="NombreProducto"
                            width={120}
                            tick={{ fontSize: 10, fill: "#555" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            formatter={(value, name) =>
                              name === "Unidades netas"
                                ? Number(value)
                                : tooltipPrice(Number(value))
                            }
                            contentStyle={{
                              borderRadius: 10,
                              borderColor: "#e5e7eb",
                              fontSize: 12,
                            }}
                          />
                          <Bar
                            dataKey="UnidadesNetasVendidas"
                            name="Unidades netas"
                            fill="#005297"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-dn-gris/20 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users
                      aria-hidden="true"
                      size={18}
                      className="text-dn-rojo"
                    />{" "}
                    Carritos abandonados
                  </CardTitle>
                  <CardDescription>
                    Sin actividad por al menos{" "}
                    {filters.minutosInactividad >= 1440
                      ? `${filters.minutosInactividad / 1440} día(s)`
                      : `${filters.minutosInactividad / 60} hora(s)`}
                    . Valor estimado al precio actual.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.carritosAbandonados.length === 0 ? (
                    <p className="py-12 text-center text-sm text-dn-gris">
                      No hay carritos que cumplan este umbral.
                    </p>
                  ) : (
                    <div className="max-h-[340px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Actividad</TableHead>
                            <TableHead className="text-right">
                              Unidades
                            </TableHead>
                            <TableHead className="text-right">
                              Valor estimado
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.carritosAbandonados.map((cart) => (
                            <TableRow key={cart.IDCarrito}>
                              <TableCell>
                                <strong className="block text-xs text-dn-gris-oscuro">
                                  {cart.NombreCliente}
                                </strong>
                                <span className="mt-1 block text-xs text-dn-gris/80">
                                  {cart.CorreoCliente}
                                </span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs text-dn-gris">
                                {formatLastActivity(cart.FechaUltimaActividad)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {cart.TotalUnidades}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-right text-xs font-semibold">
                                {formatPrice(cart.ValorEstimadoCarrito)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4 border-dn-gris/20 bg-white">
              <CardHeader>
                <CardTitle>Ventas por categoría</CardTitle>
                <CardDescription>
                  Resumen del periodo seleccionado; se excluyen pedidos
                  cancelados y se descuentan devoluciones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Pedidos</TableHead>
                        <TableHead className="text-right">
                          Unidades netas
                        </TableHead>
                        <TableHead className="text-right">
                          Participación
                        </TableHead>
                        <TableHead className="text-right">Venta neta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.ventasCategoria.map((row) => (
                        <TableRow key={row.IDCategoria}>
                          <TableCell className="font-medium">
                            {row.Categoria}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.CantidadPedidos}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.UnidadesNetasVendidas}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.PorcentajeParticipacion}%
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(row.MontoNetoVendido)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.ventasCategoria.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-dn-gris"
                          >
                            Sin ventas para este periodo.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )
      )}
    </section>
  );
}

function formatLastActivity(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
