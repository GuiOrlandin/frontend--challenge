import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Camadas do monolito modular.
 * - app: bootstrap, providers e layout global; compõe os módulos.
 * - routes: arquivos de rota finos; importam o index.ts dos módulos e shared (schemas de search).
 * - module: um por pasta em src/modules; os outros só enxergam o index.ts.
 * - shared: visual e utilitários sem domínio; nunca importa módulos nem app.
 * - mocks: MSW; carregado só pelo bootstrap do app.
 */
const elements = [
  { type: 'app', pattern: 'src/app' },
  { type: 'routes', pattern: 'src/routes' },
  { type: 'module', pattern: 'src/modules/*', capture: ['name'] },
  { type: 'shared', pattern: 'src/shared' },
  { type: 'mocks', pattern: 'src/mocks' },
]

/** Qualquer arquivo de outro módulo, desde que seja o index.ts público. */
const modulePublicApi = { to: { element: { type: 'module', fileInternalPath: 'index.ts' } } }

export default defineConfig([
  globalIgnores(['dist', 'src/routeTree.gen.ts', 'public/mockServiceWorker.js']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': elements,
      'boundaries/include': ['src/**/*'],
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: [{ to: { element: { types: ['app', 'shared'] } } }, modulePublicApi],
            },
            {
              // Só o bootstrap carrega os mocks (import dinâmico quando VITE_API_MOCKING=enabled).
              from: { element: { type: 'app', fileInternalPath: 'main.tsx' } },
              allow: { to: { element: { type: 'mocks' } } },
            },
            {
              from: { element: { type: 'routes' } },
              allow: [{ to: { element: { types: ['routes', 'shared'] } } }, modulePublicApi],
            },
            {
              from: { element: { type: 'module' } },
              allow: [
                {
                  to: {
                    element: {
                      type: 'module',
                      captured: { name: '{{ from.element.captured.name }}' },
                    },
                  },
                },
                modulePublicApi,
                { to: { element: { type: 'shared' } } },
              ],
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'mocks' } },
              allow: { to: { element: { types: ['mocks', 'shared'] } } },
            },
          ],
        },
      ],
      'boundaries/no-unknown-files': 'error',
    },
  },
  {
    files: ['*.{js,ts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    // Componentes shadcn exportam as variantes (`buttonVariants`) junto do componente.
    files: ['src/shared/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettier,
])
