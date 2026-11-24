"use client";

import { useActionState } from "react";
import Spinner from "@/components/Spinner";
import { simulatePayment } from "@/app/pedido/[code]/actions";
import type { ActionState } from "@/lib/types";

export default function SimulatePaymentButton({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(simulatePayment, {
    ok: false,
    message: "",
  });

  return (
    <form action={formAction} aria-busy={pending}>
      <input type="hidden" name="code" value={code} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="u-btn u-btn--primary px-6"
      >
        {pending ? <Spinner /> : null}
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
