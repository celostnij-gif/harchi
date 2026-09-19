"use client";

/** Animated steam puffs rising from a point (bottom center of parent) */
export default function Steam({
  className = "",
  puffs = 3,
}: {
  className?: string;
  puffs?: number;
}) {
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      {Array.from({ length: puffs }, (_, i) => (
        <span
          key={i}
          className="steam-blob"
          style={{
            width: 46 + i * 10,
            height: 46 + i * 10,
            left: i === 0 ? "30%" : i === 1 ? "55%" : "20%",
            bottom: 8,
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${3.4 + i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
