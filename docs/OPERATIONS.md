# Operação de Produção — Clã das Sombras

## Bootstrap do primeiro administrador

O Admin usa Supabase Auth para autenticação e `public.admin_user` como fonte de verdade para autorização interna. O metadata `app_metadata.role` é mantido apenas como espelho de compatibilidade.

Todo o acesso administrativo exige TOTP e uma sessão Supabase no nível `aal2`. Depois do primeiro login com password, o administrador é obrigado a digitalizar o QR code em `/admin-access` e confirmar o código da aplicação autenticadora. Nos acessos seguintes, a password cria apenas uma sessão `aal1`; a aplicação pede o código TOTP antes de disponibilizar páginas, APIs ou o cliente Supabase com a chave de serviço.

Uma inscrição abandonada pode deixar fatores TOTP `unverified`. Como o cliente Supabase exige `aal2` para `unenroll`, `POST /api/admin/mfa/enrollment` usa a Auth Admin API apenas para listar os fatores do administrador autenticado e apagar fatores TOTP ainda não verificados. O endpoint nunca remove fatores verificados nem executa operações de negócio.

Se a MFA estiver desativada na configuração de Auth do projeto, o Admin falha fechado e permanece inacessível. TOTP MFA deve estar ativo em **Supabase Dashboard → Authentication → Multi-Factor Authentication**.

Depois de aplicar `00440_admin_identity_bootstrap.sql`, configurar temporariamente em Production:

```env
ADMIN_BOOTSTRAP_EMAIL=<email-do-admin>
ADMIN_BOOTSTRAP_SECRET=<segredo-aleatorio-com-pelo-menos-16-caracteres>
```

Se o email ainda não existir em Supabase Auth, configurar também uma password inicial forte com pelo menos 12 caracteres:

```env
ADMIN_BOOTSTRAP_PASSWORD=<password-inicial-forte>
```

Após um novo deployment com essas variáveis, executar uma única vez:

```bash
GAMEVERSE_ORIGIN=https://game-verse-blond-beta.vercel.app
curl --fail --silent --show-error \
  -X POST \
  -H "Authorization: Bearer $ADMIN_BOOTSTRAP_SECRET" \
  "$GAMEVERSE_ORIGIN/api/internal/admin/bootstrap"
```

Em alternativa, abrir `/admin-access/setup`, introduzir apenas `ADMIN_BOOTSTRAP_SECRET` e selecionar **Criar primeiro administrador**. O browser não guarda o segredo; o email e a password continuam a ser lidos apenas no servidor a partir das variáveis de Production.

O endpoint promove a conta existente ou cria a conta Auth em falta, cria/ativa `admin_user` como `super_admin`, regista `ADMIN_BOOTSTRAPPED` no audit log e fecha o bootstrap para outros utilizadores enquanto existir um administrador ativo. Depois do sucesso, remover `ADMIN_BOOTSTRAP_PASSWORD` e `ADMIN_BOOTSTRAP_SECRET` do ambiente de produção e fazer novo deployment. O acesso administrativo é feito em `/admin-access` ou diretamente em `/admin` quando já existe sessão válida.

No primeiro acesso a `/admin-access`, concluir imediatamente a inscrição TOTP. Não partilhar o QR code nem a chave manual. Como o Supabase não fornece recovery codes TOTP, a perda do dispositivo exige uma recuperação privilegiada fora da aplicação: o owner do projeto remove o fator perdido através da Auth Admin MFA API e o administrador volta a inscrever TOTP no login seguinte. Nunca criar uma rota pública de bypass para este processo.

Como alternativa operacional para uma conta Auth já existente, a mesma promoção pode ser executada no SQL editor com privilégios de projeto:

```sql
select public.service_bootstrap_admin_by_email('admin@exemplo.pt','Initial platform administrator bootstrap');
```

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
GAMEVERSE_ORIGIN=https://game-verse-blond-beta.vercel.app
curl --fail --silent --show-error \
  -X POST \
  -H "Authorization: Bearer $INTERNAL_JOBS_SECRET" \
  "$GAMEVERSE_ORIGIN/api/internal/maintenance"
```

O worker é idempotente; múltiplas chamadas não devem duplicar settlements ou domain events.

## Build gate

`next.config.mjs` não ignora erros TypeScript. Um deployment Vercel só deve chegar a `READY` quando o build Next.js passa com o typecheck efetivo.

A checklist completa de promoção, incluindo os gates funcional, visual, Supabase/Vercel e rollback, está em [`docs/PRODUCTION_GATE.md`](./PRODUCTION_GATE.md).

O GitHub Actions `Application quality` executa o gate completo:

```text
pnpm run quality:production
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
