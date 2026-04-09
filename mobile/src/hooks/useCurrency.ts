import { useQuery } from "@tanstack/react-query";
import { getBuilding } from "../api/admin";

/**
 * Returns the building's configured currency code.
 * Caches aggressively since currency rarely changes.
 */
export function useCurrency(): string {
  const { data } = useQuery({
    queryKey: ["admin-building"],
    queryFn: getBuilding,
    staleTime: 1000 * 60 * 30,
    select: (b) => b.currency,
  });
  return data || "TRY";
}
