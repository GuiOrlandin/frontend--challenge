import { http } from '@/shared/lib/http'
import { tokenStore } from '@/shared/lib/tokenStore'

/**
 * Ao autenticar, junta o carrinho de Visitante ao da conta e esquece o `cartToken` (SPEC §6, §7).
 * shortcut: os `adjustments` da resposta são ignorados; o aviso entra na task do carrinho (33).
 */
export async function mergeGuestCart(): Promise<void> {
  const cartToken = tokenStore.getCartToken()
  if (!cartToken) return
  await http.post('/cart/merge', { cartToken })
  tokenStore.clearCartToken()
}
