"use client";

import { useEffect } from "react";

export default function JoyCoinToast({ coinAmount, category, visible, onDone }) {
  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => onDone?.(), 2200);
    return () => clearTimeout(timer);
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[3000] animate-fade-in"
    >
      <div className="bg-surface rounded-2xl shadow-warm border border-accent/30 px-5 py-3 flex items-center gap-3 glow-gold">
        <span className="text-2xl">✨</span>
        <div>
          <p className="font-heading text-sm text-accent">
            +{coinAmount} JoyCoins!
          </p>
          {category && (
            <p className="text-sm text-text-muted mt-0.5 capitalize">
              {category} is trending up!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
