import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Os `--text-*` extras do `@theme` (index.css); sem isso o merge lê `text-15` como cor e mantém o `text-sm` da base.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ['9', '10', '13', '15', '17', '22', '28', '32', '43'] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
