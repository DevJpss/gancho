import { createAdminClient } from "@/lib/supabase/admin";

const PAID_STATUSES = ["paid", "refunded"];

export function generateOrderCode(): string {
  return `GC-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function markOrderPaid(input: {
  code: string;
  providerPaymentId: string | null;
  status?: string;
}): Promise<boolean> {
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select("id,status,kind,customer_id,plan_id")
    .eq("code", input.code)
    .maybeSingle();
  if (error || !order || PAID_STATUSES.includes(order.status)) return false;

  const now = new Date().toISOString();

  const { data: existingPayment } = await admin
    .from("payments")
    .select("payload")
    .eq("order_id", order.id)
    .maybeSingle();

  const { error: updateError } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: now,
      payment_id: input.providerPaymentId,
    })
    .eq("id", order.id)
    .eq("status", "pending_payment");
  if (updateError) return false;

  await admin
    .from("payments")
    .update({
      status: input.status ?? "approved",
      ...(input.providerPaymentId ? { provider_payment_id: input.providerPaymentId } : {}),
      payload: {
        ...((existingPayment?.payload ?? {}) as Record<string, unknown>),
        confirmed_at: now,
      },
    })
    .eq("order_id", order.id)
    .neq("status", "approved");

  if (order.kind === "subscription" && order.plan_id) {
    await activateSubscription({
      customerId: order.customer_id,
      planId: order.plan_id,
      providerPreapprovalId: input.providerPaymentId,
      orderId: order.id,
    });
  }

  return true;
}

export async function activateSubscription(input: {
  customerId: string;
  planId: string;
  providerPreapprovalId: string | null;
  orderId?: string | null;
}): Promise<boolean> {
  const admin = createAdminClient();
  const periodEnd = new Date();
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 30);

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("customer_id", input.customerId)
    .eq("plan_id", input.planId)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    await admin
      .from("subscriptions")
      .update({
        current_period_end: periodEnd.toISOString(),
        provider_preapproval_id:
          input.providerPreapprovalId ?? undefined,
      })
      .eq("id", existing.id);
    return true;
  }

  const { error } = await admin.from("subscriptions").insert({
    customer_id: input.customerId,
    plan_id: input.planId,
    provider: "mercadopago",
    provider_preapproval_id: input.providerPreapprovalId,
    status: "active",
    current_period_end: periodEnd.toISOString(),
  });
  return !error;
}

export function estimateGatewayFeeCents(
  totalCents: number,
  method: "pix" | "card" | null,
): number {
  // Valores padrão; ajustar conforme a tabela de taxas da conta.
  const bps = method === "card" ? 399 : 100;
  return Math.round((totalCents * bps) / 10000) + 30;
}
