"use client";

import { CATEGORY_COLORS, DIFFICULTY_LABELS } from "@/lib/categories";
import { formatDistance } from "@/lib/api";

export default function QuestCard({ quest }) {
  const categoryColor = CATEGORY_COLORS[quest.category] || CATEGORY_COLORS["kindness"];
  const diffLabel = DIFFICULTY_LABELS[quest.difficulty_tier] || "Med";

  return (
    <div className="bg-surface rounded-[var(--radius-card)] border border-border shadow-warm-sm p-4 transition-all">
      {/* Category + Difficulty pills */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {quest.category && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{
              backgroundColor: categoryColor + "18",
              color: categoryColor,
            }}
          >
            {quest.category}
          </span>
        )}
        {quest.difficulty_tier && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              quest.difficulty_tier === "low"
                ? "bg-success/10 text-success"
                : quest.difficulty_tier === "high"
                  ? "bg-error/10 text-error"
                  : "bg-accent/10 text-accent"
            }`}
          >
            {diffLabel}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-text-primary leading-snug mb-2">
        {quest.title}
      </h3>

      {/* Distance + Completions + Reward row */}
      <div className="flex items-center gap-3 text-sm text-text-muted">
        <span>{formatDistance(quest.distance_meters)}</span>
        <span className="w-1 h-1 rounded-full bg-border-warm" />
        <span>{quest.completions || 0} completed</span>
        <span className="w-1 h-1 rounded-full bg-border-warm" />
        <span className="text-accent font-medium">+{quest.coin_reward || 0} JC</span>
      </div>
    </div>
  );
}
