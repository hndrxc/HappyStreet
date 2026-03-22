"use client";

import { useEffect, useState } from "react";
import { CATEGORY_COLORS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import useSocket from "@/lib/useSocket";

export default function IncomingRequestPopup() {
  const { user } = useAuth();
  const { socket } = useSocket(user);
  const [request, setRequest] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data) => {
      setRequest(data);
      setFadeOut(false);
    };

    socket.on("incoming_task_request", onIncoming);
    return () => socket.off("incoming_task_request", onIncoming);
  }, [socket]);

  const dismiss = () => {
    setFadeOut(true);
    setTimeout(() => {
      setRequest(null);
      setFadeOut(false);
    }, 300);
  };

  const handleAccept = () => {
    if (!socket || !request || !user) return;
    socket.emit("task_accept", {
      requestId: request.requestId,
      fromSocketId: request.fromSocketId,
      task: request.task,
      userId: user.id,
      username: user.username,
    });
    dismiss();
  };

  const handleDecline = () => {
    if (!socket || !request) return;
    socket.emit("task_decline", {
      requestId: request.requestId,
      fromSocketId: request.fromSocketId,
    });
    dismiss();
  };

  if (!request) return null;

  const { task, action, fromUsername, hotspotName } = request;
  const isRequest = action === "request";
  const color = CATEGORY_COLORS[task.category] || CATEGORY_COLORS["kindness"];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-text-primary/30 z-[2000] transition-opacity duration-300 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleDecline}
      />

      {/* Popup */}
      <div
        className={`fixed top-8 left-4 right-4 z-[2001] max-w-md mx-auto transition-all duration-300 ${
          fadeOut ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="bg-surface rounded-2xl shadow-warm border border-border p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + "18" }}
            >
              <span className="text-lg">{isRequest ? "🙋" : "🤝"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary text-sm">
                {fromUsername} {isRequest ? "needs help" : "is offering help"}
              </p>
              <p className="text-xs text-text-muted truncate">
                Near {hotspotName}
              </p>
            </div>
          </div>

          {/* Task info */}
          <div className="bg-base rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: color + "18", color }}
              >
                {task.category}
              </span>
              <span className="text-[10px] text-text-muted ml-auto">
                +{task.coin_reward} JC
              </span>
            </div>
            <p className="text-sm font-medium text-text-primary">
              {task.title}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="flex-1 py-3 border border-border rounded-xl text-text-secondary font-medium transition-colors hover:bg-base"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-3 bg-accent text-text-on-accent rounded-xl font-semibold transition-all active:scale-95"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
