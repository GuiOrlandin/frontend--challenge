import { Button } from '@/shared/ui/button'

import type { QuoteChangesNoticeProps } from './types'

/** Aviso de Cotação obsoleta com as diferenças e "Atualizar cotação" (SPEC §8.2). */
export function QuoteChangesNotice({
  stale,
  changes,
  expired,
  refreshing,
  onRefresh,
}: QuoteChangesNoticeProps) {
  // A região fica sempre no DOM: uma região que nasce junto com o texto pode não ser lida.
  return (
    <div role="status" aria-live="polite">
      {stale && (
        <div className="flex flex-col gap-3 rounded-sm border border-primary bg-card p-4 text-sm">
          <p className="font-bold">
            {expired && changes.length === 0 ? 'A cotação expirou' : 'A cotação mudou'}
          </p>
          {changes.length > 0 ? (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          ) : (
            <p>Atualize a cotação para ver os valores atuais.</p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            onClick={onRefresh}
            className="h-10 w-fit rounded-sm text-sm font-bold"
          >
            {refreshing ? 'Atualizando…' : 'Atualizar cotação'}
          </Button>
        </div>
      )}
    </div>
  )
}
