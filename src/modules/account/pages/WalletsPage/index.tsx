import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'

import { sessionQueries } from '@/modules/auth'
import type { WalletInput } from '@/shared/contracts'

import { ProfileShell } from '../../components/ProfileShell'
import { WalletSection } from '../../components/WalletSection'
import { accountQueries } from '../../queries'

/** `/perfil/carteiras`: no máximo uma principal e uma secundária (SPEC §9). */
export function WalletsPage() {
  const { data: session } = useSuspenseQuery(sessionQueries.current())
  const userId = session!.user.id
  const { data: profile } = useSuspenseQuery(accountQueries.profile(userId))
  const { data: wallets } = useSuspenseQuery(accountQueries.wallets(userId))
  const { redirect } = useSearch({ strict: false })
  const navigate = useNavigate()

  const primary = wallets.find((wallet) => wallet.role === 'primary')
  const secondary = wallets.find((wallet) => wallet.role === 'secondary')
  // Carteira nova já vem com os dados do Perfil; "Nome do perfil" começa pelo nome de exibição.
  const defaults: Partial<WalletInput> = {
    displayName: profile.displayName,
    profileName: profile.displayName,
    email: profile.email,
    ensName: profile.ensName,
  }

  function onSaved(created: boolean) {
    toast(created ? 'Carteira adicionada' : 'Carteira salva')
    // Veio do pagamento sem Carteira: volta para lá assim que cadastrar.
    if (created && redirect) void navigate({ href: redirect })
  }

  return (
    <ProfileShell>
      <div className="grid gap-10">
        <h1 className="font-bold">Carteiras</h1>
        <WalletSection
          title="Carteira principal"
          role="primary"
          userId={userId}
          wallet={primary}
          defaults={{ ...defaults, label: profile.alias }}
          onSaved={onSaved}
        />
        <WalletSection
          title="Carteira secundária"
          role="secondary"
          userId={userId}
          wallet={secondary}
          defaults={defaults}
          primary={primary}
          onSaved={onSaved}
        />
      </div>
    </ProfileShell>
  )
}
