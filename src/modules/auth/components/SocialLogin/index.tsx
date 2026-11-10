import FacebookIcon from '@/assets/icons/facebook-color.svg?react'
import GoogleIcon from '@/assets/icons/google.svg?react'
import { Button } from '@/shared/ui/button'

/** Login social estático (SPEC §1): aparece, sem ação. */
export function SocialLogin() {
  return (
    <div className="grid gap-3">
      {/* Mobile: traços dos lados; desktop: divisor de borda a borda do modal, texto abaixo. */}
      <p className="flex items-center justify-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border lg:-mx-14 lg:border-t lg:pt-4 lg:before:hidden lg:after:hidden">
        Ou continue com
      </p>
      <Button
        type="button"
        variant="outline"
        aria-disabled="true"
        className="h-10 text-xs font-normal"
      >
        <GoogleIcon className="size-4" />
        Continuar com Google
      </Button>
      <Button
        type="button"
        variant="outline"
        aria-disabled="true"
        className="h-10 text-xs font-normal"
      >
        <FacebookIcon className="size-4" />
        Continuar com Facebook
      </Button>
    </div>
  )
}
