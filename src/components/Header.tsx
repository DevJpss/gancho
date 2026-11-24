import Link from "next/link";

const forward = ["nav-forward"];
const back = ["nav-back"];

const nav: Array<{ href: string; label: string; types?: string[] }> = [
  { href: "/packs", label: "Packs", types: forward },
  { href: "/#nichos", label: "Nichos" },
  { href: "/planos", label: "Planos", types: forward },
  { href: "/biblioteca", label: "Biblioteca", types: forward },
];

export default function Header() {
  return (
    <>
      <div className="u-ticker bg-ink px-4 py-2.5 text-center text-[11px] font-medium tracking-[0.14em] text-white uppercase sm:text-xs">
        Novos roteiros toda segunda-feira às 9h &nbsp;·&nbsp; gravados em português
      </div>
      <header
        style={{ viewTransitionName: "site-header" }}
        className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8 lg:px-16"
      >
        <Link
          href="/"
          transitionTypes={back}
          className="u-link font-display text-4xl font-bold tracking-[0.06em] uppercase"
        >
          Gancho<span className="text-accent">.</span>
        </Link>
        <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} transitionTypes={item.types} className="u-link">
              {item.label}
            </Link>
          ))}
          <Link href="/planos" transitionTypes={forward} className="u-btn u-btn--primary px-5 text-sm">
            Ver planos
          </Link>
        </nav>
      </header>
    </>
  );
}
