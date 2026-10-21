# Normas de engenharia — Clã das Sombras

## Objetivo e âmbito

Este documento adapta a rastreabilidade, os gates de segurança e as práticas de release usados no projeto Naraiana Advogada para uma plataforma de gestão e competição futebolística. Reutiliza métodos de engenharia; não copia obrigações próprias de processos jurídicos nem declara conformidade ou certificação.

As referências (OWASP ASVS e API Security, PostgreSQL RLS/least privilege, OWASP Logging, WCAG 2.2 AA, OpenAPI 3.1/RFC 9457, SLSA e DORA) são guias de trabalho. A sua presença não prova cumprimento integral.

O mapeamento local de riscos, responsabilidades cloud, privacidade, gestão de serviço e continuidade está em [`GOVERNANCE_CONTROLS.md`](./GOVERNANCE_CONTROLS.md). A rastreabilidade de ISO/IEC 25010, 12207, 29148, requisitos e DORA está em [`QUALITY_TRACEABILITY.md`](./QUALITY_TRACEABILITY.md). Ambos distinguem controlo local parcial de evidência operacional/auditoria.

A aplicação das características ISO/IEC 25010 e dos processos ISO/IEC/IEEE 12207 e 29148, com estados, IDs de requisitos, evidência e métricas DORA, está rastreada em [`QUALITY_TRACEABILITY.md`](./QUALITY_TRACEABILITY.md). Esse registo não declara certificação.

## Regras obrigatórias

### Segurança e autorização

- Toda rota API deve ter uma fronteira de autenticação explícita, ou uma exceção protocolar estreita documentada, como assinatura Stripe ou segredo de worker.
- A autorização verifica utilizador, papel e relação com clube/universo/objeto. Estar autenticado não concede acesso aos dados de outro manager.
- RLS permanece a segunda fronteira para tabelas expostas; grants, policies, RPCs `SECURITY DEFINER`, Storage e Realtime são revistos em conjunto.
- Operações administrativas exigem MFA AAL2 e RBAC por ação. Chaves secretas Supabase ficam apenas no servidor.
- Inputs externos têm validação de runtime e limites explícitos. Erros devolvidos não incluem stack trace, tokens, segredos ou dados de outros utilizadores.
- Uma verificação estática de rotas é regressão preventiva; nunca é evidência suficiente de isolamento por objeto ou RLS.

### Integridade competitiva e económica

- Saldos e movimentos são derivados de ledger auditável; mutações de saldo e respetivo evento são atómicos.
- Compras, bids, prémios, settlement de partidas, recompensas, webhooks e jobs são idempotentes e resistentes a repetição/concorrência.
- O servidor valida elegibilidade, ownership, estado e limites; o cliente não é fonte de verdade para resultado, preço, saldo, ranking ou prémio.
- Disputas, reversões, freezes e alterações administrativas registam ator, motivo, alvo, estado anterior/posterior e referência de correlação sem guardar conteúdo excessivo.

### Privacidade, comunidade e conteúdo

- Minimizar dados pessoais e conteúdo de chat nos logs. Usar eventos fixos, códigos estáveis e request IDs; não serializar objetos de erro completos nem incluir tokens, passwords, mensagens privadas ou payloads de utilizador.
- Definir retenção, exportação e eliminação para conta, perfil, comunicações, evidência de partida, suporte e auditoria antes do lançamento público.
- Testar autorização de leitura/escrita em comunidades, mensagens, denúncias e uploads, incluindo acesso por URL direta e depois de perder associação/permissão.
- Idade mínima, regras de comunidade, denúncia/moderação, recursos, compras, reembolsos e eventual mecânica aleatória com dinheiro real exigem decisão de produto e revisão legal apropriada; não inferir conformidade.

### Arquitetura e qualidade

- Continuar a migração incremental já iniciada: UI → aplicação/casos de uso → domínio → repositórios/infraestrutura. Evitar refactor geral sem necessidade verificável.
- Route handlers validam sessão e input, chamam casos de uso e formatam resposta; regras de competição/economia vivem no domínio/aplicação, e SQL/Supabase nas migrações e adaptadores.
- Manter `quality:production`, fronteiras de domínio e verificação de variáveis de ambiente no CI. Todas as rotas entram também no checker `check:api-auth`.
- Novas rotas/contratos públicos devem documentar métodos, autenticação, validação, respostas de erro estáveis, limites e efeitos idempotentes.
- Design mantém tokens semânticos, hierarquia futebolística, responsividade real, teclado/foco/labels e alvos táteis definidos em `DESIGN_SYSTEM.md`; validação visual não substitui WCAG nem teste com jogadores.

## Matriz de aceitação adaptada

Executar apenas em ambiente local descartável ou Preview ligado a Supabase isolado, com dados sintéticos. Nunca usar produção para cenários que escrevem dados.

| Área | Atores e tentativas | Critério de aceitação |
| --- | --- | --- |
| Auth e sessão | Anónimo, manager, admin sem AAL2, sessão expirada/revogada | Sem acesso indevido; MFA e revogação aplicadas também em API e RLS |
| Isolamento | Manager A e B em clubes/universos diferentes; URLs e IDs adivinhados | Sem leitura, alteração ou agregação cruzada; exceções públicas limitadas ao conteúdo aprovado |
| Clube e plantel | Dono, membro sem permissão, manager de outro universo | Ownership e operações permitidas validados no servidor e no banco |
| Competições | Participantes, adversário, árbitro/admin | Estado válido; resultado com evidência; confirmação/disputa e progressão auditáveis |
| Economia/mercado | Saldo insuficiente, bids simultâneos, replay e timeout | Ledger e saldo coerentes; uma liquidação por evento; nenhuma operação parcial |
| Recompensas | Pedido duplicado, janela inválida, ações concorrentes | Elegibilidade verificada no servidor; recompensa idempotente e auditável |
| Comunidade/chat | Não membro, membro removido, bloqueio/denúncia | Conteúdo, canais e ações apenas para participantes autorizados |
| Pagamentos | Webhook inválido, evento repetido, cancelamento/reembolso | Assinatura validada; um único crédito/devolução; pacote e valor conferidos no servidor |
| Administração | Cada papel, AAL1/AAL2 e ação fora do âmbito | Menor privilégio por ação; negativas não alteram dados; auditoria completa |
| Worker | Sem segredo, segredo errado, duas execuções concorrentes | 401 em chamadas não autorizadas e efeitos sem duplicação |
| Privacidade e abuso | Exportação/remoção, spam, payload grande, conteúdo abusivo | Limites, retenção e moderação definidos; logs minimizados; abuso limitado e investigável |
| Interface | 320×568, 390×844, 768×1024, 1440×900 e zoom 200% | Ações completas, sem overflow, teclado/foco, estados de erro/loading e contraste legíveis |

Cada cenário regista SHA, ambiente, versão de migrações, papel (sem credenciais), esperado/observado, timestamp UTC, resultado e referência de evidência redigida. Build aprovado ou HTTP 200 não conta como aceitação de auth, RLS, saldo ou acesso por objeto.

## Migrações e release

1. Confirmar o projeto Supabase e ambiente de destino; obter backup restaurável e provar recuperação antes de DDL de produção.
2. Mapear migrations locais e história remota; comparar schema, grants, RLS, funções, triggers, Storage, Auth e Realtime. Não repetir migrations antigas só porque o histórico remoto parece incompleto.
3. Aplicar migrations em Supabase isolado, com fixtures sintéticas; executar preflight e advisors. Resolver ou aceitar explicitamente cada finding.
4. Validar o mesmo SHA em CI e Vercel Preview, seguido da matriz de aceitação relevante. Não testar escrita na produção.
5. Promover o deployment aprovado sem rebuild de SHA diferente. Registar versão de migration, deployment, evidências, rollback da aplicação e plano forward-fix do schema.
6. Após a promoção, observar Vercel, Supabase, Auth, worker, filas, ledger e webhooks. Incidente de autorização, dados cruzados, saldo divergente, duplicação ou falha de pagamento interrompe o rollout.

## Rastreabilidade

Manter no Notion um registo por controlo com estes estados: **Não avaliado**, **Recomendado**, **Parcial**, **Implementado**, **Verificado** e **Não aplicável**. Cada afirmação deve indicar alcance e evidência. "Implementado" descreve código/configuração; "Verificado" exige resultado observado no ambiente e SHA indicados.

Controles de segredo profissional, gestão de clientes/processos jurídicos, faturação jurídica e eIDAS são específicos da Naraiana e não se aplicam ao Clã. Privacidade geral, autenticação, segurança de cloud, evidência/auditoria, acessibilidade, qualidade, supply chain e gestão de incidentes são adaptados ao risco da plataforma.
