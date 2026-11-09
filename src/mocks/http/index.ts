import { catalogHandlers } from './catalog'

/** Handlers REST por recurso. As tasks seguintes acrescentam auth, perfil, carrinho e pedidos. */
export const httpHandlers = [...catalogHandlers]
