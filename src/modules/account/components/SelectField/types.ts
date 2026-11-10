export interface SelectFieldProps {
  name: string
  label: string
  /** Pares `[valor, texto]`. */
  options: readonly (readonly [string, string])[]
  defaultValue?: string
  error?: string
}
