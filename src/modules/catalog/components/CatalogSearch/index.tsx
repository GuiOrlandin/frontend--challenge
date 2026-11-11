import { useEffect, useState } from 'react'

import SearchIcon from '@/assets/icons/search-bold.svg?react'
import { Input } from '@/shared/ui/input'

import type { CatalogSearchProps } from './types'

const DEBOUNCE_MS = 300

/** Busca com debounce (SPEC §11.4). */
export function CatalogSearch({ q, onSearch }: CatalogSearchProps) {
  const [draft, setDraft] = useState(q)
  // Último `q` sincronizado (vindo da URL ou enviado daqui). Só um `q` diferente vindo de fora
  // (ex.: busca do header) sobrescreve o que está sendo digitado.
  const [lastSyncedQ, setLastSyncedQ] = useState(q)
  if (q !== lastSyncedQ) {
    setLastSyncedQ(q)
    setDraft(q)
  }

  useEffect(() => {
    if (draft === lastSyncedQ) return
    const timer = setTimeout(() => {
      setLastSyncedQ(draft)
      onSearch(draft)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, lastSyncedQ, onSearch])

  return (
    <div role="search" className="relative flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#B39463]" />
      {/* Texto digitado fica em 16 px: abaixo disso o iOS dá zoom no foco. Placeholder no Body/14 Bold do Figma. */}
      <Input
        type="search"
        aria-label="Buscar no catálogo"
        placeholder="Explorar coleções"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-[45px] rounded-[10px] border-none bg-card pl-[42px] placeholder:text-sm placeholder:font-bold placeholder:text-[#B39463]"
      />
    </div>
  )
}
