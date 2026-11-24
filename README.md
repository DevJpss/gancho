# Gancho — roteiros prontos toda segunda-feira

Loja de roteiros digitais para Reels/TikTok/Shorts. Um job semanal coleta notícias dos
nichos, usa uma IA para escrever um script por subnicho e publica o pack automaticamente.
O cliente compra o pack avulso ou assina e recebe todos.

Stack idêntica ao projeto `evidence-reps`: Next.js 16 (App Router, Cache Components),
React 19, TypeScript, Tailwind 4, Supabase e Mercado Pago.

**Começo sem custo:** Gemini (free tier, sem cartão), Supabase Free, Vercel Hobby,
Google News RSS e Mercado Pago em `demo`. Veja o passo a passo em
[`COMECO-GRATIS.md`](./COMECO-GRATIS.md).

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sem Supabase, a vitrine usa packs de demonstração. Para testar checkout e geração,
preencha as chaves do Supabase. **Use um projeto Supabase novo**: as tabelas
`orders`, `customers`, `payments`, `settings` etc. colidem com as do `evidence-reps`.
O plano Free pausa o banco após 7 dias sem acesso; o job semanal e as visitas ao site
normalmente mantêm o projeto ativo.

## Supabase

1. Crie um projeto em https://supabase.com.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
   `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.
3. Execute `supabase/migrations/0001_init.sql` no SQL Editor. O script já cria:
   - 8 nichos e 32 subnichos;
   - o plano `Gancho Pro`;
   - RLS: catálogo público, dados de cliente apenas via `service_role`;
   - bucket público `pack-covers`.
4. Crie o admin em Authentication > Users > Add user e depois:

```sql
insert into admins (user_id)
select id from auth.users where email = 'voce@exemplo.com';
```

5. Acesse `/admin/login`.

## Geração automática (segunda-feira)

Env vars:

| Variável | Uso |
|---|---|
| `AI_API_KEY` | Obrigatória para gerar; chave do Gemini (grátis) em https://aistudio.google.com/apikey |
| `AI_BASE_URL` | Padrão `https://generativelanguage.googleapis.com/v1beta/openai`; aceita OpenRouter/OpenAI/etc. |
| `AI_WRITER_MODEL` | Roteirista; padrão gratuito `gemini-4-hydrogen` |
| `AI_JUDGE_MODEL` | Jurado; usa `AI_WRITER_MODEL` se omitido |
| `AI_REVIEW_THRESHOLD` | Nota mínima para aprovar sem reescrita; padrão `80` |
| `CRON_SECRET` | Protege o endpoint do job |
| `NEWS_LOCALE`, `NEWS_REGION`, `NEWS_LANGUAGE` | Google News RSS (padrão pt-BR/BR) |

Alternativa gratuita: `AI_BASE_URL=https://openrouter.ai/api/v1` com
`AI_WRITER_MODEL=openrouter/free` e `AI_JUDGE_MODEL=openrouter/free`. As variáveis
`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` e `OPENAI_JUDGE_MODEL` continuam
funcionando como legado.

O endpoint é `GET /api/cron/gerar-packs`, protegido por `Authorization: Bearer <CRON_SECRET>`.
O `vercel.json` agenda `0 12 * * 1` (segunda, 9h em Brasília). No Vercel Hobby o cron é
permitido, mas a execução pode atrasar até 59 minutos. Fluxo:

1. Verifica se já existe pack para a semana e se não há geração em andamento.
2. Para cada nicho ativo: coleta até 6 manchetes do Google News RSS via `after:<segunda>`.
3. O roteirista escreve o lote; um jurado independente avalia cada roteiro por rubrica com outro
   system prompt, temperatura baixa e modelo configurável.
4. Se algum roteiro for reprovado, o roteirista reescreve só as falhas e um segundo julgamento
   escolhe a melhor versão de cada posição. A nota final salva é a do jurado, não a do autor.
5. Toda resposta é validada com Zod, com uma retentativa se o JSON ou a quantidade estiver errada.
6. Grava `trend_signals` e `scripts`, publica o pack e registra `generation_runs`.
7. Se qualquer nicho falhar, o pack é descartado e o run fica `failed` — nunca vai ao ar
   conteúdo parcial.

O botão em `/admin/geracao` dispara o mesmo endpoint manualmente.

> A collection usa RSS público, sem chave. Respeite os termos das fontes. A IA pode errar:
> os termos deixam claro que o cliente deve conferir fatos antes de publicar.

## Pagamentos

| Variável | Uso |
|---|---|
| `PAYMENT_MODE` | `demo` (padrão) ou `live` |
| `MERCADO_PAGO_ACCESS_TOKEN` | Necessário em `live` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Valida a assinatura HMAC |
| `NEXT_PUBLIC_SITE_URL` | Usada em `back_urls` e no disparo manual do cron |

- **Pack avulso:** Pix (QR Code) ou cartão (preference).
- **Assinatura:** preapproval recorrente do Mercado Pago (`/v1/preapproval`), sempre cartão.
- Webhook: `https://seu-dominio/api/webhooks/pagamento`, eventos **Pagamentos** e
  **Assinaturas** (`payment` e `subscription_preapproval`). Idempotência por `event_id`
  em `webhook_events`. Confirmação nunca vem do navegador.
- Para Pix é obrigatório ter chave Pix cadastrada na conta do Mercado Pago.

Em `demo`, o pedido fica pendente e o botão em `/pedido/[code]` simula a aprovação.
Nenhuma cobrança é feita.

## Entrega do conteúdo

Não há login para o cliente. Cada `customer` recebe um `access_token` aleatório no banco.
A página do pedido mostra `/biblioteca?token=...`, que lista os packs pagos. Se houver
assinatura ativa, todos os packs publicados ficam liberados.

## Preços

Padrão no código: pack avulso R$ 19,90 e assinatura R$ 39,90/mês. O preço cobrado é sempre
relido do banco no servidor; o navegador envia apenas `kind` e `slug`. Para alterar, edite
a linha do pack em `packs.price_cents`, a tabela `plans` e os textos de `src/lib/site.ts`.

## Rotas principais

| Rota | Descrição |
|---|---|
| `/` | Home, amostra grátis, nichos e planos |
| `/packs`, `/pack/[slug]` | Catálogo e detalhe com 2 roteiros grátis |
| `/nichos/[slug]` | Página por nicho (SEO) |
| `/planos`, `/checkout` | Planos e checkout |
| `/pedido/[code]` | Status, QR/link de pagamento e acesso |
| `/biblioteca?token=...` | Roteiros liberados |
| `/admin` | Painel (packs, pedidos, geração) |
| `/api/webhooks/pagamento` | Webhook assinado |
| `/api/cron/gerar-packs` | Job semanal |

## Validação

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Antes de vender de verdade

- Contador/CNPJ, termos e privacidade revisados por profissional (o texto atual é um rascunho).
- Informar claramente que roteiros são sugestões e não garantem resultado.
- Confirmar a tarifa do Mercado Pago da sua conta e ajustar os cálculos em `payments/orders.ts`.
- Testar Pix e preapproval com valores baixos em produção e estornar/remover os dados de teste.
- Dar ao cliente um canal de atendimento (e-mail/WhatsApp) nos textos legais.
