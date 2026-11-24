import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="px-4 py-14 sm:px-8 lg:px-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Admin</p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase">Acesso ao painel</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        Apenas usuários cadastrados na tabela <code>admins</code> conseguem entrar.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
