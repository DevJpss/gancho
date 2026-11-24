import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="px-4 py-24 text-center sm:px-8 lg:px-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">404</p>
      <h1 className="mt-3 font-display text-6xl font-bold uppercase">Página sem gancho</h1>
      <p className="mt-4 text-muted">O endereço não existe ou o conteúdo foi movido.</p>
      <Link href="/" className="u-btn u-btn--primary mt-8 px-7">
        Voltar ao início
      </Link>
    </main>
  );
}
