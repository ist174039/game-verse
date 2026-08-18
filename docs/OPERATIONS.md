# Operação de Produção — Clã das Sombras

## Maintenance worker

A rota `GET|POST /api/internal/maintenance` executa o maintenance worker idempotente da plataforma. Ela processa:

- domain events pendentes;
- expiração de listings diretos;
- empréstimos em atraso;
- promoção de partidas `SCHEDULED` para `READY`;
- progressão de competições ativas;
- settlement/expiração de leilões;
- geração/refresh de ofertas de patrocínio;
- ciclos financeiros devidos.

A rota exige `Authorization: Bearer <secret>` e aceita `CRON_SECRET` ou `INTERNAL_JOBS_SECRET`. Os segredos devem ter pelo menos 16 caracteres.

## Vercel fallback cron

`vercel.json` agenda `/api/internal/maintenance` diariamente às `03:00 UTC`. Em Vercel Hobby esta é a cadência máxima suportada pelo Cron nativo.

Configurar em Production:

```env
CRON_SECRET=<segredo-aleatorio-forte>
INTERNAL_JOBS_SECRET=<segredo-aleatorio-forte>
```

Pode ser usado o mesmo valor forte em ambas as variáveis.

## Execução mais frequente

Para leilões e partidas, uma execução horária oferece melhor experiência operacional. Se existir um scheduler no servidor próprio, chamar:

```bash
curl --fail --silent --show-error \
  -X POST \
  -H "Authorization: Bearer $INTERNAL_JOBS_SECRET" \
  "$NEXT_PUBLIC_APP_URL/api/internal/maintenance"
```

O worker é idempotente; múltiplas chamadas não devem duplicar settlements ou domain events.

## Build gate

`next.config.mjs` não ignora erros TypeScript. Um deployment Vercel só deve chegar a `READY` quando o build Next.js passa com o typecheck efetivo.

O GitHub Actions `Application quality` continua a executar:

```text
pnpm run quality:domain
pnpm run typecheck
```

## Operação diária

Verificar regularmente:

1. deployment Vercel `READY` no SHA esperado;
2. erros 5xx da rota `/api/internal/maintenance`;
3. `internal_job_run` com estados `FAILED`;
4. filas de `domain_event` não processadas;
5. leilões expirados ainda `ACTIVE`;
6. empréstimos vencidos ainda `ACTIVE`;
7. partidas vencidas ainda `SCHEDULED`;
8. ciclos financeiros devidos sem settlement.
