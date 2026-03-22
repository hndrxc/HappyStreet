"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function TestPage() {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [quests, setQuests] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [logs, setLogs] = useState([]);
  const canConnect = Boolean(serverUrl);

  const sortedQuests = useMemo(
    () => [...quests].sort((a, b) => Number(b.value) - Number(a.value)),
    [quests]
  );

  function addLog(line) {
    setLogs((prev) => {
      const next = [`${new Date().toLocaleTimeString()} ${line}`, ...prev];
      return next.slice(0, 20);
    });
  }

  async function fetchQuests() {
    if (!canConnect) return;
    const res = await fetch(`${serverUrl}/quests`);
    if (!res.ok) throw new Error(`GET /quests failed: ${res.status}`);
    const data = await res.json();
    setQuests(Array.isArray(data) ? data : []);
    addLog(`REST GET /quests -> ${Array.isArray(data) ? data.length : 0} items`);
  }

  async function handleCreateQuest(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !canConnect) return;

    const res = await fetch(`${serverUrl}/quests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      addLog(`REST POST /quests failed (${res.status})`);
      return;
    }
    addLog(`REST POST /quests -> "${title}"`);
    setNewTitle("");
  }

  function handleCompleteQuest(id) {
    if (!socketRef.current) return;
    socketRef.current.emit("complete_quest", id);
    addLog(`SOCKET emit complete_quest (${id})`);
  }

  useEffect(() => {
    if (!canConnect) return;

    const socket = io(serverUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      addLog(`SOCKET connect ${socket.id}`);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      addLog("SOCKET disconnect");
    });

    socket.on("quests_init", (data) => {
      setQuests(Array.isArray(data) ? data : []);
      addLog(`SOCKET quests_init (${Array.isArray(data) ? data.length : 0})`);
    });

    socket.on("quests_updated", (data) => {
      setQuests(Array.isArray(data) ? data : []);
      addLog(`SOCKET quests_updated (${Array.isArray(data) ? data.length : 0})`);
    });

    socket.on("quest_added", (quest) => {
      addLog(`SOCKET quest_added (${quest?.id ?? "unknown"})`);
    });

    socket.on("quest_completed", (payload) => {
      addLog(`SOCKET quest_completed (${payload?.quest?.id ?? "unknown"})`);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [canConnect, serverUrl]);

  if (!canConnect) {
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-3">Server Wiring Test</h1>
        <p className="text-sm">
          Missing <code>NEXT_PUBLIC_SERVER_URL</code>. Set it in{" "}
          <code>app/.env.local</code>, for example:
        </p>
        <pre className="mt-3 p-3 rounded bg-gray-100 text-sm overflow-x-auto">
{`NEXT_PUBLIC_SERVER_URL=http://localhost:3001`}
        </pre>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <section>
        <h1 className="text-xl font-semibold">Server Wiring Test</h1>
        <p className="text-sm text-gray-600">
          URL: <code>{serverUrl}</code> | Socket:{" "}
          <strong>{connected ? "connected" : "disconnected"}</strong>
        </p>
      </section>

      <section className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchQuests().catch((err) => addLog(`REST error: ${err.message}`))}
            className="px-3 py-2 rounded bg-black text-white text-sm"
          >
            Refresh Quests (REST)
          </button>
        </div>

        <form onSubmit={handleCreateQuest} className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New quest title"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
          >
            Create Quest (POST)
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Quests</h2>
        <div className="border rounded divide-y">
          {sortedQuests.length === 0 ? (
            <p className="p-3 text-sm text-gray-600">No quests returned.</p>
          ) : (
            sortedQuests.map((q) => (
              <div
                key={q.id}
                className="p-3 flex items-center justify-between gap-3"
              >
                <div className="text-sm">
                  <div className="font-medium">{q.title}</div>
                  <div className="text-gray-600">
                    id={q.id} | value={q.value} | completions={q.completions}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCompleteQuest(q.id)}
                  className="px-3 py-2 rounded border text-sm"
                >
                  complete_quest
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Event Log</h2>
        <div className="border rounded p-3 bg-gray-50">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-600">No events yet.</p>
          ) : (
            <ul className="text-xs space-y-1 font-mono">
              {logs.map((line, i) => (
                <li key={`${line}-${i}`}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
