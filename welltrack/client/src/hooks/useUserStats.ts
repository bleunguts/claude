import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import type { UserStats } from "../types/api";

export interface UseUserStatsResult {
  data: UserStats | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useUserStats(): UseUserStatsResult {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<UserStats>("/stats"),
    enabled: !!user,
  });

  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
