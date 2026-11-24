"use server";

import { revalidatePath } from "next/cache";
import { markOrderPaid } from "@/lib/payments/orders";
import type { ActionState } from "@/lib/types";

export async function simulatePayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (process.env.PAYMENT_MODE === "live") {
    return { ok: false, message: "Simulação indisponível em modo live." };
  }

  const code = String(formData.get("code") ?? "");
  if (!code) return { ok: false, message: "Pedido inválido." };

  const confirmed = await markOrderPaid({ code, providerPaymentId: null, status: "approved" });
  revalidatePath(`/pedido/${code}`);
  revalidatePath("/biblioteca");

  return confirmed
    ? { ok: true, message: "Pagamento aprovado. Seu conteúdo já está liberado." }
    : { ok: false, message: "Não foi possível confirmar este pedido." };
}
