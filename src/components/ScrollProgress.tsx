"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    function onScroll() {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (!barRef.current) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const width = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        const pastHero = scrollTop > window.innerHeight * 0.8;
        barRef.current.style.width = `${width}%`;
        barRef.current.style.opacity = pastHero ? "1" : "0";
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return <div ref={barRef} id="scroll-progress" />;
}
