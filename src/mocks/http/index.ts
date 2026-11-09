import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { checkoutHandlers } from './checkout'
import { favoriteHandlers } from './favorites'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { quoteHandlers } from './quotes'
import { walletHandlers } from './wallets'

/** Handlers REST por recurso. */
export const httpHandlers = [
  ...catalogHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...checkoutHandlers,
  ...orderHandlers,
]
