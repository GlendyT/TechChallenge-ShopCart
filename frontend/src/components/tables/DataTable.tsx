import type { Key, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export interface DataTableColumn<TData> {
  id: string;
  header: ReactNode;
  cell: (row: TData) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<TData> {
  ariaLabel: string;
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowId: (row: TData) => Key;
  containerClassName?: string;
}

export function DataTable<TData>({
  ariaLabel,
  columns,
  data,
  getRowId,
  containerClassName,
}: DataTableProps<TData>) {
  return (
    <Table aria-label={ariaLabel} containerClassName={containerClassName}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.id} className={column.headerClassName}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={getRowId(row)}>
            {columns.map((column) => (
              <TableCell key={column.id} className={column.cellClassName}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
