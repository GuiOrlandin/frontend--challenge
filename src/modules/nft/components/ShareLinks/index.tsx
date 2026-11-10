import LinkedinIcon from '@/assets/icons/linkedin.svg?react'
import MailIcon from '@/assets/icons/mail.svg?react'
import TwitterIcon from '@/assets/icons/twitter.svg?react'

const linkClass =
  'flex size-6 items-center justify-center rounded-sm hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none'

/** Compartilhar com links reais em nova aba (SPEC §13.6). */
export function ShareLinks({ title }: { title: string }) {
  const url = window.location.href
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold">Compartilhar este NFT:</span>
      <ul className="flex items-center gap-1">
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
            href={`mailto:?subject=${t}&body=${u}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar por e-mail"
            className={linkClass}
          >
            <MailIcon className="size-4" aria-hidden />
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
      </ul>
    </div>
  )
}
