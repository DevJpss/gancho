"use client";

import { useActionState } from "react";
import { simulatePayment } from "@/app/pedido/[code]/actions";
import type { ActionState } from "@/lib/types";

export default function SimulatePaymentButton({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(simulatePayment, {
    ok: false,
    message: "",
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="code" value={code} />
      <button
        type="submit"
        disabled={pending}
        className="bg-accent px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Confirmando..." : "Simular pagamento aprovado"}
      </button>
      {state.message ? (
        <p role="status" className={`mt-3 text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
