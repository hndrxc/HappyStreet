"use client";

import { useState } from "react";
import HotspotMap from "@/components/HotspotMap";
import HotspotQuestList from "@/components/HotspotQuestList";
import PostNeedSheet from "@/components/PostNeedSheet";
import { PlusIcon } from "@/components/icons";

export default function HotspotPage() {
  const [view, setView] = useState("map"); // "map" | "questList"
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [showPostSheet, setShowPostSheet] = useState(false);

  const handleSelectHotspot = (hotspot) => {
    setSelectedHotspot(hotspot);
    setView("questList");
  };

  const handleBack = () => {
    setView("map");
    setSelectedHotspot(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {view === "map" ? (
        <HotspotMap onSelectHotspot={handleSelectHotspot} />
      ) : (
        <HotspotQuestList hotspot={selectedHotspot} onBack={handleBack} />
      )}

      {/* Floating Post Button */}
      <div className="post-quest-btn-wrapper">
        <button
          type="button"
          onClick={() => setShowPostSheet(true)}
          className="post-quest-btn flex items-center whitespace-nowrap bg-accent text-text-on-accent rounded-full shadow-warm glow-gold font-heading font-semibold transition-transform active:scale-95"
        >
          <PlusIcon className="post-quest-btn-icon" />
          Post a Quest
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
