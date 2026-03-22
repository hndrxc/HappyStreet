"use client";

import { useState } from "react";

const RATINGS = [
  { value: 1, emoji: "\uD83D\uDE10", label: "Meh" },
  { value: 2, emoji: "\uD83D\uDE42", label: "Okay" },
  { value: 3, emoji: "\uD83D\uDE0A", label: "Happy" },
  { value: 4, emoji: "\uD83D\uDE04", label: "Great" },
  { value: 5, emoji: "\uD83E\uDD29", label: "Amazing" },
];

export default function HappinessRatingModal({ quest, isOpen, onSubmit, onCancel }) {
  const [selected, setSelected] = useState(null);

  if (!isOpen || !quest) return null;

  const handleSubmit = () => {
    if (selected === null) return;
    onSubmit({ questId: quest.id || quest._id, happinessRating: selected });
    setSelected(null);
  };

  const handleCancel = () => {
    setSelected(null);
    onCancel();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000] bg-text-primary/30"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="modal-center z-[2001] pointer-events-none">
        <div
          className="bg-surface rounded-2xl p-6 shadow-warm w-full max-w-sm pointer-events-auto animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <h3 className="font-heading text-base text-text-primary text-center mb-2">
            How happy did this make you?
          </h3>
          <p className="text-sm text-text-muted text-center mb-5 leading-relaxed line-clamp-2">
            {quest.title}
          </p>

          {/* Rating buttons */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-5">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelected(r.value)}
                className={`flex flex-col items-center gap-1 w-14 h-14 sm:w-16 sm:h-16 rounded-xl transition-all ${
                  selected === r.value
                    ? "bg-accent/15 border-2 border-accent scale-110"
                    : "bg-base border border-border hover:bg-base-darker"
                }`}
              >
                <span className="text-xl sm:text-2xl leading-none mt-1.5">{r.emoji}</span>
                <span className="text-xs text-text-muted">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Coin reward preview */}
          <div className="text-center mb-5">
            <span className="text-accent font-semibold text-base">
              +{quest.coin_reward || 0} JoyCoins
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium transition-colors hover:bg-base-darker"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                selected !== null
                  ? "bg-accent text-text-on-accent active:scale-[0.98]"
                  : "bg-border text-text-muted cursor-not-allowed"
              }`}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
