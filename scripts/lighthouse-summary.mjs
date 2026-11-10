// Lê os LHRs de `lighthouse/<perfil>/` (upload `filesystem` do LHCI) e gera `lighthouse/SUMMARY.md` (SPEC §15).
import { readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'

const PROFILES = ['mobile', 'desktop']
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
const score = (value) => Math.round(value * 100)
const ms = (value) => `${Math.round(value)} ms`

const lines = [
  '# Lighthouse',
  '',
  'Mediana de 3 execuções por página e perfil (`pnpm lighthouse`).',
  '',
]
let sample

for (const profile of PROFILES) {
  const dir = `lighthouse/${profile}`
  // O LHCI grava caminhos absolutos da máquina; o manifest é versionado, então ficam só os nomes.
  const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8')).map((entry) => ({
    ...entry,
    jsonPath: basename(entry.jsonPath),
    htmlPath: basename(entry.htmlPath),
  }))
  writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2))
  const runsByUrl = Map.groupBy(manifest, (entry) => entry.url)

  lines.push(
    `## ${profile}`,
    '',
    '| Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |',
    '|---|---|---|---|---|---|---|---|',
  )
  for (const [url, entries] of runsByUrl) {
    const lhrs = entries.map((entry) =>
      JSON.parse(readFileSync(`${dir}/${entry.jsonPath}`, 'utf8')),
    )
    sample = lhrs[0]
    const cat = (id) => score(median(lhrs.map((lhr) => lhr.categories[id].score)))
    const audit = (id) => median(lhrs.map((lhr) => lhr.audits[id].numericValue))
    lines.push(
      `| \`${new URL(url).pathname}\` | ${CATEGORIES.map(cat).join(' | ')} | ${ms(audit('largest-contentful-paint'))} | ${audit('cumulative-layout-shift').toFixed(3)} | ${ms(audit('total-blocking-time'))} |`,
    )
  }
  const { throttling, formFactor, screenEmulation } = sample.configSettings
  lines.push(
    '',
    `Emulação: ${formFactor}, ${screenEmulation.width}×${screenEmulation.height} @${screenEmulation.deviceScaleFactor}x. ` +
      `Throttling (simulado): RTT ${throttling.rttMs} ms, ${Math.round(throttling.throughputKbps)} Kbps, CPU ${throttling.cpuSlowdownMultiplier}×.`,
    '',
  )
}

lines.push(
  '## Versões e ambiente',
  '',
  `- Lighthouse ${sample.lighthouseVersion}`,
  `- ${sample.environment.hostUserAgent.match(/(?:Headless)?Chrome\/[\d.]+/)?.[0] ?? sample.environment.hostUserAgent}`,
  `- Node ${process.version}, ${process.platform} ${process.arch}`,
  `- Benchmark index da máquina: ${sample.environment.benchmarkIndex}`,
  '- Build `pnpm build:demo` (MSW no cenário `default`) servido por `vite preview` na porta 4173',
  '',
)

writeFileSync('lighthouse/SUMMARY.md', lines.join('\n'))
console.log('lighthouse/SUMMARY.md gerado')
