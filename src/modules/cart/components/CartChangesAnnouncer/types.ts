import type { CartLine } from '@/shared/contracts'

export interface CartChangesAnnouncerProps {
  lines: CartLine[]
  onHighlight: (lineIds: string[]) => void
}
