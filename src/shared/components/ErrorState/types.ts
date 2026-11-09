export interface ErrorStateProps {
  /** Padrão: "Não foi possível carregar". */
  title?: string
  description?: string
  onRetry: () => void
  className?: string
}
