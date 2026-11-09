import { cn } from '@/shared/lib/utils'

/**
 * Bloco de carregamento. Com movimento permitido, um brilho atravessa o bloco
 * (`animate-shimmer`); com `prefers-reduced-motion: reduce` fica estático.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'rounded-md bg-accent motion-safe:animate-shimmer motion-safe:bg-[linear-gradient(90deg,var(--accent)_25%,var(--border)_50%,var(--accent)_75%)] motion-safe:bg-size-[200%_100%]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
