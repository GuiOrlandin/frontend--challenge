/**
 * Vitrine temporária dos componentes, só em `pnpm dev`. Sai na task do shell do app (26).
 */
import { useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { PageContainer } from '@/shared/components/PageContainer'
import { QuantityStepper } from '@/shared/components/QuantityStepper'
import { Badge } from '@/shared/ui/badge'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import { Button } from '@/shared/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/ui/carousel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui/pagination'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { Skeleton } from '@/shared/ui/skeleton'
import { Slider } from '@/shared/ui/slider'
import { Toaster } from '@/shared/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Textarea } from '@/shared/ui/textarea'

const swatches = [
  'background',
  'card',
  'accent',
  'primary',
  'foreground',
  'muted-foreground',
  'border',
  'destructive',
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t pt-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}

export default function DevShowcase() {
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState([0, 8])

  return (
    <PageContainer className="flex flex-col gap-8 py-10">
      <h1 className="text-2xl font-bold">Vitrine de componentes (dev)</h1>

      <Section title="Tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map((name) => (
            <div key={name} className="flex flex-col gap-1 text-xs">
              <div className="h-12 rounded-lg border" style={{ background: `var(--${name})` }} />
              {name}
            </div>
          ))}
        </div>
        <p className="font-normal">Roboto Mono 400</p>
        <p className="font-medium">Roboto Mono 500</p>
        <p className="font-bold">Roboto Mono 700</p>
        <p className="text-muted-foreground">Texto secundário</p>
        <p className="text-primary">0,25 ETH</p>
        <p className="text-destructive">Erro: campo obrigatório</p>
      </Section>

      <Section title="Botões e badges">
        <div className="flex flex-wrap gap-3">
          <Button>Comprar</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Remover</Button>
          <Button disabled>Desabilitado</Button>
          <Button onClick={() => toast.success('Adicionado ao carrinho')}>Toast</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge>Raro</Badge>
          <Badge variant="secondary">Ethereum</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Esgotado</Badge>
        </div>
      </Section>

      <Section title="Formulário">
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sc-email">E-mail</Label>
            <Input id="sc-email" type="email" placeholder="voce@exemplo.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sc-invalid">Com erro</Label>
            <Input id="sc-invalid" aria-invalid aria-describedby="sc-invalid-error" />
            <p id="sc-invalid-error" className="text-sm text-destructive">
              Informe um valor válido
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sc-bio">Bio</Label>
            <Textarea id="sc-bio" placeholder="Conte sobre você" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sc-sort">Ordenar por</Label>
            <Select>
              <SelectTrigger id="sc-sort" className="w-56">
                <SelectValue placeholder="Mais recentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <RadioGroup defaultValue="metamask" aria-label="Carteira">
            {['metamask', 'coinbase'].map((value) => (
              <div key={value} className="flex items-center gap-2">
                <RadioGroupItem id={`sc-${value}`} value={value} />
                <Label htmlFor={`sc-${value}`}>{value}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="grid gap-2">
            <span className="text-sm">
              Preço: {price[0]} a {price[1]} ETH
            </span>
            <Slider
              value={price}
              onValueChange={setPrice}
              min={0}
              max={13}
              step={1}
              aria-label="Faixa de preço"
            />
          </div>
          <QuantityStepper value={quantity} onChange={setQuantity} max={5} />
        </div>
      </Section>

      <Section title="Navegação">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>NFT</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="new">Novos</TabsTrigger>
            <TabsTrigger value="trending">Em alta</TabsTrigger>
          </TabsList>
          <TabsContent value="all">Conteúdo de Todos</TabsContent>
          <TabsContent value="new">Conteúdo de Novos</TabsContent>
          <TabsContent value="trending">Conteúdo de Em alta</TabsContent>
        </Tabs>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Section>

      <Section title="Sobreposições">
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir diálogo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Entrar</DialogTitle>
                <DialogDescription>Diálogo com foco preso.</DialogDescription>
              </DialogHeader>
              <Input aria-label="E-mail" />
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Abrir filtros</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>Painel lateral.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </Section>

      <Section title="Carrossel">
        <Carousel className="mx-12 max-w-md">
          <CarouselContent>
            {[1, 2, 3].map((n) => (
              <CarouselItem key={n}>
                <div className="flex h-32 items-center justify-center rounded-lg bg-card">
                  Slide {n}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Section>

      <Section title="Estados">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-40 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <EmptyState
          title="Nenhum NFT encontrado"
          description="Tente outros filtros."
          action={<Button variant="outline">Limpar filtros</Button>}
        />
        <ErrorState onRetry={() => toast('Tentando de novo…')} />
      </Section>

      <Toaster />
    </PageContainer>
  )
}
