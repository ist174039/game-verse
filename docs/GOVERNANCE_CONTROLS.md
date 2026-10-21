# Controlos de governação, cloud e privacidade

## Âmbito e limite da aplicação

Data da revisão local: 2026-10-18. Este documento aplica práticas proporcionais inspiradas em ISO/IEC 27001/27002/27017/27018/27701, ISO/IEC 20000-1 e ISO 22301 ao Clã das Sombras. Não constitui um SGSI, PIMS, sistema de gestão de serviços ou BCMS auditado e não declara conformidade/certificação.

Âmbito técnico proposto para validação pelo responsável do produto: repositório GitHub `ist174039/game-verse`, CI GitHub Actions, aplicação Vercel, dados/Auth/Storage Supabase e pagamentos Stripe. O projeto Supabase está atualmente inativo; configurações operacionais não foram verificadas nesta revisão.

## Responsabilidades partilhadas de cloud (ISO/IEC 27017)

| Área | Aplicação / equipa do Clã | Fornecedor | Estado / evidência necessária |
| --- | --- | --- | --- |
| Código e regras de autorização | Validar sessão e objeto; manter guards, RLS, grants, migrations e testes negativos | Vercel/Supabase fornecem runtime e serviço de dados | Checker de auth reconhece 42 handlers; RLS remoto por validar |
| Deploy e segredos | Rever mudanças, scopes/envs, rotação e remoção de credenciais temporárias | Vercel executa builds/deploys e fornece gestão de envs | Projeto live=false; confirmar envs e domínio antes de ativação |
| Dados e recuperação | Definir retenção, backups, restore, RPO/RTO e owners; executar recovery exercise | Supabase fornece DB/Auth/Storage e capacidades contratadas de backup | Supabase INACTIVE; plano de backup/restore não verificado |
| Pagamentos | Definir catálogo/benefício, validar preço server-side, assinatura, idempotência, refund e reconciliação | Stripe processa pagamento e oferece eventos/API | Código local existe; autenticação/configuração Stripe e E2E pendentes |
| Monitorização/incidentes | Triar alertas, comunicar impacto, preservar evidência e autorizar rollback | Cada fornecedor fornece logs/telemetria conforme plano | Rotinas documentadas; sem baseline/alertas/owner confirmados |

Não atribuir ao fornecedor a responsabilidade por decisões de produto, permissões da aplicação, configuração de RLS, retenção ou resposta ao incidente da aplicação.

## Baseline de controlos (ISO/IEC 27001 e 27002)

| Tema | Controlo mínimo aplicado/documentado | Evidência ou trabalho restante |
| --- | --- | --- |
| Ativos e âmbito | Repositório, CI, Vercel, Supabase, Stripe e dados de utilizadores identificados como ativos críticos | Inventário de endpoints, buckets, dados e responsáveis ainda precisa de validação |
| Identidade e privilégio | Auth validada no servidor, admin separado com AAL2/RBAC, secret do Supabase apenas no servidor | Testes negativos por papel e revisão de membros/segredos no ambiente ativo |
| Desenvolvimento seguro | TypeScript, fronteiras de domínio, checker estático de auth, revisão de migrations e gate de produção | CI verde no SHA candidato, revisão independente e teste de abuso pendentes |
| Gestão de mudanças | Alterações associadas a requisito, SHA, migration, gate e rollback no plano/registo de release | Registo por release ainda deve ser preenchido para cada candidato |
| Logging e monitorização | Não devolver diagnósticos internos; não registar tokens, mensagens privadas ou objetos de erro; usar eventos fixos | Correlation/request ID e retenção de logs devem ser configurados/confirmados no ambiente |
| Criptografia e segredos | TLS do fornecedor; segredos fora do bundle/browser; não escrever secrets em documentação | Confirmar rotação, scopes e configurações efetivas nos dashboards |
| Vulnerabilidades e dependências | Lockfile, instalação frozen no CI, verificação de dependências prevista no ciclo | Proveniência/SBOM, alertas e resposta a vulnerabilidades ainda carecem de evidência |
| Continuidade | Runbook, rollback e dependências mapeados neste documento e em `OPERATIONS.md` | Backup restaurável, alertas e exercício real não executados |

## Registo preliminar de risco (ISO/IEC 27001)

Este é um registo inicial de engenharia, não uma avaliação aprovada pelo proprietário do risco. Nenhum risco abaixo está formalmente aceite; não há owners atribuídos.

| ID | Risco observado | Impacto potencial | Tratamento / critério de saída |
| --- | --- | --- | --- |
| SEC-01 | Supabase de produção INACTIVE e schema remoto inacessível | Indisponibilidade, drift desconhecido, impossibilidade de validar Auth/RLS/dados | Confirmar alvo; recuperar acesso; inventariar schema/migrations; backup restaurável e Preview antes de DDL |
| SEC-02 | Deployment Vercel READY, mas `live: false` | Serviço não promovido ou ambiente sem configuração operacional confirmada | Confirmar domínio/envs e alvo; CI no SHA; Preview completo; decisão GO explícita |
| SEC-03 | Stripe requer reautenticação | Checkout/webhooks/refunds sem configuração verificada | Reautenticar conta pretendida; usar test mode; validar replay, falhas e reconciliação antes de ativar checkout |
| SEC-04 | Migrations locais 00530/00531 ainda sem execução remota | RLS/social podem divergir do schema real | Backup, aplicar em Preview, correr security advisors e casos negativos member/non-member/anónimo |
| SEC-05 | E2E, Web Vitals e carga ainda sem evidência | Regressões funcionais, autorização/economia incorreta ou degradação sob carga | Executar casos QLT em ambiente isolado; guardar SHA, resultado, métricas e evidência redigida |
| SEC-06 | Retenção, eliminação/exportação e owners de privacidade não aprovados | Retenção excessiva ou incumprimento de direitos aplicáveis | Inventariar dados; aprovar finalidade/base, retenção e fluxo de direitos com responsável apropriado |

Reavaliar probabilidade, impacto, tratamento e aceitação com responsáveis de produto/segurança antes do lançamento; a tabela deliberadamente não inventa aprovações nem tolerância ao risco.

## Privacidade em cloud e ciclo de dados (ISO/IEC 27018/27701 e RGPD)

| Classe de dados | Finalidade no produto | Minimização e proteção no código | Decisão pendente antes de lançamento |
| --- | --- | --- | --- |
| Conta/identidade | Login, perfil e identidade global | Auth e leitura de perfil por necessidade; nunca usar metadata editável como autoridade | Inventário, retenção da conta, exportação/eliminação, informação ao utilizador |
| Dados de clube/jogo/economia | Persistir clube, competição, progresso e ledger | Validação server-side, RLS/ownership, ledger e RPCs de domínio | Testes por universo, retenção após fecho/eliminação da conta |
| Chat/comunidade/suporte | Conversas e pedidos de suporte | Autorização por membro, limites de body, erros/logs sem payload privado | Regras de comunidade, denúncia, moderação, retenção e pedidos de acesso/apagamento |
| Pagamento | Criar ordem e creditar moeda virtual | Dados de cartão processados pelo Stripe; app guarda order/session e valida assinatura/valor | Verificar DPA/subprocessadores, test mode, política de reembolso e reconciliação |
| Segurança/auditoria | Investigar abusos e mudanças privilegiadas | Eventos de auditoria sem segredos nem conteúdo desnecessário | Definir acesso, retenção, exportação e eliminação do audit log |

Não inventar prazos de retenção, bases legais, idade mínima ou transferências internacionais. Até aprovação, registar esses tópicos como decisão pendente; não alegar PIMS, RGPD ou certificação de fornecedor.

## Gestão de serviço e incidentes (ISO/IEC 20000-1)

1. **Detetar e registar:** abrir registo com timestamp UTC, serviço/ambiente, SHA, sintomas, impacto observado e referência de log sem PII/segredos.
2. **Conter:** incidentes de autorização, corrupção económica, pagamento duplicado ou exposição de dados interrompem a promoção; usar rollback da aplicação ou desativar o fluxo afetado.
3. **Recuperar:** seguir `OPERATIONS.md`, preservar dados e evidência, evitar alterações manuais sem audit trail e preferir forward-fix de schema.
4. **Rever:** documentar causa, janela de impacto, dados afetados, decisão/comunicação, recuperação e ações preventivas com responsável.
5. **Mudança/release:** registar requisito, SHA, migrations, CI, gates e rollback no template em `QUALITY_TRACEABILITY.md`.

O projeto ainda não tem catálogo de serviço, SLA/SLO aprovado, horários de suporte ou processo formal auditado. Não prometer disponibilidade ou suporte até essas decisões serem tomadas.

## Continuidade e recuperação (ISO 22301)

| Serviço crítico | Dependência | Recuperação prevista | Objetivo aprovado |
| --- | --- | --- | --- |
| Login e dados de jogo | Supabase Auth/Database | Recuperar o projeto, validar schema/migrations, restaurar backup e confirmar RLS antes de abrir tráfego | RTO/RPO por definir pelo produto/operação |
| Interface e API | Vercel + repositório/CI | Reverter ao deployment anterior ou corrigir e promover SHA validado | RTO por definir |
| Pagamento | Stripe + webhook + ledger Supabase | Suspender checkout, reconciliar ordens/eventos, corrigir apenas via processo auditado | RPO/RTO por definir |
| Tarefas de manutenção | Cron/worker + tabelas de jobs/eventos | Corrigir segredo/configuração; executar worker autenticado e confirmar ausência de duplicados | Janela/cadência por definir |

Antes de produção: atribuir responsáveis; avaliar impacto e dependências; aprovar RTO/RPO; confirmar backup e restore; executar exercício de recuperação/rollback; rever resultados e ações corretivas. Não há evidência desses exercícios nesta revisão.

## Design centrado nas pessoas (ISO 9241-210/220)

Aplicar um ciclo leve por fluxo: identificar contexto e perfis de uso; definir tarefas e resultado esperado; desenhar/prototipar; rever com teclado/leitor de ecrã e diferentes viewports; observar jogadores em tarefas reais; registar achados, prioridade e alteração; repetir após a mudança. O plano de avaliação, métricas e evidência estão em `DESIGN_SYSTEM.md` e `QUALITY_TRACEABILITY.md`.

Papéis, recrutamento de utilizadores, consentimento e cadência de investigação ainda não foram formalizados. Não afirmar pesquisa centrada no utilizador concluída sem sessões/evidência.

## Revisão

Rever este baseline quando mudar o âmbito de dados, fornecedores, arquitetura, pagamentos ou nível de serviço e antes de qualquer promoção. A data deste documento é a aplicação documental local; owners, aprovação organizacional e validação remota permanecem pendentes.
