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

export default function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;
    refCount++;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onQuestsInit = (quests) => {
      // TODO: store initial quest list
    };
    const onHotspotsInit = (hotspots) => {
      // TODO: render hotspots on map
    };
    const onHotspotUpdated = ({ hotspot_id, name, questq_ids }) => {
      // TODO: update hotspot queue in real time
    };
    const onQuestCompleted = ({ quest, by }) => {
      console.log(`${by} just completed: ${quest.title}`);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("quests_init", onQuestsInit);
    socket.on("hotspots_init", onHotspotsInit);
    socket.on("hotspot_updated", onHotspotUpdated);
    socket.on("quest_completed", onQuestCompleted);
    

  
    // Sync initial state
    setConnected(socket.connected);

    
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        socket.emit("update_location", {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
      });
    }


    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("quests_init", onQuestsInit);
      socket.off("hotspots_init", onHotspotsInit);
      socket.off("hotspot_updated", onHotspotUpdated);
      socket.off("quest_completed", onQuestCompleted);
      if (watchId) navigator.geolocation.clearWatch(watchId);
      refCount--;

      if (refCount <= 0) {
        socket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, []);

  return { socket: socketRef.current, connected };
}
