/**
 * Valores em ETH sem lib de decimal (SPEC §5.4).
 * Transporte e cache sempre em string decimal; bigint (wei, 18 casas) só dentro dos cálculos.
 * O cliente não calcula subtotal, desconto, taxa nem total: esses vêm da API.
 */
export type Eth = string

const DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(DECIMALS)
const DECIMAL_PATTERN = new RegExp(`^(\\d+)(?:\\.(\\d{1,${DECIMALS}}))?$`)

export function toWei(value: Eth): bigint {
  const match = DECIMAL_PATTERN.exec(value)
  if (!match) throw new RangeError(`Invalid ETH value: "${value}"`)
  const [, whole = '0', fraction = ''] = match
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(DECIMALS, '0'))
}

export function fromWei(wei: bigint): Eth {
  if (wei < 0n) throw new RangeError('Negative ETH values are not supported')
  const whole = wei / WEI_PER_ETH
  const fraction = (wei % WEI_PER_ETH).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export function add(a: Eth, b: Eth): Eth {
  return fromWei(toWei(a) + toWei(b))
}

export function mulQty(price: Eth, quantity: number): Eth {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError(`Invalid quantity: ${quantity}`)
  }
  return fromWei(toWei(price) * BigInt(quantity))
}

export function compare(a: Eth, b: Eth): -1 | 0 | 1 {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

const formatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
})

/** "1234.5" → "1.234,50". Passa a string direto ao Intl (precisão exata, sem Number). */
export function formatEth(value: Eth): string {
  return formatter.format(value as Intl.StringNumericLiteral)
}
