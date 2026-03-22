"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import useSocket from "@/lib/useSocket";
import { sendMessage as apiSendMessage } from "@/lib/api";
import HappinessRatingModal from "./HappinessRatingModal";
import { ArrowLeftIcon, SendIcon, LockIcon } from "./icons";

export default function ChatView({
  conversation,
  messages: initialMessages,
  currentUserId,
  isRecipient,
  onBack,
}) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [newMessage, setNewMessage] = useState("");
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [ratingQuest, setRatingQuest] = useState(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const { user, token } = useAuth();
  const { socket } = useSocket(user);

  const { otherUser, questTitle, isLocked, questId } = conversation;
  const conversationId = conversation.id;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync initial messages
  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !conversationId) return;

    const onNewMessage = (data) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    };

    socket.on("new_message", onNewMessage);
    return () => socket.off("new_message", onNewMessage);
  }, [socket, conversationId]);

  // Mark as read on open and when new messages arrive
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit("mark_read", { conversationId });
  }, [socket, conversationId, messages.length]);

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      const text = newMessage.trim();
      if (!text || isLocked || sending) return;

      setSending(true);
      setNewMessage("");

      if (socket) {
        socket.emit("chat_message", { conversationId, text });
      } else if (token) {
        try {
          await apiSendMessage(conversationId, text, token);
        } catch (err) {
          console.error("Failed to send message:", err);
        }
      }
      setSending(false);

      if (inputRef.current) inputRef.current.focus();
    },
    [newMessage, isLocked, sending, socket, conversationId, token]
  );

  const handleDoneClick = () => {
    setShowDoneConfirm(true);
  };

  const handleDoneConfirm = () => {
    setShowDoneConfirm(false);
    setRatingQuest({
      id: questId,
      _id: questId,
      title: questTitle,
      coin_reward: conversation.coinReward || 0,
    });
  };

  const handleRatingSubmit = ({ questId: qId, happinessRating }) => {
    if (!socket) return;
    socket.emit("complete_quest", {
      questId: qId,
      happinessRating,
      recipientId: currentUserId,
      conversationId,
    });
    setRatingQuest(null);
    onBack();
  };

  const handleRatingCancel = () => {
    setRatingQuest(null);
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date
      : typeof date === "number" ? new Date(date)
      : new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-base">
      {/* Header */}
      <header className="shrink-0 bg-surface border-b border-border px-4 py-3 flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-base transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">
            {otherUser.username}
          </p>
          <p className="text-xs text-accent">{questTitle}</p>
        </div>

        {isRecipient && !isLocked && (
          <button
            onClick={handleDoneClick}
            className="min-h-[2.5rem] px-4 bg-accent text-text-on-accent text-sm font-semibold rounded-lg shadow-warm-sm transition-transform active:scale-95"
          >
            Done
          </button>
        )}
      </header>

      {/* Chat input — ABOVE messages so it's always visible and never clipped */}
      {!isLocked && (
        <form
          onSubmit={handleSend}
          className="shrink-0 bg-surface border-b border-border flex items-center gap-2 px-3 py-2"
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 min-h-[44px] px-4 py-3 bg-base rounded-full border-2 border-border text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-accent text-text-on-accent rounded-full transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-warm-sm"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      )}

      {isLocked && (
        <div className="shrink-0 px-4 py-3 bg-base-darker border-b border-border flex items-center justify-center gap-2 text-text-muted">
          <LockIcon className="w-4 h-4" />
          <span className="text-sm">This conversation is complete</span>
        </div>
      )}

      {/* Messages — scrollable area fills remaining space below input */}
      <div
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4"
        ref={scrollRef}
      >
        {messages.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = String(msg.senderId) === String(currentUserId);
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-5 py-3 rounded-2xl ${
                  isMine
                    ? "bg-accent text-text-on-accent rounded-br-md"
                    : "bg-surface border border-border text-text-primary rounded-bl-md"
                }`}
              >
                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap [word-break:break-word]">
                  {msg.text}
                </p>
                <p
                  className={`text-[11px] mt-1.5 ${
                    isMine ? "text-text-on-accent/70" : "text-text-muted"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Done confirmation */}
      {showDoneConfirm && (
        <DoneConfirmModal
          onConfirm={handleDoneConfirm}
          onCancel={() => setShowDoneConfirm(false)}
        />
      )}

      {/* Happiness rating after Done */}
      <HappinessRatingModal
        quest={ratingQuest}
        isOpen={!!ratingQuest}
        onSubmit={handleRatingSubmit}
        onCancel={handleRatingCancel}
      />
    </div>
  );
}

function DoneConfirmModal({ onConfirm, onCancel }) {
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
      <div className="modal-center z-50">
        <div className="bg-surface rounded-2xl p-6 shadow-warm max-w-sm w-full animate-fade-in">
          <h3 className="font-heading text-base text-text-primary text-center mb-2">
            Mark as Done?
          </h3>
          <p className="text-text-secondary text-sm text-center mb-6">
            This will complete the quest and you&apos;ll rate your experience.
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
              Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
