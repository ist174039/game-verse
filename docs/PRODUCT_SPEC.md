# Clã das Sombras — Especificação Funcional Mestre

## 1. Princípios estruturais

- O utilizador é único e global na plataforma.
- Um utilizador pode participar em vários universos.
- Cada utilizador pode ter no máximo um clube por universo.
- O Universo Principal é oficial e governado pela plataforma.
- Universos comunitários são criados por utilizadores mediante custo em Gold.
- Comunidade e Universo são entidades distintas: Comunidade é social; Universo é competitivo/económico.
- Jogadores de futebol são dados externos canónicos, sincronizados por provider, e não evoluem dentro da plataforma.
- Cada jogador pode existir apenas uma vez por universo, embora possa existir em universos diferentes.
- Toda operação económica é ledger-first, auditável e idempotente.

## 2. Moedas

### Gold
- Âmbito global do utilizador.
- Comprável via Stripe.
- Usado para criação/expansão de Universos, premium, season pass, branding e operações controladas de financiamento.
- Pode financiar Silver apenas através de produtos financeiros definidos; não existe câmbio livre.

### Silver
- Âmbito clube + universo.
- Capital operacional do clube.
- Usado em jogadores, salários, mercado, leilões, manutenção, competições, infraestrutura, empréstimos e obrigações.
- Não sai do universo.
- Cada novo clube recebe um starting budget definido pelas regras do universo.

### Bronze
- Âmbito global do utilizador.
- Ganho por atividade, missões, daily, achievements e eventos.
- Usado para engagement, cosméticos, colecionáveis e conteúdo sazonal.
- Não converte livremente para Gold ou Silver.

## 3. Utilizador, clube e progressão

### Utilizador global
- identidade, autenticação, manager XP/level, Gold, Bronze, achievements globais e reputação.
- username e fotografia/avatar são identidade editável pelo próprio manager.
- manager level, XP e reputação são progressão protegida e nunca são editáveis diretamente pelo browser.

### Clube por universo
- identidade, Silver, Elo, divisão, classificação, prestígio, adeptos, plantel, infraestruturas, património, dívidas, troféus e histórico.
- cada clube tem emblema, nome e lema próprios.
- cada clube pode manter três equipamentos de identidade visual: HOME, AWAY e THIRD.
- equipamentos não alteram ratings, resultados ou vantagens competitivas.

### Métricas separadas
- Elo: força competitiva atual, sobe/desce.
- Classificação: performance da época.
- Divisão: contexto competitivo sazonal.
- Prestígio: feitos históricos do clube; normalmente não desce.
- Adeptos: popularidade/economia; pode subir ou descer.
- Manager Level: progressão global permanente.
- Reputação: confiança/comportamento global.

## 4. Universos

Tipos: OFFICIAL e COMMUNITY.

Lifecycle: DRAFT -> CONFIGURING -> OPEN_FOR_MEMBERS -> ACTIVE -> SEASON_RUNNING -> SEASON_CLOSED -> ACTIVE -> ARCHIVED, com SUSPENDED/CANCELLED para exceções.

Roles: OWNER, ADMIN, MODERATOR, MEMBER.

Políticas de entrada: PUBLIC, APPLICATION, INVITE_ONLY, PRIVATE.

Regras configuráveis dentro de limites da plataforma:
- starting_silver
- squad min/max
- divisões e clubes por divisão
- promoção/descida
- transfer policy
- taxas de mercado/leilão
- financiamento externo
- empréstimos
- calendário e temporadas

Regras críticas ficam protegidas pela plataforma: ledger, Stripe, segurança, auditoria, fraude e integridade de resultados.

## 5. Jogadores e mercado

### Player Master
Entidade canónica global proveniente de base externa: provider, external_id, nome, posição, overall, atributos, nacionalidade, clube/equipa de origem, versão e updated_at.

### Universe Player
Representa a disponibilidade/propriedade do jogador dentro de um universo. Estados principais: AVAILABLE, OWNED, LISTED, AUCTION, FREE_AGENT, UNAVAILABLE.

### Atualizações externas
Quando o provider atualiza atributos/overall:
- Player Master é atualizado.
- Preço de compra à plataforma, valor de referência e salary reference são recalculados.
- Jogador já adquirido não gera cobrança/reembolso retroativo.
- Contratos existentes mantêm o salário até renovação.

### Mercado
- Compra primária à plataforma em Silver.
- Venda direta entre clubes.
- Leilão com escrow e settlement atómico.
- Quick Sell à plataforma abaixo do valor de referência para gerar liquidez imediata.
- Taxas de mercado funcionam como Silver sinks.
- Mercado é isolado por universo.

## 6. Plantel, contratos e salários

- Plantel mínimo/máximo configurável por universo dentro de limites da plataforma.
- Formação válida é verificada por competição, não pela composição patrimonial do plantel.
- Salário depende da referência desportiva atual, não do preço especulativo da última venda.
- Contratos têm início/fim, salário e estado.
- Expiração leva a renovação ou FREE_AGENT.
- Nova transferência cria novo contrato com referência salarial atual.
- Falhas repetidas de salário podem tornar jogador indisponível e posteriormente libertá-lo.

## 7. Infraestruturas

Cinco categorias:
- Estádio: capacidade, bilheteira, eventos, manutenção.
- Academia: scouting, watchlists, alertas e acesso ao mercado primário; não evolui jogadores.
- Centro de Treino: disponibilidade, recuperação e preparação; não altera overall.
- Marketing: adeptos, visibilidade, patrocinadores e receitas comerciais.
- Finanças: crédito, custos financeiros, previsões, limites e condições de financiamento.

Cada upgrade aumenta potencial e custos recorrentes.

## 8. Adeptos e patrocinadores

Adeptos influenciam procura de bilhetes, patrocinadores, merchandising e prestígio.

Patrocinadores são contratos recebidos pelo clube com base em adeptos, prestígio, divisão, resultados, marketing e audiência. Podem ter pagamento base e bónus por objetivos.

## 9. Economia operacional

Receitas: bilheteira, patrocinadores, prémios, objetivos, mercado e eventos.

Despesas: salários, manutenção, taxas de competição, dívida, mercado, infraestrutura e custos operacionais.

Cash flow do clube é central. Um clube pode vencer e perder Silver financeiramente.

Estados financeiros: HEALTHY, PRESSURE, CRITICAL, INSOLVENT, ADMINISTRATION.

Recuperação: receitas normais -> venda/leilão -> crédito -> redução de custos -> fundo de recuperação restrito.

## 10. Gold -> Silver

Não existe câmbio livre. Gold compra operações financeiras:
- capital injection
- sponsorship funding
- loan origination fee
- universe treasury funding

Cada universo define política: DISABLED, LIMITED, STANDARD ou OPEN.

O Universo Principal usa limites para preservar integridade competitiva.

## 11. Competições

Tipos: LEAGUE, CUP, TOURNAMENT, FRIENDLY/CASUAL.

Todos usam o mesmo match engine.

Estados principais: SCHEDULED -> READY -> PLAYED -> RESULT_SUBMITTED -> CONFIRMED/DISPUTED/AUTO_CONFIRMED -> SETTLED.

Só SETTLED produz efeitos económicos, desportivos e sociais.

Resultado oficial pode exigir screenshot. Disputa gera moderação. Auto-confirmação depende de timeout configurável.

Settlement é idempotente. Correções posteriores usam REVERSAL + NEW_SETTLEMENT; nunca edição silenciosa.

## 12. Liga, Taça e temporadas

Liga: pontos e critérios de desempate; Elo não substitui classificação.

Promoção/descida dependem da classificação sazonal.

Taça: knockout, single/double leg, extra-time/penalties configuráveis.

Torneios: formatos configuráveis, entry fee e prize pool imutável após início.

Universo Principal começa com Liga Oficial, Taça do Clã e Supertaça.

Temporadas sincronizam Liga/Taça e geram snapshot histórico.

## 13. Retenção

Ciclos: diário, semanal e sazonal.

Bronze alimenta Daily, Missões, Achievements, Season Pass e cosméticos.

Manager XP vem de eventos concluídos, não de cliques.

Jornal automático é event-driven: matches, transferências, records, mudanças de liderança, promoções, descidas, crises, patrocinadores e atualizações de jogadores.

## 14. Social e comunidades

- Follow unilateral e Friendship bilateral.
- Rivalidade é relação entre clubes dentro de um universo.
- Chats: direct, community, universe e match.
- Feeds separados: global, universe e community.
- Community posts, journal articles e announcements são objetos diferentes.
- Sanções sociais, competitivas e de plataforma são separadas.

## 15. Administração e Governance

Admin Control Center dá visão global de users, clubs, universes, competitions, matches, economy, Stripe, market, disputes, fraud, communities, system e audit.

Backoffice operacional: tickets, disputes, refunds, grants, moderation, fraud reviews e support.

RBAC mínimo: SUPER_ADMIN, PLATFORM_ADMIN, ECONOMY_ADMIN, COMPETITION_ADMIN, MODERATOR, SUPPORT_AGENT, FINANCE_OPERATOR, READ_ONLY_ANALYST.

Todas as ações sensíveis exigem operação explícita, motivo e audit log. Nunca alterar saldo diretamente.

Refund Stripe e economic reversal são fluxos distintos.

Governance do Universo Principal inclui temporada, divisões, Liga, Taça, calendário, mercado, finanças, promoção/descida e regras oficiais.

## 16. Implementação por fases

### Foundation
- domínio e tipos
- configuração económica
- ledger multi-moeda
- universos e memberships
- clube por universo
- player master + universe player
- Stripe Gold checkout/webhook

### Core Competitive
- plantel/contratos/salários
- mercado/leilão/quick sell
- match engine + settlement
- Liga/Taça/temporadas

### Club Management
- identidade do manager e clube
- avatar, emblema e três equipamentos
- infraestruturas
- adeptos
- patrocinadores
- crédito/financiamento

### Engagement
- Bronze
- missions/daily/achievements
- jornal/notificações
- social/comunidades

### Governance
- admin control center
- backoffice
- moderation/fraud
- refunds/grants/configuration/audit

## 17. Baseline funcional da v1 para produção

A v1 é o baseline que deve estar funcionalmente alinhado e validado antes do E2E final. Funcionalidades de roadmap não devem aparecer na interface como ações disponíveis.

### Incluído na v1
- autenticação e identidade global do manager;
- edição de username e avatar;
- participação em múltiplos universos e um clube por universo;
- emblema, nome, lema e equipamentos HOME/AWAY/THIRD por clube;
- dashboard, clube, plantel, calendário e ranking contextualizados ao universo;
- mercado primário, venda direta e leilões;
- Gold, Silver, Bronze, Stripe, ledger, financiamento, empréstimos, liabilities e patrocínios;
- competições, partidas, lineup, resultado, confirmação, disputa e settlement;
- Daily, missões, achievements e Bronze Store;
- comunidades, posts, chat de comunidade e mensagens diretas;
- Admin Control Center, RBAC/MFA, backoffice e auditoria;
- provider externo de jogadores desacoplado do gameplay normal, com tolerância a rate limiting.

### Pós-v1 / não bloqueia produção
- Quick Sell;
- Season Pass completo;
- criação self-service de universos comunitários;
- disciplina avançada/sanções desportivas dedicadas;
- experiência completa de Follow/Friends/Rivalidades;
- chat específico legado de tournament;
- seleção de HOME/AWAY/THIRD no pré-jogo e regras visuais automáticas;
- estados financeiros avançados HEALTHY/PRESSURE/CRITICAL/INSOLVENT/ADMINISTRATION quando ainda não estiverem operacionalizados end-to-end.

### Regra de exposição
Uma funcionalidade pós-v1 pode existir no domínio ou roadmap, mas não pode ser apresentada como botão/CTA operacional enquanto não tiver persistência, autorização, regras de negócio e fluxo completo. Estados indisponíveis devem ser informação, não ações falsas.
