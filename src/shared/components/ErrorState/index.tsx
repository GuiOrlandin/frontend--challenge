import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

import type { ErrorStateProps } from './types'

export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg bg-card px-6 py-10 text-center',
        className,
      )}
    >
      <p className="text-base font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}
