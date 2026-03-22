"use client";

import { useEffect, useState } from "react";
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
  const [socket, setSocket] = useState(() => getSocket());

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    setSocket(s);
    refCount++;

    const onConnect = () => {
      setConnected(true);
      // Re-register user on every connect/reconnect so server always has the mapping
      if (user?.id) {
        s.emit("register_user", { userId: user.id });
      }
    };
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    // Sync initial state
    setConnected(s.connected);

    // Register immediately if already connected
    if (s.connected && user?.id) {
      s.emit("register_user", { userId: user.id });
    }

    // Only send location when a logged-in user is present
    let intervalId;
    if (navigator.geolocation && user?.id) {
      const sendLocation = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
          s.emit("update_location", {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            userId: user.id,
            username: user.username,
          });
        });
      };
      sendLocation();
      intervalId = setInterval(sendLocation, 5000);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      if (intervalId) clearInterval(intervalId);
      refCount--;

      if (refCount <= 0) {
        s.disconnect();
        sharedSocket = null;
        refCount = 0;
        setSocket(null);
      }
    };
  }, [user?.id]);

  return { socket, connected };
}
