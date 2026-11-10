import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // Antes do React (SPEC §4.1).
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    // Ícones como componente (`?react`), decorativos por padrão.
    svgr({ svgrOptions: { svgProps: { 'aria-hidden': 'true', focusable: 'false' } } }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    alias: {
      // Bundle de browser: usa o `WebSocket` global, que o MSW intercepta (o de Node usa `ws`).
      'socket.io-client': fileURLToPath(
        new URL('./node_modules/socket.io-client/dist/socket.io.esm.min.js', import.meta.url),
      ),
    },
  },
})
