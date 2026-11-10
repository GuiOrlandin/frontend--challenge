import { Link } from '@tanstack/react-router'

import { EmptyState } from '@/shared/components/EmptyState'
import { PageContainer } from '@/shared/components/PageContainer'
import { Button } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <PageContainer className="py-10">
      <h1 className="sr-only">Página não encontrada</h1>
      <EmptyState
        title="Erro 404"
        description="O endereço não existe ou foi removido."
        action={
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        }
      />
    </PageContainer>
  )
}
