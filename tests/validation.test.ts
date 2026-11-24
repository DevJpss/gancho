import assert from "node:assert/strict";
import { test } from "node:test";
import { accessTokenSchema, paymentWebhookSchema } from "../src/lib/validation";

test("paymentWebhookSchema aceita notificação válida e ignora campos extras", () => {
  const result = paymentWebhookSchema.safeParse({
    type: "payment",
    data: { id: 123456 },
    action: "payment.updated",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.data?.id, 123456);
});

test("paymentWebhookSchema rejeita id inválido", () => {
  assert.equal(paymentWebhookSchema.safeParse({ type: "payment" }).success, true);
  assert.equal(paymentWebhookSchema.safeParse({ data: { id: "" } }).success, false);
  assert.equal(paymentWebhookSchema.safeParse({ data: { id: -1 } }).success, false);
});

test("accessTokenSchema aceita token hexadecimal e rejeita valores inventados", () => {
  const token = "a".repeat(48);
  assert.equal(accessTokenSchema.safeParse(token).success, true);
  assert.equal(accessTokenSchema.safeParse("curto").success, false);
  assert.equal(accessTokenSchema.safeParse("x".repeat(200)).success, false);
  assert.equal(accessTokenSchema.safeParse("token com espaços").success, false);
});
