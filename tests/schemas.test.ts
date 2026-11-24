import test from "node:test";
import assert from "node:assert/strict";
import { generatedBatchSchema } from "../src/lib/ai/schemas";

const valid = {
  title: "Renda extra sem custo escondido",
  hook: "Você não está sem tempo, está vendendo o seu tempo errado.",
  body: "[0s] Mostre o extrato.\n[8s] Explique o custo por hora.\n[20s] Mostre o que pode ser repetido.",
  cta: "Comenta PADRÃO para receber o checklist.",
  caption: "Renda extra não é trabalhar mais; é parar de refazer o mesmo trabalho.",
  hashtags: ["rendaextra", "negocios", "produtividade"],
  duration_seconds: 42,
  score: 82,
};

test("aceita um lote válido", () => {
  const result = generatedBatchSchema.safeParse({ scripts: [valid] });
  assert.equal(result.success, true);
});

test("rejeita hook muito curto", () => {
  const result = generatedBatchSchema.safeParse({
    scripts: [{ ...valid, hook: "Oi" }],
  });
  assert.equal(result.success, false);
});

test("rejeita duração fora do intervalo", () => {
  const result = generatedBatchSchema.safeParse({
    scripts: [{ ...valid, duration_seconds: 200 }],
  });
  assert.equal(result.success, false);
});
