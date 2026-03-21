"use client";

import { useState } from "react";
import BottomTabBar from "./BottomTabBar";
import HotspotPage from "./pages/HotspotPage";
import MessagesPage from "./pages/MessagesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SharesPage from "./pages/SharesPage";
import ProfilePage from "./pages/ProfilePage";

export default function AppShell() {
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
