import { queryOptions } from '@tanstack/react-query'

import type { Network, WalletProvider } from '@/shared/contracts'

import { connectWallet, createQuote } from './api'

/**
 * Cotação e Conexão da revisão (SPEC §8.1). São `POST` com efeito: sem retry, sem refetch no
 * foco (`staleTime: Infinity`) e `gcTime: 0`, para cada entrada na revisão cotar e conectar de
 * novo. A key da Cotação usa a Rede porque o `quoteId` só existe depois da resposta.
 */
export const checkoutQueries = {
  quote: (userId: string, network: Network) =>
    queryOptions({
      queryKey: ['quote', userId, 'review', network],
      queryFn: ({ signal }) => createQuote(network, signal),
      staleTime: Infinity,
      gcTime: 0,
      retry: false,
    }),
  connection: (userId: string, walletId: string, provider: WalletProvider) =>
    queryOptions({
      queryKey: ['checkout-connection', userId, walletId, provider],
      queryFn: ({ signal }) => connectWallet({ walletId, provider }, signal),
      staleTime: Infinity,
      gcTime: 0,
      retry: false,
    }),
}
