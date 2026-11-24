import { Suspense } from "react";
import { connection } from "next/server";
import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../login/actions";

// O guard redireciona visitantes não logados durante o prefetch; a validação de
// navegação instantânea não suporta esse redirect.
export const instant = false;

async function AdminGuard({ children }: { children: React.ReactNode }) {
  // A leitura da sessão usa Date.now() internamente no Supabase Auth.
  await connection();
  const user = await requireAdmin();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-sm">
        <span className="text-muted">
          Logado como <strong className="text-ink">{user.email}</strong>
        </span>
        <form action={signOut}>
          <button type="submit" className="border border-ink px-4 py-2 font-semibold hover:bg-ink hover:text-white">
            Sair
          </button>
        </form>
      </div>
      <AdminNav />
      <div className="mt-8">{children}</div>
    </>
  );
}

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-4 py-12 sm:px-8 lg:px-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Painel</p>
          <h1 className="font-display text-5xl font-bold uppercase">Gancho Admin</h1>
        </div>
      </div>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted">Verificando acesso...</p>}>
          <AdminGuard>{children}</AdminGuard>
        </Suspense>
      </div>
    </main>
  );
}
