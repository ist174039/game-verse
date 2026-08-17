'use client'

import { useState } from 'react'
import {
  Users,
  CreditCard,
  Coins,
  BarChart3,
  Search,
  Download,
  ShieldAlert,
  Trophy,
  Activity,
  DollarSign,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type BackofficeTab = 'users' | 'cards' | 'coins' | 'reports'

const mockUsers = [
  { id: 'USR-0047', username: '⚡ CarloFC', email: 'carlo@email.com', role: 'user', gc: 42500, status: 'Activo', registered: 'Jan 15, 2026' },
  { id: 'USR-0048', username: '🐉 FC Dragon', email: 'dragon@email.com', role: 'user', gc: 18200, status: 'Activo', registered: 'Fev 3, 2026' },
  { id: 'USR-0049', username: '🔥 ThunderFC', email: 'thunder@email.com', role: 'moderador', gc: 31500, status: 'Activo', registered: 'Mar 20, 2026' },
  { id: 'USR-0050', username: '🦅 Red Eagles', email: 'eagles@email.com', role: 'user', gc: 8900, status: 'Suspenso', registered: 'Abr 1, 2026' },
  { id: 'USR-0051', username: '👻 Dark Knights', email: 'dark@email.com', role: 'user', gc: 5600, status: 'Activo', registered: 'Abr 15, 2026' },
  { id: 'USR-0052', username: '⭐ BlueStars', email: 'blue@email.com', role: 'admin', gc: 68900, status: 'Activo', registered: 'Dez 1, 2025' },
]

const kpis = [
  { value: '156', label: 'Utilizadores Activos', icon: <Users className="h-4 w-4" />, bg: 'bg-emerald-50 dark:bg-emerald-950', textColor: 'text-emerald-700 dark:text-emerald-300' },
  { value: '1,245,800', label: 'GC em Circulação', icon: <Coins className="h-4 w-4" />, bg: 'bg-amber-50 dark:bg-amber-950', textColor: 'text-amber-700 dark:text-amber-300' },
  { value: '48', label: 'Jogos Hoje', icon: <Activity className="h-4 w-4" />, bg: 'bg-blue-50 dark:bg-blue-950', textColor: 'text-blue-700 dark:text-blue-300' },
  { value: '€2,450', label: 'Receita Total', icon: <DollarSign className="h-4 w-4" />, bg: 'bg-violet-50 dark:bg-violet-950', textColor: 'text-violet-700 dark:text-violet-300' },
]

const roleBadge = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    moderador: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  }
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', colors[role] || 'bg-secondary text-muted-foreground')}>
      {role}
    </span>
  )
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Activo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    Suspenso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    Banido: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  }
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', colors[status] || 'bg-secondary text-muted-foreground')}>
      {status}
    </span>
  )
}

export function BackofficeClient() {
  const [activeTab, setActiveTab] = useState<BackofficeTab>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredUsers = mockUsers.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          Backoffice — Administração da Plataforma
        </h1>
        <span className="mt-1 inline-block rounded-lg bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
          Admin Only
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div key={i} className={cn('rounded-lg border border-border p-3', kpi.bg)}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              {kpi.icon}
              {kpi.label}
            </div>
            <div className={cn('text-xl font-bold', kpi.textColor)}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1">
        {([
          { key: 'users', label: '👥 UserManager' },
          { key: 'cards', label: '🃏 Cartas' },
          { key: 'coins', label: '💰 GameCoins' },
          { key: 'reports', label: '📊 Relatórios' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* User Manager */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="🔍 Pesquisar por username, email ou ID…"
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">Todos os roles</option>
              <option value="user">user</option>
              <option value="moderador">moderador</option>
              <option value="admin">admin</option>
            </select>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os estados</option>
              <option value="activo">Activo</option>
              <option value="suspenso">Suspenso</option>
              <option value="banido">Banido</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">GC</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registado</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u, i) => (
                  <tr key={i} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <code className="text-[10px] text-muted-foreground">{u.id}</code>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{u.username}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">{u.gc.toLocaleString()}</td>
                    <td className="px-4 py-3">{statusBadge(u.status)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.registered}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">✏️</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-600">🚫</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards Management */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">🃏 Gestão de Cartas</h3>
            <div className="flex gap-2">
              <Button size="sm">+ Nova Carta</Button>
              <Button size="sm" variant="outline">📤 Importar CSV</Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            <CreditCard className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p>Criação e edição de cartas de jogador (nome, posição, rating, nacionalidade, imagem)</p>
            <p className="text-sm mt-1">Cartas de infraestrutura (tipo, nível, bonus_pct, preço base)</p>
            <p className="text-sm mt-3 text-foreground font-medium">Em breve — interface de gestão completa</p>
          </div>
        </div>
      )}

      {/* GameCoins Management */}
      {activeTab === 'coins' && (
        <div className="space-y-4">
          <h3 className="font-bold text-foreground">💰 Gestão de GameCoins</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-medium text-foreground mb-3">Distribuição Manual</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Utilizador</label>
                  <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option>Seleccionar utilizador…</option>
                    {mockUsers.map((u, i) => (
                      <option key={i}>{u.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Quantidade (GC)</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Motivo</label>
                  <Input placeholder="ex: Bónus de participação" />
                </div>
                <Button className="w-full">Distribuir GC</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-medium text-foreground mb-3">Configurações</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de mercado</span>
                  <span className="font-medium text-foreground">5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recompensa vitória (Liga)</span>
                  <span className="font-medium text-foreground">+150 GC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recompensa empate</span>
                  <span className="font-medium text-foreground">+50 GC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recompensa casual (vitória)</span>
                  <span className="font-medium text-foreground">+50 GC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bónus infraestrutura (max)</span>
                  <span className="font-medium text-foreground">20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Limite diário casual</span>
                  <span className="font-medium text-foreground">500 GC</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">Editar Configurações</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="font-bold text-foreground">📊 Relatórios & KPIs</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-medium text-foreground mb-2">Exportar Relatórios</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Transacções (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Utilizadores Activos (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Economia — GC em circulação (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Relatório Completo da Plataforma
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-medium text-foreground mb-2">Resumo Rápido</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">GC criados (hoje)</span>
                  <span className="font-medium text-foreground">+12,500 GC</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">GC removidos (hoje)</span>
                  <span className="font-medium text-foreground">-3,200 GC</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Novos registos (hoje)</span>
                  <span className="font-medium text-foreground">+8</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Jogos concluídos (hoje)</span>
                  <span className="font-medium text-foreground">48</span>
                </div>
                <div className="flex justify-between py-1 border-t border-border mt-2 pt-2">
                  <span className="text-muted-foreground">Receita Stripe (mês)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">€2,450</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
