# Clã das Sombras — Design System

## North Star
Dark Premium + Football + Competitive Gaming + Sports Management. A interface deve comunicar prestígio, competição e gestão sem parecer SaaS genérico, casino ou UI gaming infantil.

## Brand assets
- Logo oficial da aplicação: `/public/brand/clan-logo.svg` (derivado da referência fornecida pelo produto).
- O leão é assinatura, não decoração repetitiva. Usar em brand lockup, watermark subtil, estados especiais, achievements e superfícies editoriais.

## Tokens
### Neutral surfaces
- background `#050505`
- surface `#0B0B0B`
- elevated `#111111`
- interactive/hover `#161616`

### Gold
- gold-300 `#FFE27A`
- gold-400 `#FFD23F`
- gold-500 `#F5BF16`
- gold-600 `#C99108`
- metallic `#D7A51C`

Gold comunica ação, valor, conquista, competição, seleção e identidade. Não usar como cor normal de conteúdo.

### Currencies
- Gold: amarelo/dourado + ícone Gold
- Silver: cinza metálico + ícone Silver
- Bronze: castanho/cobre + ícone Bronze
Nunca depender apenas da cor.

## Hierarquia visual
1. Identidade/contexto do clube
2. Próximo jogo e situação competitiva
3. Recursos e saúde económica
4. Competição/ranking
5. Plantel/mercado
6. Atividade
KPIs secundários têm menor peso visual.

## Surfaces
Evitar card dentro de card e borders em todas as regiões. Preferir spacing, contraste de surface, headers e separadores subtis. `clan-panel` é reservado para superfícies premium; `clan-panel-neutral` para gestão operacional.

## Effects
Glow só em CTA premium, seleção, troféus, ranking, moeda, rewards e momentos especiais. Formulários, tabelas, navegação e admin devem ser sóbrios.

## Typography
- Display/competition: peso 700–900, tracking compacto; resultados, títulos, ranking e conquistas.
- Interface: Inter/Geist legível; navegação, tabelas, filtros, gestão e admin.

## Page patterns
- App Shell: sidebar desktop 272px; topbar + drawer em mobile.
- Public/search: PageHeader → Search/Filters → Results → Pagination.
- Entity detail: Identity Hero → primary status/actions → tabs/sections → contextual side rail quando houver espaço.
- Admin: header compacto → KPI/alerts → filters → dense table/work queue → contextual actions.

## Core components
Normalizar antes de páginas: AppShell, PageHeader, SectionHeader, Button, Input, Select, Search, Filters, Tabs, Card/Surface, PlayerCard, ClubCard, MatchCard, CompetitionCard, CurrencyDisplay, Ranking, Table, Pagination, Modal, Drawer, Toast, Tooltip, Badge, EmptyState, Skeleton, ErrorState, ConfirmationDialog.

## Football primitives
- ClubIdentity: escudo/logo, nome, universo, divisão, ranking, prestígio.
- MatchCard: competição/jornada, clubes, score dominante, estado, data e stats essenciais.
- PlayerCard: foto, nome, posição, rating, market value, ownership/status. Não mostrar evolução interna de atributos: os ratings vêm da fonte externa.
- Ranking: Top 3 premium; restantes densos e legíveis.

## Admin
Mesma marca, menor teatralidade: fundos dark, gold em seleção/ações importantes, alta densidade, filtros fortes, tabelas legíveis, audit trail e ações sensíveis claramente separadas.

## Responsive
Mobile reorganiza, não encolhe desktop. Priorizar contexto + ação principal, usar drawer/bottom sheet, converter tabelas quando necessário e preservar identidade do clube sem desperdiçar viewport.

## Enforcement
Nenhuma página cria cores arbitrárias. Novos tokens entram primeiro em `app/globals.css`. Componentes reutilizáveis precedem implementações específicas de páginas.
