# Rastreabilidade de qualidade e ciclo de vida

Este registo adapta práticas de ISO/IEC 25010, ISO/IEC/IEEE 12207 e ISO/IEC/IEEE 29148 ao produto. Não declara certificação nem conformidade integral. Os controlos só passam a **Verificados** quando existe evidência do SHA e ambiente indicados; documentação ou uma verificação estática, por si só, não prova comportamento em runtime.

## Estado de aplicação local

Data de revisão local: 2026-10-18. Esta data regista a revisão deste documento, não a data de aplicação remota ou de aprovação de release.

| Referência / característica | Aplicação concreta | Evidência local | Estado e lacuna |
| --- | --- | --- | --- |
| ISO/IEC 25010 — adequação funcional | Requisitos e fluxos de negócio descritos para V1; critérios de aceitação por fluxo e papel | [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md), matriz em [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) | Parcial: cobertura funcional e aceitação ponta a ponta precisam de evidência em Preview |
| ISO/IEC 25010 — eficiência de desempenho | Limites/paginação, evitar cascatas, critérios LCP/INP/CLS e p50/p95 | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md), gate de performance em [`PRODUCTION_GATE.md`](./PRODUCTION_GATE.md) | Parcial: baseline, metas por fluxo e medições comparáveis ainda não registados |
| ISO/IEC 25010 — compatibilidade | Integrações Supabase, Vercel e Stripe e variáveis de ambiente verificadas antes da promoção | `check:production-env`, [`PRODUCTION_GATE.md`](./PRODUCTION_GATE.md) | Parcial: dependente de credenciais e configuração nos ambientes alvo |
| ISO/IEC 25010 — capacidade de interação | Requisitos responsivos, teclado, foco, labels, estados e reduced motion | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md), [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) | Parcial: requer inspeção visual e tarefas com utilizadores em Preview |
| ISO/IEC 25010 — fiabilidade | Idempotência, concorrência, worker, ledger, recuperação e rollback | [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md), [`OPERATIONS.md`](./OPERATIONS.md) | Parcial: falhas, retries, restore e recuperação ainda precisam de execução documentada |
| ISO/IEC 25010 — segurança | Auth, autorização, RLS, validação e segredo mínimo | [`check-api-auth-boundaries.mjs`](../scripts/check-api-auth-boundaries.mjs), migrations e matriz em [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md) | Implementação local parcial; isolamento por objeto/RLS requer validação negativa em Preview |
| ISO/IEC 25010 — manutenibilidade | Fronteiras de domínio, typecheck e padrões de componentes | `quality:domain`, `quality:production`, [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Automatizado em CI configurado; execução verde tem de ser confirmada para o SHA candidato |
| ISO/IEC 25010 — flexibilidade/portabilidade | Configuração por ambiente e ausência de valores secretos no cliente | `check:production-env`, workflow CI | Parcial: ambientes reais e procedimento de recuperação de configuração não verificados |
| ISO/IEC/IEEE 12207 — planeamento e requisitos | Plano ordenado, requisitos, responsáveis e gates de lançamento | Plano de implementação e [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) | Parcial: responsáveis, datas e decisões de produto ainda têm de ser atribuídos |
| ISO/IEC/IEEE 12207 — implementação e integração | Typecheck, regras de domínio, autenticação das rotas e build no gate | `.github/workflows/domain-quality.yml`, `package.json` | Configurado; resultado por SHA deve ser anexado ao registo de release |
| ISO/IEC/IEEE 12207 — verificação e validação | Matriz de aceitação por atores, fluxos, segurança, UI e pagamentos | [`ENGINEERING_STANDARDS.md`](./ENGINEERING_STANDARDS.md), [`PRODUCTION_GATE.md`](./PRODUCTION_GATE.md) | Parcial: CI não substitui verificação funcional, de segurança ou visual em Preview |
| ISO/IEC/IEEE 12207 — operação/manutenção | Observação, gatilhos de rollback, manutenção e incidentes | [`OPERATIONS.md`](./OPERATIONS.md), [`PRODUCTION_GATE.md`](./PRODUCTION_GATE.md) | Parcial: alertas, execução de restore e exercício de rollback requerem ambiente operacional |
| ISO/IEC/IEEE 29148 — requisitos verificáveis e rastreáveis | Identificador, critério de aceitação, implementação e evidência associados no registo abaixo | Este ficheiro e plano de implementação | Parcial: ligar cada requisito de produto a um caso executado e evidência é trabalho contínuo |

## Registo de requisito → implementação → evidência

Usar identificadores estáveis nos novos requisitos. Uma mudança de escopo ou aceite deve manter decisão, data e responsável. Um requisito não pode ser marcado como concluído só porque existe uma página ou endpoint com nome semelhante.

| ID | Requisito verificável | Implementação/controlo | Evidência exigida para fechar |
| --- | --- | --- | --- |
| QLT-01 | Um utilizador não lê nem altera dados privados de outro utilizador/club | Autorização server-side, RLS e grants | Casos positivos e negativos por papel em Preview; SHA e migrations aplicadas |
| QLT-02 | Operações monetárias repetidas ou concorrentes não duplicam saldo/ledger | Idempotência, transação e constraints | Replay/concor­rência com resultado e ledger comparados em dados sintéticos |
| QLT-03 | Um pagamento só credita o produto/valor definido no servidor | Checkout e webhook verificado | Eventos válidos, inválidos e repetidos; evidência Stripe test mode |
| QLT-04 | Rotas internas recusam chamadas sem segredo válido | Guard da rota e verificador estático | 401/403 observado no Preview e chamada autorizada controlada |
| QLT-05 | Fluxos essenciais funcionam em viewports suportados e teclado | Design system e componentes acessíveis | Capturas por viewport e resultados de teclado/foco/labels no SHA candidato |
| QLT-06 | O release pode ser reconstruído, atribuído e revertido | Lockfile, CI, deployment imutável e plano rollback | Workflow verde no SHA, deployment correspondente e rollback operacional documentado |
| QLT-07 | Alteração de requisito mantém histórico de decisão e critério | Plano/issue versionado com owner e estado | Link do requisito, decisão, commit e evidência de aceite |

## Registo mínimo por release

Copiar este bloco para cada candidato de release e completar antes de GO:

```text
Release ID:
Requisito(s)/issue(s):
SHA candidato:
Workflow CI (URL + conclusão):
Ambiente e projeto alvo (sem segredos):
Versão/IDs das migrations e backup restaurável:
Casos de aceitação executados (IDs QLT):
Resultado observado e referências de evidência redigida:
Findings aceites, responsável e validade da aceitação:
Deployment candidato e smoke checks:
Responsável técnico / responsável de produto:
Decisão GO/NO-GO e timestamp UTC:
Deployment anterior e plano de rollback/forward-fix:
Observação pós-release: erros, disponibilidade e incidentes:
```

## Métricas DORA

Recolher por serviço e janela de tempo consistente, sem inferir valores a partir de commits ou estados de deploy isolados:

- **Deployment frequency:** deploys de produção bem-sucedidos por período.
- **Lead time for changes:** tempo entre commit pronto/review aprovado e execução em produção.
- **Change failure rate:** percentagem de deploys que causam rollback, hotfix ou incidente que exige intervenção.
- **Time to restore service:** tempo entre deteção do incidente e recuperação do serviço.

Para cada amostra, guardar período, serviço, numerador, denominador, fonte e exclusões. Fixar baseline antes de definir metas; não usar metas externas sem contexto. Atualmente não há série histórica confirmada neste repositório, pelo que os valores permanecem **Não medidos**. A recolha exige acesso a CI/Vercel e registo operacional de incidentes e rollbacks.
