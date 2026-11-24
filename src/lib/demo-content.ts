import { currentMonday, slugifyWeek } from "./format";
import { DEFAULT_PACK_PRICE_CENTS, DEFAULT_PLAN_PRICE_CENTS } from "./site";
import type { Niche, Pack, Plan, Script, Subniche } from "./types";

const week = currentMonday();

function previousWeek(weeks: number): string {
  const date = new Date(`${week}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - weeks * 7);
  return date.toISOString().slice(0, 10);
}

const nicheSeed: Array<[string, string, string, string[]]> = [  ["Finanças", "financas", "Renda, investimentos e organização sem juridiquês.", ["Investimentos", "Cartões", "Renda extra", "Imposto de renda"]],
  ["Saúde & Treino", "saude-e-treino", "Treino, recuperação e hábitos com pé no chão.", ["Musculação", "Emagrecimento", "Corrida", "Recuperação"]],
  ["Tecnologia & IA", "tecnologia-e-ia", "Ferramentas, automação e o que muda na prática.", ["Ferramentas de IA", "Gadgets", "Automação", "Privacidade"]],
  ["Beleza & Estética", "beleza-e-estetica", "Rotinas, produtos e tendências sem promessa milagrosa.", ["Skincare", "Maquiagem", "Cabelos", "Procedimentos"]],
  ["Alimentação", "alimentacao", "Comida de verdade, receitas e rotina na cozinha.", ["Receitas", "Dieta", "Organização", "Bebidas"]],
  ["Carreira & Negócios", "carreira-e-negocios", "Vendas, marketing e trabalho com linguagem de adulto.", ["Empreendedorismo", "Vendas", "Marketing digital", "Currículo"]],
  ["Casa & Decoração", "casa-e-decoracao", "Espaços menores, organização e reformas possíveis.", ["Organização", "Reforma", "Jardinagem", "Limpeza"]],
  ["Educação", "educacao", "Estudo, concursos e idiomas com método.", ["Concursos", "Vestibular", "Idiomas", "Técnicas de estudo"]],
];

export const demoNiches: Niche[] = nicheSeed.map(([name, slug, description], index) => ({
  id: `niche-${index + 1}`,
  name,
  slug,
  description,
  accent: null,
  sort_order: index,
}));

export const demoSubniches: Subniche[] = nicheSeed.flatMap((entry, nicheIndex) => {
  return entry[3].map((name, index) => ({
    id: `sub-${nicheIndex + 1}-${index + 1}`,
    niche_id: `niche-${nicheIndex + 1}`,
    name,
    slug: name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    description: null,
    sort_order: index,
  }));
});

function script(
  id: string,
  packId: string,
  nicheIndex: number,
  subIndex: number,
  title: string,
  hook: string,
  body: string,
  cta: string,
  caption: string,
  hashtags: string[],
  duration = 42,
): Script {
  return {
    id,
    pack_id: packId,
    niche_id: `niche-${nicheIndex}`,
    subniche_id: `sub-${nicheIndex}-${subIndex}`,
    title,
    hook,
    body,
    cta,
    caption,
    hashtags,
    duration_seconds: duration,
    score: 82,
    position: Number(id.split("-").pop()),
  };
}

const packCurrentId = "pack-demo-1";
const packPreviousId = "pack-demo-2";
const packOlderId = "pack-demo-3";

const demoScripts: Script[] = [
  script(
    "script-1",
    packCurrentId,
    1,
    3,
    "Renda extra que não vira custo extra",
    "Você não está sem tempo. Você está vendendo o seu tempo errado.",
    "[0s] Mostre o extrato com 3 vendas pequenas.\n[6s] Uma venda de R$ 30 que tomou 4 horas não é renda extra: é um emprego com pior salário.\n[16s] Separe o que pode ser repetido de onde você está. Repetição é o que vira produto.\n[28s] Escolha UMA coisa para padronizar esta semana: preço, roteiro ou horário de postagem.\n[38s] Só depois disso pense em escalar.",
    "Comenta 'PADRÃO' que eu mando o checklist de 1 página.",
    "Renda extra não é trabalhar mais. É parar de refazer o mesmo trabalho. #rendaextra",
    ["rendaextra", "negocios", "produtividade"],
  ),
  script(
    "script-2",
    packCurrentId,
    3,
    1,
    "3 prompts para transformar notícia em conteúdo",
    "A notícia já está pronta. O que falta é o ângulo — e isso você roteiriza em 30 segundos.",
    "[0s] Tela com manchete qualquer da semana.\n[5s] Prompt 1: 'Resume em 2 frases para quem não acompanha o assunto.'\n[14s] Prompt 2: 'Me dê 3 ângulos polêmicos, mas defensáveis, para um vídeo de 40 segundos.'\n[24s] Prompt 3: 'Escreva um hook de 1 linha para cada ângulo, sem prometer resultado.'\n[35s] Você não copia a IA. Você a usa para chegar no ângulo mais rápido.",
    "Salva esse post e testa com a notícia de hoje.",
    "Notícia todo mundo lê. Ângulo é o que faz alguém parar o scroll. #ia #conteudo",
    ["inteligenciaartificial", "prompt", "conteudo"],
  ),
  script(
    "script-3",
    packCurrentId,
    2,
    4,
    "O que a ciência diz sobre treinos curtos",
    "12 minutos de treino não são 'pouco'. São tempo suficiente se você não desperdiçar nenhum segundo.",
    "[0s] Você cronometrando no celular.\n[6s] O que pesa não é a duração: é a densidade de séries com esforço real e pausa controlada.\n[18s] Para quem começa, 3 exercícios bem feitos superam 10 exercícios sem intensidade.\n[30s] A regra prática: se dá para conversar o tempo todo, ainda dá para subir um nível.\n[40s] Treino curto é ferramenta, não desculpa — nem milagre.",
    "Guarda esse vídeo para o dia em que você disser 'não tenho tempo'.",
    "Treino curto funciona quando o treino é honesto. #treino #saude",
    ["treino", "musculacao", "saude"],
    45,
  ),
  script(
    "script-4",
    packCurrentId,
    4,
    1,
    "Ordem do skincare: o que muda de verdade",
    "Você não precisa de 9 produtos. Precisa de 3 na ordem certa.",
    "[0s] Produtos alinhados na bancada.\n[5s] Limpar, tratar, proteger. Nessa ordem, todo o resto é detalhe.\n[15s] O erro mais comum é comprar o 'tratamento' antes de acertar a proteção.\n[27s] E cuidado: mais camadas não significam mais resultado — significam mais irritação possível.\n[38s] Comece simples, observe 4 semanas, mude uma coisa por vez.",
    "Me conta nos comentários qual produto você usaria primeiro.",
    "Menos produtos, mais consistência. #skincare #beleza",
    ["skincare", "beleza", "rotina"],
  ),
  script(
    "script-5",
    packPreviousId,
    3,
    3,
    "Automação que você configura em 10 minutos",
    "Automação boa não é complexa. É chata o suficiente para rodar todo dia.",
    "[0s] Uma tarefa repetitiva na tela.\n[6s] Escolha uma coisa que você faz toda semana e odeia: relatório, aviso, organizar arquivo.\n[17s] Escreva o passo a passo como se fosse ensinar para outra pessoa.\n[28s] Só então transforme cada passo em uma regra. A clareza vem antes da ferramenta.\n[40s] Se você não consegue explicar, ainda não está pronto para automatizar.",
    "Salva e automatiza uma coisa hoje.",
    "Automatize o chato, não o importante. #automacao #produtividade",
    ["automacao", "produtividade", "trabalho"],
  ),
  script(
    "script-6",
    packPreviousId,
    6,
    2,
    "O preço antes da técnica de vendas",
    "Se você precisa convencer no argumento, o preço está errado antes da conversa começar.",
    "[0s] Um orçamento na tela com valor alto.\n[6s] Cliente não compra pelo menor preço. Compra pelo menor risco percebido.\n[17s] Mostre o que acontece se ele não resolver: tempo perdido, retrabalho, vergonha.\n[29s] Depois mostre exatamente o que muda com a sua solução — sem adjetivos.\n[40s] Quem prova valor não precisa de pegadinha de escassez.",
    "Comenta 'CUSTO' para eu mandar o roteiro de diagnóstico.",
    "Vender é reduzir risco, não aumentar pressão. #vendas #negocios",
    ["vendas", "negocios", "marketing"],
  ),
  script(
    "script-7",
    packPreviousId,
    5,
    1,
    "Receita de 15 minutos que não é 'comida fit'",
    "Comida rápida não precisa ser comida ruim — só precisa de uma panela e uma regra.",
    "[0s] Ingredientes simples na bancada.\n[5s] Uma base (proteína), um volume (vegetal), um tempero (ácido). Decide isso antes de cozinhar.\n[16s] Organize o tempo: começa o que demora mais, aproveita a mesma panela para o resto.\n[29s] O sucesso está no acidez no final: limão ou vinagre muda o prato inteiro.\n[40s] Receita boa é a que você repete na terça, não a que viralizou na segunda.",
    "Salva para a próxima terça-feira.",
    "Uma panela, três decisões, jantar pronto. #receitas #comida",
    ["receitas", "culinaria", "rotina"],
  ),
  script(
    "script-8",
    packOlderId,
    8,
    4,
    "Como estudar quando o dia não colabora",
    "Você não perde o dia quando estuda pouco. Perde quando estuda sem alvo.",
    "[0s] Caderno com uma única pergunta escrita.\n[6s] Antes de abrir o material, escreva a pergunta que você quer responder.\n[16s] Estude só até responder. O resto é distração com cheiro de produtividade.\n[28s] 25 minutos com pergunta rendem mais que 3 horas de 'vou ver o que cai'.\n[40s] Termine escrevendo a resposta com as suas palavras. Se não consegue, ainda não aprendeu.",
    "Testa hoje com uma pergunta só.",
    "Estudo sem pergunta é rolagem de material. #concursos #estudo",
    ["estudo", "concursos", "aprendizagem"],
  ),
];

export const demoPacks: Pack[] = [
  {
    id: packCurrentId,
    week_start: week,
    slug: slugifyWeek(week),
    title: `Pack da semana — ${week}`,
    summary:
      "32 scripts organizados por 8 nichos e 32 subnichos, escritos a partir do que aconteceu nesta semana. Hook, corpo, CTA e legenda prontos para gravar.",
    cover_url: null,
    price_cents: DEFAULT_PACK_PRICE_CENTS,
    compare_at_price_cents: 10000,
    status: "published",
    published_at: `${week}T12:00:00Z`,
    generated_at: `${week}T09:00:00Z`,
    scripts_count: 32,
  },
  {
    id: packPreviousId,
    week_start: previousWeek(1),
    slug: slugifyWeek(previousWeek(1)),
    title: `Pack da semana — ${previousWeek(1)}`,
    summary: "Scripts da semana passada, mantidos na biblioteca para quem assina.",
    cover_url: null,
    price_cents: DEFAULT_PACK_PRICE_CENTS,
    compare_at_price_cents: null,
    status: "published",
    published_at: `${previousWeek(1)}T12:00:00Z`,
    generated_at: `${previousWeek(1)}T09:00:00Z`,
    scripts_count: 32,
  },
  {
    id: packOlderId,
    week_start: previousWeek(2),
    slug: slugifyWeek(previousWeek(2)),
    title: `Pack da semana — ${previousWeek(2)}`,
    summary: "Arquivo de duas semanas atrás.",
    cover_url: null,
    price_cents: DEFAULT_PACK_PRICE_CENTS,
    compare_at_price_cents: null,
    status: "published",
    published_at: `${previousWeek(2)}T12:00:00Z`,
    generated_at: `${previousWeek(2)}T09:00:00Z`,
    scripts_count: 32,
  },
];

export function getDemoScripts(packId: string): Script[] {
  return demoScripts.filter((item) => item.pack_id === packId);
}

export const demoPlans: Plan[] = [
  {
    id: "plan-pro",
    name: "Gancho Pro",
    slug: "pro",
    price_cents: DEFAULT_PLAN_PRICE_CENTS,
    interval: "monthly",
    features: [
      "Todos os packs da semana, sem comprar separado",
      "Arquivo completo das semanas anteriores",
      "Novos roteiros toda segunda-feira às 9h",
      "Cancelamento a qualquer momento",
    ],
    active: true,
    sort_order: 0,
  },
];
