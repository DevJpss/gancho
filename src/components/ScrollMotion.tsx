"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Mode = "reveal" | "fade" | "drift" | "none";

type Item = {
  el: HTMLElement;
  mode: Mode;
  speed: number;
  opacity: number;
  y: number;
  scale: number;
  rotate: number;
};

type Target = Pick<Item, "opacity" | "y" | "scale" | "rotate">;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Fallback para navegadores sem CSS scroll-driven animations.
 * O layout só ativa isto quando `animation-timeline: view()` não existe.
 * Usa translate/rotate/scale (propriedades individuais) para não brigar com
 * transformações de hover, View Transitions ou o u-enter.
 */
export default function ScrollMotion() {
  const pathname = usePathname();
  const items = useRef<Item[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-motion-fallback")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const collect = () => {
      items.current = Array.from(
        document.querySelectorAll<HTMLElement>("[data-scroll], .u-reveal"),
      )
        .filter((el) => !el.closest("[data-motion-off]"))
        .map((el) => {
          const mode = (el.dataset.scroll ?? "reveal") as Mode;
          return {
            el,
            mode,
            speed: Number(el.dataset.scrollSpeed ?? "1"),
            opacity: mode === "drift" ? 1 : 0,
            y: mode === "drift" ? 36 : 64,
            scale: mode === "reveal" ? 0.96 : 1,
            rotate: 0,
          };
        });
    };

    const targetFor = (item: Item): Target => {
      const rect = item.el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      if (item.mode === "none") {
        return { opacity: 1, y: 0, scale: 1, rotate: 0 };
      }

      if (item.mode === "drift") {
        const p = clamp((vh - rect.top) / (vh + rect.height));
        return {
          opacity: 1,
          y: (p - 0.5) * 88 * item.speed,
          scale: 1,
          rotate: (p - 0.5) * 2.4 * item.speed,
        };
      }

      if (item.mode === "fade") {
        const enter = clamp((vh * 0.95 - rect.top) / (vh * 0.55));
        const exit = clamp((vh * 0.55 - rect.bottom) / (vh * 0.55));
        return {
          opacity: enter * (1 - exit),
          y: (1 - enter) * 40 - exit * 72,
          scale: 1 - exit * 0.03,
          rotate: 0,
        };
      }

      const enter = clamp((vh * 0.95 - rect.top) / (vh * 0.6));
      const exit = clamp((vh * 0.35 - rect.bottom) / (vh * 0.35));
      return {
        opacity: enter * (1 - exit),
        y: (1 - enter) * 64 - exit * 44,
        scale: 0.96 + enter * 0.04 - exit * 0.01,
        rotate: 0,
      };
    };

    const step = () => {
      let moving = false;
      const ease = 0.16;

      for (const item of items.current) {
        const target = targetFor(item);
        item.opacity += (target.opacity - item.opacity) * ease;
        item.y += (target.y - item.y) * ease;
        item.scale += (target.scale - item.scale) * ease;
        item.rotate += (target.rotate - item.rotate) * ease;

        if (
          Math.abs(target.opacity - item.opacity) > 0.001 ||
          Math.abs(target.y - item.y) > 0.1 ||
          Math.abs(target.scale - item.scale) > 0.001 ||
          Math.abs(target.rotate - item.rotate) > 0.01
        ) {
          moving = true;
        }

        item.el.style.opacity = item.opacity.toFixed(3);
        item.el.style.translate = `0 ${item.y.toFixed(1)}px`;
        item.el.style.scale = item.scale.toFixed(4);
        if (item.mode === "drift") {
          item.el.style.rotate = `${item.rotate.toFixed(2)}deg`;
        }
      }

      frame.current = moving ? requestAnimationFrame(step) : 0;
    };

    const kick = () => {
      if (!frame.current) frame.current = requestAnimationFrame(step);
    };

    collect();
    kick();

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });

    const observer = new MutationObserver(() => {
      collect();
      kick();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
