import type { RealtimeEvent } from '@/shared/contracts'

/**
 * Porta de entrada dos eventos (SPEC §10.3): dedupe pelos últimos `maxIds` `eventId` (LRU) e
 * guarda de versão por recurso (só passa versão maior que a última aceita).
 */
export function createEventGate(maxIds = 500) {
  const seenIds = new Set<string>()
  const versions = new Map<string, number>()

  return {
    accept(event: RealtimeEvent): boolean {
      if (seenIds.has(event.eventId)) return false
      const key = `${event.type}:${event.resourceId}`
      if (event.version <= (versions.get(key) ?? -Infinity)) return false

      seenIds.add(event.eventId)
      // Set guarda ordem de inserção: o primeiro é o mais antigo.
      if (seenIds.size > maxIds) seenIds.delete(seenIds.values().next().value!)
      versions.set(key, event.version)
      return true
    },
  }
}
