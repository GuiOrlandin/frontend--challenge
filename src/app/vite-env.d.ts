/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  /** `enabled` liga o MSW antes de montar o app. */
  readonly VITE_API_MOCKING?: 'enabled'
  /** Base da API REST. Padrão: `/api`. */
  readonly VITE_API_URL?: string
  /** Origem do Socket.IO. Padrão: `location.origin`. */
  readonly VITE_SOCKET_URL?: string
}
