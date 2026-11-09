export interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  /** Teto da quantidade, como `min(available, maxPerOrder)`. */
  max: number
  /** Padrão: 1. */
  min?: number
  /** Nome acessível do grupo. Padrão: "Quantidade". */
  label?: string
  disabled?: boolean
  className?: string
}
