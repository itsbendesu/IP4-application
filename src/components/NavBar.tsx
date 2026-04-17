"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-lg border-b border-stone-100"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={`flex items-center gap-1 font-bold text-lg tracking-tight transition-colors duration-300 ${
            scrolled ? "text-stone-900" : "text-white"
          }`}
        >
          Interesting People
          <sup
            className={`text-sm font-bold transition-colors duration-300 ${
              scrolled ? "text-blue-600" : "text-blue-400"
            }`}
          >
            4
          </sup>
        </Link>
        <div className="flex items-center gap-8">
          {[
            { href: "#people", label: "People" },
            { href: "#about", label: "About" },
            { href: "#process", label: "Process" },
            { href: "#faq", label: "FAQ" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hidden md:block text-sm transition-colors duration-300 ${
                scrolled
                  ? "text-stone-500 hover:text-stone-900"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/apply"
            className="px-5 py-3 bg-blue-600 text-white text-sm rounded-full font-medium hover:bg-blue-700 transition-all"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
