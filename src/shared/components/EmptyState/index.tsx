import { cn } from '@/shared/lib/utils'

import type { EmptyStateProps } from './types'

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg bg-card px-6 py-10 text-center',
        className,
      )}
    >
      <p className="text-base font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}
