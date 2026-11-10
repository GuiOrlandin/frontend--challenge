import type { AuthResponse, LoginInput, RegisterInput, Session } from '@/shared/contracts'
import { isApiError } from '@/shared/contracts'
import { http } from '@/shared/lib/http'
import { tokenStore } from '@/shared/lib/tokenStore'

/** Sessão atual, ou `null` para Visitante. 401 apaga o token em vez de virar erro (SPEC §6). */
export async function getSession(): Promise<Session | null> {
  if (!tokenStore.getSessionToken()) return null
  try {
    const { data } = await http.get<Session>('/auth/session')
    return data
  } catch (error) {
    if (!isApiError(error) || error.status !== 401) throw error
    tokenStore.clearSessionToken()
    return null
  }
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', input)
  return data
}

/** A API valida o mesmo `registerSchema`, inclusive a confirmação. */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/register', input)
  return data
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}
