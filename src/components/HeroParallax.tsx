"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function HeroParallax({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    function onScroll() {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const y = window.scrollY;
        ref.current.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
        ref.current.style.opacity = `${Math.max(0, 1 - y / 700)}`;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}
