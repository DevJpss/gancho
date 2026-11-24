import Link from "next/link";
import ScriptCard from "@/components/ScriptCard";
import { getLatestPack, getNiches, getPlans, getScriptsByPack } from "@/lib/catalog";
import { formatPrice, formatWeekRange } from "@/lib/format";
import { COMPARISON_PRICE_CENTS, DEFAULT_PACK_PRICE_CENTS } from "@/lib/site";

const steps = [
  {
    number: "01",
    title: "Coleta",
    text: "Na segunda de manhã, o job lê notícias e eventos da semana de cada nicho: o que está sendo falado, o que mudou, o que está na boca do povo.",
  },
  {
    number: "02",
    title: "Escreve",
    text: "A IA transforma cada sinal em um roteiro completo: hook, corpo com marcação de tempo, CTA e legenda. Um por subnicho, na mesma ordem, toda semana.",
  },
  {
    number: "03",
    title: "Você grava",
    text: "Abre o pack, escolhe o roteiro, lê em câmera e publica. Sem planilha, sem prompt, sem 'como eu começo?'",
  },
];

const faqs = [
  {
    question: "Recebo os textos prontos para copiar e colar?",
    answer:
      "Sim. Cada roteiro vem com hook, corpo dividido por tempo, CTA e legenda com hashtags. Você pode gravar como está ou adaptar à sua voz.",
  },
  {
    question: "Os roteiros são sobre o que aconteceu esta semana?",
    answer:
      "Sim. O job de segunda-feira coleta manchetes recentes dos oito nichos antes de escrever. Quando não há algo relevante, ele parte de um problema prático do subnicho.",
  },
  {
    question: "Posso usar em vários perfis ou para clientes?",
    answer:
      "Pode usar nos seus canais. A assinatura é por pessoa, não por conta de cliente: se você produz para terceiros, cada editor precisa da sua própria licença.",
  },
  {
    question: "E se eu não gostar de um roteiro?",
    answer:
      "O pack é digital e entregue na hora. Não há garantia de performance: tendência é contexto, não promessa de views. Veja amostras grátis antes de comprar.",
  },
];

export default async function HomePage() {
  const [pack, niches, plans] = await Promise.all([
    getLatestPack(),
    getNiches(),
    getPlans(),
  ]);
  const previewScripts = pack ? (await getScriptsByPack(pack.id)).slice(0, 2) : [];
  const plan = plans[0];

  return (
    <main>
      <section className="u-grid border-b border-line px-4 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="u-enter">
            <p className="mb-5 inline-flex items-center gap-2 border border-accent px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-accent uppercase">
              <span className="u-pulse h-2 w-2 rounded-full bg-accent" />
              Novo pack toda segunda · 9h
            </p>
            <h1 className="font-display text-6xl leading-[0.9] font-bold uppercase sm:text-8xl">
              Pare de olhar o feed.
              <br />
              <span className="text-accent">Comece a gravar.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
              Uma IA coleta o que está acontecendo na semana e escreve roteiros completos
              para Reels, TikTok e Shorts — separados por nicho e subnicho. Hook, corpo,
              CTA e legenda prontos.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={pack ? `/pack/${pack.slug}` : "/packs"}
                className="u-btn u-btn--primary px-7"
              >
                Ver pack da semana
              </Link>
              <Link
                href="/planos"
                className="u-btn u-btn--outline px-7"
              >
                Ver assinatura
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted">
              {niches.length} nichos · {niches.reduce((sum, n) => sum + (n.subniches?.length ?? 0), 0)} subnichos · 32 roteiros por pack
            </p>
          </div>

          <div className="relative">
            <div className="u-sample u-enter u-enter-1 border border-line bg-panel p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-line pb-4 text-xs font-semibold tracking-wide uppercase">
                <span className="text-accent">Amostra grátis</span>
                <span className="text-muted">Reels · 42s</span>
              </div>
              <p className="mt-6 text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
                Hook
              </p>
              <p className="mt-2 font-display text-3xl leading-tight font-bold uppercase">
                “Você não está sem tempo. Você está vendendo o seu tempo errado.”
              </p>
              <div className="mt-6 space-y-2 text-sm text-muted">
                <p>[0s] Mostre o extrato com três vendas pequenas.</p>
                <p>[6s] Uma venda de R$ 30 que tomou 4 horas não é renda extra.</p>
                <p>[16s] Separe o que pode ser repetido de onde você está.</p>
              </div>
              <div className="mt-6 border-t border-line pt-4 text-xs font-semibold text-muted uppercase">
                Finanças / Renda extra
              </div>
            </div>
            <p className="mt-8 text-xs text-muted">
              Exemplo ilustrativo. Os roteiros reais são gerados com as notícias da semana.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line px-4 py-16 sm:px-8 lg:px-16">
        <h2 className="font-display text-4xl font-bold uppercase sm:text-5xl">Como funciona</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="u-card u-reveal border-t-4 border-accent bg-panel p-6">
              <p className="font-display text-5xl font-bold text-line">{step.number}</p>
              <h3 className="mt-4 font-display text-2xl font-bold uppercase">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {pack ? (
        <section className="border-b border-line px-4 py-16 sm:px-8 lg:px-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
                Pack da semana · {formatWeekRange(pack.week_start)}
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase sm:text-5xl">
                Pronto para gravar hoje
              </h2>
            </div>
            <Link href={`/pack/${pack.slug}`} className="u-link font-semibold text-accent underline underline-offset-4">
              Ver todos os {pack.scripts_count} roteiros →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {previewScripts.map((script, index) => (
              <ScriptCard key={script.id} script={script} index={index + 1} />
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border border-accent bg-panel p-6">
            <div>
              <p className="font-display text-3xl font-bold">{formatPrice(pack.price_cents)}</p>
              <p className="text-sm text-muted">Pagamento único · acesso imediato ao pack completo</p>
            </div>
            <Link
              href={`/checkout?kind=pack&slug=${pack.slug}`}
              className="u-btn u-btn--primary px-7"
            >
              Comprar pack avulso
            </Link>
          </div>
        </section>
      ) : null}

      <section id="nichos" className="border-b border-line px-4 py-16 sm:px-8 lg:px-16">
        <h2 className="font-display text-4xl font-bold uppercase sm:text-5xl">Oito nichos, todo mundo atendido</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Cada semana tem um roteiro para cada subnicho. Escolha o seu e grave sem precisar
          transformar notícia em ideia.
        </p>
        <div className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {niches.map((niche) => (
            <div key={niche.id} className="u-cell u-reveal bg-panel p-5">
              <h3 className="font-display text-xl font-bold uppercase">{niche.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{niche.description}</p>
              <p className="mt-4 text-[11px] font-semibold tracking-wide text-accent uppercase">
                {niche.subniches?.map((sub) => sub.name).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-line px-4 py-16 sm:px-8 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Planos</p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase sm:text-5xl">
              Um pack ou a semana inteira
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted">
            Ferramentas de IA avançadas custam cerca de {formatPrice(COMPARISON_PRICE_CENTS)} por mês.
            Aqui você paga só pelo que vai gravar.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="u-card u-reveal border border-line bg-panel p-7">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Avulso</p>
            <h3 className="mt-2 font-display text-3xl font-bold uppercase">Pack da semana</h3>
            <p className="mt-4 font-display text-5xl font-bold">
              {formatPrice(DEFAULT_PACK_PRICE_CENTS)}
            </p>
            <p className="mt-1 text-sm text-muted">pagamento único</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ 32 roteiros completos da semana escolhida</li>
              <li>✓ Hook, corpo cronometrado, CTA e legenda</li>
              <li>✓ Acesso imediato, sem assinatura</li>
            </ul>
            <Link
              href={pack ? `/checkout?kind=pack&slug=${pack.slug}` : "/packs"}
              className="u-btn u-btn--dark u-btn--block mt-8 px-6"
            >
              Comprar avulso
            </Link>
          </article>
          <article className="u-card u-reveal border-2 border-accent bg-panel p-7">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">Recorrência</p>
            <h3 className="mt-2 font-display text-3xl font-bold uppercase">
              {plan?.name ?? "Gancho Pro"}
            </h3>
            <p className="mt-4 font-display text-5xl font-bold">
              {formatPrice(plan?.price_cents ?? 3990)}
            </p>
            <p className="mt-1 text-sm text-muted">por mês · cancele quando quiser</p>
            <ul className="mt-6 space-y-2 text-sm">
              {(plan?.features ?? []).map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
            <Link
              href={`/checkout?kind=subscription&slug=${plan?.slug ?? "pro"}`}
              className="u-btn u-btn--primary u-btn--block mt-8 px-6"
            >
              Assinar
            </Link>
          </article>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 lg:px-16">
        <h2 className="font-display text-4xl font-bold uppercase sm:text-5xl">Perguntas frequentes</h2>
        <div className="mt-8 max-w-3xl divide-y divide-line border-y border-line">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="cursor-pointer font-semibold transition-colors hover:text-accent marker:text-accent">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
