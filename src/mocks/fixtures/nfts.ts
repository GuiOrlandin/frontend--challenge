/**
 * 60 Nfts gerados com semente (SPEC §12.5). Os nove mais recentes reproduzem os cards do
 * Figma (título, número e preço); os demais saem do PRNG. Mesma semente, mesmo catálogo.
 */
import { NETWORKS, type Edition, type Eth, type Nft } from '@/shared/contracts'

import { createRandom, type Random } from '../random'
import { artworkUrl, ARTWORKS, type Artwork } from './images'
import { CATEGORIES, COLLECTIONS } from './taxonomy'

const NFT_COUNT = 60

/** Pares de nome por arte, no estilo dos cards do Figma. */
const NOUNS: Record<Artwork, readonly string[]> = {
  'emerald-ape': ['Ape', 'Baron'],
  'sage-nomad': ['Nomad', 'Bloom'],
  'neon-vessel': ['Vessel', 'Baron'],
  'golden-beat': ['Beat', 'Signal'],
}

const ADJECTIVES = [
  'Amber',
  'Azure',
  'Crimson',
  'Velvet',
  'Lunar',
  'Solar',
  'Rustic',
  'Silent',
  'Royal',
  'Misty',
  'Ember',
  'Jade',
  'Onyx',
  'Copper',
  'Coral',
  'Frost',
  'Echo',
  'Saffron',
] as const

const CREATORS = ['Lia Moraes', 'Theo Kwan', 'Studio Aurora', 'Nina Faria', 'Rafa Okoye', 'Kael']

const ART_COLLECTION: Record<Artwork, (typeof COLLECTIONS)[number]['id']> = {
  'emerald-ape': 'kurio-apes',
  'sage-nomad': 'nomad-society',
  'neon-vessel': 'neon-vessels',
  'golden-beat': 'golden-signals',
}

interface FigmaCard {
  title: string
  tokenId: string
  artwork: Artwork
  cents: number
  compareAtCents?: number
  rare?: boolean
}

/** Na ordem do grid do Figma (mais recente primeiro). */
const FIGMA_CARDS: FigmaCard[] = [
  { title: 'Emerald Ape', tokenId: '042', artwork: 'emerald-ape', cents: 119 },
  { title: 'Sage Nomad', tokenId: '009', artwork: 'sage-nomad', cents: 169 },
  {
    title: 'Neon Vessel',
    tokenId: '552',
    artwork: 'neon-vessel',
    cents: 199,
    compareAtCents: 229,
    rare: true,
  },
  { title: 'Cosmic Bloom', tokenId: '118', artwork: 'sage-nomad', cents: 129 },
  { title: 'Violet Nomad', tokenId: '314', artwork: 'sage-nomad', cents: 139 },
  { title: 'Ivory Baron', tokenId: '088', artwork: 'neon-vessel', cents: 179 },
  { title: 'Golden Beat', tokenId: '207', artwork: 'golden-beat', cents: 99 },
  { title: 'Amber Signal', tokenId: '271', artwork: 'golden-beat', cents: 59 },
  { title: 'Golden Signal', tokenId: '160', artwork: 'golden-beat', cents: 39 },
]

/** Extremos da faixa de preço do Figma ("0,02 - 12,30 ETH"), garantidos no catálogo. */
const MIN_CENTS = 2
const MAX_CENTS = 1230

const DAY_MS = 24 * 60 * 60 * 1000

const eth = (cents: number): Eth =>
  `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`

export function createNfts(seed: number, now: string): Nft[] {
  const random = createRandom(seed)
  const usedTokens = new Set(FIGMA_CARDS.map((card) => card.tokenId))
  const nowMs = Date.parse(now)

  return Array.from({ length: NFT_COUNT }, (_, index) => {
    const number = index + 1
    const card = FIGMA_CARDS[index] ?? generatedCard(random, index, usedTokens)
    const id = `nft_${String(number).padStart(3, '0')}`
    const title = `${card.title} #${card.tokenId}`
    // Mais recente primeiro: ~1,5 dia entre cada um, com até 10 h de variação.
    const createdAt = new Date(nowMs - index * 1.5 * DAY_MS - random.int(1, 10) * 3_600_000)
    const editions = createEditions(random, number, card)
    const category = CATEGORIES[index % CATEGORIES.length] ?? CATEGORIES[0]
    const collection =
      index < FIGMA_CARDS.length || random.chance(0.6)
        ? collectionById(ART_COLLECTION[card.artwork])
        : random.pick(COLLECTIONS)

    return {
      id,
      tokenId: card.tokenId,
      title,
      description: `${title} faz parte da coleção ${collection.label}. Arte digital original, com propriedade registrada e benefícios exclusivos para quem coleciona.`,
      category: { id: category.id, label: category.label },
      collection: { id: collection.id, label: collection.label },
      network: index < FIGMA_CARDS.length ? 'ethereum' : random.pick(NETWORKS),
      creator: {
        name: random.pick(CREATORS),
        avatarUrl: artworkUrl(random.pick(ARTWORKS)),
      },
      images: galleryFor(random, card.artwork, title),
      attributes: [
        { label: 'Fundo', value: random.pick(['Creme', 'Menta', 'Areia', 'Oliva']) },
        { label: 'Estilo', value: random.pick(['Óculos', 'Chapéu', 'Fones', 'Gola alta']) },
        { label: 'Expressão', value: random.pick(['Sereno', 'Confiante', 'Curioso']) },
      ],
      rating: {
        average: random.int(35, 50) / 10,
        // ~1 em 4 passa do corte da aba "Em alta".
        count: random.chance(0.25) ? random.int(80, 160) : random.int(0, 60),
      },
      rare: card.rare ?? false,
      editions,
      defaultEditionId: editions[0]?.id ?? '',
      createdAt: createdAt.toISOString(),
      version: 1,
    } satisfies Nft
  })
}

function generatedCard(random: Random, index: number, usedTokens: Set<string>): FigmaCard {
  const artwork = ARTWORKS[index % ARTWORKS.length] ?? 'emerald-ape'
  let tokenId: string
  do tokenId = String(random.int(1, 999)).padStart(3, '0')
  while (usedTokens.has(tokenId))
  usedTokens.add(tokenId)

  // Os dois primeiros gerados fixam os extremos da faixa; o resto concentra abaixo de 3 ETH.
  const cents =
    index === FIGMA_CARDS.length
      ? MAX_CENTS
      : index === FIGMA_CARDS.length + 1
        ? MIN_CENTS
        : random.chance(0.8)
          ? random.int(MIN_CENTS, 300)
          : random.int(300, MAX_CENTS)

  return {
    title: `${random.pick(ADJECTIVES)} ${random.pick(NOUNS[artwork])}`,
    tokenId,
    artwork,
    cents,
    compareAtCents: random.chance(1 / 6) ? Math.ceil(cents * 1.15) : undefined,
    rare: random.chance(1 / 8),
  }
}

/**
 * As 4 Edições do Figma (1/1, 1/10, 1/50, Aberta). A aberta é a padrão (primeira): sempre tem
 * estoque e o preço dela segue o card; as outras cobrem quase esgotada e esgotada. Os sorteios
 * são os mesmos de antes (e na mesma ordem), para o resto da seed não mudar.
 */
function createEditions(random: Random, number: number, card: FigmaCard): Edition[] {
  const prefix = `ed_${String(number).padStart(3, '0')}`
  const open = random.chance(0.4)
  const standard: Edition = {
    id: `${prefix}_a`,
    label: 'Aberta',
    supply: null,
    available: open ? 999 : random.int(1, 100),
    price: eth(card.cents),
    ...(card.compareAtCents ? { compareAtPrice: eth(card.compareAtCents) } : {}),
    maxPerOrder: 5,
  }
  const extra = random.int(0, 2)

  let limitedAvailable = 25
  if (extra >= 1) {
    const stock = random.pick(['almostSoldOut', 'soldOut', 'healthy'] as const)
    limitedAvailable =
      stock === 'soldOut' ? 0 : stock === 'almostSoldOut' ? random.int(1, 3) : random.int(10, 50)
  }
  let collectorAvailable = 2
  if (extra >= 2) collectorAvailable = random.chance(0.5) ? 0 : random.int(1, 2)

  return [
    standard,
    {
      id: `${prefix}_b`,
      label: 'Limitada 1/50',
      supply: 50,
      available: limitedAvailable,
      price: eth(Math.min(MAX_CENTS, Math.round(card.cents * 1.5))),
      maxPerOrder: 3,
    },
    {
      id: `${prefix}_c`,
      label: 'Colecionador 1/10',
      supply: 10,
      available: collectorAvailable,
      price: eth(Math.min(MAX_CENTS, card.cents * 3)),
      maxPerOrder: 1,
    },
    {
      id: `${prefix}_d`,
      label: 'Única 1/1',
      supply: 1,
      available: 1,
      price: eth(Math.min(MAX_CENTS, card.cents * 5)),
      maxPerOrder: 1,
    },
  ]
}

function galleryFor(random: Random, main: Artwork, title: string): Nft['images'] {
  // Sorteio mantido só para não deslocar a sequência da seed (preços, estoques etc.).
  random.int(0, 2)
  // Figma: a galeria mostra só a arte do próprio NFT.
  return [{ src: artworkUrl(main), alt: title }]
}

function collectionById(id: string): (typeof COLLECTIONS)[number] {
  const collection = COLLECTIONS.find((c) => c.id === id)
  if (!collection) throw new Error(`Coleção desconhecida: ${id}`)
  return collection
}
