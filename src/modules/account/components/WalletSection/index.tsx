import { useId, useState } from 'react'

import { EmptyState } from '@/shared/components/EmptyState'
import { Button } from '@/shared/ui/button'

import { WalletForm } from '../WalletForm'
import type { WalletSectionProps } from './types'

/** Uma seção por papel: "Adicionar" enquanto a Carteira não existe; depois, o formulário de edição (SPEC §9). */
export function WalletSection({ title, ...formProps }: WalletSectionProps) {
  const titleId = useId()
  const [adding, setAdding] = useState(false)
  const { wallet } = formProps

  return (
    <section aria-labelledby={titleId} className="grid gap-6">
      <h2 id={titleId} className="font-bold">
        {title}
      </h2>
      {wallet || adding ? (
        <WalletForm key={wallet?.id ?? 'nova'} {...formProps} />
      ) : (
        <EmptyState
          title="Nenhuma carteira cadastrada"
          action={
            <Button variant="outline" onClick={() => setAdding(true)} className="h-10 px-7">
              Adicionar
            </Button>
          }
        />
      )}
    </section>
  )
}
