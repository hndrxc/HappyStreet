"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function useLocation() {
  const hasGeolocation =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "geolocation" in navigator;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(
    hasGeolocation ? null : "Geolocation is not supported by your browser."
  );
  const [loading, setLoading] = useState(hasGeolocation);
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef(null);

  const handleSuccess = useCallback((position) => {
    setLocation({
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err) => {
    const messages = {
      1: "Location permission denied. Enable location to see quests near you.",
      2: "Location unavailable. Please try again.",
      3: "Location request timed out.",
    };
    setError(messages[err.code] || "Could not get your location.");
    setLoading(false);
  }, []);

  // One-shot position on mount
  useEffect(() => {
    if (!hasGeolocation) return;

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  }, [hasGeolocation, handleSuccess, handleError]);

  const startWatching = useCallback(() => {
    if (!hasGeolocation) return;
    if (watchIdRef.current !== null) return;

    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });
    watchIdRef.current = id;
    setWatching(true);
  }, [hasGeolocation, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setWatching(false);
    }
  }, []);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { location, error, loading, watching, startWatching, stopWatching };
}
