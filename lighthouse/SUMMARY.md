# Lighthouse

Mediana de 3 execuções por página e perfil (`pnpm lighthouse`).

## mobile

| Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 84 | 100 | 100 | 100 | 3481 ms | 0.000 | 177 ms |
| `/nft/nft_001` | 84 | 100 | 100 | 100 | 3305 ms | 0.000 | 259 ms |

Emulação: mobile, 412×823 @1.75x. Throttling (simulado): RTT 150 ms, 1638 Kbps, CPU 4×.

## desktop

| Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 99 | 96 | 100 | 100 | 794 ms | 0.004 | 0 ms |
| `/nft/nft_001` | 100 | 100 | 100 | 100 | 767 ms | 0.000 | 0 ms |

Emulação: desktop, 1350×940 @1x. Throttling (simulado): RTT 40 ms, 10240 Kbps, CPU 1×.

## Versões e ambiente

- Lighthouse 13.6.0
- HeadlessChrome/157.0.0.0
- Node v24.15.0, win32 x64
- Benchmark index da máquina: 2754
- Build `pnpm build:demo` (MSW no cenário `default`) servido por `vite preview` na porta 4173
