'use client';

/**
 * @module components/providers/query-provider
 *
 * TanStack Query provider for client-side refetching, mutations, optimistic
 * updates, and cache invalidation (design.md D1). A fresh `QueryClient` is
 * created per component instance (via `useState`) rather than at module
 * scope, so server-rendered requests never share cache across users.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * Default query options: short `staleTime` since dashboard data changes via
 * background scrapers/LLM matching, and mutations invalidate explicitly.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Provides a `QueryClient` to the dashboard's client component tree.
 *
 * @param props - Provider props.
 * @param props.children - Nested content.
 * @returns The provider element.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
