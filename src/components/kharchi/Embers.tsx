"use client";

import { useMemo } from "react";

/** Floating glowing ember particles */
export default function Embers({ count = 14 }: { count?: number }) {
  const embers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 73 + 11) % 100}%`,
        size: 3 + ((i * 7) % 4),
        delay: (i * 1.35) % 4.5,
        duration: 3.6 + ((i * 0.7) % 2.4),
        drift: `${((i % 5) - 2) * 24}px`,
      })),
    [count]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {embers.map((e, i) => (
        <span
          key={i}
          className="absolute bottom-[-10px] rounded-full bg-amber-400"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            boxShadow: "0 0 12px 3px rgba(251,146,60,0.55)",
            animation: `ember ${e.duration}s linear ${e.delay}s infinite`,
            ["--ember-x" as string]: e.drift,
          }}
        />
      ))}
    </div>
  );
}
