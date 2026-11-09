import { cn } from '@/shared/lib/utils'

import type { PageContainerProps } from './types'

/** Container de página: até ~1120 px, centralizado, 16 px de margem no mobile. */
export function PageContainer({ className, ...props }: PageContainerProps) {
  return <div className={cn('mx-auto w-full max-w-280 px-4', className)} {...props} />
}
