export interface FieldProps extends Omit<React.ComponentProps<'input'>, 'id' | 'className'> {
  label: string
  error?: string
}
