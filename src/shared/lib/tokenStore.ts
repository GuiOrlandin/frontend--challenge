/**
 * Tokens persistidos em localStorage (SPEC §6): o da sessão do Colecionador e o do
 * carrinho do Visitante. Lido pelo interceptor do Axios; quem grava é o módulo dono do fluxo.
 */
const KEYS = {
  session: 'kurio-token',
  cart: 'kurio-cart-token',
} as const

type TokenKind = keyof typeof KEYS

function read(kind: TokenKind): string | null {
  try {
    return localStorage.getItem(KEYS[kind])
  } catch {
    return null
  }
}

function write(kind: TokenKind, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(KEYS[kind])
    else localStorage.setItem(KEYS[kind], value)
  } catch {
    // Storage indisponível (modo privado, cota): segue sem persistir.
  }
}

export const tokenStore = {
  /** Chave usada no listener de `storage` entre abas. */
  sessionKey: KEYS.session,
  getSessionToken: () => read('session'),
  setSessionToken: (token: string) => write('session', token),
  clearSessionToken: () => write('session', null),
  getCartToken: () => read('cart'),
  setCartToken: (token: string) => write('cart', token),
  clearCartToken: () => write('cart', null),
}
