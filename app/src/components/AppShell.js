"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import useSocket from "@/lib/useSocket";
import BottomTabBar from "./BottomTabBar";
import LoginPage from "./pages/LoginPage";

export default function AppShell({ children }) {
  const { user, isLoading, updateUser } = useAuth();
  const { socket } = useSocket(user);

  // Keep user.hotspot_id in sync with server
  useEffect(() => {
    if (!socket) return;
    const onHotspotChanged = ({ hotspot_id }) => {
      updateUser({ hotspot_id: hotspot_id || null });
    };
    socket.on("user_hotspot_changed", onHotspotChanged);
    return () => socket.off("user_hotspot_changed", onHotspotChanged);
  }, [socket, updateUser]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-base flex items-center justify-center">
        <div className="grain-overlay" />
        <p className="font-heading text-sm text-accent animate-pulse">Loading...</p>
      </div>
    );
  }

  // Not authenticated - show login
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-[100dvh] bg-base">
      <div className="grain-overlay" />
      <main className="mx-auto flex h-[100dvh] w-full flex-col overflow-hidden pb-16 md:pb-[88px]">
        <div className="app-frame">
          <div className="app-panel">
          {children}
          </div>
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
