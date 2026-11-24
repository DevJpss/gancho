import { z } from "zod";

export const generatedScriptSchema = z.object({
  title: z.string().trim().min(8).max(140),
  hook: z.string().trim().min(20).max(300),
  body: z.string().trim().min(80).max(2400),
  cta: z.string().trim().min(10).max(240),
  caption: z.string().trim().min(20).max(600),
  hashtags: z.array(z.string().trim().min(2).max(40)).min(3).max(8),
  duration_seconds: z.number().int().min(15).max(90),
  score: z.number().min(0).max(100),
});

export const generatedBatchSchema = z.object({
  scripts: z.array(generatedScriptSchema).min(1).max(12),
});

/**
 * Modelos baratos às vezes devolvem números como texto ou hashtags em uma única string.
 * Este schema aceita esses formatos e normaliza antes de aplicar as regras do catálogo.
 */
const flexibleText = (min: number, max: number) => z.coerce.string().trim().min(min).max(max);

const flexibleHashtags = z
  .union([z.array(z.string()), z.string()])
  .transform((value) =>
    (Array.isArray(value) ? value : value.split(/[,;\n]/))
      .map((tag) => tag.trim().replace(/^#+/, ""))
      .filter(Boolean),
  )
  .pipe(z.array(z.string().trim().min(2).max(40)).min(3).max(8));

export const flexibleGeneratedBatchSchema = z.object({
  scripts: z
    .array(
      z.object({
        title: flexibleText(1, 140),
        hook: flexibleText(20, 300),
        body: flexibleText(80, 2400),
        cta: flexibleText(10, 240),
        caption: flexibleText(20, 600),
        hashtags: flexibleHashtags,
        duration_seconds: z.coerce.number().int().min(15).max(90),
        score: z.coerce.number().min(0).max(100),
      }),
    )
    .min(1)
    .max(12),
});

export type GeneratedBatch = z.infer<typeof generatedBatchSchema>;

export const scriptReviewSchema = z.object({
  index: z.number().int().min(0).max(11),
  score: z.number().min(0).max(100),
  verdict: z.enum(["aprovar", "revisar"]),
  problems: z.string().trim().max(500),
  fix: z.string().trim().max(500),
});

export const reviewBatchSchema = z.object({
  reviews: z.array(scriptReviewSchema).min(1).max(12),
});

export const flexibleReviewBatchSchema = z.object({
  reviews: z
    .array(
      z.object({
        index: z.coerce.number().int().min(0).max(11),
        score: z.coerce.number().min(0).max(100),
        verdict: z.enum(["aprovar", "revisar"]),
        problems: z.coerce.string().trim().max(500),
        fix: z.coerce.string().trim().max(500),
      }),
    )
    .min(1)
    .max(12),
});

export type ReviewBatch = z.infer<typeof reviewBatchSchema>;

export const trendSignalSchema = z.object({
  title: z.string().trim().min(5),
  url: z.string().trim().url(),
  source: z.string().trim().min(2),
  published_at: z.string().nullable(),
  summary: z.string().nullable(),
});

export type TrendSignal = z.infer<typeof trendSignalSchema>;
