"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid max-w-md gap-4 border border-line bg-panel p-6">
      <label className="grid gap-1.5 text-sm font-medium">
        E-mail
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-line bg-white px-3 py-2.5 text-sm"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Senha
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="border border-line bg-white px-3 py-2.5 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-accent px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
