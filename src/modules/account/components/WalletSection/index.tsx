import { useId, useState } from 'react'

import { WalletForm } from '../WalletForm'
import type { WalletSectionProps } from './types'

/** Uma seção por papel: "Adicionar" enquanto a Carteira não existe; depois, o formulário de edição (SPEC §9). */
export function WalletSection({ title, description, ...formProps }: WalletSectionProps) {
  const titleId = useId()
  const [adding, setAdding] = useState(false)
  const { wallet } = formProps

  return (
    <section aria-labelledby={titleId} className="grid gap-6">
      {/* Frame: título (e descrição) à esquerda, "Adicionar" em texto à direita. */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 id={titleId} className="font-bold lg:text-17">
            {title}
          </h2>
          {description && <p className="text-sm text-option">{description}</p>}
          {!wallet && !adding && (
            <p className="text-sm text-option">
              Você ainda não adicionou uma {title.toLowerCase()}.
            </p>
          )}
        </div>
        {!wallet && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="shrink-0 text-base text-primary hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Adicionar
          </button>
        )}
      </div>
      {(wallet || adding) && <WalletForm key={wallet?.id ?? 'nova'} {...formProps} />}
    </section>
  )
}
