/** Nome ENS nos formulários (SPEC §9): o nome num campo, o domínio num select que só tem `.eth`. */
export const ENS_SUFFIX = '.eth'

/** Junta o sufixo; um ".eth" digitado não vira ".eth.eth". Vazio continua vazio. */
export function withEnsSuffix(value = '') {
  const label = withoutEnsSuffix(value.trim())
  return label && `${label}${ENS_SUFFIX}`
}

export function withoutEnsSuffix(value = '') {
  return value.endsWith(ENS_SUFFIX) ? value.slice(0, -ENS_SUFFIX.length) : value
}
