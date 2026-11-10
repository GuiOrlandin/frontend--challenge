import { Link } from '@tanstack/react-router'

import ArrowExploreIcon from '@/assets/icons/arrow-explore.svg?react'
import ArrowReadMoreIcon from '@/assets/icons/arrow-read-more.svg?react'
import emeraldApe from '@/assets/nfts/emerald-ape-640.webp'
import goldenBeat from '@/assets/nfts/golden-beat-250.webp'
import neonVessel from '@/assets/nfts/neon-vessel-250.webp'
import sageNomad from '@/assets/nfts/sage-nomad-640.webp'
import { Button } from '@/shared/ui/button'

/** Blocos de marketing do Figma, estáticos (SPEC §1): textos fixos, sem dados da API. Duas artes só existem em 250 px (fonte do Figma). */

const BANNERS = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: emeraldApe,
  },
  {
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: neonVessel,
  },
]

export function PromoBanners() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {BANNERS.map((banner) => (
        <section
          key={banner.title}
          className="grid grid-cols-2 overflow-hidden rounded-2xl bg-card"
        >
          {/* Arte em meio card, na altura toda (frame ~588×250, não quadrada). */}
          <img
            src={banner.image}
            alt=""
            width={640}
            height={640}
            loading="lazy"
            className="size-full min-h-50 rounded-2xl object-cover lg:min-h-62"
          />
          <div className="flex flex-col items-end gap-3 p-4 text-right">
            <h2 className="text-base font-bold lg:text-lg">{banner.title}</h2>
            <p className="text-xs leading-relaxed text-primary lg:text-sm">{banner.text}</p>
            <Button asChild size="lg" className="mt-auto">
              <Link to="/" hash="catalogo">
                Explorar <ArrowExploreIcon className="h-2.5 w-3" />
              </Link>
            </Button>
          </div>
        </section>
      ))}
    </div>
  )
}

const POSTS = [
  {
    date: '12 de setembro',
    read: 6,
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: neonVessel,
  },
  {
    date: '13 de setembro',
    read: 2,
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: emeraldApe,
  },
  {
    date: '15 de setembro',
    read: 3,
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: sageNomad,
  },
  {
    date: '15 de setembro',
    read: 2,
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: goldenBeat,
  },
]

/** "Diário da Cunhagem": estático, sem páginas editoriais (SPEC §1). */
export function MintJournal() {
  return (
    <section aria-labelledby="diario-titulo" className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 text-center">
        <h2 id="diario-titulo" className="text-2xl font-bold lg:text-28">
          Diário da Cunhagem
        </h2>
        <p className="text-xs text-option lg:text-sm">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-card">
              <img
                src={post.image}
                alt=""
                width={640}
                height={640}
                loading="lazy"
                className="h-48 w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="text-xs text-option">
                  {post.date} | Leitura de {post.read} min
                </p>
                <h3 className="text-sm font-bold lg:text-base">{post.title}</h3>
                <p className="text-xs text-option">{post.text}</p>
                {/* Estático (SPEC §1): sem página do artigo. */}
                <span className="mt-auto flex items-center gap-1 text-xs text-primary">
                  Ler mais{' '}
                  <ArrowReadMoreIcon aria-hidden="true" className="h-4 w-3 translate-y-0.5" />
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
