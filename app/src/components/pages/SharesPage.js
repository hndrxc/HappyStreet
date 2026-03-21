"use client";

import { useState, useEffect } from "react";
import { userShares as initialShares } from "@/lib/mockData";
import { SharesIcon } from "@/components/icons";

export default function SharesPage() {
  const [shares, setShares] = useState(initialShares);
  const [sellingIds, setSellingIds] = useState(new Set());
  const [showSellAllConfirm, setShowSellAllConfirm] = useState(false);

  // Simulate real-time value updates via socket
  useEffect(() => {
    const interval = setInterval(() => {
      setShares((prev) =>
        prev.map((share) => ({
          ...share,
          currentValue: share.currentValue * (0.98 + Math.random() * 0.04), // ±2% fluctuation
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSell = (shareId) => {
    // Add to selling set to trigger animation
    setSellingIds((prev) => new Set([...prev, shareId]));
    
    // Remove after animation
    setTimeout(() => {
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      setSellingIds((prev) => {
        const next = new Set(prev);
        next.delete(shareId);
        return next;
      });
    }, 400);
  };

  const handleSellAll = () => {
    // Add all to selling set
    const allIds = new Set(shares.map((s) => s.id));
    setSellingIds(allIds);
    
    // Remove all after animation
    setTimeout(() => {
      setShares([]);
      setSellingIds(new Set());
    }, 400);
    
    setShowSellAllConfirm(false);
  };

  const totalValue = shares.reduce(
    (sum, s) => sum + s.shareCount * s.currentValue,
    0
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 bg-surface border-b border-border">
        <h1 className="font-pixel text-sm text-text-primary mb-2">Your Shares</h1>
        <p className="text-text-secondary text-sm">
          Total value: <span className="font-pixel text-accent">${totalValue.toFixed(2)}</span>
        </p>
      </header>

      {/* Shares List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        {shares.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-base-darker flex items-center justify-center mb-4">
              <SharesIcon className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-text-muted">No shares owned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => (
              <ShareRow
                key={share.id}
                share={share}
                isSelling={sellingIds.has(share.id)}
                onSell={() => handleSell(share.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sell All Button */}
      {shares.length > 0 && (
        <div className="p-4 bg-surface border-t border-border">
          <button
            onClick={() => setShowSellAllConfirm(true)}
            className="w-full py-4 border-2 border-accent text-accent font-semibold rounded-xl transition-all active:scale-[0.98] hover:bg-accent hover:text-text-on-accent"
          >
            Sell All Shares
          </button>
        </div>
      )}

      {/* Sell All Confirm Modal */}
      {showSellAllConfirm && (
        <SellAllConfirmModal
          totalValue={totalValue}
          onConfirm={handleSellAll}
          onCancel={() => setShowSellAllConfirm(false)}
        />
      )}
    </div>
  );
}

function ShareRow({ share, isSelling, onSell }) {
  const { questTitle, shareCount, currentValue } = share;
  const totalValue = shareCount * currentValue;

  return (
    <div
      className={`bg-surface rounded-2xl p-4 border border-border transition-all duration-400 ${
        isSelling ? "animate-slide-right opacity-0" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary mb-1 truncate">
            {questTitle}
          </h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-text-muted">
              {shareCount} shares
            </span>
            <span className="text-text-secondary">
              @ <span className="font-pixel text-xs">${currentValue.toFixed(2)}</span>
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-pixel text-accent text-sm mb-2">
            ${totalValue.toFixed(2)}
          </p>
          <button
            onClick={onSell}
            disabled={isSelling}
            className="px-4 py-2 bg-accent text-text-on-accent text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
}

function SellAllConfirmModal({ totalValue, onConfirm, onCancel }) {
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanConfirm(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div 
        className="fixed inset-0 bg-text-primary/30 z-50"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl p-6 shadow-warm max-w-sm w-full animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <SharesIcon className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-pixel text-sm text-text-primary text-center mb-2">
            Sell All Shares?
          </h3>
          <p className="text-text-secondary text-sm text-center mb-2">
            You will receive:
          </p>
          <p className="font-pixel text-accent text-lg text-center mb-6">
            ${totalValue.toFixed(2)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-border rounded-xl text-text-secondary font-medium transition-colors hover:bg-base"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex-1 py-3 bg-accent text-text-on-accent rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canConfirm ? "Confirm" : "Wait..."}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
