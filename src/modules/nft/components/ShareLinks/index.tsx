import LinkedinIcon from '@/assets/icons/linkedin.svg?react'
import TwitterIcon from '@/assets/icons/twitter.svg?react'

const linkClass =
  'flex size-9 items-center justify-center rounded-full border text-primary hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none'

/** Compartilhar com links reais em nova aba (SPEC §13.6). */
export function ShareLinks({ title }: { title: string }) {
  const url = window.location.href
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Compartilhar</span>
      <ul className="flex gap-2">
        <li>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no LinkedIn (abre em nova aba)"
            className={linkClass}
          >
            <LinkedinIcon className="size-4" aria-hidden />
          </a>
        </li>
        <li>
          <a
            href={`https://x.com/intent/post?text=${t}&url=${u}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no X (abre em nova aba)"
            className={linkClass}
          >
            <TwitterIcon className="size-4" aria-hidden />
          </a>
        </li>
        <li>
          {/* shortcut: sem ícone de e-mail no Figma recebido; trocar pelo SVG quando vier. */}
          <a
            href={`mailto:?subject=${t}&body=${u}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar por e-mail"
            className={`${linkClass} text-sm font-bold`}
          >
            @
          </a>
        </li>
      </ul>
    </div>
  )
}
