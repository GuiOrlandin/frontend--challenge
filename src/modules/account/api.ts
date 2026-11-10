import type { Profile } from '@/shared/contracts'
import { http } from '@/shared/lib/http'

export async function getProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await http.get<Profile>('/me/profile', { signal })
  return data
}
