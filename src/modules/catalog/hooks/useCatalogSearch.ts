import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'

import type { CatalogSearch } from '@/shared/contracts'

/**
 * Search da `/` e a navegação que a altera. Qualquer mudança volta para a página 1
 * (SPEC §4.2); a rolagem fica onde está.
 */
export function useCatalogSearch() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })

  const update = useCallback(
    (patch: Partial<CatalogSearch>, { replace = false } = {}) =>
      navigate({
        search: (prev) => ({ ...prev, page: 1, ...patch }),
        replace,
        resetScroll: false,
      }),
    [navigate],
  )

  return { search, update }
}
