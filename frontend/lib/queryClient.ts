"use client";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 s
      gcTime: 5 * 60_000,      // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
