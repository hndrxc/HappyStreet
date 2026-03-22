"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchLeaderboard } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import useSocket from "@/lib/useSocket";

const SORT_OPTIONS = [
  { id: "joy_coins", label: "JoyCoins" },
  { id: "total_completions", label: "Quests Done" },
];

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("joy_coins");
  const { user } = useAuth();
  const { socket } = useSocket(user);

  useEffect(() => {
    fetchLeaderboard()
      .then((result) => {
        console.log("[Leaderboard] fetched:", result);
        setData(Array.isArray(result) ? result : []);
      })
      .catch((err) => {
        console.error("[Leaderboard] fetch failed:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Live update when any quest is completed
  useEffect(() => {
    if (!socket) return;
    const onQuestCompleted = () => {
      fetchLeaderboard()
        .then((result) => setData(Array.isArray(result) ? result : []))
        .catch(() => {});
    };
    socket.on("quest_completed", onQuestCompleted);
    return () => socket.off("quest_completed", onQuestCompleted);
  }, [socket]);

  console.log("[Leaderboard] render — data:", data.length, "loading:", loading, "entries:", data.map(d => `${d.username}=${d.joy_coins}JC`).join(", "));

  const sortedData = useMemo(() => {
    const sorted = [...data];
    if (sortBy === "joy_coins") {
      sorted.sort((a, b) => (b.joy_coins || 0) - (a.joy_coins || 0));
    } else if (sortBy === "total_completions") {
      sorted.sort((a, b) => (b.total_completions || 0) - (a.total_completions || 0));
    }
    return sorted.map((item, index) => ({ ...item, rank: index + 1 }));
  }, [data, sortBy]);

  return (
    <div className="page-shell">
      <header className="page-header bg-surface border-b border-border">
        <h1 className="font-heading text-base text-text-primary mb-3">Leaderboard</h1>

        <div className="card-stack-center">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-text-muted shrink-0">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 min-h-[2.5rem] px-3 bg-base rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="page-scroll scrollbar-hide">
        <div className="page-content space-y-2">
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card-stack-center flex items-center gap-3 p-3 rounded-xl bg-surface border border-border animate-pulse">
                <div className="w-8 h-8 rounded-full bg-base-darker" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-base-darker rounded" />
                </div>
                <div className="h-4 w-16 bg-base-darker rounded" />
              </div>
            ))
          ) : sortedData.length === 0 ? (
            <div className="page-center py-16">
              <p className="text-text-muted text-sm">No users yet</p>
              <p className="text-sm text-text-muted mt-1">Complete quests to earn JoyCoins</p>
            </div>
          ) : (
            <div className="card-stack-center space-y-2">
              {sortedData.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  sortBy={sortBy}
                  isCurrentUser={entry.userId === user?.id || entry.username === user?.username}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, sortBy, isCurrentUser }) {
  const { rank, username, joy_coins, total_completions } = entry;

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
    if (sortBy === "total_completions") return `${total_completions || 0} quests`;
    return `${joy_coins || 0} JC`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isCurrentUser ? "bg-accent/10 border border-accent/30" : "bg-surface border border-border"
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading text-xs ${getRankStyle()}`}>
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentUser ? "text-accent" : "text-text-primary"}`}>
          {username}
          {isCurrentUser && <span className="text-text-muted text-xs ml-2">(You)</span>}
        </p>
      </div>

      <div className={`font-heading text-xs ${rank <= 3 ? "text-accent" : "text-text-secondary"}`}>
        {getValue()}
      </div>
    </div>
  );
}
