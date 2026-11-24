import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const forward = ["nav-forward"];

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink px-4 py-12 text-white sm:px-8 lg:px-16">
      <div className="flex flex-wrap justify-between gap-10">
        <div className="max-w-md">
          <p className="font-display text-3xl font-bold tracking-[0.06em] uppercase">
            {SITE_NAME}<span className="text-accent">.</span>
          </p>
          <p className="mt-2 text-sm text-line">{SITE_TAGLINE}</p>
          <p className="mt-4 text-xs leading-relaxed text-line">
            Roteiros são sugestões editoriais. Você é responsável por revisar fatos,
            direitos de imagem e a adequação do conteúdo ao seu público antes de publicar.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="mb-3 font-semibold tracking-wider uppercase">Site</p>
            <div className="flex flex-col gap-2 text-line">
              <Link href="/packs" transitionTypes={forward} className="u-link hover:text-white">Packs</Link>
              <Link href="/planos" transitionTypes={forward} className="u-link hover:text-white">Planos</Link>
              <Link href="/biblioteca" transitionTypes={forward} className="u-link hover:text-white">Biblioteca</Link>
            </div>
          </div>
          <div>
            <p className="mb-3 font-semibold tracking-wider uppercase">Legal</p>
            <div className="flex flex-col gap-2 text-line">
              <Link href="/termos" transitionTypes={forward} className="u-link hover:text-white">Termos de uso</Link>
              <Link href="/privacidade" transitionTypes={forward} className="u-link hover:text-white">Privacidade</Link>
              <Link href="/admin/login" className="u-link hover:text-white">Admin</Link>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-10 border-t border-white/15 pt-5 text-xs text-line">
        © 2026 {SITE_NAME}. Todos os direitos reservados.
      </p>
    </footer>
  );
}
