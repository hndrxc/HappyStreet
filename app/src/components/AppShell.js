"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import BottomTabBar from "./BottomTabBar";
import HotspotPage from "./pages/HotspotPage";
import MessagesPage from "./pages/MessagesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SharesPage from "./pages/SharesPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";

export default function AppShell() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("hotspot");

  const renderPage = () => {
    switch (activeTab) {
      case "hotspot":
        return <HotspotPage />;
      case "messages":
        return <MessagesPage />;
      case "leaderboard":
        return <LeaderboardPage />;
      case "shares":
        return <SharesPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <HotspotPage />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
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
    <div className="min-h-screen bg-base">
      <div className="grain-overlay" />
      <main className="max-w-[480px] mx-auto h-screen flex flex-col pb-16 overflow-hidden">
        {renderPage()}
      </main>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
