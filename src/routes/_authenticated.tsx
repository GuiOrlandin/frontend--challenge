import { createFileRoute, redirect } from '@tanstack/react-router'

/** Guard das rotas do Colecionador (SPEC §4.3). Não é fronteira de autorização: a API recusa sozinha. */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.session) {
      throw redirect({ to: '/', search: { auth: 'entrar', redirect: location.href } })
    }
  },
})
