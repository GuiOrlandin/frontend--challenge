import FacebookIcon from '@/assets/icons/facebook.svg?react'
import InstagramIcon from '@/assets/icons/instagram.svg?react'
import LinkedinIcon from '@/assets/icons/linkedin.svg?react'
import TwitterIcon from '@/assets/icons/twitter.svg?react'
import YoutubeIcon from '@/assets/icons/youtube.svg?react'
import { PageContainer } from '@/shared/components/PageContainer'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

// Tudo aqui é estático (SPEC §1): texto ou controle `aria-disabled`, sem ação.

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const COLUMNS = [
  {
    title: 'Meu perfil',
    items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    items: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  { title: 'Coleções', items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
]

const SOCIALS = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'X (Twitter)', Icon: TwitterIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
]

export function Footer() {
  return (
    <footer className="mt-16 pb-24 md:pb-0">
      <PageContainer>
        <div className="grid gap-8 rounded-t-lg bg-card p-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:p-8">
          {FEATURES.map(({ letter, title, text }) => (
            <div
              key={title}
              className="flex flex-col gap-2 lg:border-r lg:border-primary/40 lg:pr-3 lg:pl-4 lg:first:pl-0"
            >
              <span
                aria-hidden="true"
                className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary font-bold lg:size-[74px] lg:text-2xl text-primary-foreground"
              >
                {letter}
              </span>
              <h2 className="text-sm font-bold lg:text-[17px] lg:whitespace-nowrap">{title}</h2>
              <p className="text-xs leading-relaxed text-option lg:max-w-[190px] lg:text-sm">
                {text}
              </p>
            </div>
          ))}
          <div className="flex flex-col gap-3 lg:pl-4">
            <h2 className="text-sm font-bold lg:text-[17px] lg:leading-tight">
              Antecipe-se ao próximo lançamento
            </h2>
            <div className="flex">
              <Input
                aria-label="E-mail para novidades"
                placeholder="digite seu e-mail..."
                readOnly
                aria-disabled="true"
                className="h-8 w-[185px] shrink-0 lg:h-10 rounded-r-none border-0 bg-accent px-2 text-sm"
              />
              <Button
                aria-disabled="true"
                className="h-8 shrink-0 rounded-l-none lg:h-10 lg:px-2.5"
              >
                Enviar
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-option lg:text-sm">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>

        <div className="grid gap-2 bg-footer-band px-6 py-5 text-xs sm:grid-cols-2 lg:text-sm lg:grid-cols-4 lg:items-center lg:px-8">
          <span className="font-bold tracking-widest">KURIO</span>
          <span>Feito para colecionadores, criadores e cultura</span>
          <span>contato@email.com</span>
          <span>+55 11 4002 8922</span>
        </div>

        <div className="grid gap-8 rounded-b-lg bg-card p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
          {COLUMNS.map(({ title, items }) => (
            <div key={title}>
              <h2 className="mb-3 text-sm font-bold lg:text-lg">{title}</h2>
              <ul className="flex flex-col gap-2 text-xs lg:text-sm">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="mb-3 text-sm font-bold lg:text-lg">Redes sociais</h2>
            <ul className="flex gap-2">
              {SOCIALS.map(({ label, Icon }) => (
                <li key={label}>
                  <span
                    role="img"
                    aria-label={label}
                    className="flex size-8 items-center justify-center rounded-sm border border-primary text-primary"
                  >
                    <Icon className="size-4" />
                  </span>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 mb-3 text-sm font-bold lg:text-lg">Carteiras compatíveis</h2>
            <p className="inline-block rounded-sm bg-accent px-3 py-1.5 text-[9px] font-bold tracking-wide text-primary">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>

        <p className="py-6 text-center text-xs lg:text-sm">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </PageContainer>
    </footer>
  )
}
