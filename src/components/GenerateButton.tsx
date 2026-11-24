"use client";

import { useState, useTransition } from "react";
import Spinner from "@/components/Spinner";
import { triggerGeneration } from "@/app/admin/(protected)/geracao/actions";

export default function GenerateButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(await triggerGeneration());
          })
        }
        className="u-btn u-btn--primary px-6 text-sm"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Gerando (pode levar minutos)..." : "Gerar pack desta semana agora"}
      </button>
      {result ? (
        <p role="status" className={`mt-3 text-sm ${result.ok ? "text-green-700" : "text-red-700"}`}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
