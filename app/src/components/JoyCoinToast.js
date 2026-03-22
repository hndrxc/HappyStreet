"use client";

import { useEffect, useState } from "react";

export default function JoyCoinToast({ coinAmount, category, visible, onDone }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => onDone?.(), 300); // wait for fade-out
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, onDone]);

  if (!visible && !show) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[3000] transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-surface rounded-2xl shadow-warm border border-accent/30 px-5 py-3 flex items-center gap-3 glow-gold">
        <span className="text-2xl">✨</span>
        <div>
          <p className="font-pixel text-[10px] text-accent">
            +{coinAmount} JoyCoins!
          </p>
          {category && (
            <p className="text-[11px] text-text-muted mt-0.5 capitalize">
              {category} is trending up!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
