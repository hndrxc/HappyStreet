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

    // Only send location when a logged-in user is present
    let intervalId;
    if (navigator.geolocation && user?.id) {
      const sendLocation = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
          socket.emit("update_location", {
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
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      if (intervalId) clearInterval(intervalId);
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
