import { Link, useNavigate, useRouterState } from '@tanstack/react-router'

import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

import { LoginForm } from '../LoginForm'
import { RegisterForm } from '../RegisterForm'
import { SocialLogin } from '../SocialLogin'

const tabClass = (active: boolean) =>
  cn('transition-colors hover:text-primary', active ? 'text-primary' : 'text-foreground')

/**
 * Login e cadastro por `?auth=` (SPEC §4.3): `Dialog` de 500px a partir de `lg`, tela cheia abaixo.
 * Fechar tira `auth` e `redirect` e mantém a página.
 */
export function AuthDialog() {
  // Fica no `InnerWrap`, fora dos matches: `useSearch({ from })` não alcança a raiz daqui.
  const auth = useRouterState({ select: (state) => state.location.search.auth })
  const navigate = useNavigate()
  const isLogin = auth !== 'cadastro'
  const title = isLogin ? 'Entrar' : 'Criar conta'

  return (
    <Dialog
      open={auth !== undefined}
      onOpenChange={(open) => {
        if (!open) {
          void navigate({
            to: '.',
            search: (prev) => ({ ...prev, auth: undefined, redirect: undefined }),
          })
        }
      }}
    >
      <DialogContent
        className={cn(
          'inset-0 top-0 left-0 flex h-dvh max-w-none translate-x-0 translate-y-0 flex-col gap-8 overflow-y-auto rounded-none border-0 bg-background px-7 py-16 sm:max-w-none',
          'lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-auto lg:min-h-[600px] lg:overflow-x-hidden lg:max-h-[calc(100dvh-2rem)] lg:justify-center lg:w-[500px] lg:max-w-[500px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:gap-6 lg:border-b-[10px] lg:border-b-primary lg:bg-card lg:px-14 lg:py-10',
        )}
      >
        <header className="grid gap-4 text-center">
          <p aria-hidden="true" className="text-2xl font-bold tracking-widest lg:hidden">
            KURIO
          </p>
          <DialogTitle className="mt-10 text-base font-bold lg:sr-only">{title}</DialogTitle>
          {/* Abas do desktop: mesmo destino do link "Crie uma conta" do mobile. */}
          <nav
            aria-label="Acesso"
            className="hidden items-center justify-center gap-2 text-xl lg:flex"
          >
            <Link
              to="."
              search={(prev) => ({ ...prev, auth: 'entrar' as const })}
              className={tabClass(isLogin)}
              aria-current={isLogin ? 'page' : undefined}
            >
              Entrar
            </Link>
            <span aria-hidden="true" className="h-5 w-px bg-primary" />
            <Link
              to="."
              search={(prev) => ({ ...prev, auth: 'cadastro' as const })}
              className={tabClass(!isLogin)}
              aria-current={isLogin ? undefined : 'page'}
            >
              Criar conta
            </Link>
          </nav>
          <DialogDescription className="text-[13px] max-lg:sr-only">
            {isLogin
              ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
              : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
          </DialogDescription>
        </header>

        {isLogin ? <LoginForm /> : <RegisterForm />}
        <SocialLogin />

        <p className="text-center text-xs lg:hidden">
          {isLogin ? 'Novo na Kurio? ' : 'Já tem conta? '}
          <Link
            to="."
            search={(prev) => ({
              ...prev,
              auth: isLogin ? ('cadastro' as const) : ('entrar' as const),
            })}
            className="text-primary hover:underline"
          >
            {isLogin ? 'Crie uma conta' : 'Entre'}
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
