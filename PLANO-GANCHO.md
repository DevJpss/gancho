# Plano — Gancho (loja de roteiros gerados por IA)

**Data:** 24/11/2026  
**Status:** MVP implementado em `D:\doc\gancho`.

## 1. Estratégia

Reaproveitar a estrutura já validada no `evidence-reps` (Next.js + Supabase + Mercado Pago)
para um segundo produto digital. A ideia é montar várias fontes de receita com a mesma base
técnica, trocando apenas o domínio do produto.

Produto deste site: **roteiros completos de vídeo curto** (hook, corpo com marcação de tempo,
CTA e legenda), escritos toda segunda-feira a partir de notícias e eventos da semana.

## 2. Decisões travadas

| Decisão | Escolha |
|---|---|
| Entregável | Scripts completos prontos para Reels/TikTok/Shorts |
| Geração | 100% automática via API (coleta + IA + jurado independente + publicação sem revisão humana) |
| Modelo de venda | Pack avulso da semana + assinatura mensal |
| Nichos | 8 nichos × 4 subnichos = 32 roteiros por pack |
| Preço sugerido | R$ 19,90 avulso / R$ 39,90 por mês |
| Pagamento | Mercado Pago (Pix e cartão no avulso; preapproval na assinatura) |
| Entrega | Link pessoal com token, sem login |
| Job | Segunda-feira, 9h (Brasília), via Vercel Cron (Hobby: janela de ±59 min) |
| Stack inicial | 100% gratuita: Gemini Free, Supabase Free, Vercel Hobby, RSS e pagamento `demo` |

## 3. Arquitetura da geração

```
Vercel Cron (seg 12:00 UTC)
        |
        v
GET /api/cron/gerar-packs  (Bearer CRON_SECRET)
        |
        +--> Google News RSS por nicho (after:<segunda>)
        |
        +--> Roteirista: /chat/completions (json_object)
        |       +--> validação Zod + 1 retentativa
        |
        +--> Jurado independente: outra persona, temperatura baixa, modelo próprio
        |       +--> nota por roteiro + veredito + correção objetiva
        |       +--> se reprovar: reescrita + segundo julgamento + melhor versão por índice
        |
        +--> Supabase: trend_signals + scripts + pack publicado
                |
                +--> revalidateTag("packs" | "scripts")
```

Guardas: um pack por `week_start`, Bloqueio se já houver run `running`, e descarte do pack
se qualquer nicho falhar. Isso evita vender conteúdo incompleto.

## 4. Modelo de dados (resumo)

| Tabela | Função |
|---|---|
| `niches`, `subniches` | Taxonomia usada no prompt e nas páginas de SEO |
| `packs` | Edição semanal, preço, status e contagem de roteiros |
| `scripts` | Roteiros completos com hashtags, duração e score final atribuído pelo jurado |
| `trend_signals` | Manchetes coletadas (rastreabilidade do que originou o pack) |
| `generation_runs` | Auditoria do job: sucesso, falha, contadores e erro |
| `plans`, `subscriptions` | Assinatura e period endpoint |
| `customers`, `orders`, `order_items`, `payments` | Compra avulsa e recorrência |
| `webhook_events` | Idempotência do webhook |
| `admins`, `settings` | Painel e configurações |

RLS: leitura pública só de `niches`, `subniches`, `packs` publicados, `scripts` de packs
publicados, `sinais` de packs publicados e `plans` ativos. Todo o resto é `service_role`.

## 5. Diferenças em relação ao `evidence-reps`

- Não há carrinho, frete, CEP, fornecedor nem rastreio: produto digital.
- Cliente é identificado por token no link, não por login/senha.
- Assinatura usa preapproval em vez de pagamento único.
- O "fornecedor" é o próprio job de geração — não há compra manual operacional.

## 6. Riscos e cuidados

- **Qualidade da IA:** o jurado independente reprova e pede reescrita, mas não substitui revisão
  humana. Os termos responsabilizam o comprador pela conferência antes de publicar.
- **Fontes de notícia:** RSS público pode mudar de formato; o coletor falha de forma isolada
  por nicho e o job continua.
- **Custo da IA:** 2 a 4 chamadas por nicho por semana (roteirista, jurado, reescrita opcional e
  segundo julgamento), com retentativas e fallback entre modelos em 429/503. No início,
  `gemini-flash-lite-latest` e `gemini-3.1-flash-lite` (free tier) e `openrouter/free` custam
  R$ 0. Se precisar de mais rigor, troque `AI_JUDGE_MODEL` para um modelo pago;
  `AI_REVIEW_THRESHOLD` controla a severidade. Detalhes em `COMECO-GRATIS.md`.
- **Jurídico:** termos/privacidade são rascunhos. Revisar com contador/advogado antes de vender.
- **Cobrança recorrente:** testar preapproval com valor baixo e conferir cancelamento.

## 7. Próximos passos sugeridos

1. Seguir `COMECO-GRATIS.md`: chave Gemini, Supabase Free e deploy na Vercel Hobby.
2. Configurar `NEXT_PUBLIC_SITE_URL` e `CRON_SECRET`. Domínio próprio pode vir depois.
3. Manter `PAYMENT_MODE=demo` até validar o fluxo; credenciais do Mercado Pago só na virada para `live`.
4. Disparar o job manualmente no admin e conferir 32 roteiros no pack.
5. Testar compra avulsa em `demo`, depois Pix real de valor baixo e estorno.
6. Testar assinatura com preapproval real e cancelamento.
7. Adicionar e-mail transacional (Resend) para enviar o link da biblioteca automaticamente —
   hoje o link aparece na página do pedido.
