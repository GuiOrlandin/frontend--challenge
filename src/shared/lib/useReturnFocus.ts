import { useRef } from 'react'

type AutoFocusHandler = (event: Event) => void

/**
 * Devolve o foco a quem estava focado ao abrir. O Radix só devolve ao `Trigger`, e os nossos
 * Dialog/Sheet abrem pela URL (`?auth=`, `#filtros`), sem `Trigger` (SPEC §13.5).
 */
export function useReturnFocus(
  onOpenAutoFocus?: AutoFocusHandler,
  onCloseAutoFocus?: AutoFocusHandler,
) {
  const previous = useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: (event: Event) => {
      previous.current = document.activeElement as HTMLElement | null
      onOpenAutoFocus?.(event)
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event)
      if (event.defaultPrevented || !previous.current?.isConnected) return
      event.preventDefault()
      previous.current.focus()
    },
  }
}
