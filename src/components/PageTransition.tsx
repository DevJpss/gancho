import { ViewTransition } from "react";
import type { ReactNode } from "react";

// Navegações com tipo ganham direção; tudo o mais troca sem movimento.
const direction = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
};

type Props = {
  children: ReactNode;
  className?: string;
  // Páginas que já possuem <main> próprio (ex.: biblioteca) usam o wrapper puro.
  bare?: boolean;
};

export default function PageTransition({ children, className, bare = false }: Props) {
  return (
    <ViewTransition enter={direction} exit={direction} default="none">
      {bare ? children : <main className={className}>{children}</main>}
    </ViewTransition>
  );
}
