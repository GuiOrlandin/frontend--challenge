import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import HeartFilledIcon from '@/assets/icons/heart-filled.svg?react'
import HeartIcon from '@/assets/icons/heart.svg?react'
import { sessionQueries } from '@/modules/auth'
import type { FavoriteIds } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'

import { setFavorite } from '../../api'
import { favoritesQueries } from '../../queries'

import type { FavoriteButtonProps } from './types'

/**
 * Favoritar com otimismo (SPEC §11.3): grava na hora, desfaz e avisa se a API falhar. O
 * Visitante é levado ao login.
 */
export function FavoriteButton({ nftId, className, showLabel = false }: FavoriteButtonProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const session = useQuery(sessionQueries.current())
  const userId = session.data?.user.id
  const favoritesQuery = favoritesQueries.ids(userId ?? '')
  const { queryKey } = favoritesQuery
  const favorites = useQuery({ ...favoritesQuery, enabled: !!userId })
  const favorite = favorites.data?.nftIds.includes(nftId) ?? false

  const mutation = useMutation({
    mutationFn: (next: boolean) => setFavorite(nftId, next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<FavoriteIds>(queryKey)
      const ids = (previous?.nftIds ?? []).filter((id) => id !== nftId)
      queryClient.setQueryData<FavoriteIds>(queryKey, { nftIds: next ? [...ids, nftId] : ids })
      return { previous }
    },
    onError: (_error, next, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error(
        next
          ? 'Não foi possível favoritar. Tente novamente.'
          : 'Não foi possível remover dos favoritos. Tente novamente.',
      )
    },
    onSuccess: (_data, next) => toast(next ? 'Adicionado aos favoritos' : 'Removido dos favoritos'),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  function onClick() {
    if (!userId) {
      toast('Entre para favoritar')
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, auth: 'entrar' as const }),
        resetScroll: false,
      })
      return
    }
    mutation.mutate(!favorite)
  }

  const Icon = favorite ? HeartFilledIcon : HeartIcon
  return (
    <button
      type="button"
      aria-label="Favoritar"
      aria-pressed={favorite}
      aria-busy={mutation.isPending}
      // Enquanto a lista não chega, o estado mostrado ainda não é o real.
      disabled={!!userId && favorites.isPending}
      onClick={onClick}
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-background/80 text-primary transition-colors hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
      {showLabel && <span aria-hidden>Favoritar</span>}
    </button>
  )
}
