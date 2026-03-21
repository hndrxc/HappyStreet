import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io(import.meta.env.VITE_SERVER_URL);

export default function App() {
  const [quests, setQuests] = useState([]);
  const [flash, setFlash] = useState({});
  const [newTitle, setNewTitle] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("quests_init", (data) => setQuests(data));
    socket.on("quests_updated", (data) => {
      setQuests((old) => {
        const oldMap = Object.fromEntries(old.map((q) => [q.id, q.value]));
        const newFlash = {};
        data.forEach((q) => {
          if (oldMap[q.id] !== undefined) {
            newFlash[q.id] = q.value > oldMap[q.id] ? "up" : q.value < oldMap[q.id] ? "down" : "none";
          }
        });
        setFlash(newFlash);
        setTimeout(() => setFlash({}), 800);
        return data;
      });
    });
    return () => socket.removeAllListeners();
  }, []);

  function completeQuest(id) {
    socket.emit("complete_quest", id);
  }

  function addQuest(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    fetch(import.meta.env.VITE_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
  }

  const sorted = [...quests].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...quests.map((q) => q.value), 1);

  return (
    <div className="app">
      <div className="header">
        <div>
          <div className="ticker">HQEX</div>
          <div className="subtitle">Happy Quest Exchange</div>
        </div>
        <div className="dot" style={{ background: connected ? "#00ff88" : "#ff4455" }} />
      </div>

      <form className="add-form" onSubmit={addQuest}>
        <input
          placeholder="New quest..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit">+ LIST</button>
      </form>

      <div className="table-header">
        <span>QUEST</span>
        <span style={{ textAlign: "center" }}>COMPLETIONS</span>
        <span style={{ textAlign: "right", paddingRight: 20 }}>VALUE</span>
        <span></span>
      </div>

      {sorted.map((q) => {
        const dir = flash[q.id] || "none";
        const barWidth = `${(q.value / maxValue) * 100}%`;
        return (
          <div key={q.id} className={`quest-row flash-${dir}`}>
            <div className="bar" style={{ width: barWidth }} />
            <span className="quest-name">{q.title}</span>
            <span className="completions">{q.completions}x</span>
            <span className={`value ${dir === "none" ? "neutral" : dir}`}>
              {dir === "up" ? "▲ " : dir === "down" ? "▼ " : ""}
              {q.value.toFixed(0)}
            </span>
            <button className="done-btn" onClick={() => completeQuest(q.id)}>DONE</button>
          </div>
        );
      })}
    </div>
  );
}