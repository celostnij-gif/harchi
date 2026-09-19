"use client";

import { Flame, Timer, Mountain, PackageCheck, Star } from "lucide-react";
import { useLang } from "./LangProvider";

const ICONS = [Flame, Timer, Mountain, PackageCheck, Star];

export default function Ticker() {
  const { t } = useLang();
  const row = t.ticker.map((text, i) => ({ icon: ICONS[i], text }));
  const loop = [...row, ...row, ...row];
  return (
    <div className="relative z-20 border-y border-primary/20 bg-primary/[0.06] py-4 overflow-hidden marquee-paused">
      <div className="marquee-track items-center gap-10 pr-10">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center gap-10 shrink-0" aria-hidden={half === 1}>
            {loop.map(({ icon: Icon, text }, i) => (
              <span
                key={`${half}-${i}`}
                className="inline-flex items-center gap-3 whitespace-nowrap text-sm sm:text-base font-medium text-accent-strong"
              >
                <Icon className="size-5 text-primary" />
                {text}
                <span className="ml-6 inline-block size-1.5 rounded-full bg-primary/50" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
