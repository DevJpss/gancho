"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Suaviza o scroll da rodinha/trackpad com inércia, sem biblioteca.
 * Não mexe em âncoras, scroll de teclado, áreas com scroll próprio nem
 * navegação entre rotas — e desliga com prefers-reduced-motion.
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  const current = useRef(0);
  const target = useRef(0);
  const frame = useRef(0);
  const last = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    const limit = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const step = (now: number) => {
      const elapsed = Math.min(now - last.current, 64);
      last.current = now;
      const ease = 1 - Math.pow(0.82, elapsed / 16.667);

      target.current = Math.min(limit(), Math.max(0, target.current));
      let value = current.current + (target.current - current.current) * ease;

      if (Math.abs(target.current - value) < 0.4) {
        value = target.current;
        active.current = false;
      }

      current.current = value;
      window.scrollTo({ top: value, behavior: "instant" });
      frame.current = active.current ? requestAnimationFrame(step) : 0;
    };

    const run = () => {
      if (active.current) return;
      active.current = true;
      last.current = performance.now();
      frame.current = requestAnimationFrame(step);
    };

    const stop = () => {
      active.current = false;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;

      // Deixa o navegador cuidar de áreas com scroll próprio.
      let node = event.target as Element | null;
      while (node && node !== document.documentElement) {
        const overflowY = getComputedStyle(node).overflowY;
        if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 1) return;
        node = node.parentElement;
      }

      if (limit() <= 0) return;
      event.preventDefault();

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      target.current = Math.min(limit(), Math.max(0, target.current + event.deltaY * unit));
      run();
    };

    const onScroll = () => {
      if (!active.current) {
        current.current = window.scrollY;
        target.current = window.scrollY;
      }
    };

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      if (motion.matches) {
        stop();
        window.removeEventListener("wheel", onWheel);
        return;
      }
      current.current = window.scrollY;
      target.current = window.scrollY;
      window.addEventListener("wheel", onWheel, { passive: false });
    };

    current.current = window.scrollY;
    target.current = window.scrollY;
    syncMotion();
    window.addEventListener("scroll", onScroll, { passive: true });
    motion.addEventListener("change", syncMotion);

    return () => {
      stop();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      motion.removeEventListener("change", syncMotion);
    };
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      current.current = window.scrollY;
      target.current = window.scrollY;
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
