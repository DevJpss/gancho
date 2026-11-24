import Link from "next/link";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/packs", label: "Packs" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/geracao", label: "Geração" },
];

export default function AdminNav() {
  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-4 text-sm font-medium">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-accent">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
