import type { ChangePasswordInput, Profile, ProfileInput } from '@/shared/contracts'
import { http } from '@/shared/lib/http'

export async function getProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await http.get<Profile>('/me/profile', { signal })
  return data
}

export async function updateProfile(input: ProfileInput): Promise<Profile> {
  const { data } = await http.patch<Profile>('/me/profile', input)
  return data
}

export async function uploadAvatar(file: File): Promise<Profile> {
  const body = new FormData()
  body.append('file', file)
  const { data } = await http.put<Profile>('/me/profile/avatar', body)
  return data
}

export async function removeAvatar(): Promise<Profile> {
  const { data } = await http.delete<Profile>('/me/profile/avatar')
  return data
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await http.put('/me/password', input)
}
