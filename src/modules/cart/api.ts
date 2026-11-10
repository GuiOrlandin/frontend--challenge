import type { AxiosResponse } from 'axios'
import { toast } from 'sonner'

import type { Cart } from '@/shared/contracts'
import { http } from '@/shared/lib/http'
import { tokenStore } from '@/shared/lib/tokenStore'

import { adjustmentMessages } from './lines'

/** O servidor cria o carrinho do Visitante na primeira chamada e devolve o token no header. */
function keepCartToken({ data, headers }: AxiosResponse<Cart>): Cart {
  const token: unknown = headers['x-cart-token']
  if (typeof token === 'string' && token) tokenStore.setCartToken(token)
  return data
}

export const getCart = (signal?: AbortSignal) =>
  http.get<Cart>('/cart', { signal }).then(keepCartToken)

export const addCartItem = (item: { nftId: string; editionId: string; quantity: number }) =>
  http.post<Cart>('/cart/items', item).then(keepCartToken)

export const updateCartLine = (lineId: string, quantity: number) =>
  http.patch<Cart>(`/cart/items/${encodeURIComponent(lineId)}`, { quantity }).then(keepCartToken)

export const removeCartLine = (lineId: string) =>
  http.delete<Cart>(`/cart/items/${encodeURIComponent(lineId)}`).then(keepCartToken)

export const applyCoupon = (code: string) =>
  http.put<Cart>('/cart/coupon', { code }).then(keepCartToken)

export const removeCoupon = () => http.delete<Cart>('/cart/coupon').then(keepCartToken)

/**
 * Ao autenticar, junta o carrinho de Visitante ao da conta, esquece o `cartToken` e avisa das
 * linhas cortadas pelo teto (SPEC §6, §7).
 */
export async function mergeGuestCart(): Promise<void> {
  const cartToken = tokenStore.getCartToken()
  if (!cartToken) return
  const { data } = await http.post<Cart>('/cart/merge', { cartToken })
  tokenStore.clearCartToken()
  for (const message of adjustmentMessages(data)) toast(message)
}
