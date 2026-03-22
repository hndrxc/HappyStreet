"use client";

import { useState, useEffect, useRef } from "react";
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { fetchMarket, fetchStock } from "@/lib/api";
import { CATEGORY_COLORS } from "@/lib/categories";
import useSocket from "@/lib/useSocket";

const TICKER_DISPLAY = {
  KIND: "Kindness",
  MIND: "Mindfulness",
  SOCL: "Social",
  PHYS: "Physical",
  CRTV: "Creativity",
  GRAT: "Gratitude",
};

export default function MarketDashboard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const prevPricesRef = useRef({});
  const [flashTickers, setFlashTickers] = useState({});
  const { socket } = useSocket();

  // Fetch initial market data
  useEffect(() => {
    fetchMarket()
      .then((data) => setStocks(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Socket: market_snapshot on connect
  useEffect(() => {
    if (!socket) return;
    const onSnapshot = (data) => {
      if (Array.isArray(data)) setStocks(data);
    };
    socket.on("market_snapshot", onSnapshot);
    return () => socket.off("market_snapshot", onSnapshot);
  }, [socket]);

  // Socket: stock_updated on price change
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (update) => {
      const prev = prevPricesRef.current[update.ticker];
      if (prev !== undefined && prev !== update.current_price) {
        const direction = update.current_price > prev ? "up" : "down";
        setFlashTickers((f) => ({ ...f, [update.ticker]: direction }));
        setTimeout(() => {
          setFlashTickers((f) => {
            const next = { ...f };
            delete next[update.ticker];
            return next;
          });
        }, 1200);
      }
      setStocks((prev) =>
        prev.map((s) => (s.ticker === update.ticker ? { ...s, ...update } : s))
      );
    };
    socket.on("stock_updated", onUpdate);
    return () => socket.off("stock_updated", onUpdate);
  }, [socket]);

  // Track previous prices
  useEffect(() => {
    const map = {};
    stocks.forEach((s) => {
      map[s.ticker] = s.current_price;
    });
    prevPricesRef.current = map;
  }, [stocks]);

  // Fetch detail when a stock is selected
  useEffect(() => {
    if (!selectedStock) return;
    let isCancelled = false;

    fetchStock(selectedStock)
      .then((data) => {
        if (!isCancelled) {
          setDetailData(data);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setDetailData(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedStock]);

  const totalIndex =
    stocks.length > 0
      ? Math.round(
          (stocks.reduce((sum, s) => sum + (s.current_price || 100), 0) / stocks.length) * 100
        ) / 100
      : 100;

  if (loading) {
    return (
      <div className="page-shell">
        <header className="page-header bg-surface border-b border-border">
          <h1 className="font-heading text-base text-text-primary">Happiness Market</h1>
        </header>
        <div className="page-scroll">
          <div className="page-content grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border p-4 animate-pulse">
                <div className="h-4 w-12 bg-base-darker rounded mb-2" />
                <div className="h-3 w-20 bg-base-darker rounded mb-3" />
                <div className="h-6 w-16 bg-base-darker rounded mb-2" />
                <div className="h-8 w-full bg-base-darker rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header bg-surface border-b border-border">
        <div className="card-stack-center">
          <h1 className="font-heading text-base text-text-primary mb-1">Happiness Market</h1>
          <p className="text-text-secondary text-sm">
            Market Index:{" "}
            <span className="font-heading text-accent">${totalIndex.toFixed(2)}</span>
          </p>
        </div>
      </header>

      <div className="page-scroll scrollbar-hide">
        <div className="page-content">
          <div className="card-stack-center grid grid-cols-2 gap-3">
            {stocks.map((stock) => (
              <StockCard
                key={stock.ticker}
                stock={stock}
                flash={flashTickers[stock.ticker]}
                onTap={() => setSelectedStock(stock.ticker)}
              />
            ))}
          </div>

          {stocks.length === 0 && (
            <div className="page-center py-16">
              <p className="text-text-muted text-sm">No market data yet</p>
              <p className="text-sm text-text-muted mt-1">Complete quests to move the market</p>
            </div>
          )}
        </div>
      </div>

      {selectedStock && detailData && detailData.ticker === selectedStock.toUpperCase() && (
        <StockDetailModal
          stock={detailData}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}

function StockCard({ stock, flash, onTap }) {
  const { ticker, name, current_price, hour_change, sparkline, price_history } = stock;
  const color = CATEGORY_COLORS[name?.toLowerCase()] || "#8B5CF6";
  const change = hour_change || 0;
  const isUp = change >= 0;

  const chartData = (sparkline || (price_history || []).slice(-20).map((h) => h.price) || []).map(
    (p, i) => ({ i, p })
  );

  const flashBorder =
    flash === "up"
      ? "border-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]"
      : flash === "down"
      ? "border-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]"
      : "border-border";

  return (
    <button
      onClick={onTap}
      className={`bg-surface rounded-2xl border p-3 text-left transition-all duration-300 ${flashBorder}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-heading text-xs text-text-primary">{ticker}</span>
        <span
          className={`text-xs font-semibold ${
            isUp ? "text-green-400" : "text-red-400"
          }`}
        >
          {isUp ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </div>
      <p className="text-sm text-text-muted truncate mb-1">
        {TICKER_DISPLAY[ticker] || name}
      </p>
      <p className="font-heading text-sm text-accent mb-2">
        ${(current_price || 100).toFixed(2)}
      </p>
      {chartData.length > 1 && (
        <div className="h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="p"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </button>
  );
}

function StockDetailModal({ stock, onClose }) {
  const { ticker, name, current_price, hour_change, day_change, price_history, avg_happiness, total_completions } =
    stock;
  const color = CATEGORY_COLORS[name?.toLowerCase()] || "#8B5CF6";

  const chartData = (price_history || []).map((h, i) => ({
    i,
    price: h.price,
  }));

  return (
    <>
      <div className="fixed inset-0 bg-text-primary/30 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-surface rounded-t-2xl p-6 shadow-warm max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-base text-text-primary">
                {ticker} - {TICKER_DISPLAY[ticker] || name}
              </h2>
              <p className="font-heading text-accent text-lg mt-1">
                ${(current_price || 100).toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-base-darker text-text-muted"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-4 mb-4 text-sm">
            <div>
              <span className="text-text-muted">1h </span>
              <span className={`font-semibold ${(hour_change || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(hour_change || 0) >= 0 ? "+" : ""}
                {(hour_change || 0).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-text-muted">24h </span>
              <span className={`font-semibold ${(day_change || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(day_change || 0) >= 0 ? "+" : ""}
                {(day_change || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {chartData.length > 1 && (
            <div className="h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} hide />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#grad-${ticker})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-base rounded-xl p-3 text-center">
              <p className="text-text-muted text-xs mb-1">Avg Happiness</p>
              <p className="font-heading text-sm text-text-primary">
                {(avg_happiness || 0).toFixed(1)} / 5
              </p>
            </div>
            <div className="bg-base rounded-xl p-3 text-center">
              <p className="text-text-muted text-xs mb-1">Completions</p>
              <p className="font-heading text-sm text-text-primary">
                {total_completions || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
