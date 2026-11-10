import { useEffect, useRef, useState } from 'react'

import { useRealtimeEvent } from '@/shared/lib/realtime'

import { describeNftChanges } from '../../lines'

import type { CartChangesAnnouncerProps } from './types'

const HIGHLIGHT_MS = 8_000

/**
 * Anuncia `nft.updated` que muda uma linha aberta (SPEC §7). Roda antes do refetch que o
 * aplicador dispara, então `lines` ainda são os valores antigos. Anúncio e destaque somem
 * depois de alguns segundos, para o próximo evento igual ser anunciado de novo.
 */
export function CartChangesAnnouncer({ lines, onHighlight }: CartChangesAnnouncerProps) {
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  useRealtimeEvent('nft.updated', (event) => {
    const changes = describeNftChanges(lines, event.data)
    if (changes.messages.length === 0) return
    setMessage(changes.messages.join('. '))
    onHighlight(changes.lineIds)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setMessage('')
      onHighlight([])
    }, HIGHLIGHT_MS)
  })

  // A região fica sempre no DOM: uma região que nasce junto com o texto pode não ser lida.
  return (
    <p role="status" aria-live="polite" className="text-sm text-primary empty:sr-only">
      {message}
    </p>
  )
}
