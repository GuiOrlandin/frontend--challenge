import FacebookIcon from '@/assets/icons/facebook-color.svg?react'
import GoogleIcon from '@/assets/icons/google.svg?react'
import { Button } from '@/shared/ui/button'

/** Login social estático (SPEC §1): aparece, sem ação. */
export function SocialLogin() {
  return (
    <div className="grid gap-3">
      {/* Traços dos lados do texto; no desktop vão de borda a borda do modal. */}
      <p className="flex items-center justify-center gap-3 text-sm before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border lg:-mx-14">
        Ou continue com
      </p>
      <Button
        type="button"
        variant="outline"
        aria-disabled="true"
        className="h-10 gap-3 text-sm font-normal text-option dark:bg-transparent"
      >
        <GoogleIcon className="size-5" />
        Continuar com Google
      </Button>
      <Button
        type="button"
        variant="outline"
        aria-disabled="true"
        className="h-10 gap-3 text-sm font-normal text-option dark:bg-transparent"
      >
        <FacebookIcon className="size-5" />
        Continuar com Facebook
      </Button>
    </div>
  )
}
