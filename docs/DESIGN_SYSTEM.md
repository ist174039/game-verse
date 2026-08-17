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

## Buttons and actions
- Todo botão de ação deve usar `components/ui/button.tsx`. Não criar CTAs com classes isoladas quando uma variante existente resolve o caso.
- `default`: ação principal da página/fluxo. Usar no máximo uma ação dominante por contexto visual.
- `outline`: ação secundária importante.
- `secondary`: ações operacionais neutras.
- `ghost`: navegação/utilidades de baixo peso.
- `destructive`: operações reversíveis ou perigosas; nunca usar gold para ações destrutivas.
- Altura táctil alvo em mobile: 44px para ação principal; icon buttons não devem ficar abaixo de 40px salvo controlos densos e não críticos.
- Ações no `PageHeader` ocupam a largura disponível no mobile e voltam ao tamanho natural no desktop.
- Não esconder a única ação principal de uma página só porque o viewport é pequeno.
- Grupos com 3+ ações devem priorizar a primária e mover ações secundárias para menu/drawer quando necessário.
- Loading deve manter largura e posição do botão para evitar layout shift.
- Disabled precisa de parecer indisponível sem perder completamente legibilidade.

## Modal and confirmation policy
- **Proibido** usar `window.alert`, `alert()`, `window.confirm` ou `confirm()` na aplicação.
- Feedback que exige leitura/decisão usa `Dialog`/`ConfirmationDialog`.
- No mobile, o mesmo componente apresenta-se como bottom sheet; no desktop como modal central.
- Operações destrutivas mostram contexto, consequência e dois caminhos claros: cancelar e confirmar.
- Nunca mostrar apenas “Tem a certeza?” sem explicar o objeto e o impacto da ação.
- Erros de formulário inline continuam junto ao campo; erros operacionais que bloqueiam o fluxo podem usar modal.
- Toast pode ser usado apenas para feedback transitório não crítico, nunca para consentimento ou decisões irreversíveis.

## Forms and touch targets
- Inputs e selects têm 44px no mobile e tipografia de 16px para evitar zoom automático no iOS.
- Elementos clicáveis devem ter spacing suficiente para uso com polegar.
- Select items e menus devem ter altura mínima confortável para toque.
- Formulários longos no mobile devem ser divididos em secções, steps ou sheets; evitar uma única parede de campos.

## Page patterns
- App Shell desktop: sidebar 272px.
- App Shell mobile: topbar compacta + bottom navigation para ações primárias + bottom sheet “Mais” para navegação completa.
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
Mobile reorganiza, não encolhe desktop. Priorizar contexto + ação principal, usar modal/bottom sheet, converter tabelas quando necessário e preservar identidade do clube sem desperdiçar viewport.

### Mobile navigation
- Bottom navigation: Início, Clube, Jogar, Competições e Mais.
- “Mais” abre um bottom sheet com navegação secundária, economia, mercado, comunidade, perfil e operações permitidas.
- Respeitar `safe-area-inset-bottom` em dispositivos com gesture bar/notch.
- O conteúdo da aplicação deve reservar espaço para a bottom navigation; nada importante pode ficar escondido atrás dela.

### Mobile tables
- Não reduzir simplesmente uma tabela larga até ficar ilegível.
- Quando comparação entre colunas não é essencial, converter linha em item/card compacto.
- Quando comparação é essencial, manter tabela com scroll horizontal explícito, primeira coluna sticky quando fizer sentido e ações acessíveis sem scroll extremo.

## Enforcement
Nenhuma página cria cores arbitrárias. Novos tokens entram primeiro em `app/globals.css`. Componentes reutilizáveis precedem implementações específicas de páginas. Qualquer novo fluxo com confirmação deve passar pelo sistema de modal; qualquer nova ação deve verificar primeiro as variantes globais do `Button`.
