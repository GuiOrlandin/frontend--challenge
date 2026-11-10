# Arquitetura

Como o Kurio é construído, os contratos entre as partes e as decisões tomadas. Setup, comandos e cenários estão no [`README.md`](README.md); o enunciado, em [`docs/CHALLENGE.md`](docs/CHALLENGE.md).

## Sumário

1. [Visão geral e camadas](#visão-geral-e-camadas)
2. [Módulos e regras de dependência](#módulos-e-regras-de-dependência)
3. [Contratos REST](#contratos-rest)
4. [Eventos Socket.IO](#eventos-socketio)
5. [Política de sessão](#política-de-sessão)
6. [Carrinho e cotação](#carrinho-e-cotação)
7. [Pedido: estados, idempotência e recuperação](#pedido-estados-idempotência-e-recuperação)
8. [Estratégia de cache](#estratégia-de-cache)
9. [Reconciliação REST × Socket.IO](#reconciliação-rest--socketio)
10. [Mocks](#mocks)
11. [Acessibilidade](#acessibilidade)
12. [Decisões de UX, desvios do Figma e limitações](#decisões-de-ux-desvios-do-figma-e-limitações)
13. [Performance](#performance)

---

## Visão geral e camadas

Monolito modular em Vite + React. Rotas com TanStack Router (file-based, code splitting por rota), estado remoto com TanStack Query, HTTP com Axios, validação com Zod 4. A API simulada vive inteira no MSW, na camada de rede: o app não sabe que está falando com um mock.

```
                ┌──────────────────────────────────────────┐
  main.tsx ───▶ │ app       bootstrap, providers, router,  │
 (liga o MSW    │           query client, realtime, layout │
  se habilitado)└──────────────┬───────────────────────────┘
                               │ compõe
  routes ──────────────────────┤  arquivos finos: search, guard, loader, page
                               ▼
                ┌──────────────────────────────────────────┐
                │ modules   catalog · nft · cart ·         │
                │           checkout · auth · account      │
                └──────────────┬───────────────────────────┘
                               ▼
                ┌──────────────────────────────────────────┐
                │ shared    ui (shadcn) · components ·     │
                │           contracts (Zod) · lib (http,   │
                │           eth, realtime, tokenStore)     │
                └──────────────┬───────────────────────────┘
                               │ Axios / socket.io-client
                               ▼
                ┌──────────────────────────────────────────┐
                │ rede      MSW: handlers REST + ws.link   │
                │ (mocks)   (Socket.IO) sobre o mesmo db   │
                └──────────────────────────────────────────┘
```

```
src/
  app/        bootstrap (main.tsx, App.tsx), queryClient, router, layout/, realtime/
  routes/     rotas file-based (__root, index, nft.$nftId, carrinho, _authenticated/…)
  modules/    catalog, nft, cart, checkout, auth, account
  shared/     ui/, components/, contracts/, lib/
  mocks/      browser, db, fixtures/, http/, ws, scenarios, network, rules/, control
  assets/     artes otimizadas, ícones e logos
```

**Bootstrap** (`src/app/main.tsx`): com `VITE_API_MOCKING=enabled`, importa `@/mocks/browser`, inicia o worker e aplica `?scenario=`/`?reset=`. Só depois faz `import('./App')`: o `engine.io-client` captura o `WebSocket` global ao carregar, e um import estático pegaria o nativo antes de o MSW trocá-lo. Sem a variável, o MSW nunca é carregado e o app chama `VITE_API_URL`.

## Módulos e regras de dependência

| Módulo | API pública (`index.ts`) | Responsabilidade |
| --- | --- | --- |
| `catalog` | `HomePage`, `catalogQueries` | Início: hero, destaque, grade, busca, filtros, ordenação, paginação |
| `nft` | `NftDetailPage`, `FavoriteButton`, `nftQueries`, `favoritesQueries`, `applyNftUpdated` | Detalhe, galeria, edições, favoritos, aplicação do `nft.updated` |
| `cart` | `CartPage`, `CartBadge`, `AddToCartButton`, `cartQueries`, `mergeGuestCart` | Carrinho, cupom, resumo, anúncio de mudanças em tempo real |
| `checkout` | `CheckoutPage`, `OrderPage`, `checkoutQueries`, `applyOrderUpdated` | Pagamento, cotação, conexão de carteira, pedido e recibo |
| `auth` | `AuthDialog`, `AccountMenu`, `useSessionSync`, `useLogout`, `sessionQueries` | Login, cadastro, sessão, logout, troca de usuário |
| `account` | `ProfilePage`, `WalletsPage`, `accountQueries` | Perfil, avatar, senha e carteiras |

Cada módulo segue a mesma forma: `api.ts` (funções Axios), `queries.ts` (`queryOptions` e keys), `hooks/`, `pages/`, `components/` privados e, em `nft` e `checkout`, `realtime.ts` com o aplicador de eventos.

Regras, reforçadas pelo `eslint-plugin-boundaries` em `eslint.config.js` (vale para alias e import relativo):

- Um módulo só é importado pelo seu `index.ts`. O interior é privado.
- `shared` não importa `modules` nem `app`. `modules` importam `shared` e o `index.ts` de outros módulos. `app` compõe módulos.
- `routes` importam só o `index.ts` dos módulos, `shared` e outras rotas.
- `mocks` só é importado pelo bootstrap. Componentes, hooks e o cliente Axios não contêm respostas fictícias nem caminhos alternativos.
- Componente visual usado em mais de uma tela vai para `shared/components`, só com props. Quem busca ou altera dados fica no módulo dono e entra por props ou slot (ex.: `NftCard` recebe `AddToCartButton` e `FavoriteButton` no slot `actions`).

Há ciclos entre `index.ts` de módulos (`catalog` ↔ `nft`, `cart` ↔ `auth`, `cart` ↔ `catalog`), inofensivos porque os símbolos só são usados em render.

## Contratos REST

**Fonte dos tipos**: [`src/shared/contracts`](src/shared/contracts) (`entities.ts`, `catalog.ts`, `errors.ts`, `realtime.ts`, `schemas.ts`, `search.ts`). Cliente e mock usam os mesmos tipos e os mesmos schemas Zod, então uma regra de validação vale igual nos dois lados.

### Convenções

- Prefixo `/api`, sem versão. JSON em camelCase. Datas ISO 8601 UTC.
- Ids opacos em string (`nft_042`, `ed_042_a`, `ord_0001`, `wal_ana_1`), separados do `tokenId` exibido.
- **ETH sempre como string decimal** (`"1.19"`); quantidade como inteiro. O cliente não calcula subtotal, desconto, taxa nem total: vêm do carrinho ou da cotação. `shared/lib/eth.ts` faz aritmética com `BigInt` (18 casas) só para preço × quantidade no detalhe e para comparar preços nos anúncios; a formatação usa `Intl.NumberFormat('pt-BR')` sobre a string, sem passar por `Number`.
- `version` inteiro crescente nos agregados `Nft` (cobre as edições), `Cart` e `Order`.
- Headers: `Authorization: Bearer <token>` (Colecionador), `X-Cart-Token` (Visitante), `Idempotency-Key` (`POST /orders`).

### Endpoints

| Recurso | Método e caminho | Entrada | Saída |
| --- | --- | --- | --- |
| Catálogo | `GET /api/nfts` | `q, category[], network[], priceMin, priceMax, tab, sort, page, pageSize, collection` | `Page<Nft>` |
| | `GET /api/nfts/:id` | — | `Nft` (404 `NOT_FOUND`) |
| | `GET /api/nfts/facets` | os filtros da lista | `Facets` (cada grupo conta sob os outros filtros ativos) |
| | `GET /api/highlights` | — | `Highlights` |
| Favoritos | `GET /api/me/favorites` | — | `{ nftIds }` |
| | `PUT` / `DELETE /api/me/favorites/:nftId` | — | `{ nftIds }` (idempotentes) |
| Sessão | `POST /api/auth/register` | `{ username, displayName, email, password, confirmPassword }` | `{ token, session }` (201) |
| | `POST /api/auth/login` | `{ email, password }` | `{ token, session }` |
| | `POST /api/auth/logout` | — | 204 |
| | `GET /api/auth/session` | — | `Session` ou 401 |
| Perfil | `GET` / `PATCH /api/me/profile` | campos do perfil | `Profile` |
| | `PUT` / `DELETE /api/me/profile/avatar` | multipart `file` | `Profile` |
| | `PUT /api/me/password` | `{ currentPassword, newPassword, confirmPassword }` | 204 |
| Carteiras | `GET /api/me/wallets` | — | `Wallet[]` |
| | `POST /api/me/wallets` | carteira sem `id`/`version` | `Wallet` (201; 409 `WALLET_ROLE_TAKEN`) |
| | `PATCH /api/me/wallets/:id` | campos da carteira | `Wallet` |
| Carrinho | `GET /api/cart` | Bearer ou `X-Cart-Token` | `Cart` (cria o carrinho de Visitante e devolve o token em `X-Cart-Token`) |
| | `POST /api/cart/items` | `{ nftId, editionId, quantity }` | `Cart` |
| | `PATCH` / `DELETE /api/cart/items/:lineId` | `{ quantity }` | `Cart` |
| | `PUT` / `DELETE /api/cart/coupon` | `{ code }` | `Cart` (422 `COUPON_INVALID`/`COUPON_EXPIRED`) |
| | `POST /api/cart/merge` | `{ cartToken }` | `Cart` com `adjustments` |
| Cotação | `POST /api/quotes` | `{ network }` | `Quote` (409 `AVAILABILITY_CONFLICT`) |
| Conexão | `POST /api/checkout/connection` | `{ walletId, provider }` | `{ connectionId, walletId, provider, network }` (409 `WALLET_REJECTED`) |
| Pedido | `POST /api/orders` | `{ quoteId, walletId, connectionId, buyer }` + `Idempotency-Key` | `Order` (201 na criação, 200 no replay) |
| | `GET /api/orders/:id` | — | `Order` (404 se for de outro Colecionador) |

### Envelope de erro

```json
{ "error": { "code": "…", "message": "…", "fieldErrors": {}, "details": {}, "retryable": false } }
```

O interceptor do Axios (`shared/lib/http.ts`) normaliza tudo em `ApiError { status, code, message, fieldErrors, details, retryable }`. Timeout (10 s) e falha de rede viram `code: 'NETWORK_ERROR'`, `retryable: true`. A UI decide pelo `code`, nunca pelo texto.

| HTTP | `code` | Uso |
| --- | --- | --- |
| 422 | `VALIDATION_FAILED` | `fieldErrors` mapeados para os campos do formulário |
| 422 | `COUPON_INVALID`, `COUPON_EXPIRED` | erro no campo do cupom |
| 401 | `UNAUTHENTICATED`, `SESSION_EXPIRED` | sem sessão / sessão vencida |
| 403 | `FORBIDDEN` | recurso de outro usuário onde 404 não se aplica |
| 404 | `NOT_FOUND` | NFT, pedido, linha |
| 409 | `EMAIL_TAKEN`, `USERNAME_TAKEN` | cadastro e perfil |
| 409 | `WALLET_ROLE_TAKEN` | já existe carteira com aquele papel |
| 409 | `AVAILABILITY_CONFLICT` | carrinho: `details.available`; cotação: `details.lines[]` |
| 409 | `QUOTE_STALE` | `details.quote` traz a cotação nova |
| 409 | `IDEMPOTENCY_KEY_REUSED` | mesma chave, corpo diferente |
| 409 | `WALLET_REJECTED`, `WALLET_DISCONNECTED` | conexão de carteira |
| 503 | `TEMPORARILY_UNAVAILABLE` | `retryable: true`, header `Retry-After` |

## Eventos Socket.IO

### Envelope

```ts
interface RealtimeEvent<T extends 'nft.updated' | 'order.updated'> {
  eventId: string      // identidade estável do evento
  type: T
  resourceId: string   // recurso afetado
  version: number      // versão do recurso depois da mudança
  occurredAt: string
  data: T extends 'nft.updated' ? Nft : Order  // snapshot completo na versão nova
}
```

| Evento | Escopo | Efeito no cliente |
| --- | --- | --- |
| `nft.updated` | todos (Visitante incluso) | Grava o detalhe, faz patch do item nas listas e destaques (marcadas stale, sem reordenar), invalida o carrinho |
| `order.updated` | só o dono do pedido | Grava o pedido; se `confirmed`, invalida o carrinho |

### Conexão

- Um único socket no `RealtimeProvider` (`src/app/realtime`), com `transports: ['websocket']` e o token em `query`. Recriado quando o token muda; destruído com `disconnect()` + `removeAllListeners()` no logout e na troca de usuário.
- O mock resolve o token: sem token ou inválido, só `nft.updated`; válido, também os `order.updated` dos próprios pedidos. O filtro por usuário é feito no servidor, nunca vem do cliente, então eventos de uma sessão anterior não chegam a outro usuário.

### Garantias

- **Guarda de versão**: o `eventGate` (`app/realtime/eventGate.ts`) só deixa passar um evento com `version` acima da última aceita para aquele recurso, e os aplicadores dos módulos ainda comparam com a versão em cache (que pode ter vindo do REST). Duplicatas e eventos atrasados são descartados sem regredir.
- **Dedupe de efeitos**: LRU com os últimos ~500 `eventId`; anúncios e invalidações não se repetem.
- Reações de UI (anúncio no carrinho, aviso de cotação obsoleta) usam `useRealtimeEvent(type, handler)` (`shared/lib/realtime.ts`), que registra no `useEffect` e remove no cleanup.

## Política de sessão

- **Token** opaco devolvido por login e cadastro, guardado em `localStorage` (`kurio-token`) e enviado como `Authorization: Bearer`. Em produção seria um cookie HttpOnly; aqui fica no storage porque o "servidor" é o próprio navegador.
- **Validade**: 2 h absolutas, sem refresh token. Depois disso, as rotas privadas respondem 401 `SESSION_EXPIRED`.
- **Boot**: o `beforeLoad` da raiz espera `GET /api/auth/session`. 200 → logado; 401 → apaga o token e segue como Visitante, sem aviso. A sessão chega às rotas pelo contexto do router (`context.session`).
- **Guard** (`routes/_authenticated.tsx`): sem sessão → `/?auth=entrar&redirect=<url>`. Login e cadastro são um diálogo sobre a página atual (`?auth=entrar|cadastro`); depois de entrar, navega para `redirect` (só caminhos internos são aceitos).
- **Expiração em uso**: o interceptor pega o 401 `SESSION_EXPIRED`, limpa a sessão e os dados privados, avisa por toast acessível e abre o login com `redirect` para a mesma URL. O carrinho fica no servidor, então a compra é retomada após entrar de novo; o rascunho do checkout é apagado junto com os dados privados, e o pagamento volta ao passo de dados, repreenchido pelo perfil e pela carteira.
- **Ao autenticar**: limpa o cache privado → grava o token → faz o merge do carrinho de Visitante → navega para `redirect` → invalida o router. O socket é recriado pelo `RealtimeProvider` quando a sessão muda.
- **Logout e troca de usuário**: `POST /auth/logout` → apaga o token → grava a sessão nula → remove todas as queries menos `['session']` (que recebe a sessão nova por `setQueryData`, para não deixar órfãos os observers do header e do socket) → apaga rascunhos e tentativas em `sessionStorage` → navega e invalida o router. A sessão nula derruba o socket (`disconnect()` + `removeAllListeners()`) no render seguinte do `RealtimeProvider`. Em login, cadastro e logout a navegação vem antes do `invalidate`, senão o guard da rota privada abriria o login.
- **Várias abas**: um listener de `storage` na chave do token roda logout local ou recarrega a sessão.
- **Senhas no mock**: salt aleatório por usuário + SHA-256 via WebCrypto. A senha nunca é persistida nem logada. Sem PBKDF2, pelo custo nos testes.

## Carrinho e cotação

- **Sempre no servidor mock.** O Visitante recebe um `cartToken` anônimo (`localStorage` `kurio-cart-token`, header `X-Cart-Token`); o Colecionador usa o carrinho da conta. O carrinho sobrevive a refresh porque mora no banco do mock.
- **Merge ao autenticar**: soma as quantidades da mesma edição com teto `min(available, maxPerOrder)`. Linhas cortadas voltam em `adjustments` e a UI avisa. Fica o cupom do Colecionador; sem ele, herda o do Visitante. No logout, o carrinho da conta fica nela e o navegador começa um carrinho de Visitante vazio.
- **Disponibilidade sem reserva**: acima do teto → 409 `AVAILABILITY_CONFLICT`. Edição esgotada ou abaixo da quantidade marca a linha como `unavailable`/`exceedsAvailable` e bloqueia "Conectar e finalizar". As linhas não guardam preço: o servidor sempre usa o atual.
- **Resumo × cotação**: o `summary` do carrinho é uma estimativa na rede Ethereum. No pagamento, `POST /api/quotes { network }` gera a cotação firme (10 min, `cartVersion`, `nftVersions`), que é a referência do pedido.
- **Cupons**: `KURIO10`, `EXPIRADO` e `RELAMPAGO` (expira 5 min após a primeira aplicação). Cupom vencido depois de aplicado é removido na próxima leitura do carrinho ou cotação, com aviso em `notices`.
- **Cotação obsoleta** quando chega um `nft.updated` com `version` acima de `quote.nftVersions[nftId]`, quando o carrinho muda (`cartVersion`, inclusive em outra aba) ou quando `expiresAt` vence. "Confirmar compra" fica desabilitado e o `QuoteChangesNotice` mostra as diferenças com "Atualizar cotação". Numa corrida, o servidor responde 409 `QUOTE_STALE` com a cotação nova e o fluxo é o mesmo.

## Pedido: estados, idempotência e recuperação

**Passos**: `/pagamento?step=dados` (comprador e carteira, rascunho em `sessionStorage`) → `?step=revisao` (cria a cotação firme e a conexão da carteira, mostra o resumo e "Confirmar compra"). Entrar direto na revisão sem rascunho válido volta para dados; carrinho vazio ou bloqueado volta para o carrinho.

**Idempotência**:

- A chave nasce no primeiro clique e fica em `sessionStorage` como tentativa `{ userId, quoteId, key, orderId? }`. O botão fica desabilitado durante o envio e qualquer reenvio usa a mesma chave.
- Timeout ou falha de rede → "Verificando seu pedido…" e até 3 reenvios automáticos (1 s, 2 s, 4 s) com a mesma chave; depois, "Tentar novamente", ainda com ela.
- Cotação nova → chave nova.
- No servidor: mesma chave + mesmo corpo → o mesmo pedido (200); corpo diferente → 409 `IDEMPOTENCY_KEY_REUSED`. O servidor revalida cotação, estoque e cupom antes de criar.

**Estados** (`/pedidos/$orderId`): `pending` → `confirmed` | `refused` (terminais, nunca regridem pela guarda de versão). O mock decide ~3 s após criar e emite `order.updated`. O recibo só aparece em `confirmed`; `refused` mostra o motivo (`payment_declined` ou `sold_out`) e o carrinho fica intacto.

**Na confirmação**, o mock baixa o estoque (emitindo `nft.updated`) e subtrai do carrinho só as quantidades compradas; o que foi adicionado depois fica. O recibo é um snapshot gravado nesse momento e nunca recalculado. Hash de transação e "Ver no Etherscan" são simulados (o botão revela o hash, sem link externo).

**Recuperação**:

- Refresh na rota do pedido → `GET /api/orders/:id`.
- Refresh antes de receber o `orderId` → a revisão encontra a tentativa pendente, repete o `POST` com a mesma chave e redireciona para o pedido.
- Reconexão do socket → refetch do pedido ativo.
- Socket fora do ar com pedido `pending` → polling a cada 5 s até reconectar ou o pedido ficar terminal.

## Estratégia de cache

### Query keys

| Módulo | Key |
| --- | --- |
| catalog | `['nfts', 'list', params]`, `['nfts', 'facets', params]`, `['highlights']` |
| nft | `['nfts', 'detail', id]`, `['favorites', userId]` |
| cart | `['cart', owner]` (`owner` = `userId` ou `guest:<cartToken>`) |
| checkout | `['quote', userId, 'review', network]`, `['checkout-connection', userId, walletId, provider]`, `['order', userId, orderId]` |
| auth/account | `['session']`, `['profile', userId]`, `['wallets', userId]` |

Os `params` são normalizados antes da key (arrays ordenados, padrões removidos) pela mesma função que monta a query do Axios. Dados privados sempre levam o `userId` na key, o que isola usuários mesmo antes da limpeza do cache.

### Tempos e retries

- `staleTime` global de 30 s, `refetchOnWindowFocus`, `gcTime` padrão. Facets e destaques: 5 min. Sessão, favoritos, perfil e carteiras: `Infinity` (mudam só por mutation nossa). Carrinho e pedido: 0. Cotação e conexão da revisão são `POST` com efeito: `staleTime: Infinity`, `gcTime: 0` e sem retry, para cada entrada na revisão cotar e conectar de novo (a key da cotação usa a rede porque o `quoteId` só existe depois da resposta).
- Queries: 1 retry após 1 s, só para `NETWORK_ERROR` ou 5xx `retryable`; nunca em 4xx (`app/queryClient.ts`). Mutations sem retry, exceto o fluxo idempotente do pedido.

### Mutations e otimismo

- A resposta traz o recurso inteiro e é gravada com `setQueryData`, sem refetch (carrinho, cupom, perfil, avatar, carteiras).
- **Otimista com rollback**: favorito (`onMutate` cancela e grava, `onError` restaura e avisa, `onSettled` invalida) e quantidade/remoção no carrinho. O rollback do carrinho só restaura o snapshot se nenhuma resposta mais nova chegou; senão refaz o `GET /cart`. Adicionar ao carrinho não é otimista: espera a validação de disponibilidade.
- Feedback acessível por toast (`sonner`, `aria-live`) e `aria-busy` nos botões.

### URL e respostas fora de ordem

- Busca, filtros, ordenação, aba e página vivem nos search params (validados com Zod, `stripSearchParams` para os padrões). Filtros fazem push no histórico; a busca tem debounce de 300 ms e replace. Qualquer mudança de filtro zera a página.
- Respostas obsoletas são descartadas pela key derivada da URL e canceladas pelo `signal` repassado ao Axios em toda `queryFn`.
- Listas usam `useQuery` (cancelável, skeleton local). Detalhe, carrinho e perfil usam `useSuspenseQuery` sobre o dado carregado pelo loader, com o skeleton da página como `pendingComponent`.

## Reconciliação REST × Socket.IO

- O REST é a fonte da verdade; o evento é um atalho. Todo evento carrega o snapshot completo e a `version`, então aplicá-lo é equivalente a um `GET` daquela versão, e a guarda de versão impede que um evento atrasado desfaça um dado mais novo vindo do REST (e vice-versa).
- Valores derivados (resumo do carrinho, cotação) nunca são recalculados a partir do evento: o evento invalida e o REST responde.
- **Reconexão**: o primeiro `connect` não faz nada. Num `connect` depois de uma queda, o provider faz `refetchQueries({ type: 'active' })` no detalhe do NFT, na lista visível, no carrinho e no pedido pendente, cobrindo os eventos perdidos. Queda de mais de 3 s mostra "Reconectando…" (`aria-live="polite"`).
- **Troca de identidade**: o socket é recriado com o token novo; eventos da sessão anterior não chegam porque o filtro é no servidor, e o cache privado anterior já foi removido.

## Mocks

- **Ativação**: `VITE_API_MOCKING=enabled` (dev, demo da Vercel, Playwright e Lighthouse). `public/mockServiceWorker.js` é versionado.
- **Estrutura**: `db.ts` (estado, persistência, reset e emissor), `fixtures/` (seed com semente: 60 NFTs em 9 categorias e 3 redes, 2 Colecionadores, cupons), `http/` (handlers por recurso), `ws.ts` (Socket.IO), `rules/` (regras puras e testadas: idempotência, merge com teto, cotação obsoleta, subtração do carrinho), `network.ts` (latência, offline, 503, fora de ordem), `scenarios.ts` e `control.ts` (`window.__mock`).
- **Consistência**: toda mudança passa por uma mutação do `db`, que incrementa `version`, persiste e emite. REST e eventos leem o mesmo estado, então uma mudança aparece nos dois.
- **Cenários**: listados no README. Os eventos de `price-change` e `sold-out` disparam por timer (4 s) a partir da requisição que a tela faz ao abrir, nunca da UI.
- **Persistência e reset**: banco em `localStorage` (`kurio-mock-db`) com versão de schema (versão diferente reseta). Trocar de cenário reseta para a seed dele; `?reset=1` reseta o atual.
- **Determinismo**: latência variável com PRNG de semente; ids, hashes e datas saem de contador e do relógio da seed. Os handlers rodam na página, então o `page.clock` do Playwright controla latência e timers.

### Transporte Socket.IO no mock e limitações

O Socket.IO é interceptado com `ws.link` do MSW + `toSocketIo` do `@mswjs/socket.io-binding` 0.2.0. Os testes passam pelo `socket.io-client` real; nada chama setters ou o cache direto.

- Só WebSocket: o MSW não intercepta long-polling, por isso o cliente usa `transports: ['websocket']`.
- Só o namespace `/`; sem acks, binário nem rooms (rooms viram filtro por `userId` no mock).
- `socket.id` fixo (`"test"`).
- As conexões mockadas não aparecem na aba Network; use os logs do MSW no console.
- Heartbeat manual no mock (`client.send('2')` a cada 20 s); sem ele o cliente cai por `ping timeout` a cada ~30 s.
- O estado do mock é por aba. A persistência em `localStorage` sincroniza depois de um refresh, mas eventos não atravessam abas.
- O token vai em `query` na conexão, aceitável só no mock.

## Acessibilidade

- Navegação completa por teclado, foco visível (`focus-visible:ring` no laranja) e "Pular para o conteúdo".
- `Dialog` e `Sheet` (Radix) prendem o foco e o devolvem a quem estava focado ao abrir (`useReturnFocus`): os nossos abrem pela URL (`?auth=`, `#filtros`), sem `Trigger`, e o Radix só devolve ao `Trigger`.
- Todos os campos com label; erros com `aria-describedby` e `aria-invalid`; o foco vai ao primeiro campo inválido no submit. Validação Zod no cliente e a mesma regra no mock (422).
- Anúncios: região global de toasts e regiões locais `aria-live="polite"` no carrinho (preço e disponibilidade), na cotação e no pedido.
- Estados nunca só por cor (texto ou ícone junto). Links dentro de texto sempre sublinhados.
- Cinza secundário clareado de `#726863` para `#9C918A` e vermelho de erro `#E74E53`, ambos com contraste ≥ 4,5:1. Itens inativos do menu do perfil em `#CFB28C` (o laranja a 75% do Figma não passava). Piso de 12 px para texto.
- `prefers-reduced-motion`: animações e transições terminam na hora; skeletons sem shimmer; carrosséis saltam em vez de rolar.
- Sem overflow horizontal em 390, 720 (1440 a 200% de zoom), 768 e 1440 px, verificado no `11-a11y` junto com o axe (falha em `serious`/`critical`).
- `<title>` e `meta description` por rota, `lang="pt-BR"`.

## Decisões de UX, desvios do Figma e limitações

### Fora do escopo e estáticos

Itens do Figma sem comportamento no enunciado ficam como texto ou botão `aria-disabled`, nunca com toast de sucesso: login social, "Esqueceu a senha", "Criadores", "Aprenda", "Diário", newsletter, redes sociais, coração da barra inferior, "Lista de interesse" e os itens extras do menu do perfil (Atividade, Ofertas, Arquivos baixados, Suporte). A aba "Avaliações de colecionadores" fica visível e desabilitada; as estrelas são só exibição. Não há tela de lista de favoritos, tema claro, nem exclusão ou promoção de carteiras.

### Navegação e layout

- Login e cadastro sem rota própria: modal a partir de `lg` e tela cheia abaixo, via `?auth=`. Só com placeholder à vista, como no Figma; o rótulo existe para leitores de tela. O cadastro do Figma não tem "Nome de exibição": o nome de usuário vai como `displayName`, editável no perfil.
- Menu da conta no header (Dados do perfil, Carteiras, Trocar de usuário, Sair), sem frame no Figma.
- Header só de `md` para cima; no mobile, navegação pela barra inferior (os frames mobile não têm topo global). O botão central da barra abre o Sheet de filtros (`/#filtros`).
- Container de 1200 px de conteúdo, como o frame do catálogo.
- Layout mobile de Perfil, Carteiras e Confirmação criado sem frame, no padrão do restante. Perfil mobile com o menu em lista horizontal rolável no topo.
- Carrinho e pagamento no mobile em tela cheia, sem barra inferior nem rodapé, com resumo/CTA no pé da tela.

### Catálogo e detalhe

- Busca do catálogo só abaixo de `lg` (frame mobile); no desktop a busca é a do header.
- Filtros de Coleções e Rede com uma opção por grupo (escolher outra troca, clicar na atual desmarca). A URL e a API aceitam lista; só a UI limita.
- Contagens dos filtros refletem as fixtures e reagem aos outros filtros ativos, para nenhuma opção com contagem positiva levar a uma lista vazia.
- Paginação mostra todas as páginas, sem reticências (a seed tem no máximo 5). Grade mobile em 2 colunas alinhadas, sem o escalonamento do frame.
- Hero em carrossel sem autoplay, título mais curto no mobile; "NFT em destaque" só em `lg+`. Com erro ou vazios, destaque e vitrines somem (são complementares).
- Card do catálogo abaixo de `lg`: só o favoritar; carrinho e lupa só no desktop. Ordenação no mobile dentro do Sheet de filtros.
- "Comprar" adiciona e vai ao carrinho; o ícone de carrinho só adiciona. "Compartilhar" usa links reais (LinkedIn, e-mail, X) em nova aba.

### Carrinho, pagamento e conta

- Badge do carrinho mostra a soma das quantidades.
- Resumo do carrinho vira skeleton só enquanto uma mutation do carrinho está em voo; refetch em segundo plano não mexe nele. Anúncio e destaque do `nft.updated` somem após 8 s.
- Pagamento mobile: carteiras em radio (escolher a outra troca e repreenche); dados do comprador recolhidos sob o ⋮ da carteira e abertos sozinhos com erro de validação.
- Perfil com um "Salvar" só, como no Figma: a senha só é enviada se algum campo dela foi preenchido, e vai antes do perfil (se falhar, nada é salvo). O avatar sobe ao escolher o arquivo (PNG, JPEG ou WebP, até 2 MB).
- Carteiras: no máximo uma principal e uma secundária; "Igual à carteira principal" copia os dados, exceto apelido e endereço, que precisam ser diferentes.

### Assets

Fonte Roboto Mono servida localmente (preload só do peso 400 latin). Artes do Figma convertidas para AVIF/WebP responsivos. Ícones do Figma como SVG local via `vite-plugin-svgr`, sem biblioteca de ícones. O hero usa uma única URL de imagem por arte (640 px), sem `srcset`, porque a API entrega uma URL por imagem.

### Limitações conhecidas

- Tudo é simulado: sem blockchain, extensões de carteira ou gateway. Hash de transação e "Ver no Etherscan" são fictícios.
- Token em `localStorage` e em `query` no socket: aceitável só porque o servidor é o mock; em produção seria cookie HttpOnly.
- O estado do mock é por aba; eventos não atravessam abas.
- Baselines visuais só são comparáveis na imagem Docker do Playwright.

## Performance

Medianas de 3 execuções por página e perfil ([`lighthouse/SUMMARY.md`](lighthouse/SUMMARY.md), relatórios em `lighthouse/mobile/` e `lighthouse/desktop/`):

| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | `/` | 84 | 100 | 100 | 100 | 3481 ms | 0.000 | 177 ms |
| mobile | `/nft/nft_001` | 84 | 100 | 100 | 100 | 3305 ms | 0.000 | 259 ms |
| desktop | `/` | 99 | 96 | 100 | 100 | 794 ms | 0.004 | 0 ms |
| desktop | `/nft/nft_001` | 100 | 100 | 100 | 100 | 767 ms | 0.000 | 0 ms |

Lighthouse 13.6.0, HeadlessChrome 157, Node 24.15, build `pnpm build:demo` servido por `vite preview`. Mobile com throttling simulado (RTT 150 ms, 1,6 Mbps, CPU 4×).

**Performance mobile abaixo de 90.** O build de demo põe no caminho crítico duas coisas que não existem em produção:

1. O MSW (~175 KB gz), que precisa ser carregado e ter o Service Worker registrado antes do app. O app só pode ser importado depois, por causa da captura do `WebSocket` pelo `engine.io-client`.
2. A latência simulada do cenário `default` (150 ms) em toda chamada à API.

Tirá-los da auditoria seria uma simplificação exclusiva para a pontuação, que o enunciado proíbe. Por isso o assert de performance mobile em `lighthouserc.mobile.json` é `warn` (continua no relatório). Tentativas medidas e descartadas:

- `modulepreload` do chunk do App: LCP de 3,4 s para 4,2 s (disputa banda com o MSW).
- `sideEffects` no `package.json` para separar as páginas por rota (hoje os barrels dos módulos as levam ao chunk de boot): LCP de 4,3 s e ganho pequeno em bytes, porque o grosso são bibliotecas.

O que já está aplicado: code splitting por rota, imagens AVIF/WebP com `srcset`, `width`/`height` explícitos, `fetchpriority="high"` no LCP e `loading="lazy"` fora da dobra, fonte local com `font-display: swap` e preload, skeletons com as dimensões finais (CLS ≈ 0), `favicon.svg` e `robots.txt`.
