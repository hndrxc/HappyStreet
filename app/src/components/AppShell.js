"use client";

import { useAuth } from "@/context/AuthContext";
import BottomTabBar from "./BottomTabBar";
import LoginPage from "./pages/LoginPage";
import IncomingRequestPopup from "./IncomingRequestPopup";

export default function AppShell({ children }) {
  const { user, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-base flex items-center justify-center">
        <div className="grain-overlay" />
        <p className="font-pixel text-[10px] text-accent animate-pulse">Loading...</p>
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
      <main className="mx-auto flex h-[100dvh] w-full flex-col overflow-hidden pb-16 md:px-4 md:pt-4 md:pb-[88px]">
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden md:rounded-3xl md:border md:border-border md:bg-surface md:shadow-warm">
          {children}
        </div>
      </main>
      <BottomTabBar />
      <IncomingRequestPopup />
    </div>
  );
}
