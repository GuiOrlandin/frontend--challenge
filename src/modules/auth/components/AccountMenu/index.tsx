import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { DropdownMenu } from 'radix-ui'

import ChevronDownIcon from '@/assets/icons/chevron-down.svg?react'
import LogInIcon from '@/assets/icons/log-in.svg?react'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { useLogout } from '../../hooks/useLogout'
import { sessionQueries } from '../../queries'

const itemClass =
  'block cursor-pointer rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-primary'

/** Slot de conta do header: skeleton no boot, "Entrar" para Visitante, menu do Colecionador. */
export function AccountMenu() {
  const session = useQuery(sessionQueries.current())
  const logout = useLogout()

  // Skeleton no boot, sem flash de "Entrar" (SPEC §6).
  if (session.isPending) return <Skeleton className="h-8 w-20" />
  if (!session.data) {
    return (
      <Button asChild size="sm" className="text-base">
        <Link to="." search={(prev) => ({ ...prev, auth: 'entrar' as const })}>
          <LogInIcon className="size-4" />
          Entrar
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-base"
          aria-label={`Conta de ${session.data.user.displayName}`}
        >
          {session.data.user.displayName}
          <ChevronDownIcon className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <DropdownMenu.Item asChild className={itemClass}>
            <Link to="/perfil">Dados do perfil</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link to="/perfil/carteiras">Carteiras</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            className={itemClass}
            onSelect={() => void logout({ switchUser: true })}
          >
            Trocar de usuário
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={() => void logout()}>
            Sair
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
