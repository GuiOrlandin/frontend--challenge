import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { favoriteHandlers } from './favorites'
import { profileHandlers } from './profile'
import { quoteHandlers } from './quotes'
import { walletHandlers } from './wallets'

/** Handlers REST por recurso. A task seguinte acrescenta conexão e pedidos. */
export const httpHandlers = [
  ...catalogHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
]
