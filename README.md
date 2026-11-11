# Kurio — Marketplace de NFTs

Marketplace de NFTs em React e TypeScript: catálogo, detalhe, carrinho, pagamento, confirmação de pedido, login, cadastro, perfil e carteiras, em desktop, tablet e mobile. A API REST e os eventos Socket.IO são simulados com MSW na camada de rede; nada depende de backend real, blockchain ou gateway de pagamento.

- **Deploy**: _URL pública a preencher após o deploy na Vercel_ (build de demo com os mocks ligados).
- **Enunciado do desafio**: [`docs/CHALLENGE.md`](docs/CHALLENGE.md).
- **Arquitetura, contratos e decisões**: [`ARCHITECTURE.md`](ARCHITECTURE.md).

Stack: Vite 8, React 19, TypeScript 6 (strict), TanStack Router, TanStack Query, Axios, Zod 4, Socket.IO client, Tailwind CSS 4, shadcn/ui (Radix), MSW 2 + `@mswjs/socket.io-binding`, Playwright, Vitest e Lighthouse CI.

## Requisitos

- Node 24 (`engines` no `package.json`).
- pnpm via Corepack: `corepack enable` (a versão vem de `packageManager`).
- Docker, só para os testes de regressão visual.

## Setup

```bash
corepack enable
pnpm install
pnpm exec playwright install chromium   # só para os testes E2E
pnpm dev                                # http://localhost:5173, com mocks
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento com os mocks ligados (`.env.development`) |
| `pnpm build` | Verificação de tipos + build de produção (sem mocks; chama `VITE_API_URL`) |
| `pnpm build:demo` | Build com os mocks ligados (`.env.demo`). Usado pela Vercel, pelo Playwright e pelo Lighthouse |
| `pnpm preview` | Serve o `dist/` em http://localhost:4173 |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm lint` | ESLint (inclui as regras de dependência entre camadas) |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm test:unit` | Vitest: ETH, guarda de versão dos eventos, regras do mock, schemas |
| `pnpm test:e2e` | Playwright (Chromium, desktop e mobile), sem os testes visuais |
| `pnpm test:visual` | Regressão visual dentro da imagem Docker `mcr.microsoft.com/playwright:v1.65.0-noble` |
| `pnpm test:visual:update` | Regera as baselines visuais na mesma imagem |
| `pnpm lighthouse` | Build de demo + Lighthouse mobile e desktop + `lighthouse/SUMMARY.md` |
| `pnpm images` | Converte as artes do Figma (`docs/figma/`, fora do repositório) em AVIF/WebP responsivos. A saída já está versionada em `src/assets/nfts`; não é preciso rodar |

Para ver o build de demo localmente: `pnpm build:demo && pnpm preview`.

## Variáveis de ambiente

Modelo em [`.env.example`](.env.example). `.env.development` e `.env.demo` já ligam os mocks; não há segredos.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_API_MOCKING` | `enabled` em dev e demo | `enabled` liga o MSW (REST e Socket.IO) antes de montar o app |
| `VITE_API_URL` | `/api` | Base da API REST real, usada quando os mocks estão desligados |
| `VITE_SOCKET_URL` | origem da página | Origem do Socket.IO; o mock usa a mesma |

## Credenciais fictícias e cupons

| Colecionador | E-mail | Senha | Particularidades |
| --- | --- | --- | --- |
| Ana | `ana@kurio.dev` | `Kurio@123` | Carteira principal e secundária, favoritos próprios |
| Bruno | `bruno@kurio.dev` | `Kurio@123` | Só carteira principal, favoritos diferentes da Ana |

| Cupom | Efeito |
| --- | --- |
| `KURIO10` | 10% sobre o subtotal |
| `EXPIRADO` | Sempre recusado como expirado |
| `RELAMPAGO` | 20%, válido ao aplicar, mas expira 5 min após a primeira aplicação (some na próxima cotação, com aviso) |

Cadastrar com `ana@kurio.dev` ou com o usuário `ana` gera o conflito de cadastro.

## Cenários dos mocks

O cenário vem de `?scenario=<nome>` em qualquer URL, fica guardado em `localStorage` (sobrevive a refresh) e troca o banco para a seed dele. O bootstrap remove o parâmetro da URL depois de aplicar.

As URLs abaixo usam o `pnpm dev`; no deploy, troque a origem pela URL pública.

| Cenário | Efeito | URL |
| --- | --- | --- |
| `default` | Tudo funciona, latência fixa de 150 ms | http://localhost:5173/?scenario=default |
| `empty` | Catálogo vazio | http://localhost:5173/?scenario=empty |
| `slow` | Latência de 1,5 a 3 s (skeletons visíveis) | http://localhost:5173/?scenario=slow |
| `flaky` | As 2 primeiras buscas do catálogo respondem 503, depois funciona | http://localhost:5173/?scenario=flaky |
| `offline` | Toda chamada falha por rede e o socket não conecta | http://localhost:5173/?scenario=offline |
| `out-of-order` | Buscas mais antigas respondem depois das mais novas | http://localhost:5173/?scenario=out-of-order |
| `session-expired` | A sessão expira na próxima chamada privada | http://localhost:5173/?scenario=session-expired |
| `payment-refused` | O pedido termina recusado (pagamento recusado) | http://localhost:5173/?scenario=payment-refused |
| `wallet-rejected` | A conexão da carteira é recusada | http://localhost:5173/?scenario=wallet-rejected |
| `wallet-disconnected` | A carteira cai antes de criar o pedido | http://localhost:5173/?scenario=wallet-disconnected |
| `order-timeout` | O pedido é criado, mas a resposta é segurada por 15 s (o cliente desiste em 10 s) | http://localhost:5173/?scenario=order-timeout |
| `price-change` | O preço de um NFT do carrinho sobe 10% 4 s depois de abrir o carrinho ou a revisão | http://localhost:5173/?scenario=price-change |
| `sold-out` | A edição de um NFT do carrinho esgota 4 s depois de abrir a revisão | http://localhost:5173/?scenario=sold-out |

**Reset**: `?reset=1` volta o banco à seed do cenário atual; trocar de cenário também reseta. `?scenario=default` volta ao normal.

**Depuração** pelo console do navegador (só com os mocks ligados):

```js
__mock.scenario()                         // cenário atual
__mock.scenario('slow')                   // troca e reseta
__mock.reset()                            // volta à seed do cenário atual
__mock.updateNft('nft_001', { ... })      // muda um NFT como o servidor faria e emite nft.updated
__mock.emit(evento)                       // entrega um evento como veio (duplicado ou antigo)
__mock.dropSocket()                       // derruba o Socket.IO; o cliente reconecta sozinho
__mock.expireSession()                    // a próxima chamada privada responde 401 SESSION_EXPIRED
__mock.failNext({ method: 'PUT', path: '/me/favorites' }, 1)  // próxima chamada que casa responde 503
```

As requisições REST aparecem na aba Network; o Socket.IO mockado não aparece lá (use os logs do MSW no console).

## Reproduzindo os fluxos de falha

Para os fluxos de compra: entre como Ana, adicione um NFT ao carrinho e siga até o pagamento. Abra a URL do cenário **antes** de começar, ou depois de entrar (trocar de cenário reseta o banco, mas a sessão e o carrinho voltam à seed).

- **Resultado vazio** (`empty`): abra a Início. A grade mostra o estado vazio.
- **Carregamento lento** (`slow`): abra a Início ou um NFT. Grade, filtros, detalhe e resumo do carrinho mostram skeletons com shimmer.
- **Falha transitória** (`flaky`): abra a Início. A grade mostra o erro com "Tentar novamente"; após a segunda tentativa, o catálogo carrega.
- **Sem conexão** (`offline`): abra qualquer tela. Aparece o erro de rede com "Tentar novamente".
- **Respostas fora de ordem** (`out-of-order`): digite uma busca rápido, letra a letra. A grade sempre mostra o resultado da busca atual.
- **Sessão expirada**: em qualquer cenário, entre como Ana, rode `__mock.expireSession()` no console e abra o perfil (ou clique em "Confirmar compra" na revisão). Aparece "Sua sessão expirou, entre novamente" e o login abre com `redirect` para a tela atual; depois de entrar, você volta a ela (no pagamento, ao passo de dados, já preenchido pela carteira). O cenário `session-expired` faz o mesmo na primeira chamada privada, que costuma ser o carrinho do header logo após o login.
- **Conflito de cadastro**: abra http://localhost:5173/?auth=cadastro (ou "Entrar" → "Criar conta") e cadastre com `ana@kurio.dev`. O erro aparece no campo de e-mail.
- **Cupom inválido ou expirado**: no carrinho, aplique `NAOEXISTE` ou `EXPIRADO`. O erro aparece no campo do cupom.
- **Pagamento recusado** (`payment-refused`): confirme a compra. O pedido fica pendente ~3 s e termina recusado, com o motivo e "Voltar ao pagamento"; o carrinho fica intacto.
- **Carteira recusada** (`wallet-rejected`): avance para a revisão. A conexão é recusada, com "Tentar de novo".
- **Carteira desconectada** (`wallet-disconnected`): confirme a compra. A UI pede para reconectar sem perder os dados.
- **Timeout do pedido** (`order-timeout`): confirme a compra. Aparece "Verificando seu pedido…" e o cliente reenvia com a mesma chave de idempotência; o mesmo pedido é recuperado, sem duplicar.
- **Clique repetido**: em qualquer cenário, clique várias vezes em "Confirmar compra". Só um pedido é criado.
- **Preço alterado** (`price-change`): abra o carrinho e espere 4 s. A linha é destacada, o anúncio informa o preço novo e o resumo é atualizado. Na revisão, "Confirmar compra" fica bloqueado até "Atualizar cotação".
- **Edição esgotada** (`sold-out`): vá até a revisão e espere 4 s. A cotação fica obsoleta e a confirmação é bloqueada.
- **Queda do socket com pedido pendente**: em `payment-refused` ou `default`, confirme a compra e rode `__mock.dropSocket()` ou recarregue a página. O pedido é retomado pelo id, sem nova compra.
- **Eventos duplicados ou antigos**: com um NFT aberto, emita o mesmo evento duas vezes ou um com versão menor via `__mock.emit(...)`. A tela não regride nem repete o anúncio.

## Decisões de interpretação

### Estado "Aguardando confirmação" antes do comprovante

O Figma vai direto da revisão do pagamento ao comprovante, mas o enunciado pede para "representar pedido pendente, confirmado e recusado" e "exibir a confirmação somente para pedido efetivamente confirmado". Entendi que o comprovante (frame "Confirmação de pedido") não pode aparecer enquanto o pedido está pendente; por isso, adicionei o estado pendente, que não tem frame.

Não é um passo a mais no fluxo: é a mesma rota `/pedidos/$orderId`. Enquanto o pedido está `pending`, ela mostra "Aguardando confirmação da rede…" com o skeleton do comprovante. Quando o evento `order.updated` chega (~3 s no mock), troca para o comprovante, se confirmado, ou para o motivo da recusa com "Voltar ao pagamento". O mesmo estado sustenta a retomada após refresh ou queda do socket.

## Testes

```bash
pnpm test:unit       # Vitest
pnpm test:e2e        # Playwright: builda o demo, sobe o preview na 4173 e roda desktop + mobile
pnpm test:visual     # regressão visual (Docker)
```

- Os specs ficam em `e2e/`, um smoke (`00-smoke`) e um por fluxo do enunciado (`01-catalog` a `12-loading-errors`), mais `visual.spec.ts` com as 8 baselines (Início, Detalhe, Carrinho e Pagamento × desktop e mobile) em `e2e/visual.spec.ts-snapshots/`.
- Cada teste parte de contexto novo, storage vazio, seed do cenário e relógio fixo (`page.clock`).
- Relatório HTML em `playwright-report/` (`pnpm exec playwright show-report`). Traces e screenshots das falhas em `test-results/` (`pnpm exec playwright show-trace <arquivo>.zip`).
- As baselines visuais são geradas e comparadas só na imagem Docker, para não variar com fontes e renderização do sistema.

### Rodando localmente: erros conhecidos

- **`visual.spec.ts` falha fora do Docker.** As baselines são `*-linux.png`, renderizadas no Chromium da imagem `v1.65.0-noble`. No Windows ou no macOS, a fonte e o antialiasing mudam alguns pixels e todas as comparações falham. Não é regressão: rode `pnpm test:visual` (precisa do Docker). Depois de uma mudança visual intencional, `pnpm test:visual:update` regera as baselines, e o diff dos PNGs entra no commit.
- **`--ui` e `--headed` incluem os visuais.** O `pnpm test:e2e` exclui `@visual`, mas `pnpm exec playwright test` sem filtro não exclui. No modo UI, digite `-@visual` no filtro da barra lateral, ou passe `--grep-invert @visual` na linha de comando.
- **`http://localhost:4173 is already used`.** Algum `pnpm preview` ficou aberto (de outra rodada, do Lighthouse ou de um terminal). O Playwright sobe o próprio servidor e não reaproveita outro, para não testar um build antigo. Encerre o processo que está na porta 4173 e rode de novo.

**Para ver os testes rodando:**

```bash
pnpm exec playwright test --ui                                # escolha os testes e veja o replay de cada passo
pnpm test:e2e --headed --project=desktop e2e/06-purchase.spec.ts   # um spec com o Chrome visível, ao vivo
pnpm test:e2e --debug -g "preço novo"                         # passo a passo com o inspector
```

No `--ui`, clique numa ação da lista para ver a tela naquele momento. A faixa de miniaturas no topo é a linha do tempo.

## Lighthouse

```bash
pnpm lighthouse
```

Builda o demo, roda 3 medições de `/` e `/nft/nft_001` nos perfis mobile e desktop e grava os relatórios HTML/JSON em `lighthouse/mobile/` e `lighthouse/desktop/`, com o resumo em [`lighthouse/SUMMARY.md`](lighthouse/SUMMARY.md). Configuração em `lighthouserc.mobile.json` e `lighthouserc.desktop.json`.

Medianas da última execução:

| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | `/` | 84 | 100 | 100 | 100 | 3481 ms | 0.000 | 177 ms |
| mobile | `/nft/nft_001` | 84 | 100 | 100 | 100 | 3305 ms | 0.000 | 259 ms |
| desktop | `/` | 99 | 96 | 100 | 100 | 794 ms | 0.004 | 0 ms |
| desktop | `/nft/nft_001` | 100 | 100 | 100 | 100 | 767 ms | 0.000 | 0 ms |

Performance mobile fica abaixo de 90 por causa do MSW e da latência simulada no caminho crítico do build de demo. A análise está em [`ARCHITECTURE.md`](ARCHITECTURE.md#performance).

## Documentação

- [`ARCHITECTURE.md`](ARCHITECTURE.md): camadas, módulos, contratos REST e eventos, sessão, carrinho, pedido, cache, reconciliação REST × Socket.IO, mocks, acessibilidade, desvios do Figma e performance.
- [`docs/CHALLENGE.md`](docs/CHALLENGE.md): enunciado original.
