"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import useSocket from "@/lib/useSocket";
import BottomTabBar from "./BottomTabBar";
import LoginPage from "./pages/LoginPage";

export default function AppShell({ children }) {
  const { user, isLoading, updateUser } = useAuth();
  const { socket } = useSocket(user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [matchToast, setMatchToast] = useState(null);

  // register_user is handled by useSocket on connect/reconnect

  // Keep user.hotspot_id in sync with server
  useEffect(() => {
    if (!socket) return;
    const onHotspotChanged = ({ hotspot_id }) => {
      updateUser({ hotspot_id: hotspot_id || null });
    };
    socket.on("user_hotspot_changed", onHotspotChanged);
    return () => socket.off("user_hotspot_changed", onHotspotChanged);
  }, [socket, updateUser]);

  // Track unread message count
  useEffect(() => {
    if (!socket) return;
    const onUnread = ({ unreadCount: count }) => {
      setUnreadCount(count || 0);
    };
    socket.on("unread_update", onUnread);
    return () => socket.off("unread_update", onUnread);
  }, [socket]);

  // Notify both parties when a tunnel is established (dedup by tunnelId)
  useEffect(() => {
    if (!socket || !user?.id) return;
    const seenTunnels = new Set();
    const onTunnelCreated = (data) => {
      const tid = data?.tunnelId;
      if (tid && seenTunnels.has(tid)) return; // skip duplicate
      if (tid) seenTunnels.add(tid);
      const isRecipient = String(user.id) === String(data?.recipientId);
      setMatchToast({
        questTitle: data?.questTitle || "Quest",
        isRecipient,
      });
      setTimeout(() => setMatchToast(null), 5000);
    };
    socket.on("tunnel_created", onTunnelCreated);
    return () => socket.off("tunnel_created", onTunnelCreated);
  }, [socket, user?.id]);

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
      <BottomTabBar unreadCount={unreadCount} />

      {matchToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
          <div
            className="bg-success text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 cursor-pointer"
            onClick={() => setMatchToast(null)}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-semibold">
                {matchToast.isRecipient
                  ? "Someone accepted your quest!"
                  : "Quest matched!"}
              </p>
              <p className="text-xs opacity-90">
                {matchToast.questTitle} — check{" "}
                {matchToast.isRecipient ? "Requests" : "Offers"} in Messages
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
