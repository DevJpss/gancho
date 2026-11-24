import { z } from "zod";

/** Payload mínimo das notificações do Mercado Pago; campos extras são ignorados. */
export const paymentWebhookSchema = z.object({
  type: z.string().optional(),
  data: z
    .object({
      id: z.union([z.string().min(1), z.number().int().positive()]).optional(),
    })
    .optional(),
});

export type PaymentWebhook = z.infer<typeof paymentWebhookSchema>;

/** Token de acesso enviado por URL: sem espaços e com tamanho limitado. */
export const accessTokenSchema = z
  .string()
  .trim()
  .min(16, "Token inválido")
  .max(128, "Token inválido")
  .regex(/^[A-Za-z0-9_-]+$/, "Token inválido");
