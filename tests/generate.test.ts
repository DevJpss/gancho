import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_WRITER_MODEL,
  generateScriptsForNiche,
  getAiConfig,
  isAiConfigured,
  needsRevision,
  pickBestBatch,
} from "../src/lib/ai/generate";
import {
  flexibleGeneratedBatchSchema,
  flexibleReviewBatchSchema,
  reviewBatchSchema,
  type GeneratedBatch,
  type ReviewBatch,
} from "../src/lib/ai/schemas";

function script(title: string, score: number): GeneratedBatch["scripts"][number] {
  return {
    title,
    hook: "Você não está sem tempo, está vendendo o seu tempo errado.",
    body: "[0s] Mostre o extrato.\n[8s] Explique o custo por hora.\n[20s] Mostre o que pode ser repetido.",
    cta: "Comenta PADRÃO para receber o checklist.",
    caption: "Renda extra não é trabalhar mais; é parar de refazer o mesmo trabalho.",
    hashtags: ["rendaextra", "negocios", "produtividade"],
    duration_seconds: 42,
    score,
  };
}

function review(
  index: number,
  score: number,
  verdict: "aprovar" | "revisar",
): ReviewBatch["reviews"][number] {
  return { index, score, verdict, problems: "", fix: "" };
}

test("aceita a avaliação do jurado", () => {
  const result = reviewBatchSchema.safeParse({
    reviews: [review(0, 88, "aprovar"), review(1, 72, "revisar")],
  });
  assert.equal(result.success, true);
});

test("rejeita um veredito inventado pelo jurado", () => {
  const result = reviewBatchSchema.safeParse({
    reviews: [{ ...review(0, 88, "aprovar"), verdict: "talvez" }],
  });
  assert.equal(result.success, false);
});

test("não pede reescrita quando o jurado aprova todos", () => {
  const reviews = { reviews: [review(0, 88, "aprovar"), review(1, 84, "aprovar")] };
  assert.equal(needsRevision(reviews, 80), false);
});

test("pede reescrita quando há veredito de revisão ou nota baixa", () => {
  const byVerdict = { reviews: [review(0, 91, "aprovar"), review(1, 84, "revisar")] };
  const byScore = { reviews: [review(0, 79, "aprovar"), review(1, 90, "aprovar")] };

  assert.equal(needsRevision(byVerdict, 80), true);
  assert.equal(needsRevision(byScore, 80), true);
});

test("escolhe a melhor versão de cada roteiro e usa a nota do jurado", () => {
  const first = {
    batch: { scripts: [script("Versão A", 70), script("Versão B", 92)] },
    reviews: { reviews: [review(0, 70, "revisar"), review(1, 92, "aprovar")] },
  };
  const second = {
    batch: { scripts: [script("Versão A revisada", 60), script("Versão B revisada", 50)] },
    reviews: { reviews: [review(0, 88, "aprovar"), review(1, 81, "aprovar")] },
  };

  const result = pickBestBatch(first, second);

  assert.equal(result.scripts[0].title, "Versão A revisada");
  assert.equal(result.scripts[0].score, 88);
  assert.equal(result.scripts[1].title, "Versão B");
  assert.equal(result.scripts[1].score, 92);
});

test("sem segunda versão, mantém a nota do jurado na primeira", () => {
  const first = {
    batch: { scripts: [script("Versão A", 95)] },
    reviews: { reviews: [review(0, 73, "revisar")] },
  };

  const result = pickBestBatch(first);

  assert.equal(result.scripts[0].title, "Versão A");
  assert.equal(result.scripts[0].score, 73);
});

test("jurado reprova, roteirista reescreve e a melhor versão vence", async () => {
  const originalFetch = globalThis.fetch;
  const keys = ["AI_API_KEY", "AI_WRITER_MODEL", "AI_JUDGE_MODEL", "AI_REVIEW_THRESHOLD"] as const;
  const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  process.env.AI_API_KEY = "teste";
  process.env.AI_WRITER_MODEL = "roteirista";
  process.env.AI_JUDGE_MODEL = "jurado";
  process.env.AI_REVIEW_THRESHOLD = "80";

  const draft = {
    scripts: [
      { ...script("Versão A", 70), title: "Renda extra com limite claro" },
      { ...script("Versão B", 90), title: "Cartões sem surpresa" },
    ],
  };
  const rewrite = {
    scripts: [
      { ...script("Versão A revisada", 60), title: "Renda extra sem promessa de milagre" },
      draft.scripts[1],
    ],
  };
  const firstReviews = { reviews: [review(0, 70, "revisar"), review(1, 90, "aprovar")] };
  const secondReviews = { reviews: [review(0, 88, "aprovar"), review(1, 85, "aprovar")] };

  const calls: Array<{ model: string; judge: boolean; rewrite: boolean }> = [];

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    const system = body.messages[0]?.content ?? "";
    const user = body.messages[1]?.content ?? "";
    const judge = system.includes("editora sênior independente");
    const isRewrite = user.includes("editor independente reprovou");
    calls.push({ model: body.model, judge, rewrite: isRewrite });

    let content: unknown;
    if (judge && calls.length === 2) content = firstReviews;
    else if (judge) content = secondReviews;
    else if (isRewrite) content = rewrite;
    else content = draft;

    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await generateScriptsForNiche({
      nicheName: "Finanças",
      subniches: [
        { name: "Renda extra", slug: "renda-extra" },
        { name: "Cartões", slug: "cartoes" },
      ],
      signals: [],
      weekStart: "2026-11-23",
    });

    assert.deepEqual(
      calls.map((call) => call.model),
      ["roteirista", "jurado", "roteirista", "jurado"],
    );
    assert.deepEqual(
      calls.map((call) => call.judge),
      [false, true, false, true],
    );
    assert.equal(calls[2]?.rewrite, true);
    assert.equal(result.scripts[0].title, "Renda extra sem promessa de milagre");
    assert.equal(result.scripts[0].score, 88);
    assert.equal(result.scripts[1].title, "Cartões sem surpresa");
    assert.equal(result.scripts[1].score, 90);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("usa Gemini gratuito por padrão", () => {
  const keys = [
    "AI_API_KEY",
    "AI_BASE_URL",
    "AI_WRITER_MODEL",
    "AI_JUDGE_MODEL",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
    "OPENAI_JUDGE_MODEL",
  ] as const;
  const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  try {
    for (const key of keys) delete process.env[key];

    const config = getAiConfig();

    assert.equal(config.baseUrl, DEFAULT_AI_BASE_URL);
    assert.equal(config.writerModel, DEFAULT_AI_WRITER_MODEL);
    assert.equal(config.judgeModel, DEFAULT_AI_WRITER_MODEL);
    assert.equal(isAiConfigured(), false);

    process.env.AI_API_KEY = "chave-gemini";
    process.env.AI_WRITER_MODEL = "modelo-escritor";
    assert.equal(isAiConfigured(), true);
    assert.equal(getAiConfig().judgeModel, "modelo-escritor");
  } finally {
    for (const key of keys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("aceita as variáveis OPENAI_* legadas", () => {
  const keys = [
    "AI_API_KEY",
    "AI_BASE_URL",
    "AI_WRITER_MODEL",
    "AI_JUDGE_MODEL",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
    "OPENAI_JUDGE_MODEL",
  ] as const;
  const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  try {
    for (const key of keys) delete process.env[key];
    process.env.OPENAI_API_KEY = "chave-antiga";
    process.env.OPENAI_BASE_URL = "https://openrouter.ai/api/v1/";
    process.env.OPENAI_MODEL = "openrouter/free";

    const config = getAiConfig();

    assert.equal(config.apiKey, "chave-antiga");
    assert.equal(config.baseUrl, "https://openrouter.ai/api/v1");
    assert.equal(config.writerModel, "openrouter/free");
    assert.equal(config.judgeModel, "openrouter/free");
  } finally {
    for (const key of keys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("refaz a chamada sem response_format quando o provedor rejeita", async () => {
  const originalFetch = globalThis.fetch;
  const keys = ["AI_API_KEY", "AI_WRITER_MODEL", "AI_JUDGE_MODEL"] as const;
  const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  process.env.AI_API_KEY = "teste";
  process.env.AI_WRITER_MODEL = "roteirista";
  process.env.AI_JUDGE_MODEL = "jurado";

  const batch = { scripts: [script("Roteiro aprovado", 90)] };
  const approval = { reviews: [review(0, 90, "aprovar")] };
  const bodies: Array<Record<string, unknown>> = [];

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    bodies.push(body);

    if (bodies.length === 1) {
      return new Response(JSON.stringify({ error: "response_format not supported" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const content = bodies.length === 2 ? batch : approval;
    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await generateScriptsForNiche({
      nicheName: "Finanças",
      subniches: [{ name: "Cartões", slug: "cartoes" }],
      signals: [],
      weekStart: "2026-11-23",
    });

    assert.equal(bodies.length, 3);
    assert.equal("response_format" in bodies[0], true);
    assert.equal("response_format" in bodies[1], false);
    assert.equal(result.scripts[0].title, "Roteiro aprovado");
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("normaliza hashtags e notas que vêm como texto do modelo", () => {
  const batch = flexibleGeneratedBatchSchema.safeParse({
    scripts: [
      {
        ...script("Organização financeira sem complicação", 90),
        hashtags: "#financas, #organizacao, #rendaextra",
        score: "88",
        duration_seconds: "42",
      },
    ],
  });
  assert.equal(batch.success, true);
  if (!batch.success) return;
  assert.deepEqual(batch.data.scripts[0].hashtags, ["financas", "organizacao", "rendaextra"]);
  assert.equal(batch.data.scripts[0].score, 88);
  assert.equal(batch.data.scripts[0].duration_seconds, 42);

  const reviews = flexibleReviewBatchSchema.safeParse({
    reviews: [{ index: "0", score: "82", verdict: "aprovar", problems: "", fix: "" }],
  });
  assert.equal(reviews.success, true);
  if (!reviews.success) return;
  assert.equal(reviews.data.reviews[0].index, 0);
  assert.equal(reviews.data.reviews[0].score, 82);
});

test("completa título curto com o nome do subnicho", async () => {
  const originalFetch = globalThis.fetch;
  process.env.AI_API_KEY = "teste";

  const batch = { scripts: [{ ...script("IR", 90), title: "IR" }] };
  const approval = { reviews: [review(0, 90, "aprovar")] };
  let calls = 0;

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    calls += 1;
    const payload = JSON.parse(String(init?.body ?? "{}")) as {
      messages?: Array<{ content?: string }>;
    };
    const prompt = payload.messages?.map((message) => message.content ?? "").join(" ") ?? "";
    const content = /roteirista sênior/i.test(prompt) ? batch : approval;
    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await generateScriptsForNiche({
      nicheName: "Finanças",
      subniches: [{ name: "Imposto de renda", slug: "imposto-de-renda" }],
      signals: [],
      weekStart: "2026-11-23",
    });
    assert.equal(result.scripts[0].title, "Imposto de renda: IR");
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.AI_API_KEY;
  }
});
