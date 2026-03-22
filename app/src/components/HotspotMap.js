"use client";

import dynamic from "next/dynamic";

const HotspotMapInner = dynamic(() => import("./HotspotMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-base-darker">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-surface border border-border mx-auto mb-3 animate-pulse" />
        <p className="font-heading text-sm text-text-muted">Loading map...</p>
      </div>
    </div>
  ),
});

export default function HotspotMap({ onSelectHotspot, focusHotspotId }) {
  return <HotspotMapInner onSelectHotspot={onSelectHotspot} focusHotspotId={focusHotspotId} />;
}
