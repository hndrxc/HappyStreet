"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function QuestBoard() {
  const [quests, setQuests] = useState([]);
  const [flash, setFlash] = useState({});
  const [newTitle, setNewTitle] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("quests_init", (data) => setQuests(data));
    socket.on("quests_updated", (data) => {
      setQuests((old) => {
        const oldMap = Object.fromEntries(old.map((q) => [q.id, q.value]));
        const newFlash = {};
        data.forEach((q) => {
          if (oldMap[q.id] !== undefined) {
            newFlash[q.id] =
              q.value > oldMap[q.id]
                ? "up"
                : q.value < oldMap[q.id]
                  ? "down"
                  : "none";
          }
        });
        setFlash(newFlash);
        setTimeout(() => setFlash({}), 800);
        return data;
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  function completeQuest(id) {
    socketRef.current?.emit("complete_quest", id);
  }

  function addQuest(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/quests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
  }

  const sorted = [...quests].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...quests.map((q) => q.value), 1);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center px-10 py-5 border-b border-terminal-border max-sm:px-4 max-sm:py-4">
        <div>
          <div className="text-[28px] font-bold tracking-[4px] text-terminal-accent">
            HQEX
          </div>
          <div className="text-[11px] text-terminal-muted tracking-[2px] mt-1">
            Happy Quest Exchange
          </div>
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: connected ? "#00ff88" : "#ff4455" }}
        />
      </div>

      {/* Add Quest Form */}
      <form
        className="flex gap-2.5 px-10 py-4 border-b border-terminal-surface max-sm:px-4 max-sm:py-3"
        onSubmit={addQuest}
      >
        <input
          className="flex-1 bg-terminal-surface border border-[#333] text-terminal-text px-3.5 py-2.5 font-mono text-sm outline-none min-w-0"
          placeholder="New quest..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button
          type="submit"
          className="bg-transparent border border-terminal-accent text-terminal-accent px-5 py-2.5 font-mono text-xs tracking-[2px] cursor-pointer whitespace-nowrap"
        >
          + LIST
        </button>
      </form>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_140px_120px_100px] px-10 py-2.5 text-[11px] tracking-[2px] text-terminal-muted-dark border-b border-terminal-surface max-sm:hidden">
        <span>QUEST</span>
        <span className="text-center">COMPLETIONS</span>
        <span className="text-right pr-5">VALUE</span>
        <span></span>
      </div>

      {/* Quest Rows */}
      {sorted.map((q) => {
        const dir = flash[q.id] || "none";
        const barWidth = `${(q.value / maxValue) * 100}%`;
        return (
          <div
            key={q.id}
            className={`grid grid-cols-[1fr_140px_120px_100px] items-center px-10 py-4 border-b border-terminal-border-dim relative transition-colors duration-300 max-sm:flex max-sm:flex-col max-sm:items-stretch max-sm:gap-2.5 max-sm:px-4 max-sm:py-3.5 ${
              dir === "up"
                ? "animate-flash-up"
                : dir === "down"
                  ? "animate-flash-down"
                  : ""
            }`}
          >
            <div
              className="absolute left-0 top-0 h-full bg-terminal-bar transition-[width] duration-[600ms] pointer-events-none"
              style={{ width: barWidth }}
            />
            <span className="text-[15px] relative pl-1 max-sm:text-[15px]">
              {q.title}
            </span>
            <span className="text-[13px] text-terminal-muted text-center relative max-sm:text-left max-sm:text-[11px]">
              {q.completions}x
            </span>
            <span
              className={`text-[22px] font-bold text-right pr-5 relative transition-colors duration-300 max-sm:text-left max-sm:pr-0 max-sm:text-[20px] ${
                dir === "up"
                  ? "text-terminal-accent"
                  : dir === "down"
                    ? "text-terminal-danger"
                    : "text-terminal-text"
              }`}
            >
              {dir === "up" ? "▲ " : dir === "down" ? "▼ " : ""}
              {q.value.toFixed(0)}
            </span>
            <button
              className="bg-transparent border border-[#333] text-[#888] px-4 py-2 font-mono text-[11px] tracking-[2px] cursor-pointer relative justify-self-end hover:border-terminal-accent hover:text-terminal-accent max-sm:self-end"
              onClick={() => completeQuest(q.id)}
            >
              DONE
            </button>
          </div>
        );
      })}
    </div>
  );
}
