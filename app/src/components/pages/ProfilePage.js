"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUserStats } from "@/lib/api";
import { CATEGORY_COLORS } from "@/lib/mockData";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const userId = user?.id || null;

  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;

    fetchUserStats(userId)
      .then((data) => {
        if (!isCancelled) {
          setStats(data);
          setStatsError("");
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setStatsError("Could not load latest profile stats.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "?";
  const joyCoins = stats?.joy_coins ?? user?.joy_coins ?? 0;
  const totalCompletions = stats?.total_completions ?? user?.total_completions ?? 0;
  const streak = stats?.streak_current ?? 0;
  const recentCompletions = stats?.recent_completions || [];
  const loading = Boolean(userId) && !stats && !statsError;

  return (
    <div className="page-shell">
      <header className="page-header bg-surface border-b border-border">
        <h1 className="font-heading text-base text-text-primary">Profile</h1>
      </header>

      <div className="page-scroll scrollbar-hide">
        <div className="page-content">
          <div className="card-stack-center flex flex-col items-center pt-6 pb-6">
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-text-on-accent font-heading text-2xl mb-4 shadow-warm glow-gold">
            {firstLetter}
            </div>

            <h2 className="font-heading text-2xl font-semibold text-text-primary mb-4">
              {user?.username}
            </h2>

            {loading ? (
              <div className="w-full max-w-[var(--content-tight-width)] space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface rounded-2xl p-4 border border-border animate-pulse">
                    <div className="h-4 w-20 bg-base-darker rounded mb-2" />
                    <div className="h-6 w-16 bg-base-darker rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="w-full max-w-[var(--content-tight-width)] grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-surface rounded-2xl p-4 shadow-warm border border-border text-center">
                    <p className="text-text-muted text-xs mb-1">JoyCoins</p>
                    <p className="font-heading text-accent text-base">{joyCoins}</p>
                  </div>
                  <div className="bg-surface rounded-2xl p-4 shadow-warm border border-border text-center">
                    <p className="text-text-muted text-xs mb-1">Quests</p>
                    <p className="font-heading text-accent text-base">{totalCompletions}</p>
                  </div>
                  <div className="bg-surface rounded-2xl p-4 shadow-warm border border-border text-center">
                    <p className="text-text-muted text-xs mb-1">Streak</p>
                    <p className="font-heading text-accent text-base">{streak}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="min-h-[var(--control-height)] px-6 text-sm text-text-secondary border border-border rounded-xl hover:bg-base-darker transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>

          <div className="card-stack-center pb-8">
            <h3 className="font-heading text-sm text-text-primary mb-4">
              Recent Activity
            </h3>

            {statsError && (
              <p className="text-sm text-error text-center mb-3">{statsError}</p>
            )}

            {recentCompletions.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-6">
                No activity yet - go complete some quests!
              </p>
            ) : (
              <div className="space-y-2">
                {recentCompletions.map((c, i) => (
                  <div
                    key={c._id || i}
                    className="bg-surface rounded-xl p-3 border border-border flex items-center gap-3"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[c.category] || "#8B5CF6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate capitalize">{c.category}</p>
                      <p className="text-xs text-text-muted">
                        {["", "😐", "🙂", "😊", "😄", "🤩"][c.happiness_rating] || ""}{" "}
                        +{c.coin_reward || 0} JC
                      </p>
                    </div>
                    <p className="text-xs text-text-muted shrink-0">
                      {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
