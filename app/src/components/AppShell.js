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
      <IncomingRequestPopup />
    </div>
  );
}
