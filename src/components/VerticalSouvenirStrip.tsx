import React, { useEffect, useRef, useState } from 'react';

export type SouvenirItem = {
  id: string;
  userId: string;
  displayName: string;
  thumbnailUrl: string;
  fullUrl?: string;
  caption?: string;
  profileUrl?: string;
};

export default function VerticalSouvenirStrip({
  items,
  intervalMs = 3500,
  visibleCount = 5,
  onOpenGallery,
}: {
  items: SouvenirItem[];         // already filtered approved & trimmed by backend
  intervalMs?: number;
  visibleCount?: number;         // how many avatars visible in the strip
  onOpenGallery?: (startIndex: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // rotate index
  useEffect(() => {
    if (reduced) return; // respect prefers-reduced-motion
    if (!items || items.length <= 1) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [items, intervalMs, reduced]);

  // calculate translateY
  const itemHeight = 56; // px (tailwind h-14)
  const translateY = -index * itemHeight;

  if (!items || items.length === 0) return null;

  // Hide on small screens (mobile) — caller controls CSS; here we keep hidden by default using tailwind class 'hidden md:block'
  return (
    <div
      ref={containerRef}
      className="souvenir-strip hidden md:block h-[280px] w-14 overflow-hidden relative"
      aria-hidden={false}
      title="Souvenirs étudiants"
    >
      <div
        className="souvenir-inner absolute left-0 top-0 transition-transform duration-500 ease-out"
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {items.map((it, i) => (
          <button
            key={it.id}
            onClick={() => onOpenGallery?.(i)}
            className="w-14 h-14 flex items-center justify-center p-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label={`${it.displayName} — souvenir`}
            title={`${it.displayName}${it.caption ? ` — ${it.caption}` : ''}`}
          >
            <img
              src={it.thumbnailUrl}
              alt={`${it.displayName} — souvenir`}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-800"
              width={40}
              height={40}
              loading="lazy"
            />
          </button>
        ))}

        {/* If less than visibleCount, duplicate items to avoid blank space */}
        {items.length < visibleCount && Array.from({ length: Math.max(0, visibleCount - items.length) }).map((_, k) => (
          <div key={`pad-${k}`} className="w-14 h-14" />
        ))}
      </div>

      {/* Decorative left bar (optional) */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800 opacity-70" aria-hidden />
    </div>
  );
}

