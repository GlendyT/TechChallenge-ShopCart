import { useQuery } from "@tanstack/react-query";
import { fetchReports, reportsQueryKey } from "../api/reportsApi";
import type { ReportFilters } from "../types/reportTypes";

export function useReports(filters: ReportFilters) {
  return useQuery({ queryKey: [...reportsQueryKey, filters], queryFn: () => fetchReports(filters), placeholderData: (previous) => previous });
}
