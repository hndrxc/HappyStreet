"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// Module-level singleton so multiple components share one connection
let sharedSocket = null;
let refCount = 0;

function getSocket() {
  if (!sharedSocket) {
    const url = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!url) return null;
    sharedSocket = io(url, { autoConnect: true });
  }
  return sharedSocket;
}

export default function useSocket(user) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;
    refCount++;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Sync initial state
    setConnected(socket.connected);

    // Send location updates with user identity so the server can route task requests
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        socket.emit("update_location", {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          userId: user?.id || null,
          username: user?.username || null,
        });
      });
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      if (watchId) navigator.geolocation.clearWatch(watchId);
      refCount--;

      if (refCount <= 0) {
        socket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, [user?.id]);

  return { socket: socketRef.current, connected };
}
