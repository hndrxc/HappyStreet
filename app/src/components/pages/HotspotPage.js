"use client";

import { useState } from "react";
import HotspotMap from "@/components/HotspotMap";
import HotspotQuestList from "@/components/HotspotQuestList";

export default function HotspotPage() {
  const [view, setView] = useState("map"); // "map" | "questList"
  const [selectedHotspot, setSelectedHotspot] = useState(null);

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

    </div>
  );
}
