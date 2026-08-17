'use client'

import { useState } from 'react'
import {
  Shield,
  Users,
  Trophy,
  Calendar,
  Newspaper,
  Settings,
  AlertTriangle,
  Play,
  XCircle,
  RotateCcw,
  Archive,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AdminTab = 'championships' | 'participants' | 'season' | 'packs' | 'news' | 'settings'

const championships = [
  {
    name: 'Liga Principal — Temp. 3',
    type: 'Round Robin',
    status: 'Em Curso',
    statusColor: 'orange',
    teams: '16/16',
    phase: 'Jornada 5/15',
  },
  {
    name: 'Taça Portugal VR',
    type: 'Eliminatória',
    status: 'Quartos-Final',
    statusColor: 'blue',
    teams: '8 restantes',
    phase: 'Quartos',
  },
  {
    name: 'Torneio Amigável Jun\'26',
    type: 'Grupos',
    status: 'Inscrições Abertas',
    statusColor: 'green',
    teams: '6/8',
    phase: '—',
  },
]

const recentEvents = [
  { club: 'FC Dragon', event: 'Multa por atraso na submissão de resultado', value: '-500 GC', valueColor: 'red', date: 'Jun 3', status: 'Pendente', statusColor: 'orange' },
  { club: 'Phoenix United', event: 'Salário semanal automático', value: '-1,200 GC', valueColor: 'red', date: 'Jun 3', status: 'Processado', statusColor: 'green' },
  { club: 'CarloFC', event: 'Prémio — Selecção da Semana', value: '+800 GC', valueColor: 'green', date: 'Jun 2', status: 'Distribuído', statusColor: 'green' },
]

const statusBadge = (label: string, color: string) => {
  const colors: Record<string, string> = {
    orange: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  }
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium', colors[color] || 'bg-secondary text-muted-foreground')}>
      {label}
    </span>
  )
}

export function AdminPanelClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>('championships')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-violet-500" />
          Painel Admin — Liga Portugal Virtual
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="rounded-lg bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            Comissário: CarloFC
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { value: '32', label: 'Membros Activos', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-300' },
          { value: '3', label: 'Campeonatos em Curso', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300' },
          { value: '12', label: 'Jogos Pendentes', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300' },
          { value: '2', label: 'Disputas Abertas', bg: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300' },
        ].map((kpi, i) => (
          <div key={i} className={cn('rounded-lg border p-3 text-center', kpi.bg)}>
            <div className={cn('text-2xl font-bold', kpi.textColor)}>{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 flex-wrap">
        {([
          { key: 'championships', label: 'Campeonatos', icon: <Trophy className="h-4 w-4" /> },
          { key: 'participants', label: 'Participantes', icon: <Users className="h-4 w-4" /> },
          { key: 'season', label: 'Temporada', icon: <Calendar className="h-4 w-4" /> },
          { key: 'packs', label: 'Packs & Cartas', icon: <TrendingUp className="h-4 w-4" /> },
          { key: 'news', label: 'Notícias', icon: <Newspaper className="h-4 w-4" /> },
          { key: 'settings', label: 'Configurações', icon: <Settings className="h-4 w-4" /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Championship Management */}
      {activeTab === 'championships' && (
        <div className="space-y-4">
          <h3 className="font-bold text-foreground">🏆 Campeonatos Activos:</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campeonato</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Equipas</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fase</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {championships.map((c, i) => (
                  <tr key={i} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3">{statusBadge(c.type, 'blue')}</td>
                    <td className="px-4 py-3">{statusBadge(c.status, c.statusColor)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.teams}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phase}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">⚙️ Gerir</Button>
                        {c.status === 'Inscrições Abertas' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">▶ Iniciar</Button>
                            <Button size="sm" variant="outline">🔀 Mercado</Button>
                          </>
                        )}
                        {c.status === 'Quartos-Final' && (
                          <Button size="sm" variant="destructive">🚫 Cancelar</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Participants */}
      {activeTab === 'participants' && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Gestão de participantes — pesquisa, roles e estatísticas.</p>
          <p className="text-sm mt-1">Funcionalidade completa em desenvolvimento.</p>
        </div>
      )}

      {/* Season Operations */}
      {activeTab === 'season' && (
        <div className="space-y-4">
          <h3 className="font-bold text-foreground">🔄 Operações de Temporada:</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-red-400 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset Caixas & Rankings
            </Button>
            <Button variant="outline" className="border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950">
              <Archive className="mr-1.5 h-4 w-4" />
              Fechar Temporada & Arquivar
            </Button>
            <Button variant="outline">
              <TrendingUp className="mr-1.5 h-4 w-4" />
              Selecção da Semana
            </Button>
            <Button variant="outline">
              <Newspaper className="mr-1.5 h-4 w-4" />
              Publicar Notícia
            </Button>
            <Button variant="outline">
              🃏 Configurar Packs
            </Button>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <strong>⚠️ Reset é irreversível.</strong> Faz sempre um arquivo histórico antes de resetar caixas, rankings ou salários. O arquivo fica acessível em <em>Temporada → Histórico</em>.
          </div>

          {/* Recent Events */}
          <h3 className="font-bold text-foreground mt-4">👤 Últimos Eventos de Gestão:</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Clube</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Evento</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentEvents.map((evt, i) => (
                  <tr key={i} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{evt.club}</td>
                    <td className="px-4 py-3 text-muted-foreground">{evt.event}</td>
                    <td className={cn('px-4 py-3 font-bold', evt.valueColor === 'red' ? 'text-red-600' : 'text-emerald-600')}>{evt.value}</td>
                    <td className="px-4 py-3 text-muted-foreground">{evt.date}</td>
                    <td className="px-4 py-3">{statusBadge(evt.status, evt.statusColor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Packs & Cartas */}
      {activeTab === 'packs' && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Configuração de packs de cartas e infraestruturas.</p>
          <p className="text-sm mt-1">Gerir tipos, níveis, preços e raridades disponíveis.</p>
        </div>
      )}

      {/* News */}
      {activeTab === 'news' && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          <Newspaper className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Publicar notícias e comunicados no portal do universo.</p>
          <p className="text-sm mt-1">Anúncios, resultados, selecção da semana.</p>
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          <Settings className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Configurações gerais da liga/universo.</p>
          <p className="text-sm mt-1">Regras, FEES, limites, integrações.</p>
        </div>
      )}
    </div>
  )
}
