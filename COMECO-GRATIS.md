# Começo 100% gratuito

Como colocar o Gancho no ar sem cartão de crédito e sem custo fixo. Nada aqui exige
plano pago; quando algum limite apertar, a troca é só de variável de ambiente.

| Peça | Serviço | Plano | Custo inicial |
|---|---|---|---|
| IA (roteirista + jurado) | Google Gemini API | Free tier | R$ 0 |
| Banco e auth | Supabase | Free | R$ 0 |
| Site e cron | Vercel | Hobby | R$ 0 |
| Notícias | Google News RSS | público | R$ 0 |
| Pagamentos | Mercado Pago | `demo` | R$ 0 (sem cobrança) |

## 1. Chave de IA gratuita (Gemini)

1. Abra https://aistudio.google.com/apikey com sua conta Google.
2. Crie uma chave em **Get API key** (não é preciso cadastrar cartão).
3. No `.env.local`:

```env
AI_API_KEY=sua-chave-aqui
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_WRITER_MODEL=gemini-flash-lite-latest
AI_JUDGE_MODEL=gemini-3.1-flash-lite
AI_FALLBACK_MODELS=gemini-3.1-flash-lite,gemini-flash-lite-latest
AI_REVIEW_THRESHOLD=80
```

`gemini-flash-lite-latest` é rápido e funciona bem como roteirista. O jurado usa
`gemini-3.1-flash-lite`, outro modelo, em uma chamada separada com outra persona e temperatura
baixa, para não ser uma simples autoavaliação. Se algum modelo estiver com demanda alta,
o job tenta automaticamente os modelos de `AI_FALLBACK_MODELS` em caso de 429/503. Ambos
são rápidos e foram testados no free tier.

Limites: RPM/TPM/RPD variam por projeto e aparecem em
https://aistudio.google.com/rate-limit. O job semanal faz poucas chamadas e cabe
tranquilamente no free tier. O tier gratuito usa os dados para melhorar produtos do
Google; se isso for problema, use a alternativa abaixo ou um provedor pago.

**Alternativa gratuita (OpenRouter):** crie a chave em https://openrouter.ai/keys e use:

```env
AI_API_KEY=sua-chave-openrouter
AI_BASE_URL=https://openrouter.ai/api/v1
AI_WRITER_MODEL=openrouter/free
AI_JUDGE_MODEL=openrouter/free
```

O roteador `openrouter/free` escolhe apenas modelos gratuitos disponíveis. Não coloque
modelos pagos como fallback: o fallback é cobrado. Modelos free mudam com o tempo e
podem ter limites menores de requisição.

## 2. Supabase Free

1. Crie um projeto em https://supabase.com → **New project** → plano Free.
2. Copie URL, anon key e service role key (Settings → API) para o `.env.local`.
3. Abra o SQL Editor, cole `supabase/migrations/0001_init.sql` e execute.
4. Crie seu usuário admin em Authentication → Users → Add user e rode:

```sql
insert into admins (user_id)
select id from auth.users where email = 'voce@exemplo.com';
```

Use um projeto **novo**: as tabelas são genéricas e colidem com as do `evidence-reps`.

Atenção: o Supabase Free pausa projetos após 7 dias sem atividade. O job semanal e o
acesso à vitrine costumam manter o projeto acordado; se for ficar parado por mais tempo,
basta abrir o dashboard do projeto para reativar.

### Se o Supabase estiver ligado ao repositório `gancho`

1. A pasta `supabase/` deve estar na raiz do repo e o **Working directory** da integração
   no dashboard deve ser `.`.
2. Envie `supabase/migrations/0001_init.sql` para a branch de produção:

```bash
git add supabase
git commit -m "Schema inicial do Gancho"
git push
```

3. Ative **Deploy to production** em Project Settings → Integrations → GitHub. Assim o
   migration é aplicado automaticamente no push; não precisa colar no SQL Editor.
4. Se o repo já tiver `supabase/config.toml`, mantenha-o. Sem arquivo de config, a
   integração ainda aplica as migrations.
5. Acompanhe o resultado em **Branching/Deployments** no dashboard. Se o migration falhar
   por conflito (tabelas já existentes), use o SQL Editor como alternativa.

A pasta `D:\doc\gancho` ainda não é um repositório Git local. Se quiser que eu inicialize
o Git e conecte ao remote, me passe a URL do repo.

## 3. Vercel Hobby

1. Faça deploy do repositório em https://vercel.com (plano Hobby, sem cartão).
2. Cadastre as mesmas variáveis do `.env.local` em Project Settings → Environment Variables.
3. Defina `NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app` (ou seu domínio).
4. Gere um `CRON_SECRET` forte (por exemplo `openssl rand -hex 32`) e use o mesmo valor
   no Vercel. Ele protege `/api/cron/gerar-packs` e o botão manual em `/admin/geracao`.
5. O `vercel.json` já agenda `0 12 * * 1` — segunda às 12:00 UTC (9h em Brasília).

No Hobby, cron jobs rodam no máximo uma vez por dia e com precisão por hora: o disparo
pode acontecer entre 9h e 10h. Uma vez por semana está dentro do limite. Funções têm
até 300 s por execução, suficientes para as 8 chamadas de IA do job.

Se preferir não depender do cron do Vercel, dispare o endpoint manualmente em
`/admin/geracao` toda segunda.

## 4. Pagamentos sem custo

Deixe `PAYMENT_MODE=demo`. O checkout cria o pedido, mostra o status e permite simular
a aprovação em `/pedido/[code]`, sem cobrar nada. É o modo ideal para validar o fluxo.

Quando quiser vender de verdade, troque para `live`, informe as credenciais do Mercado
Pago, cadastre a chave Pix e registre o webhook `https://seu-dominio/api/webhooks/pagamento`
para os eventos `payment` e `subscription_preapproval`. Não há mensalidade: o custo é
por transação, e a tarifa varia conforme sua conta. Teste com valor baixo e estorne.

## 5. O que muda quando o projeto crescer

- **Gemini:** se bater rate limit, reduza a concorrência ou suba para o tier pago; as
  variáveis `AI_*` não mudam de nome.
- **Jurado mais rigoroso:** `AI_JUDGE_MODEL=gemini-4-carbon` (pago) ou outro modelo.
  A persona independente continua a mesma.
- **Supabase:** ao passar do Free, o banco deixa de pausar e ganha mais espaço.
- **Cron mais frequente/preciso:** Schedules/Pro do Vercel permitem execuções mais
  frequentes; a cada segunda já funciona no Hobby.
- **Preços:** confirmados em R$ 19,90 (avulso) e R$ 39,90/mês antes de publicar.
