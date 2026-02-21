"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

const photos = [
  { src: "/images/ip3/comedy-stage.jpeg", alt: "Comedy night on stage with a packed audience at IP3", pos: "object-bottom" },
  { src: "/images/ip3/outdoor-hangout.jpeg", alt: "Attendees gathered for evening activities at IP3", pos: "object-top" },
  { src: "/images/ip3/cocktail-prep.jpeg", alt: "Vibrant pink cocktails being prepared at the outdoor bar", pos: "object-center" },
  { src: "/images/ip3/outdoor-gathering.jpeg", alt: "Attendees mingling under string lights among the trees at Shawnigan Lake", pos: "object-center" },
  { src: "/images/ip3/animated-conversation.jpeg", alt: "Lively conversation at IP3", pos: "object-center" },
  { src: "/images/ip3/food-spread.jpeg", alt: "Oysters, charcuterie, and drinks at the VIP reception", pos: "object-center" },
  { src: "/images/ip3/card-magic.jpeg", alt: "Group gathered around a table for close-up card magic outdoors", pos: "object-top" },
  { src: "/images/ip3/comedy-night-wide.jpeg", alt: "Comedy performance at IP3", pos: "object-center" },
  { src: "/images/ip3/dock-dive.jpeg", alt: "Jumping off the dock into the lake with swimmers below", pos: "object-bottom" },
];

export default function PhotoGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = "";
  };

  const goTo = useCallback((index: number) => {
    setLightboxIndex(((index % photos.length) + photos.length) % photos.length);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goTo(lightboxIndex + 1);
      if (e.key === "ArrowLeft") goTo(lightboxIndex - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goTo]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[140px] md:auto-rows-[200px] gap-2.5 md:gap-3">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            onClick={() => openLightbox(i)}
            className={`relative rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group ${
              i === 0 ? "col-span-2 row-span-2" : ""
            }`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className={`object-cover ${photo.pos} transition-transform duration-500 group-hover:scale-105`}
              sizes={i === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute top-7 left-6 text-sm text-white/50 font-mono">
            {lightboxIndex + 1} / {photos.length}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); goTo(lightboxIndex - 1); }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            aria-label="Previous photo"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            className="relative w-[90vw] h-[80vh] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].src}
              alt={photos[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); goTo(lightboxIndex + 1); }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            aria-label="Next photo"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-white/60 text-center max-w-lg px-4">
            {photos[lightboxIndex].alt}
          </p>
        </div>
      )}
    </>
  );
}
