"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminConfig } from "@/lib/supabase/client";
import {
  createCardPreference,
  createPixPayment,
  createPreapproval,
  isLivePayments,
} from "@/lib/payments/mercadopago";
import { generateOrderCode } from "@/lib/payments/orders";
import type { ActionState } from "@/lib/types";

const checkoutSchema = z.object({
  full_name: z.string().trim().min(3, "Informe seu nome completo"),
  email: z.string().trim().email("E-mail inválido"),
  phone: z.string().trim().min(8, "WhatsApp inválido"),
  kind: z.enum(["pack", "subscription"]),
  slug: z.string().trim().min(1, "Item inválido"),
  payment_method: z.enum(["pix", "card"]),
});

export async function checkout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = checkoutSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    kind: formData.get("kind"),
    slug: formData.get("slug"),
    payment_method: formData.get("payment_method"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  if (!hasAdminConfig()) {
    return {
      ok: false,
      message: "Checkout indisponível: configure o Supabase no .env.local para testar.",
    };
  }

  const input = parsed.data;
  const admin = createAdminClient();
  const live = isLivePayments();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const notificationUrl = `${siteUrl}/api/webhooks/pagamento`;

  let packId: string | null = null;
  let planId: string | null = null;
  let totalCents = 0;
  let description = "";

  if (input.kind === "pack") {
    const { data: pack, error } = await admin
      .from("packs")
      .select("id,slug,title,price_cents,status")
      .eq("slug", input.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !pack) return { ok: false, message: "Este pack não está mais disponível." };
    packId = pack.id;
    totalCents = pack.price_cents;
    description = `Pack de roteiros — ${pack.title}`;
  } else {
    const { data: plan, error } = await admin
      .from("plans")
      .select("id,slug,name,price_cents,active")
      .eq("slug", input.slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !plan) return { ok: false, message: "Este plano não está mais disponível." };
    planId = plan.id;
    totalCents = plan.price_cents;
    description = `Assinatura ${plan.name}`;
  }

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .upsert(
      {
        full_name: input.full_name,
        email: input.email.toLowerCase(),
        phone: input.phone,
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();
  if (customerError || !customer) {
    return { ok: false, message: customerError?.message ?? "Falha ao salvar o cliente." };
  }

  const code = generateOrderCode();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      code,
      customer_id: customer.id,
      kind: input.kind,
      status: "pending_payment",
      pack_id: packId,
      plan_id: planId,
      total_cents: totalCents,
      payment_provider: live ? "mercadopago" : "demo",
    })
    .select("id")
    .single();
  if (orderError || !order) {
    return { ok: false, message: orderError?.message ?? "Falha ao criar o pedido." };
  }

  if (packId) {
    const { error: itemError } = await admin.from("order_items").insert({
      order_id: order.id,
      pack_id: packId,
      name_snapshot: description,
      price_cents: totalCents,
      qty: 1,
    });
    if (itemError) return { ok: false, message: itemError.message };
  }

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .insert({
      order_id: order.id,
      provider: live ? "mercadopago" : "demo",
      status: "pending",
      amount_cents: totalCents,
      payload: {
        method: input.kind === "subscription" ? "preapproval" : input.payment_method,
        mode: live ? "live" : "demo",
      },
    })
    .select("id")
    .single();
  if (paymentError || !payment) {
    return { ok: false, message: paymentError?.message ?? "Falha ao registrar o pagamento." };
  }

  if (live) {
    const payer = {
      email: input.email.toLowerCase(),
      firstName: input.full_name.split(" ")[0] ?? "Cliente",
      phone: input.phone,
    };
    try {
      if (input.kind === "subscription") {
        const preapproval = await createPreapproval({
          amountCents: totalCents,
          description,
          externalReference: code,
          payerEmail: payer.email,
          notificationUrl,
          siteUrl,
        });
        await admin
          .from("payments")
          .update({
            provider_payment_id: preapproval.id,
            payload: { method: "preapproval", mode: "live", init_point: preapproval.init_point },
          })
          .eq("id", payment.id);
      } else if (input.payment_method === "pix") {
        const pix = await createPixPayment({
          amountCents: totalCents,
          description,
          externalReference: code,
          payer,
          notificationUrl,
        });
        await admin
          .from("payments")
          .update({
            provider_payment_id: pix.id,
            payload: {
              method: "pix",
              mode: "live",
              qr_code: pix.qr_code,
              qr_code_base64: pix.qr_code_base64,
            },
          })
          .eq("id", payment.id);
      } else {
        const preference = await createCardPreference({
          amountCents: totalCents,
          description,
          externalReference: code,
          payer,
          notificationUrl,
          siteUrl,
        });
        await admin
          .from("payments")
          .update({
            provider_payment_id: preference.id,
            payload: { method: "card", mode: "live", init_point: preference.init_point },
          })
          .eq("id", payment.id);
      }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao gerar o pagamento.",
      };
    }
  }

  redirect(`/pedido/${code}`);
}
