export interface QuoteChangesNoticeProps {
  /** Cotação obsoleta: mostra o aviso; senão a região fica vazia. */
  stale: boolean
  /** Diferenças legíveis; vazio quando só venceu o prazo ou o carrinho ainda não voltou. */
  changes: string[]
  expired: boolean
  refreshing: boolean
  onRefresh: () => void
}
