const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(cents: number): string {
  return brl.format(cents / 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T12:00:00Z`);
  if (Number.isNaN(start.getTime())) return weekStart;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "UTC" }).format(start);
  const endDay = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "UTC" }).format(end);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(end);
  return `${day} a ${endDay} de ${month}`;
}

/** Segunda-feira atual no fuso de Brasília (UTC-3), em ISO `YYYY-MM-DD`. */
export function currentMonday(now = new Date()): string {
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const weekday = local.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  local.setUTCDate(local.getUTCDate() + offset);
  return local.toISOString().slice(0, 10);
}

export function slugifyWeek(weekStart: string): string {
  return `semana-${weekStart}`;
}
