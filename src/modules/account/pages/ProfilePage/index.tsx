import { useSuspenseQuery } from '@tanstack/react-query'

import { sessionQueries } from '@/modules/auth'

import { ProfileForm } from '../../components/ProfileForm'
import { ProfileShell } from '../../components/ProfileShell'
import { accountQueries } from '../../queries'

/** `/perfil`: o loader já trouxe o Perfil; a rota é privada, então há sessão. */
export function ProfilePage() {
  const { data: session } = useSuspenseQuery(sessionQueries.current())
  const userId = session!.user.id
  const { data: profile } = useSuspenseQuery(accountQueries.profile(userId))

  return (
    <ProfileShell>
      <ProfileForm userId={userId} profile={profile} />
    </ProfileShell>
  )
}
