import { useMemo } from "react";

type Star = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  big: boolean;
};

function makeStars(count: number, seedOffset: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const big = i % 7 === 0;
    return {
      id: i + seedOffset,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: big ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2.5,
      delay: Math.random() * 6,
      duration: big ? 5 + Math.random() * 5 : 3 + Math.random() * 4,
      big,
    };
  });
}

/** Animated twinkling / drifting golden stars used behind every page. */
export function StarfieldBackground({ count = 46 }: { count?: number }) {
  const stars = useMemo(() => makeStars(count, 0), [count]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ animation: "drift-slow 26s ease-in-out infinite" }}
    >
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-gold"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animation: `${s.big ? "float-sparkle" : "twinkle"} ${s.duration}s ease-in-out ${s.delay}s infinite`,
            boxShadow: s.big
              ? "0 0 12px 2px var(--gold), 0 0 4px 1px var(--gold)"
              : "0 0 6px 1px var(--gold)",
          }}
        />
      ))}
    </div>
  );
}
