export interface FormFieldProps extends Omit<React.ComponentProps<'input'>, 'id' | 'className'> {
  /** Rótulo acessível (o Figma mostra só o placeholder). */
  label: string
  error?: string
}
