import test from "node:test";
import assert from "node:assert/strict";
import { currentMonday, formatPrice, formatWeekRange, slugifyWeek } from "../src/lib/format";
import { absoluteUrl } from "../src/lib/site";

test("currentMonday retorna a segunda-feira da semana", () => {
  // Quarta-feira, 25/11/2026 às 14h UTC.
  assert.equal(currentMonday(new Date("2026-11-25T14:00:00Z")), "2026-11-23");
  // Domingo, 29/11/2026 às 23h UTC ainda pertence à semana de 23/11 em Brasília.
  assert.equal(currentMonday(new Date("2026-11-29T23:00:00Z")), "2026-11-23");
  // Segunda-feira, 30/11/2026 às 12h UTC já é a semana nova.
  assert.equal(currentMonday(new Date("2026-11-30T12:00:00Z")), "2026-11-30");
});

test("formatWeekRange mostra o intervalo da semana", () => {
  assert.equal(formatWeekRange("2026-11-23"), "23 a 29 de novembro");
});

test("formatPrice usa BRL", () => {
  assert.equal(formatPrice(1990), "R$ 19,90");
});

test("slugifyWeek gera slug previsível", () => {
  assert.equal(slugifyWeek("2026-11-23"), "semana-2026-11-23");
});

test("absoluteUrl normaliza barras", () => {
  assert.equal(absoluteUrl("/packs"), "https://gancho.vercel.app/packs");
  assert.equal(absoluteUrl(), "https://gancho.vercel.app/");
});
