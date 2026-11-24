import { z } from "zod";
import {
  flexibleGeneratedBatchSchema,
  flexibleReviewBatchSchema,
  type GeneratedBatch,
  type ReviewBatch,
  type TrendSignal,
} from "./schemas";

const WRITER_SYSTEM_PROMPT = `Você é um roteirista sênior de conteúdo curto para Reels, TikTok e Shorts, escrevendo em português do Brasil.
Você recebe um nicho, seus subnichos e manchetes reais da semana. Escreva UM script por subnicho, na mesma ordem em que foram enviados.

Regras obrigatórias:
- Escreva para gente comum, com frases curtas e voz falada. Sem jargão de marketing.
- "title" é o título da publicação: atrativo, específico, com um ângulo ou pergunta concreta (12 a 90 caracteres). Cite o subnicho, mas NUNCA use só o nome dele nem repita "Subnicho: Subnicho". Ruim: "Investimentos". Bom: "Investimentos: 3 erros que derrubam seu rendimento".
- "hook" é a primeira frase dita em câmera: 1 ou 2 linhas, que seguram o scroll sem clickbait fraudulento.
- "body" deve conter marcações de tempo no início de cada bloco, assim: [0s], [8s], [18s], [30s]. Entre 4 e 6 blocos.
- "cta" é um convite único e específico no final. Não prometa resultado, sorteio ou milagre.
- "caption" é a legenda da postagem, com 1 a 3 frases.
- "hashtags" deve ter de 3 a 6 termos, sem "#", em minúsculas.
- "duration_seconds" entre 30 e 55.
- "score" é apenas sua estimativa inicial; um editor independente vai avaliar de verdade depois.
- Nunca invente estatísticas, números, nomes de pessoas ou fatos que não estejam nos materiais enviados.
- Não faça promessa de ganho de dinheiro, emagrecimento, cura ou aprovação em concurso.
- Use as manchetes como CONTEXTO, não como texto copiado. Se não houver manchete útil, escreva sobre um problema prático do subnicho.
- Responda APENAS com um objeto JSON válido, sem comentários e sem markdown.`;

const JUDGE_SYSTEM_PROMPT = `Você é uma editora sênior independente de conteúdo curto. Você NÃO escreveu estes roteiros: recebeu uma versão anônima só para julgar. Seja uma leitora exigente, desconfiada e específica.

Avalie cada roteiro por esta rubrica:
- Título: atrativo e específico, com ângulo concreto — nunca apenas o nome do subnicho.
- Hook: segura o scroll nos primeiros 2 segundos sem promessa falsa ou clickbait.
- Corpo: soa falado, tem marcações de tempo coerentes, evolui em vez de repetir a mesma frase.
- CTA: único, específico e sem prometer milagre, dinheiro fácil, cura ou aprovação.
- Legenda e hashtags: combinem com o tema e não transformem o roteiro em spam.
- Fidelidade: não inventa números, estatísticas, nomes ou fatos fora das manchetes enviadas.
- Adequação: o texto faz sentido para o subnicho informado e para Reels/TikTok/Shorts.

Calibre a nota de 0 a 100: 90+ excepcional, 75-89 publicável, abaixo de 75 precisa de revisão.
Use "aprovar" apenas se o roteiro estiver pronto para publicar sem vergonha. Caso contrário, use "revisar".
Quando reprovar, aponte no máximo 2 problemas concretos e 1 instrução de correção objetiva. Não reescreva o roteiro.
Não influe nota por simpatia, não repita elogios vazios e não comente a qualidade da escrita em geral: julgue este roteiro específico.
Responda APENAS com um objeto JSON válido, sem comentários e sem markdown, no formato:
{"reviews":[{"index":0,"score":82,"verdict":"aprovar","problems":"","fix":""}]}
Use indexes começando em 0, um review por roteiro, na mesma ordem recebida.`;

/**
 * Stack gratuita por padrão: Gemini Flash-Lite (sem cartão, free tier).
 * O jurado pode usar outro modelo configurável em AI_JUDGE_MODEL.
 * As variáveis OPENAI_* continuam funcionando para quem já as configurou.
 */
export const DEFAULT_AI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
export const DEFAULT_AI_WRITER_MODEL = "gemini-flash-lite-latest";
export const DEFAULT_AI_JUDGE_MODEL = DEFAULT_AI_WRITER_MODEL;
export const DEFAULT_REVIEW_THRESHOLD = 80;

export const DEFAULT_AI_FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
];

export type AiConfig = {
  apiKey: string;
  baseUrl: string;
  writerModel: string;
  judgeModel: string;
  fallbackModels: string[];
};

export function getAiConfig(): AiConfig {
  const fallbacks = process.env.AI_FALLBACK_MODELS
    ? process.env.AI_FALLBACK_MODELS.split(",")
        .map((model) => model.trim())
        .filter(Boolean)
    : DEFAULT_AI_FALLBACK_MODELS;

  return {
    apiKey: process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
    baseUrl: (
      process.env.AI_BASE_URL ??
      process.env.OPENAI_BASE_URL ??
      DEFAULT_AI_BASE_URL
    ).replace(/\/+$/, ""),
    writerModel:
      process.env.AI_WRITER_MODEL ?? process.env.OPENAI_MODEL ?? DEFAULT_AI_WRITER_MODEL,
    judgeModel:
      process.env.AI_JUDGE_MODEL ??
      process.env.OPENAI_JUDGE_MODEL ??
      process.env.AI_WRITER_MODEL ??
      process.env.OPENAI_MODEL ??
      DEFAULT_AI_JUDGE_MODEL,
    fallbackModels: fallbacks,
  };
}

export function isAiConfigured(): boolean {
  return Boolean(getAiConfig().apiKey);
}

function reviewThreshold(): number {
  const raw = Number(process.env.AI_REVIEW_THRESHOLD ?? DEFAULT_REVIEW_THRESHOLD);
  if (!Number.isFinite(raw)) return DEFAULT_REVIEW_THRESHOLD;
  return Math.min(100, Math.max(0, raw));
}

function unwrapJson(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

type JsonRequest<T> = {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  temperature: number;
  model: string;
  correction?: string;
  validate?: (value: T) => void;
};

async function postCompletion(url: string, apiKey: string, body: object): Promise<Response> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, response_format: { type: "json_object" } }),
    cache: "no-store",
  });

  // Alguns modelos gratuitos só aceitam JSON por prompt, sem response_format.
  if (response.status === 400) {
    const detail = await response.text();
    if (/response_format/i.test(detail)) {
      return fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });
    }
    throw new Error(`IA ${response.status}: ${detail.slice(0, 300)}`);
  }

  return response;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

async function requestJson<T>(options: JsonRequest<T>): Promise<T> {
  const config = getAiConfig();
  if (!config.apiKey) {
    throw new Error("Chave de IA não configurada. Defina AI_API_KEY no .env.local.");
  }

  const body = {
    temperature: options.temperature,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
      ...(options.correction ? [{ role: "user" as const, content: options.correction }] : []),
    ],
  };

  const models = [options.model, ...config.fallbackModels.filter((model) => model !== options.model)];
  let lastStatus = 0;
  let lastDetail = "";

  for (const model of models) {
    const response = await postCompletion(`${config.baseUrl}/chat/completions`, config.apiKey, {
      ...body,
      model,
    });

    if (RETRYABLE_STATUS.has(response.status)) {
      lastStatus = response.status;
      lastDetail = (await response.text()).slice(0, 300);
      continue;
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`IA ${response.status}: ${detail.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("A IA não retornou conteúdo.");

    const parsed = options.schema.parse(JSON.parse(unwrapJson(content)));
    options.validate?.(parsed);
    return parsed;
  }

  throw new Error(`IA ${lastStatus}: ${lastDetail}`);
}

function describeAiError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".") || "resposta"}: ${issue.message}`)
      .join("; ")
      .slice(0, 700);
  }
  return error instanceof Error ? error.message.slice(0, 400) : "formato inválido";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJsonWithRetry<T>(
  options: Omit<JsonRequest<T>, "correction">,
  retryMessage: (detail: string) => string,
): Promise<T> {
  let lastError: unknown;
  let correction: string | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await requestJson({ ...options, correction });
    } catch (error) {
      lastError = error;
      if (!isAiConfigured()) throw error;
      if (attempt === 2) break;

      const detail = describeAiError(error);
      if (/\b(429|500|502|503|504)\b/.test(detail)) {
        await sleep(800 * (attempt + 1));
      } else {
        correction = retryMessage(detail);
      }
    }
  }

  throw lastError;
}

function assertBatchSize(batch: GeneratedBatch, expected: number): void {
  if (batch.scripts.length !== expected) {
    throw new Error(`A IA retornou ${batch.scripts.length} scripts; esperava ${expected}.`);
  }
}

function assertTitles(batch: GeneratedBatch, subnicheNames: string[]): void {
  batch.scripts.forEach((script, index) => {
    const name = subnicheNames[index]?.trim().toLowerCase() ?? "";
    const title = script.title.trim().toLowerCase();
    if (name && (title === name || title === `${name}: ${name}` || title.length < 12)) {
      throw new Error(`title do script ${index} é genérico: "${script.title}"`);
    }
  });
}

function assertReviewsCoverBatch(reviews: ReviewBatch, expected: number): void {
  if (reviews.reviews.length !== expected) {
    throw new Error(`O jurado avaliou ${reviews.reviews.length} roteiros; esperava ${expected}.`);
  }
  const indexes = new Set(reviews.reviews.map((review) => review.index));
  if (indexes.size !== expected || !Array.from({ length: expected }).every((_, index) => indexes.has(index))) {
    throw new Error("O jurado não avaliou todos os roteiros uma vez cada.");
  }
}

async function requestGeneratedBatch(
  userPrompt: string,
  expected: number,
  subnicheNames: string[],
): Promise<GeneratedBatch> {
  return requestJsonWithRetry(
    {
      system: WRITER_SYSTEM_PROMPT,
      user: userPrompt,
      schema: flexibleGeneratedBatchSchema,
      temperature: 0.8,
      model: getAiConfig().writerModel,
      validate: (batch) => {
        assertBatchSize(batch, expected);
        assertTitles(batch, subnicheNames);
      },
    },
    (detail) =>
      `A resposta anterior falhou na validação: ${detail}. Corrija EXATAMENTE esses campos e devolva o JSON completo com ${expected} scripts na mesma ordem. ` +
      `O "title" deve ser um título atrativo de 12+ caracteres com um ângulo concreto, nunca apenas o nome do subnicho. ` +
      `Respeite também: hook 20+, body 80+ com blocos [0s]/[8s]/[18s]/[30s], cta 10+, caption 20+, de 3 a 8 hashtags sem "#".`,
  );
}

async function judgeBatch(
  batch: GeneratedBatch,
  contextText: string,
  expected: number,
): Promise<ReviewBatch> {
  const user = `Contexto da semana (use só para conferir fidelidade e adequação):
${contextText}

Roteiros anônimos para avaliação:
${JSON.stringify(batch, null, 2)}

Avalie ${expected} roteiros. Retorne {"reviews":[{"index":0,"score":0,"verdict":"revisar","problems":"","fix":""}]} com um review por índice, de 0 a ${expected - 1}.`;

  return requestJsonWithRetry(
    {
      system: JUDGE_SYSTEM_PROMPT,
      user,
      schema: flexibleReviewBatchSchema,
      temperature: 0.2,
      model: getAiConfig().judgeModel,
      validate: (reviews) => assertReviewsCoverBatch(reviews, expected),
    },
    (detail) =>
      `A avaliação anterior falhou na validação: ${detail}. Retorne apenas o JSON válido com ${expected} reviews, ` +
      `indexes inteiros de 0 a ${expected - 1} (um por roteiro, sem repetir), score de 0 a 100 e verdict exatamente "aprovar" ou "revisar".`,
  );
}

export function needsRevision(reviews: ReviewBatch, threshold = reviewThreshold()): boolean {
  return reviews.reviews.some(
    (review) => review.verdict === "revisar" || review.score < threshold,
  );
}

export type ReviewedBatch = { batch: GeneratedBatch; reviews: ReviewBatch };

function reviewScore(reviews: ReviewBatch, index: number, fallback: number): number {
  return reviews.reviews.find((review) => review.index === index)?.score ?? fallback;
}

/** Escolhe, roteiro por roteiro, a versão com a melhor nota do jurado. */
export function pickBestBatch(first: ReviewedBatch, second?: ReviewedBatch): GeneratedBatch {
  return {
    scripts: first.batch.scripts.map((script, index) => {
      const firstScore = reviewScore(first.reviews, index, script.score);
      const alternative = second?.batch.scripts[index];
      if (!alternative) return { ...script, score: firstScore };

      const secondScore = reviewScore(
        second.reviews,
        index,
        alternative.score,
      );
      const chosen = secondScore > firstScore ? alternative : script;
      return { ...chosen, score: Math.max(firstScore, secondScore) };
    }),
  };
}

export async function generateScriptsForNiche(input: {
  nicheName: string;
  subniches: Array<{ name: string; slug: string }>;
  signals: TrendSignal[];
  weekStart: string;
}): Promise<GeneratedBatch> {
  const signalsText = input.signals.length
    ? input.signals
        .map(
          (signal, index) =>
            `${index + 1}. ${signal.title} (${signal.source}${
              signal.published_at ? `, ${signal.published_at.slice(0, 10)}` : ""
            })`,
        )
        .join("\n")
    : "(nenhuma manchete coletada — use um problema prático do subnicho)";

  const subnichesText = input.subniches
    .map((sub, index) => `${index + 1}. ${sub.name} (${sub.slug})`)
    .join("\n");

  const contextText = `Semana de ${input.weekStart}.
Nicho: ${input.nicheName}

Subnichos — devem aparecer EXATAMENTE nesta ordem no array "scripts":
${subnichesText}

Manchetes reais coletadas nesta semana:
${signalsText}`;

  const draftPrompt = `${contextText}

Escreva ${input.subniches.length} scripts. Cada "title" deve ser um título atrativo, com um ângulo ou pergunta concreta, que cite o subnicho correspondente — NUNCA apenas o nome do subnicho.
Retorne: {"scripts":[{"title","hook","body","cta","caption","hashtags","duration_seconds","score"}]}`;

  // Títulos curtos são corrigidos aqui, sem depender de outra ida ao modelo.
  const normalizeTitles = (batch: GeneratedBatch): GeneratedBatch => ({
    scripts: batch.scripts.map((script, index) => {
      const subniche = input.subniches[index]?.name ?? "";
      let title = script.title.trim();
      if (title.length < 8 && subniche) {
        title = `${subniche}: ${title}`.trim();
      }
      return { ...script, title: title.slice(0, 140) };
    }),
  });

  const draft = await requestGeneratedBatch(
    draftPrompt,
    input.subniches.length,
    input.subniches.map((sub) => sub.name),
  );
  const firstReview = await judgeBatch(draft, contextText, input.subniches.length);

  if (!needsRevision(firstReview)) {
    return normalizeTitles(pickBestBatch({ batch: draft, reviews: firstReview }));
  }

  const rewritePrompt = `${contextText}

Você vai REESCREVER o lote abaixo. O editor independente reprovou alguns roteiros.

Primeira versão:
${JSON.stringify(draft, null, 2)}

Avaliação do editor:
${JSON.stringify(firstReview, null, 2)}

Regras da reescrita:
- Mantenha ${input.subniches.length} scripts na MESMA ordem dos subnichos.
- Reescreva apenas os roteiros com verdict "revisar" ou nota abaixo de ${reviewThreshold()}; siga o campo "fix".
- Copie integralmente os roteiros aprovados, sem alterar uma vírgula.
- Não invente fatos, números ou nomes que não estejam nas manchetes acima.
- Retorne APENAS o JSON completo do lote final, no mesmo formato: {"scripts":[...]}`;

  const revision = await requestGeneratedBatch(
    rewritePrompt,
    input.subniches.length,
    input.subniches.map((sub) => sub.name),
  );
  const secondReview = await judgeBatch(revision, contextText, input.subniches.length);

  return normalizeTitles(
    pickBestBatch(
      { batch: draft, reviews: firstReview },
      { batch: revision, reviews: secondReview },
    ),
  );
}
