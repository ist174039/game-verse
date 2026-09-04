# Gate de produção — Clã das Sombras

Este documento é a fonte de verdade para decidir se uma versão pode ser promovida para produção. Um release só recebe **GO** quando todos os bloqueadores automáticos e manuais estão verdes no mesmo commit.

## Estado da revisão (2026-09-03)

| Área | Estado | Evidência / decisão |
| --- | --- | --- |
| Compilação e tipos | Automatizado | `pnpm run quality:production` executa fronteiras de domínio, dois typechecks e o build Next de produção. |
| Configuração Vercel/Supabase | Automatizado antes da promoção | `pnpm run check:production-env` valida configuração pública, credencial server-side, segredos do worker e consistência Stripe sem imprimir valores. |
| Segurança HTTP | Implementado | Respostas recebem `nosniff`, anti-frame, política de referrer e bloqueio de APIs sensíveis do browser. |
| Migrações | Gate manual | Aplicar todas as migrações por ordem e validar o SHA/ambiente antes de promover. Não há base Supabase de produção disponível no CI para ensaio destrutivo. |
| Fluxos ponta a ponta | Gate manual | Exigem contas, MFA, Stripe e dados reais do ambiente Preview; usar a matriz abaixo. |
| Visual e acessibilidade | Gate manual | Validar a matriz de viewports e os estados de interação abaixo no Preview do SHA candidato. |
| Observabilidade e rollback | Gate operacional | Confirmar logs/alertas e manter o deployment anterior promovível. |

## Gate automático (bloqueador)

Executar a partir de uma instalação limpa, com Node 22 e pnpm 10:

```bash
pnpm install --frozen-lockfile
pnpm run quality:production
```

O workflow **Application quality** corre o mesmo comando em cada pull request e push para `main`. Não promover se o workflow não terminou com sucesso.

No ambiente Vercel que será promovido, executar também:

```bash
pnpm run check:production-env
```

Critérios:

- URL e publishable key do Supabase presentes, sem valores do template;
- `SUPABASE_SECRET_KEY` (ou a service-role legada) presente apenas no servidor;
- `CRON_SECRET` e `INTERNAL_JOBS_SECRET` aleatórios, com pelo menos 32 caracteres;
- Stripe totalmente configurado ou totalmente ausente (checkout explicitamente desativado);
- credenciais temporárias de bootstrap geram aviso e têm de ser removidas após criar o primeiro admin.

## Gate funcional no Preview (bloqueador)

Registar resultado, executor, timestamp e link de evidência para cada cenário:

1. **Visitante e autenticação** — landing, sign-up, confirmação por email, login/logout, callback inválido e redirecionamento para a rota original.
2. **Onboarding** — criar clube num universo elegível; impedir duplicado, universo fechado e submissão repetida.
3. **Clube e plantel** — editar identidade, carregar media, mudar estado de jogador e montar lineup válido/inválido.
4. **Competição** — criar/configurar, inscrever, gerar calendário, pré-jogo, submeter/confirmar/disputar resultado e avançar bracket.
5. **Mercado** — comprar catálogo, listar/cancelar, compra direta, bid concorrente, expiração e settlement idempotente.
6. **Economia** — saldos e ledger coerentes; patrocínio, financiamento, prestação, passivo e recompensa sem dupla aplicação após refresh.
7. **Comunidade** — amizade, comunidade, publicação, chat/DM e autorização negativa entre utilizadores.
8. **Pagamento** — checkout Stripe em modo de teste, cancelamento, webhook válido, assinatura inválida, replay e reembolso administrativo.
9. **Administração** — bootstrap único, login AAL2/TOTP, RBAC por função, auditoria, freeze/release, suporte e moderação.
10. **Worker** — chamada sem segredo devolve 401; chamada válida termina; segunda chamada não duplica efeitos; confirmar ausência de jobs `FAILED`.

Qualquer erro 5xx, quebra de autorização, saldo incorreto, efeito duplicado, perda de dados ou fluxo principal sem conclusão é **NO-GO**.

## Gate visual e responsivo (bloqueador)

Validar landing, login, onboarding, dashboard, sidebar/menu, detalhe de competição, mercado, equipa, checkout e admin nos seguintes viewports:

| Perfil | Viewport CSS | O que validar |
| --- | --- | --- |
| Mobile pequeno | 320 × 568 | sem scroll horizontal; texto/ações não cortados; bottom nav e diálogos utilizáveis |
| Mobile padrão | 390 × 844 | safe areas; teclado não oculta o submit; alvos táteis com pelo menos 44 × 44 px |
| Tablet portrait | 768 × 1024 | transição de layout sem sobreposição; tabelas e filtros acessíveis |
| Desktop | 1440 × 900 | hierarquia, largura de leitura, sidebar e estados vazios/loading/error |
| Desktop zoom | 1280 × 720 a 200% | conteúdo e ações continuam acessíveis sem perda funcional |

Em cada viewport, validar:

- navegação por teclado, foco visível, ordem lógica e Escape em modais;
- nomes acessíveis para botões de ícone, labels e mensagens de erro associadas;
- contraste de texto, muted text, bordas e estados disabled/focus/error;
- strings PT e EN longas, números grandes, listas vazias e conteúdo extremo;
- loading, sucesso, erro, offline/retry e prevenção de duplo clique;
- imagens sem layout shift relevante e sem conteúdo essencial dependente apenas de cor;
- ausência de erros no console, pedidos 4xx inesperados e pedidos mistos HTTP/HTTPS.

Anexar screenshots dos cinco viewports e, para fluxos com movimento, uma gravação curta. Diferenças visuais intencionais devem ser aprovadas no PR; regressões não aprovadas são **NO-GO**.

## Supabase, Vercel e dados

Antes da promoção:

1. confirmar que o Preview aponta para um projeto Supabase não produtivo;
2. gerar backup e testar restauração antes de migrações irreversíveis;
3. rever migrações novas: ordem, lock, backfill, RLS, grants e funções `security definer`;
4. aplicar migrações e executar smoke tests com utilizador comum e admin AAL2;
5. confirmar URLs de Auth, domínios permitidos, webhook Stripe e segredos apenas nos scopes corretos da Vercel;
6. confirmar o cron de manutenção e uma execução manual autenticada;
7. promover exatamente o deployment/commit aprovado, sem rebuild não auditado.

## Observabilidade, go/no-go e rollback

Durante os primeiros 30 minutos após promoção, acompanhar funções Vercel, Auth/Database do Supabase, Stripe webhooks e o maintenance worker. **Rollback imediato** para o deployment anterior se ocorrer qualquer incidente P0/P1, aumento sustentado de 5xx, falha de login generalizada, corrupção económica, autorização indevida ou falha de webhook.

O responsável pelo release regista:

- commit e deployment promovidos;
- migração mais recente aplicada;
- resultado dos gates automático, funcional e visual;
- responsável de produto e responsável técnico que deram GO;
- deployment de rollback e decisão sobre rollback de schema (preferir migrações forward-fix).

## Dívida conhecida não bloqueadora

- O lint ESLint não está atualmente configurado; o gate usa TypeScript, regras de fronteira e build. Configurar lint e testes automatizados de browser é a próxima melhoria prioritária.
- O build usa Google Fonts via `next/font`; ambientes de build sem acesso a `fonts.googleapis.com` falham. Vercel deve ter egress disponível; para builds totalmente herméticos, versionar os ficheiros de fonte e migrar para `next/font/local`.
- A otimização de imagens está desativada globalmente para permitir origens dinâmicas. Restringir hosts do fornecedor de jogadores e ativar otimização depois de estabilizar essa integração.

