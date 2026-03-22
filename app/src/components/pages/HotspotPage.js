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
      <div className="absolute top-4 left-1/2 z-[1100] -translate-x-1/2 md:top-6">
        <button
          type="button"
          onClick={() => setShowPostSheet(true)}
          className="flex items-center gap-2 whitespace-nowrap bg-accent text-text-on-accent px-8 py-4 rounded-full shadow-warm glow-gold font-semibold text-sm transition-transform active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
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
