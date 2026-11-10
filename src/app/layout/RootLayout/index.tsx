import { Toaster } from '@/shared/ui/sonner'

/**
 * Moldura de todas as rotas (entra como `InnerWrap` do router, então o 404 também tem layout).
 * O Toaster é a região `aria-live` global (SPEC §13.5).
 */
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only rounded-sm bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Pular para o conteúdo
      </a>
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Toaster />
    </>
  )
}
