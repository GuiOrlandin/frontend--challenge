/// <reference types="node" />
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

/** Lê os tokens `--nome: oklch(L C H)` do bloco `:root`. */
function readTokens(source: string): Map<string, [number, number, number]> {
  const root = /:root\s*\{([^}]*)\}/.exec(source)?.[1] ?? ''
  const tokens = new Map<string, [number, number, number]>()
  for (const [, name, l, c, h] of root.matchAll(
    /--([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g,
  )) {
    tokens.set(name!, [Number(l), Number(c), Number(h)])
  }
  return tokens
}

/** Luminância relativa WCAG de uma cor OKLCH (conversão OKLab → sRGB linear). */
function luminance([l, c, h]: [number, number, number]): number {
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const r = clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_)
  const g = clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_)
  const bl = clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

function contrast(x: [number, number, number], y: [number, number, number]): number {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('contrast helper', () => {
  it('gives 21:1 for white on black', () => {
    expect(contrast([1, 0, 0], [0, 0, 0])).toBeCloseTo(21, 1)
  })
})

describe('theme tokens', () => {
  const tokens = readTokens(css)

  // [texto, fundo]: todo par usado para texto na UI precisa de ≥ 4,5:1 (WCAG AA).
  const textPairs = [
    ['foreground', 'background'],
    ['foreground', 'accent'],
    ['card-foreground', 'card'],
    ['popover-foreground', 'popover'],
    ['accent-foreground', 'accent'],
    ['muted-foreground', 'background'],
    ['muted-foreground', 'card'],
    ['primary', 'background'],
    ['primary', 'card'],
    ['primary', 'accent'],
    ['muted-foreground', 'accent'],
    ['primary-foreground', 'primary'],
    ['secondary-foreground', 'secondary'],
    ['destructive', 'background'],
    ['destructive', 'card'],
    ['primary-foreground', 'destructive'],
    ['option', 'card'],
    ['option', 'accent'],
    ['option-active', 'card'],
    ['option-active', 'accent'],
  ] as const

  it.each(textPairs)('%s on %s reaches 4.5:1', (text, bg) => {
    const fg = tokens.get(text)
    const back = tokens.get(bg)
    expect(fg, `--${text}`).toBeDefined()
    expect(back, `--${bg}`).toBeDefined()
    expect(contrast(fg!, back!)).toBeGreaterThanOrEqual(4.5)
  })
})
