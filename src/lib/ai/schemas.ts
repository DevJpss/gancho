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

export type ReviewBatch = z.infer<typeof reviewBatchSchema>;

export const trendSignalSchema = z.object({
  title: z.string().trim().min(5),
  url: z.string().trim().url(),
  source: z.string().trim().min(2),
  published_at: z.string().nullable(),
  summary: z.string().nullable(),
});

export type TrendSignal = z.infer<typeof trendSignalSchema>;
