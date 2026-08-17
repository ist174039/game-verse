'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Coins,
  Newspaper,
  Shield,
  ShoppingCart,
  Trophy,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/auth/language-selector'

const pillars = [
  {
    icon: Shield,
    eyebrow: 'CLUBE',
    title: 'Constrói uma identidade que deixa marca.',
    description: 'Gere plantel, estádio, adeptos, patrocínios e infraestruturas. Cada decisão tem impacto competitivo e financeiro.',
  },
  {
    icon: Trophy,
    eyebrow: 'COMPETIÇÃO',
    title: 'Liga, Taça e rivalidades com história.',
    description: 'Compete no Universo Principal ou entra em universos criados pela comunidade, com ranking, calendário e troféus próprios.',
  },
  {
    icon: ShoppingCart,
    eyebrow: 'MERCADO',
    title: 'Compra, vende e disputa cada oportunidade.',
    description: 'Constrói o plantel através de mercado e leilões. O valor dos jogadores acompanha os dados externos, não progressão artificial.',
  },
]

const ecosystem = [
  { icon: Coins, label: 'Gold · Silver · Bronze', detail: 'Três moedas, três funções claras' },
  { icon: Newspaper, label: 'Jornal automático', detail: 'Resultados e acontecimentos tornam-se história' },
  { icon: Users, label: 'Universos & comunidade', detail: 'Compete com amigos, grupos e ligas próprias' },
  { icon: BarChart3, label: 'Ranking & prestígio', detail: 'Performance atual e legado do clube separados' },
]

export function HomeContent() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-[#f2b705]/30">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#050505]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Clã das Sombras">
            <Image src="/brand/clan-logo.svg" alt="" width={52} height={52} className="h-11 w-11 object-contain" priority />
            <div className="min-w-0 leading-none">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.32em] text-white/45">Sistema</span>
              <span className="mt-1 block truncate text-base font-black uppercase tracking-[0.04em] text-[#f2b705] sm:text-lg">Clã das Sombras</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/60 lg:flex">
            <a href="#plataforma" className="transition hover:text-white">Plataforma</a>
            <a href="#competir" className="transition hover:text-white">Competir</a>
            <a href="#economia" className="transition hover:text-white">Economia</a>
            <a href="#universos" className="transition hover:text-white">Universos</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector className="hidden sm:flex" />
            <Button variant="ghost" asChild className="hidden text-white/70 hover:bg-white/[0.05] hover:text-white sm:inline-flex">
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-[#f2b705] font-bold text-black hover:bg-[#ffd34a]">
              <Link href="/auth/sign-up">Criar clube <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[760px] pt-20 lg:min-h-[880px]">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_36%,rgba(242,183,5,0.14),transparent_27%),radial-gradient(circle_at_50%_100%,rgba(242,183,5,0.06),transparent_35%)]" />
          <div className="absolute inset-0 -z-20 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="absolute right-[-12rem] top-24 -z-10 h-[680px] w-[680px] opacity-[0.16] sm:right-[-8rem] lg:right-[2%] lg:top-28 lg:h-[760px] lg:w-[760px]">
            <Image src="/brand/clan-logo.svg" alt="" fill className="object-contain" priority />
          </div>

          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-24 pt-20 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-32 lg:pt-28">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-2 border border-[#f2b705]/20 bg-[#f2b705]/[0.06] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f5c84c]">
                <Zap className="h-3.5 w-3.5" /> Gestão · Competição · Prestígio
              </div>
              <h1 className="max-w-[900px] text-5xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl lg:text-[82px]">
                O teu clube.
                <span className="mt-2 block bg-gradient-to-r from-[#fff0a6] via-[#f2b705] to-[#b97900] bg-clip-text text-transparent">A tua dinastia.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-7 text-white/58 sm:text-lg sm:leading-8">
                Uma plataforma de gestão e competição futebolística onde constróis um clube, disputas universos, dominas o mercado e transformas resultados em história.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-12 bg-[#f2b705] px-7 font-extrabold text-black shadow-[0_0_40px_rgba(242,183,5,.14)] hover:bg-[#ffd34a]">
                  <Link href="/auth/sign-up">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 border-white/10 bg-white/[0.025] px-7 text-white hover:border-[#f2b705]/30 hover:bg-white/[0.05]">
                  <a href="#plataforma">Descobrir a plataforma</a>
                </Button>
              </div>

              <div className="mt-14 grid max-w-2xl grid-cols-3 border-y border-white/[0.07] py-5">
                <div><p className="text-xl font-black text-[#f2b705]">1</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/38">Clube por universo</p></div>
                <div className="border-x border-white/[0.07] px-5"><p className="text-xl font-black text-white">3</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/38">Moedas especializadas</p></div>
                <div className="pl-5"><p className="text-xl font-black text-white">∞</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/38">Histórias para criar</p></div>
              </div>
            </div>

            <div className="relative hidden min-h-[600px] lg:block">
              <div className="absolute inset-x-10 top-8 aspect-square rounded-full border border-[#f2b705]/20 bg-[radial-gradient(circle,rgba(242,183,5,.12),rgba(11,11,11,.7)_45%,transparent_68%)] shadow-[0_0_120px_rgba(242,183,5,.08)]">
                <div className="absolute inset-[8%] rounded-full border border-white/[0.06]" />
                <div className="absolute inset-[18%] rounded-full border border-[#f2b705]/15" />
                <Image src="/brand/clan-logo.svg" alt="Clã das Sombras" fill className="scale-[0.68] object-contain drop-shadow-[0_0_35px_rgba(242,183,5,.18)]" />
              </div>
              <div className="absolute bottom-14 left-0 w-[260px] border border-white/[0.08] bg-[#0b0b0b]/90 p-5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f2b705]">Próxima jornada</p>
                <div className="mt-4 flex items-center justify-between text-lg font-black"><span>CLÃ</span><span className="text-white/25">VS</span><span>RIVAL</span></div>
                <p className="mt-3 text-xs text-white/38">Liga Principal · Jornada 12</p>
              </div>
              <div className="absolute right-0 top-24 w-[230px] border border-[#f2b705]/15 bg-[#0b0b0b]/90 p-5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/38">Prestígio</p>
                <div className="mt-2 flex items-end gap-2"><span className="text-4xl font-black text-[#f2b705]">2.850</span><Trophy className="mb-1 h-5 w-5 text-[#f2b705]" /></div>
                <div className="mt-4 h-1 overflow-hidden bg-white/[0.06]"><div className="h-full w-[72%] bg-[#f2b705]" /></div>
              </div>
            </div>
          </div>
        </section>

        <section id="plataforma" className="border-y border-white/[0.06] bg-[#080808]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f2b705]">O sistema</p>
                <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.035em] sm:text-4xl">Não é só jogar.<br /><span className="text-white/38">É gerir para vencer.</span></h2>
                <p className="mt-6 max-w-md leading-7 text-white/48">O Clã das Sombras liga decisões de gestão, competição e economia num único ciclo. Ganhar importa — mas construir um clube sustentável importa também.</p>
              </div>
              <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                {pillars.map(({ icon: Icon, eyebrow, title, description }, index) => (
                  <div key={eyebrow} className="group grid gap-5 py-7 sm:grid-cols-[60px_1fr] sm:py-8">
                    <div className="flex h-11 w-11 items-center justify-center border border-white/[0.08] bg-white/[0.025] text-white/40 transition group-hover:border-[#f2b705]/25 group-hover:text-[#f2b705]"><Icon className="h-5 w-5" /></div>
                    <div>
                      <div className="flex items-center gap-3"><span className="text-[10px] font-bold tracking-[0.2em] text-[#f2b705]">0{index + 1}</span><span className="text-[10px] font-bold tracking-[0.2em] text-white/30">{eyebrow}</span></div>
                      <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">{title}</h3>
                      <p className="mt-2 max-w-2xl leading-6 text-white/45">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="competir" className="relative overflow-hidden">
          <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 bg-[#f2b705]/[0.035] blur-[130px]" />
          <div className="mx-auto max-w-[1440px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f2b705]">O teu universo competitivo</p>
              <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Cada jornada deixa uma marca.</h2>
              <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/48">Liga, Taça, ranking, rivalidades e jornal automático transformam partidas isoladas numa temporada com contexto e memória.</p>
            </div>

            <div className="mx-auto mt-14 max-w-5xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-8">
              <div className="flex flex-col gap-6 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f2b705]">Liga Principal · Jornada 12</p><p className="mt-2 text-sm text-white/35">Resultado confirmado · Settlement concluído</p></div>
                <span className="w-fit border border-[#f2b705]/20 bg-[#f2b705]/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2b705]">Oficial</span>
              </div>
              <div className="grid items-center gap-7 py-10 text-center sm:grid-cols-[1fr_auto_1fr]">
                <div><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#f2b705]/20 bg-[#f2b705]/[0.05]"><Shield className="h-9 w-9 text-[#f2b705]" /></div><p className="mt-4 text-lg font-black uppercase">Clã das Sombras FC</p></div>
                <div><p className="text-5xl font-black tracking-[-0.08em] sm:text-6xl">3 <span className="text-white/20">—</span> 1</p><p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/30">Final</p></div>
                <div><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.025]"><Shield className="h-9 w-9 text-white/30" /></div><p className="mt-4 text-lg font-black uppercase text-white/65">Shadow United</p></div>
              </div>
              <div className="grid grid-cols-3 border-t border-white/[0.07] pt-6 text-center text-sm"><div><strong className="block text-white">+18</strong><span className="text-white/35">Elo</span></div><div className="border-x border-white/[0.07]"><strong className="block text-[#f2b705]">+120</strong><span className="text-white/35">Adeptos</span></div><div><strong className="block text-white">+420</strong><span className="text-white/35">Silver líquido</span></div></div>
            </div>
          </div>
        </section>

        <section id="economia" className="border-y border-white/[0.06] bg-[#080808]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f2b705]">Economia com propósito</p><h2 className="mt-4 max-w-xl text-3xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Recursos diferentes. Decisões diferentes.</h2></div>
              <p className="max-w-xl leading-7 text-white/48 lg:justify-self-end">Gold monetiza serviços premium e financiamento, Silver mantém a economia de cada clube e Bronze recompensa participação e personalização. Sem uma moeda genérica a fazer tudo.</p>
            </div>
            <div className="mt-14 grid gap-px overflow-hidden border border-white/[0.07] bg-white/[0.07] md:grid-cols-3">
              <div className="bg-[#0b0b0b] p-7"><WalletCards className="h-6 w-6 text-[#f2b705]" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#f2b705]">Gold</p><p className="mt-2 text-2xl font-black">Premium & financiamento</p><p className="mt-3 text-sm leading-6 text-white/42">Global ao utilizador. Comprado através da plataforma e usado em serviços premium.</p></div>
              <div className="bg-[#0b0b0b] p-7"><Coins className="h-6 w-6 text-[#c7c7c7]" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#c7c7c7]">Silver</p><p className="mt-2 text-2xl font-black">A economia do clube</p><p className="mt-3 text-sm leading-6 text-white/42">Pertence ao clube e universo: mercado, salários, manutenção, receitas e dívida.</p></div>
              <div className="bg-[#0b0b0b] p-7"><Coins className="h-6 w-6 text-[#bd7437]" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#bd7437]">Bronze</p><p className="mt-2 text-2xl font-black">Engagement & identidade</p><p className="mt-3 text-sm leading-6 text-white/42">Ganho através de participação e usado em cosméticos, colecionáveis e personalização.</p></div>
            </div>
          </div>
        </section>

        <section id="universos">
          <div className="mx-auto max-w-[1440px] px-5 py-20 lg:px-8 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f2b705]">Universos</p>
                <h2 className="mt-4 max-w-2xl text-3xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Um manager. Vários mundos competitivos.</h2>
                <p className="mt-6 max-w-2xl leading-7 text-white/48">Tens uma identidade global e um clube independente em cada universo. Entra no Universo Principal, cria uma liga de amigos ou gere uma comunidade competitiva sem misturar economias e rankings.</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">{ecosystem.map(({ icon: Icon, label, detail }) => <div key={label} className="flex gap-4 border-t border-white/[0.07] py-4"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#f2b705]" /><div><p className="font-semibold">{label}</p><p className="mt-1 text-sm text-white/38">{detail}</p></div></div>)}</div>
              </div>
              <div className="relative mx-auto aspect-square w-full max-w-[520px]">
                <div className="absolute inset-[5%] rounded-full border border-[#f2b705]/20" />
                <div className="absolute inset-[18%] rounded-full border border-white/[0.08]" />
                <div className="absolute inset-[30%] rounded-full border border-[#f2b705]/20 bg-[#f2b705]/[0.035]" />
                <Image src="/brand/clan-logo.svg" alt="" fill className="scale-[0.48] object-contain opacity-90" />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 border border-white/[0.08] bg-[#0b0b0b] px-4 py-2 text-xs font-bold">Principal</span>
                <span className="absolute right-0 top-[22%] border border-white/[0.08] bg-[#0b0b0b] px-4 py-2 text-xs font-bold">Amigos</span>
                <span className="absolute bottom-[12%] right-[10%] border border-white/[0.08] bg-[#0b0b0b] px-4 py-2 text-xs font-bold">Comunidade</span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#080808]">
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f2b705]/[0.08] blur-[100px]" />
          <div className="relative mx-auto max-w-4xl px-5 py-24 text-center lg:py-32">
            <Image src="/brand/clan-logo.svg" alt="" width={100} height={100} className="mx-auto h-24 w-24 object-contain" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-[#f2b705]">A época começa aqui</p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.045em] sm:text-6xl">Cria o clube.<br />Constrói o legado.</h2>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-white/48">Entra no Clã das Sombras e começa a construir a tua história competitiva.</p>
            <Button size="lg" asChild className="mt-9 h-12 bg-[#f2b705] px-8 font-extrabold text-black hover:bg-[#ffd34a]"><Link href="/auth/sign-up">Criar conta <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#050505]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-9 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3"><Image src="/brand/clan-logo.svg" alt="" width={38} height={38} className="h-9 w-9 object-contain" /><div><p className="text-sm font-black uppercase text-[#f2b705]">Clã das Sombras</p><p className="text-xs text-white/30">Gestão · Competição · Recompensas</p></div></div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Clã das Sombras. Plataforma de gestão e competição futebolística.</p>
        </div>
      </footer>
    </div>
  )
}
