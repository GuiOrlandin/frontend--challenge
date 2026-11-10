import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router'

import { ErrorState } from '@/shared/components/ErrorState'
import { PageContainer } from '@/shared/components/PageContainer'
import { isApiError } from '@/shared/contracts'

/** `errorComponent` padrão das rotas (SPEC §11.5). */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryBoundary = useQueryErrorResetBoundary()

  return (
    <PageContainer className="py-10">
      <ErrorState
        description={isApiError(error) ? error.message : undefined}
        onRetry={() => {
          queryBoundary.reset()
          reset()
          void router.invalidate()
        }}
      />
    </PageContainer>
  )
}
