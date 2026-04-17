"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

export default function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Use shared observer if available, otherwise create one
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    up: "translate3d(0, 20px, 0)",
    left: "translate3d(-20px, 0, 0)",
    right: "translate3d(20px, 0, 0)",
    none: "translate3d(0, 0, 0)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0, 0, 0)" : transforms[direction],
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
