"use client";

import { HotspotIcon, MessagesIcon, LeaderboardIcon, SharesIcon, ProfileIcon } from "./icons";

const tabs = [
  { id: "hotspot", label: "Hotspot", Icon: HotspotIcon },
  { id: "messages", label: "Messages", Icon: MessagesIcon },
  { id: "leaderboard", label: "Ranks", Icon: LeaderboardIcon },
  { id: "shares", label: "Shares", Icon: SharesIcon },
  { id: "profile", label: "Profile", Icon: ProfileIcon },
];

export default function BottomTabBar({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="max-w-[480px] mx-auto flex justify-around items-center h-16 px-2">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors ${
                isActive ? "text-accent" : "text-text-muted"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" active={isActive} />
              <span className={`font-pixel text-[8px] ${isActive ? "text-accent" : "text-text-muted"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
