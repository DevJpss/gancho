/**
 * Sem tipos gerados pelo Supabase, relações `many-to-one` voltam como array.
 * Esta função aceita os dois formatos e devolve o primeiro registro.
 */
export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
