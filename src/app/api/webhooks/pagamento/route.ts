import { createAdminClient } from "@/lib/supabase/admin";
import { getPayment, getPreapproval, verifyWebhookSignature } from "@/lib/payments/mercadopago";
import { markOrderPaid } from "@/lib/payments/orders";

type Notification = {
  type?: string;
  data?: { id?: string | number };
};

export async function POST(request: Request) {
  if (process.env.PAYMENT_MODE !== "live") {
    return Response.json({ received: true, mode: "demo" });
  }

  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  let body: Notification;
  try {
    body = (await request.json()) as Notification;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const notificationId = String(body.data?.id ?? "");
  if (!notificationId) return Response.json({ error: "ID ausente" }, { status: 400 });

  if (
    !verifyWebhookSignature({
      signatureHeader: signature,
      requestId,
      dataId: notificationId,
    })
  ) {
    return Response.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error: eventError } = await admin.from("webhook_events").insert({
    provider: "mercadopago",
    event_id: notificationId,
    payload: body,
  });
  if (eventError) {
    if (eventError.code === "23505") return Response.json({ received: true });
    return Response.json({ error: "Falha ao registrar evento" }, { status: 500 });
  }

  try {
    if (body.type === "payment") {
      const payment = await getPayment(notificationId);
      if (payment.status === "approved" && payment.external_reference) {
        await markOrderPaid({
          code: payment.external_reference,
          providerPaymentId: payment.id,
          status: payment.status,
        });
      }
    }

    if (body.type === "subscription_preapproval") {
      const preapproval = await getPreapproval(notificationId);
      if (
        ["authorized", "active", "approved"].includes(preapproval.status) &&
        preapproval.external_reference
      ) {
        await markOrderPaid({
          code: preapproval.external_reference,
          providerPaymentId: preapproval.id,
          status: "approved",
        });
      }
    }
  } catch {
    // O Mercado Pago pode responder depois; o webhook pode ser reenviado.
    return Response.json({ error: "Falha ao consultar o gateway" }, { status: 500 });
  }

  return Response.json({ received: true });
}
