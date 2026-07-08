import { useEffect, useRef, useState } from "react";

type Star = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  big: boolean;
};

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const big = i % 7 === 0;
    return {
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: big ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2.5,
      delay: Math.random() * 6,
      duration: big ? 5 + Math.random() * 5 : 3 + Math.random() * 4,
      big,
    };
  });
}

/**
 * Animated twinkling / drifting golden stars behind every page.
 * Parallax on scroll: big stars move slightly slower than the scroll,
 * small stars move at half the scroll speed. Client-only to avoid SSR
 * hydration mismatch.
 */
export function StarfieldBackground({ count = 46 }: { count?: number }) {
  const [stars, setStars] = useState<Star[]>([]);
  const bigLayer = useRef<HTMLDivElement>(null);
  const smallLayer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStars(makeStars(count));
  }, [count]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        // Большие звёзды — чуть медленнее прокрутки; маленькие — половина скорости.
        if (bigLayer.current) {
          bigLayer.current.style.transform = `translate3d(0, ${y * 0.15}px, 0)`;
        }
        if (smallLayer.current) {
          smallLayer.current.style.transform = `translate3d(0, ${y * 0.5}px, 0)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const bigStars = stars.filter((s) => s.big);
  const smallStars = stars.filter((s) => !s.big);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ animation: "drift-slow 26s ease-in-out infinite" }}
    >
      <div ref={smallLayer} className="absolute inset-0 will-change-transform">
        {smallStars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-gold"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              boxShadow: "0 0 6px 1px var(--gold)",
            }}
          />
        ))}
      </div>
      <div ref={bigLayer} className="absolute inset-0 will-change-transform">
        {bigStars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-gold"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animation: `float-sparkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              boxShadow: "0 0 12px 2px var(--gold), 0 0 4px 1px var(--gold)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
