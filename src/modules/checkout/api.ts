import type {
  BuyerInput,
  CheckoutConnection,
  Network,
  Order,
  Quote,
  WalletProvider,
} from '@/shared/contracts'
import { http } from '@/shared/lib/http'

export async function createQuote(network: Network, signal?: AbortSignal): Promise<Quote> {
  const { data } = await http.post<Quote>('/quotes', { network }, { signal })
  return data
}

export async function connectWallet(
  input: { walletId: string; provider: WalletProvider },
  signal?: AbortSignal,
): Promise<CheckoutConnection> {
  const { data } = await http.post<CheckoutConnection>('/checkout/connection', input, { signal })
  return data
}

export interface OrderInput {
  quoteId: string
  walletId: string
  connectionId: string
  buyer: BuyerInput
}

/** Mesma `key` em todo reenvio da mesma Cotação (SPEC §8.4). */
export async function createOrder(input: OrderInput, key: string): Promise<Order> {
  const { data } = await http.post<Order>('/orders', input, {
    headers: { 'Idempotency-Key': key },
  })
  return data
}
