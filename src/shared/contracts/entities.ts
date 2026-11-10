/** Forma das entidades da API REST (SPEC §5.2). ETH sempre como string decimal. */
import type { Eth } from '@/shared/lib/eth'

export type { Eth }

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

export const WALLET_PROVIDERS = ['metamask', 'walletconnect', 'coinbase'] as const
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}
export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const WALLET_ROLES = ['primary', 'secondary'] as const
export type WalletRole = (typeof WALLET_ROLES)[number]

export const ORDER_STATUSES = ['pending', 'confirmed', 'refused'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type RefusalReason = 'payment_declined' | 'sold_out'
export type CartLineStatus = 'ok' | 'unavailable' | 'exceedsAvailable'

/** Data ISO 8601 em UTC. */
export type IsoDate = string

export interface Edition {
  id: string
  label: string
  supply: number | null
  available: number
  price: Eth
  compareAtPrice?: Eth
  maxPerOrder: number
}

export interface Nft {
  id: string
  tokenId: string
  title: string
  description: string
  category: { id: string; label: string }
  collection: { id: string; label: string }
  network: Network
  creator: { name: string; avatarUrl: string }
  images: { src: string; alt: string }[]
  attributes: { label: string; value: string }[]
  rating: { average: number; count: number }
  rare: boolean
  editions: Edition[]
  defaultEditionId: string
  createdAt: IsoDate
  version: number
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Facets {
  categories: { id: string; label: string; count: number }[]
  networks: { id: Network; label: string; count: number }[]
  priceRange: { min: Eth; max: Eth }
}

export interface Highlights {
  hero: Nft[]
  /** `null` com o catálogo vazio. */
  spotlight: Nft | null
}

export interface FavoriteIds {
  nftIds: string[]
}

export interface SessionUser {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl?: string
}

export interface Session {
  user: SessionUser
  expiresAt: IsoDate
}

export interface AuthResponse {
  token: string
  session: Session
}

export interface Profile {
  displayName: string
  username: string
  email: string
  ensName: string
  alias: string
  avatarUrl?: string
  version: number
}

export interface Wallet {
  id: string
  role: WalletRole
  label: string
  displayName: string
  network: Network
  profileName: string
  address: string
  receivingAddress?: string
  provider: WalletProvider
  referralCode: string
  email: string
  ensName: string
  version: number
}

export interface Coupon {
  code: string
  percentOff: number
}

export interface CartLine {
  lineId: string
  nftId: string
  editionId: string
  quantity: number
  nft: { title: string; tokenId: string; image: string; editionLabel: string }
  unitPrice: Eth
  lineTotal: Eth
  available: number
  maxPerOrder: number
  status: CartLineStatus
}

export interface CartAdjustment {
  nftId: string
  editionId: string
  from: number
  to: number
}

export interface CartNotice {
  code: 'COUPON_REMOVED'
  message: string
}

export interface Cart {
  id: string
  version: number
  lines: CartLine[]
  coupon: Coupon | null
  summary: { subtotal: Eth; discount: Eth; networkFee: Eth; total: Eth; network: 'ethereum' }
  adjustments?: CartAdjustment[]
  notices?: CartNotice[]
}

export interface QuoteLine {
  nftId: string
  editionId: string
  title: string
  editionLabel: string
  quantity: number
  unitPrice: Eth
  lineTotal: Eth
}

export interface Quote {
  quoteId: string
  expiresAt: IsoDate
  cartVersion: number
  network: Network
  nftVersions: Record<string, number>
  lines: QuoteLine[]
  coupon: Coupon | null
  subtotal: Eth
  discount: Eth
  networkFee: Eth
  total: Eth
  notices?: CartNotice[]
}

export interface CheckoutConnection {
  connectionId: string
  walletId: string
  provider: WalletProvider
  network: Network
}

export interface Buyer {
  displayName: string
  username: string
  email: string
  ensName: string
  profileName: string
  referralCode: string
  receivingAddress?: string
  note?: string
}

export interface Receipt {
  transactionHash: string
  confirmedAt: IsoDate
  wallet: { label: string; shortAddress: string; provider: WalletProvider }
  network: Network
  buyer: Buyer
  lines: {
    title: string
    tokenId: string
    image: string
    editionLabel: string
    quantity: number
    unitPrice: Eth
    lineTotal: Eth
  }[]
  subtotal: Eth
  discount: Eth
  networkFee: Eth
  total: Eth
}

export interface Order {
  id: string
  status: OrderStatus
  refusalReason?: RefusalReason
  quoteId: string
  walletId: string
  network: Network
  createdAt: IsoDate
  version: number
  lines: QuoteLine[]
  total: Eth
  receipt?: Receipt
}
