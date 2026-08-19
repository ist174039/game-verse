import Link from 'next/link'
import { ArrowLeft, CircleDollarSign, ShieldAlert, Shirt, Swords, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlayerCard } from '@/components/clan/player-card'
import { PlayerMarketAction } from '@/components/team/player-market-action'
import type { SquadReadModel } from '@/lib/application/read-models'

export function TeamManagementClient({ squad }: { squad: SquadReadModel }) {
  const minimumGap = Math.max(0, squad.universe.minSquadSize - squad.totals.squadSize)
  const capacity = Math.max(1, squad.universe.maxSquadSize)
  const occupancy = Math.min(100, Math.round((squad.totals.squadSize / capacity) * 100))

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/dashboard?universe=${squad.universe.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar ao clube</Link>
        <span className="text-xs text-muted-foreground">{squad.universe.name}</span>
      </div>

      <section className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="clan-kicker">Plantel · {squad.club.name}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">O plantel é património competitivo e económico.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Overall e atributos vêm do provider externo. Posse, disponibilidade, contrato, valor e salário pertencem ao ativo dentro deste universo.</p></div>
          <Button asChild><Link href={`/play?universe=${squad.universe.id}`}><Swords className="mr-2 h-4 w-4" />Preparar próxima partida</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RosterRule label="Plantel" value={`${squad.totals.squadSize}/${squad.universe.maxSquadSize}`} detail={minimumGap > 0 ? `Faltam ${minimumGap} para o mínimo de ${squad.universe.minSquadSize}.` : `Mínimo de ${squad.universe.minSquadSize} cumprido.`} accent={minimumGap === 0} />
        <RosterRule label="Ativos / Reserva" value={`${squad.totals.active} / ${squad.totals.reserve}`} detail={`${squad.totals.unavailable} indisponíveis neste momento.`} />
        <RosterRule label="Valor ref. plantel" value={formatSilver(squad.totals.marketReferenceValue)} detail="Soma do valor de referência dos ativos." />
        <RosterRule label="Folha salarial" value={formatSilver(squad.totals.contractPayroll || squad.totals.salaryReference)} detail={squad.totals.contractPayroll > 0 ? 'Contratos ativos.' : 'Referência salarial enquanto não existem contratos ativos.'} />
      </section>

      <section className="clan-panel-neutral rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Jogadores do clube</p><h2 className="mt-1 text-xl font-black">Plantel real</h2><p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">As operações de mercado respeitam automaticamente o mínimo competitivo e bloqueiam jogadores que estejam num onze pendente.</p></div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"><span>{occupancy}% ocupado</span><span>·</span><span>{squad.totals.listed} à venda</span><span>·</span><span>{squad.totals.auction} em leilão</span></div>
        </div>

        {squad.players.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center"><Users className="h-10 w-10 text-primary/35" /><p className="mt-4 text-sm font-bold">Este clube ainda não tem jogadores.</p><p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">Quando os ativos UNIVERSE_PLAYER forem atribuídos ou adquiridos, aparecem aqui automaticamente. Não existe fallback com jogadores fictícios.</p></div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {squad.players.map(entry => <div key={entry.asset.id} className="min-w-0"><PlayerCard player={{ name: entry.player.name, position: entry.player.position, rating: entry.player.overall, imageUrl: entry.player.imageUrl, nationality: entry.player.nationality, marketValue: entry.asset.marketReferenceValue, salary: entry.activeContract?.salary ?? entry.asset.salaryReference, salaryIsReference: !entry.activeContract, status: entry.asset.status, sourceLabel: entry.player.provider }} /><PlayerMarketAction universePlayerId={entry.asset.id} playerName={entry.player.name} status={entry.asset.status} marketReferenceValue={entry.asset.marketReferenceValue} /></div>)}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <RosterPolicy icon={Shirt} title="Fonte externa" text="Overall e atributos são dados canónicos do provider; a plataforma não inventa progressão de jogador." />
        <RosterPolicy icon={ShieldAlert} title="Proteção competitiva" text="Um jogador usado num onze pendente ou necessário para cumprir o mínimo da competição não pode ser retirado do plantel operacional." />
        <RosterPolicy icon={CircleDollarSign} title="Contrato ≠ referência" text="O salário contratual é obrigação real do clube. Salary reference é apenas referência económica para operações e propostas." />
      </section>
    </div>
  )
}

function formatSilver(value: number) { return `${value.toLocaleString('pt-PT')} S` }
function RosterRule({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) { return <article className="border-t border-white/[0.08] px-1 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-black sm:text-3xl ${accent ? 'text-primary' : ''}`}>{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></article> }
function RosterPolicy({ icon: Icon, title, text }: { icon: typeof Shirt; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><p className="text-sm font-black">{title}</p></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></article> }
