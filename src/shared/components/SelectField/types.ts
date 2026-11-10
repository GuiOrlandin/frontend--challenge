export interface SelectFieldProps {
  name: string
  label: string
  /** Pares `[valor, texto]`. */
  options: readonly (readonly [string, string])[]
  defaultValue?: string
  /** Controlado: com `value`, passe `onValueChange` (ou `disabled`). */
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  error?: string
}
