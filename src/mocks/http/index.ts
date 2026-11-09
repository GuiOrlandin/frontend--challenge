import { authHandlers } from './auth'
import { catalogHandlers } from './catalog'
import { favoriteHandlers } from './favorites'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

/** Handlers REST por recurso. As tasks seguintes acrescentam carrinho e pedidos. */
export const httpHandlers = [
  ...catalogHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...favoriteHandlers,
]
