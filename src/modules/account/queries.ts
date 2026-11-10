import { queryOptions } from '@tanstack/react-query'

import { getProfile } from './api'

export const accountQueries = {
  profile: (userId: string) =>
    queryOptions({
      queryKey: ['profile', userId],
      queryFn: ({ signal }) => getProfile(signal),
      staleTime: Infinity,
    }),
}
