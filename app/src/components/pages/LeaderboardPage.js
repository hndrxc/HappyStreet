"use client";

import { useState, useMemo } from "react";
import { leaderboard, quests, currentUser } from "@/lib/mockData";

const SORT_OPTIONS = [
  { id: "balance", label: "Balance" },
  { id: "totalShares", label: "Total Shares" },
  { id: "questShares", label: "Quest Shares" },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("global");
  const [sortBy, setSortBy] = useState("balance");
  const [selectedQuest, setSelectedQuest] = useState(quests[0]?.id || "");

  const data = activeTab === "global" ? leaderboard.global : leaderboard.interacted;

  const sortedData = useMemo(() => {
    const sorted = [...data];
    if (sortBy === "balance") {
      sorted.sort((a, b) => b.balance - a.balance);
    } else if (sortBy === "totalShares") {
      sorted.sort((a, b) => b.totalShares - a.totalShares);
    }
    // For questShares, we'd need real data - for now, use totalShares as proxy
    return sorted.map((item, index) => ({ ...item, rank: index + 1 }));
  }, [data, sortBy]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 bg-surface border-b border-border">
        <h1 className="font-pixel text-sm text-text-primary mb-4">Leaderboard</h1>
        
        {/* Tab Switcher */}
        <div className="flex bg-base rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab("global")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "global"
                ? "bg-surface text-accent shadow-warm-sm"
                : "text-text-muted"
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab("interacted")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "interacted"
                ? "bg-surface text-accent shadow-warm-sm"
                : "text-text-muted"
            }`}
          >
            Interacted
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 items-center">
          <span className="text-xs text-text-muted shrink-0">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-3 py-2 bg-base rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          
          {sortBy === "questShares" && (
            <select
              value={selectedQuest}
              onChange={(e) => setSelectedQuest(e.target.value)}
              className="flex-1 px-3 py-2 bg-base rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              {quests.map((q) => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 space-y-2">
          {sortedData.map((entry) => (
            <LeaderboardRow 
              key={entry.userId} 
              entry={entry}
              sortBy={sortBy}
              isCurrentUser={entry.userId === currentUser.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, sortBy, isCurrentUser }) {
  const { rank, username, balance, totalShares } = entry;

  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return "bg-gold text-text-on-accent";
      case 2:
        return "bg-silver text-text-primary";
      case 3:
        return "bg-bronze text-text-on-accent";
      default:
        return "bg-base-darker text-text-secondary";
    }
  };

  const getValue = () => {
    switch (sortBy) {
      case "balance":
        return `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      case "totalShares":
      case "questShares":
        return totalShares.toString();
      default:
        return "";
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isCurrentUser ? "bg-accent/10 border border-accent/30" : "bg-surface border border-border"
      }`}
    >
      {/* Rank */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-pixel text-xs ${getRankStyle()}`}>
        {rank}
      </div>
      
      {/* Username */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentUser ? "text-accent" : "text-text-primary"}`}>
          {username}
          {isCurrentUser && <span className="text-text-muted text-xs ml-2">(You)</span>}
        </p>
      </div>
      
      {/* Value */}
      <div className={`font-pixel text-sm ${rank <= 3 ? "text-accent" : "text-text-secondary"}`}>
        {getValue()}
      </div>
    </div>
  );
}
