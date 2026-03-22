"use client";

import { useState, useEffect } from "react";
import { ArrowLeftIcon, CompassIcon } from "./icons";
import { CATEGORY_COLORS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import useSocket from "@/lib/useSocket";

// Hardcoded boilerplate tasks — swap these out later
const TASKS = [
  { id: "task_1", title: "Buy someone a coffee", category: "kindness", coin_reward: 15 },
  { id: "task_2", title: "Help carry groceries", category: "kindness", coin_reward: 20 },
  { id: "task_3", title: "Walk someone's dog", category: "physical activity", coin_reward: 25 },
  { id: "task_4", title: "Give a campus tour", category: "social connection", coin_reward: 20 },
  { id: "task_5", title: "Share class notes", category: "gratitude", coin_reward: 10 },
];

export default function HotspotQuestList({ hotspot, onBack }) {
  const { user } = useAuth();
  const { socket } = useSocket(user);
  const [selectedTask, setSelectedTask] = useState(null);
  const [visibleTasks, setVisibleTasks] = useState(TASKS);
  const [removingId, setRemovingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { task, action }
  const [waitingForMatch, setWaitingForMatch] = useState(false);

  // Listen for acknowledgement that request was sent
  useEffect(() => {
    if (!socket) return;

    const onRequestSent = ({ requestId, task }) => {
      console.log("Request broadcast:", requestId);
      setWaitingForMatch(true);
    };

    const onAccepted = ({ task, byUsername }) => {
      setWaitingForMatch(false);
      // TODO: navigate to messaging with the matched user
      console.log(`${byUsername} accepted your task: ${task.title}`);
    };

    socket.on("task_request_sent", onRequestSent);
    socket.on("task_accepted", onAccepted);

    return () => {
      socket.off("task_request_sent", onRequestSent);
      socket.off("task_accepted", onAccepted);
    };
  }, [socket]);

  const handleAction = (task, action) => {
    setConfirmModal({ task, action });
  };

  const handleConfirm = () => {
    const { task, action } = confirmModal;

    // Emit to server
    if (socket && user) {
      socket.emit("task_request", {
        task,
        hotspotId: hotspot.id || hotspot._id,
        hotspotName: hotspot.name,
        action,
        userId: user.id,
        username: user.username,
      });
    }

    // Remove from list
    setRemovingId(task.id);
    setConfirmModal(null);
    setTimeout(() => {
      setVisibleTasks((prev) => prev.filter((t) => t.id !== task.id));
      setRemovingId(null);
      setSelectedTask(null);
    }, 300);
  };

  const handleCancel = () => {
    setConfirmModal(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-4 py-4 bg-surface border-b border-border flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base-darker transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
        <h1 className="font-pixel text-[11px] text-text-primary truncate">
          {hotspot.name}
        </h1>
      </header>

      {/* Waiting for match banner */}
      {waitingForMatch && (
        <div className="px-4 py-3 bg-accent/10 border-b border-accent/20 text-center">
          <p className="text-sm text-accent font-medium animate-pulse">
            Looking for someone nearby...
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
        {visibleTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-base-darker flex items-center justify-center mb-4">
              <CompassIcon className="w-8 h-8 text-text-muted" />
            </div>
            <p className="font-pixel text-[10px] text-text-primary mb-1">
              No tasks left
            </p>
            <p className="text-xs text-text-muted">
              Check back soon or try another hotspot
            </p>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTask === task.id}
              isRemoving={removingId === task.id}
              onSelect={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
              onAction={(action) => handleAction(task, action)}
            />
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          task={confirmModal.task}
          action={confirmModal.action}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

function TaskCard({ task, isSelected, isRemoving, onSelect, onAction }) {
  const color = CATEGORY_COLORS[task.category] || CATEGORY_COLORS["kindness"];

  return (
    <div
      className={`bg-surface rounded-2xl border border-border shadow-warm-sm p-4 transition-all duration-300 ${
        isRemoving ? "opacity-0 translate-x-full" : ""
      }`}
    >
      {/* Category pill */}
      <div className="flex items-center gap-2 mb-2">
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

      {/* Title — tappable */}
      <button
        onClick={onSelect}
        className="w-full text-left"
      >
        <h3 className="text-sm font-medium text-text-primary leading-snug">
          {task.title}
        </h3>
      </button>

      {/* Request / Offer buttons — shown when selected */}
      {isSelected && (
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => onAction("request")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] bg-accent text-text-on-accent"
          >
            Request
          </button>
          <button
            onClick={() => onAction("offer")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] border-2 border-accent text-accent"
          >
            Offer
          </button>
        </div>
      )}
    </div>
  );
}

function ConfirmModal({ task, action, onConfirm, onCancel }) {
  const isRequest = action === "request";
  const color = CATEGORY_COLORS[task.category] || CATEGORY_COLORS["kindness"];

  return (
    <>
      <div
        className="fixed inset-0 bg-text-primary/30 z-50"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl p-6 shadow-warm max-w-sm w-full animate-fade-in">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: color + "18" }}
          >
            <span className="text-2xl">{isRequest ? "🙋" : "🤝"}</span>
          </div>
          <h3 className="font-pixel text-[12px] text-text-primary text-center mb-2">
            {isRequest ? "Request this task?" : "Offer to help?"}
          </h3>
          <p className="text-text-secondary text-sm text-center mb-1">
            {task.title}
          </p>
          <p className="text-text-muted text-xs text-center mb-6">
            {isRequest
              ? "We'll find someone nearby to help you out."
              : "We'll match you with someone who needs this."}
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
              className="flex-1 py-3 bg-accent text-text-on-accent rounded-xl font-semibold transition-all active:scale-95"
            >
              {isRequest ? "Request" : "Offer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
