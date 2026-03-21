"use client";

import { useState } from "react";
import { hotspots, quests } from "@/lib/mockData";
import { CompassIcon, PlusIcon } from "@/components/icons";
import PostNeedSheet from "@/components/PostNeedSheet";
import QuestCard from "@/components/QuestCard";

export default function HotspotPage() {
  const [showPostSheet, setShowPostSheet] = useState(false);
  
  // Check if user is inside a hotspot (distance = 0)
  const currentHotspot = hotspots.find((h) => h.distance === 0);
  const nearestHotspot = hotspots.filter((h) => h.distance > 0).sort((a, b) => a.distance - b.distance)[0];

  if (!currentHotspot) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-base-darker flex items-center justify-center mb-6">
          <CompassIcon className="w-10 h-10 text-text-muted" />
        </div>
        <h2 className="font-pixel text-[12px] text-text-primary mb-2">
          Not Near a Hotspot
        </h2>
        <p className="text-text-secondary mb-8">
          Move closer to discover quests and connect with others
        </p>
        {nearestHotspot && (
          <div className="bg-surface rounded-2xl p-5 shadow-warm-sm border border-border w-full max-w-xs">
            <p className="text-text-muted text-sm mb-1">Nearest Hotspot</p>
            <p className="font-pixel text-text-primary text-sm mb-3">
              {nearestHotspot.name}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-accent font-semibold">
                {nearestHotspot.distance} mi
              </span>
              <div className="flex items-center gap-1 text-text-secondary text-sm">
                <span>{nearestHotspot.direction}</span>
                <div 
                  className="w-5 h-5 flex items-center justify-center"
                  style={{ 
                    transform: `rotate(${getDirectionDegrees(nearestHotspot.direction)}deg)` 
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-5 bg-surface border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <h1 className="font-pixel text-[12px] text-text-primary">
            {currentHotspot.name}
          </h1>
        </div>
      </header>

      {/* Quest List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
        {quests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </div>

      {/* Floating Post Button */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <button
          onClick={() => setShowPostSheet(true)}
          className="pointer-events-auto flex items-center gap-2 bg-accent text-text-on-accent px-6 py-3 rounded-full shadow-warm glow-gold font-semibold transition-transform active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          Post a Need
        </button>
      </div>

      {/* Post Need Bottom Sheet */}
      <PostNeedSheet 
        isOpen={showPostSheet} 
        onClose={() => setShowPostSheet(false)} 
      />
    </div>
  );
}

function getDirectionDegrees(direction) {
  const directions = {
    N: -90, NE: -45, E: 0, SE: 45,
    S: 90, SW: 135, W: 180, NW: -135,
  };
  return directions[direction] || 0;
}
