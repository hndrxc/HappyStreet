"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { userShares } from "@/lib/mockData";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  // Calculate top 3 holdings by total value
  const topHoldings = useMemo(() => {
    return [...userShares]
      .map((share) => ({
        ...share,
        totalValue: share.shareCount * share.currentValue,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 3);
  }, []);

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 bg-surface border-b border-border">
        <h1 className="font-pixel text-[12px] text-text-primary">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Avatar and Username Section */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4">
          {/* Large Avatar */}
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-text-on-accent font-pixel text-[14px] mb-4 shadow-warm glow-gold">
            {firstLetter}
          </div>
          
          {/* Username */}
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {user?.username}
          </h2>

          {/* Balance Card */}
          <div className="bg-surface rounded-2xl p-6 shadow-warm border border-border w-full max-w-xs text-center mb-4">
            <p className="text-text-muted text-sm mb-2">Current Balance</p>
            <p className="font-pixel text-accent text-[14px]">
              ${(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="px-6 py-2 text-sm text-text-secondary border border-border rounded-xl hover:bg-base-darker transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Top Holdings Section */}
        <div className="px-4 pb-8">
          <h3 className="font-pixel text-[10px] text-text-primary mb-4">
            Top Holdings
          </h3>
          
          {topHoldings.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">
              No holdings yet
            </p>
          ) : (
            <div className="space-y-3">
              {topHoldings.map((holding, index) => (
                <HoldingCard key={holding.id} holding={holding} rank={index + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HoldingCard({ holding, rank }) {
  const { questTitle, shareCount, totalValue } = holding;

  const getRankBadge = () => {
    switch (rank) {
      case 1:
        return { bg: "bg-gold", text: "text-text-on-accent" };
      case 2:
        return { bg: "bg-silver", text: "text-text-primary" };
      case 3:
        return { bg: "bg-bronze", text: "text-text-on-accent" };
      default:
        return { bg: "bg-base-darker", text: "text-text-secondary" };
    }
  };

  const badge = getRankBadge();

  return (
    <div className="bg-surface rounded-2xl p-4 border border-border flex items-center gap-3">
      {/* Rank Badge */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-pixel text-[8px] ${badge.bg} ${badge.text}`}>
        {rank}
      </div>
      
      {/* Quest Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary truncate">{questTitle}</p>
        <p className="text-sm text-text-muted">{shareCount} shares</p>
      </div>
      
      {/* Value */}
      <div className="font-pixel text-accent text-[10px] shrink-0">
        ${totalValue.toFixed(2)}
      </div>
    </div>
  );
}
