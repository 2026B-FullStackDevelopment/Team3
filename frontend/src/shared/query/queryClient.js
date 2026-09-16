import { QueryClient } from '@tanstack/react-query'

export function shouldRetryQuery(failureCount, error) {
  if (failureCount >= 1) return false

  const status = Number(error?.status ?? 0)
  return status === 0 || status >= 500
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createAppQueryClient()
