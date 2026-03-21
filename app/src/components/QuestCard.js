"use client";

import { ChevronRightIcon } from "./icons";

export default function QuestCard({ quest }) {
  const { title, value, activeNeeds, completions } = quest;

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-warm-sm border border-border transition-transform active:scale-[0.98]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-muted">
              {completions} completed
            </span>
            <span className="text-accent font-medium">
              {activeNeeds} active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-accent text-sm">
            ${value.toFixed(2)}
          </span>
          <ChevronRightIcon className="w-5 h-5 text-text-muted" />
        </div>
      </div>
    </div>
  );
}
