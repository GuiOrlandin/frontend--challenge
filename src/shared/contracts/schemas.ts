/**
 * Schemas Zod de conta e dos formulários (SPEC §6 e §9).
 * Os mesmos schemas validam no cliente e no mock (422 VALIDATION_FAILED).
 */
import { z } from 'zod'

import { NETWORKS, WALLET_PROVIDERS, WALLET_ROLES, type Network } from './entities'

const REQUIRED = 'Campo obrigatório'

const required = () => z.string().trim().min(1, REQUIRED)

/** Campo opcional de formulário: aparado, e vazio vira ausente no payload. */
const optional = <T extends z.ZodType<string, string>>(schema: T) =>
  z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .pipe(schema.optional())
    .optional()

const lengthBetween = (min: number, max: number) =>
  required().min(min, `Use ao menos ${min} caracteres`).max(max, `Use no máximo ${max} caracteres`)

// --- Campos ---------------------------------------------------------------

export const displayNameField = lengthBetween(2, 40)
export const profileNameField = lengthBetween(2, 40)
export const walletLabelField = lengthBetween(2, 24)

export const usernameField = required().regex(
  /^[a-z0-9_]{3,20}$/,
  'Use de 3 a 20 caracteres: letras minúsculas, números e _',
)

export const emailField = required().pipe(z.email('E-mail inválido'))

export const passwordField = z
  .string()
  .min(8, 'Use ao menos 8 caracteres')
  .regex(/[A-Za-z]/, 'Inclua ao menos uma letra')
  .regex(/\d/, 'Inclua ao menos um número')

const ENS_PATTERN = /^[a-z0-9-]{3,63}\.eth$/
export const ensNameField = required().regex(
  ENS_PATTERN,
  'Use <nome>.eth com 3 a 63 caracteres: letras minúsculas, números e -',
)

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export function isValidAddress(network: Network, address: string): boolean {
  return network === 'solana' ? SOLANA_ADDRESS.test(address) : EVM_ADDRESS.test(address)
}

export const referralCodeField = required().regex(
  /^[A-Z0-9]{6,12}$/,
  'Use de 6 a 12 caracteres: letras maiúsculas e números',
)

/** "ENS ou carteira secundária": nome .eth ou endereço de qualquer rede. */
export const receivingAddressField = optional(
  z
    .string()
    .refine(
      (value) => ENS_PATTERN.test(value) || EVM_ADDRESS.test(value) || SOLANA_ADDRESS.test(value),
      'Informe um nome .eth ou um endereço de carteira',
    ),
)

export const networkField = z.enum(NETWORKS, 'Selecione a rede')
export const walletProviderField = z.enum(WALLET_PROVIDERS, 'Selecione o tipo de carteira')

const confirmationMatches =
  (passwordKey: string) => (data: Record<string, unknown>, ctx: z.RefinementCtx) => {
    if (data[passwordKey] !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas não coincidem',
      })
    }
  }

// --- Conta ----------------------------------------------------------------

export const registerSchema = z
  .object({
    username: usernameField,
    displayName: displayNameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine(confirmationMatches('password'))
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, REQUIRED),
})
export type LoginInput = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, REQUIRED),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine(confirmationMatches('newPassword'))
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// --- Formulários (§9) -----------------------------------------------------

export const profileSchema = z.object({
  displayName: displayNameField,
  username: usernameField,
  email: emailField,
  ensName: ensNameField,
  alias: walletLabelField,
})
export type ProfileInput = z.infer<typeof profileSchema>

export const walletSchema = z
  .object({
    role: z.enum(WALLET_ROLES),
    label: walletLabelField,
    displayName: displayNameField,
    network: networkField,
    profileName: profileNameField,
    address: required(),
    receivingAddress: receivingAddressField,
    provider: walletProviderField,
    referralCode: referralCodeField,
    email: emailField,
    ensName: ensNameField,
  })
  .superRefine((wallet, ctx) => {
    if (!isValidAddress(wallet.network, wallet.address)) {
      ctx.addIssue({
        code: 'custom',
        path: ['address'],
        message:
          wallet.network === 'solana'
            ? 'Use um endereço Solana (base58, 32 a 44 caracteres)'
            : 'Use 0x seguido de 40 caracteres hexadecimais',
      })
    }
  })
export type WalletInput = z.infer<typeof walletSchema>

export const buyerSchema = z.object({
  displayName: displayNameField,
  username: usernameField,
  email: emailField,
  ensName: ensNameField,
  profileName: profileNameField,
  referralCode: referralCodeField,
  receivingAddress: receivingAddressField,
  note: optional(z.string().max(500, 'Use no máximo 500 caracteres')),
})
export type BuyerInput = z.infer<typeof buyerSchema>
