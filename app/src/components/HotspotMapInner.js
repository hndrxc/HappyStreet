"use client";
"use no memo";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from "react-leaflet";
import useLocation from "@/lib/useLocation";
import useSocket from "@/lib/useSocket";
import { useAuth } from "@/context/AuthContext";
import { fetchNearbyHotspots, geoToLeaflet, fetchHotspotById } from "@/lib/api";
import { LocationCrosshairIcon } from "@/components/icons";

import { CATEGORY_COLORS } from "@/lib/categories";

// Default center: LSU campus
const DEFAULT_CENTER = [30.4133, -91.1800];
const DEFAULT_ZOOM = 15;

function RecenterButton({ position }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(position, DEFAULT_ZOOM)}
      className="absolute bottom-4 right-4 z-[1000] w-10 h-10 bg-surface rounded-full shadow-warm flex items-center justify-center border border-border hover:bg-base-darker transition-colors"
      aria-label="Center on my location"
    >
      <LocationCrosshairIcon className="w-5 h-5 text-text-secondary" />
    </button>
  );
}

function MapUpdater({ position }) {
  const map = useMap();
  const lastCenterRef = useRef(position);

  useEffect(() => {
    if (!position) return;
    const [lat, lon] = position;
    const [lastLat, lastLon] = lastCenterRef.current || [0, 0];
    // Only re-center if moved > 50m
    const dist = Math.sqrt(
      Math.pow((lat - lastLat) * 111320, 2) +
      Math.pow((lon - lastLon) * 111320 * Math.cos(lat * Math.PI / 180), 2)
    );
    if (dist > 50) {
      map.setView(position, map.getZoom());
      lastCenterRef.current = position;
    }
  }, [position, map]);

  return null;
}

function MapResizeSync() {
  const map = useMap();

  useEffect(() => {
    let rafId = null;
    const invalidate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false, debounceMoveend: true });
      });
    };

    const container = map.getContainer();
    invalidate();

    window.addEventListener("resize", invalidate);
    window.addEventListener("orientationchange", invalidate);

    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(invalidate);
      observer.observe(container);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("orientationchange", invalidate);
      if (observer) observer.disconnect();
    };
  }, [map]);

  return null;
}

export default function HotspotMapInner({ onSelectHotspot, focusHotspotId }) {
  const { location, error, loading } = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket(user);
  const [hotspotsList, setHotspotsList] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [pingHotspotId, setPingHotspotId] = useState(null);
  const lastFetchPosRef = useRef(null);
  const focusFetchedRef = useRef(null);

  // Fetch and focus a specific hotspot by ID
  useEffect(() => {
    if (!focusHotspotId || focusFetchedRef.current === focusHotspotId) return;
    focusFetchedRef.current = focusHotspotId;

    fetchHotspotById(focusHotspotId)
      .then((hotspot) => {
        if (!hotspot) return;
        setHotspotsList((prev) => {
          const exists = prev.some((h) => (h._id || h.id) === (hotspot._id || hotspot.id));
          return exists ? prev.map((h) => (h._id || h.id) === (hotspot._id || hotspot.id) ? hotspot : h) : [...prev, hotspot];
        });
        setSelectedHotspot(hotspot);
      })
      .catch(() => {});
  }, [focusHotspotId]);

  const userPos = location
    ? [location.lat, location.lon]
    : DEFAULT_CENTER;

  // Fetch hotspots from API when location available
  useEffect(() => {
    if (!location) return;

    console.debug("[HotspotMap] location:update", {
      lat: location.lat,
      lon: location.lon,
      accuracy: location.accuracy,
    });

    const lastPos = lastFetchPosRef.current;
    if (lastPos) {
      const dist = Math.sqrt(
        Math.pow((location.lat - lastPos.lat) * 111320, 2) +
        Math.pow((location.lon - lastPos.lon) * 111320 * Math.cos(location.lat * Math.PI / 180), 2)
      );
      if (dist < 200) {
        console.debug("[HotspotMap] skip fetchNearbyHotspots (movement < 200m)", {
          movedMeters: Math.round(dist),
        });
        return;
      }
    }

    lastFetchPosRef.current = { lat: location.lat, lon: location.lon };

    console.debug("[HotspotMap] fetchNearbyHotspots:start", {
      lat: location.lat,
      lon: location.lon,
      radius: 10000,
    });

    fetchNearbyHotspots(location.lat, location.lon, 10000)
      .then((data) => {
        console.debug("[HotspotMap] fetchNearbyHotspots:success", {
          count: Array.isArray(data) ? data.length : 0,
        });
        setHotspotsList(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.debug("[HotspotMap] fetchNearbyHotspots:error", {
          message: err?.message || "unknown",
        });
        setHotspotsList([]);
      });
  }, [location]);

  // Real-time hotspot updates
  useEffect(() => {
    if (!socket) return;

    const onHotspotUpdated = (data) => {
      setHotspotsList((prev) =>
        prev.map((h) =>
          (h.id === data.hotspot_id || h._id === data.hotspot_id)
            ? { ...h, ...data }
            : h
        )
      );
    };

    socket.on("hotspot_updated", onHotspotUpdated);
    return () => socket.off("hotspot_updated", onHotspotUpdated);
  }, [socket]);

  const getHotspotColor = useCallback((hotspot) => {
    const bias = hotspot.category_bias;
    return CATEGORY_COLORS[bias] || CATEGORY_COLORS["kindness"];
  }, []);

  const getHotspotOpacity = useCallback((hotspot) => {
    const score = hotspot.heat_score || 0;
    return Math.min(0.15 + (score / 50) * 0.35, 0.5);
  }, []);

  const getHotspotCoords = useCallback((hotspot) => {
    if (hotspot.location?.coordinates) {
      return geoToLeaflet(hotspot.location.coordinates);
    }
    return DEFAULT_CENTER;
  }, []);

  const handleHotspotTap = async (hotspot) => {
    const id = hotspot._id || hotspot.id;
    setSelectedHotspot(hotspot);
    try {
      const full = await fetchHotspotById(id);
      if (full) setSelectedHotspot(full);
    } catch {
      // Keep the local data as fallback
    }
  };

  const questCount = (hotspot) => {
    return hotspot.quest_ids?.length || 0;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* Location error banner */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-accent/90 text-text-on-accent text-xs text-center py-2 px-4">
          {error}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="absolute inset-0">
        <MapContainer
          center={userPos}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <MapUpdater position={location ? userPos : null} />
          <MapResizeSync />
          <RecenterButton position={userPos} />

          {/* User position — blue dot */}
          <CircleMarker
            center={userPos}
            radius={8}
            pathOptions={{
              fillColor: "#3B82F6",
              fillOpacity: 0.9,
              color: "white",
              weight: 3,
            }}
          />
          {/* Accuracy ring */}
          {location && (
            <Circle
              center={userPos}
              radius={Math.min(location.accuracy || 50, 200)}
              pathOptions={{
                fillColor: "#3B82F6",
                fillOpacity: 0.08,
                color: "#3B82F6",
                weight: 1,
                opacity: 0.3,
              }}
            />
          )}

          {/* Hotspot circles */}
          {hotspotsList.map((hotspot) => {
            const coords = getHotspotCoords(hotspot);
            const color = getHotspotColor(hotspot);
            const id = hotspot.id || hotspot._id;
            const isPinging = pingHotspotId === id;

            return (
              <Circle
                key={`area-${id}`}
                center={coords}
                radius={hotspot.radius_meters || 300}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: isPinging ? 0.6 : getHotspotOpacity(hotspot),
                  color: color,
                  weight: isPinging ? 3 : 1.5,
                  opacity: isPinging ? 0.9 : 0.5,
                }}
                eventHandlers={{
                  click: () => handleHotspotTap(hotspot),
                }}
              />
            );
          })}

          {/* Hotspot center dots */}
          {hotspotsList.map((hotspot) => {
            const coords = getHotspotCoords(hotspot);
            const color = getHotspotColor(hotspot);
            const id = hotspot.id || hotspot._id;

            return (
              <CircleMarker
                key={`dot-${id}`}
                center={coords}
                radius={6}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 1,
                  color: "white",
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => handleHotspotTap(hotspot),
                }}
              />
            );
          })}
        </MapContainer>
        </div>
      </div>

      {/* Bottom sheet for selected hotspot */}
      {selectedHotspot && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1002] bg-text-primary/20"
            onClick={() => setSelectedHotspot(null)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[1003] bg-surface rounded-t-2xl shadow-warm animate-slide-up max-w-[480px] mx-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border-warm" />
            </div>

            <div className="px-5 pb-6 pt-2">
              {/* Category badge + heat */}
              <div className="flex items-center justify-between mb-2">
                {selectedHotspot.category_bias && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: getHotspotColor(selectedHotspot) + "18",
                      color: getHotspotColor(selectedHotspot),
                    }}
                  >
                    {selectedHotspot.category_bias}
                  </span>
                )}
                {selectedHotspot.heat_score > 0 && (
                  <span className="text-xs text-text-muted">
                    {selectedHotspot.heat_score} recent completions
                  </span>
                )}
              </div>

              {/* Name + description */}
              <h3 className="font-heading text-base text-text-primary mb-1">
                {selectedHotspot.name}
              </h3>
              {selectedHotspot.description && (
                <p className="text-sm text-text-secondary mb-4">
                  {selectedHotspot.description}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-5">
                <div className="text-sm">
                  <span className="font-semibold text-text-primary">{questCount(selectedHotspot)}</span>
                  <span className="text-text-muted ml-1">quests</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-text-primary">{selectedHotspot.radius_meters || 300}m</span>
                  <span className="text-text-muted ml-1">radius</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onSelectHotspot(selectedHotspot);
                    setSelectedHotspot(null);
                  }}
                  className="flex-1 bg-accent text-text-on-accent min-h-[var(--control-height)] rounded-xl font-semibold text-sm transition-transform active:scale-[0.98]"
                >
                  View Quests
                </button>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="px-5 min-h-[var(--control-height)] rounded-xl border border-border text-text-secondary text-sm transition-colors hover:bg-base-darker"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
