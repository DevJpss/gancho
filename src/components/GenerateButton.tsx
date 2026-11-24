"use client";

import { useState, useTransition } from "react";
import { triggerGeneration } from "@/app/admin/(protected)/geracao/actions";

export default function GenerateButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(await triggerGeneration());
          })
        }
        className="bg-accent px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
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
