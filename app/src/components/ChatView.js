"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon, SendIcon, LockIcon, CheckIcon } from "./icons";

export default function ChatView({ 
  conversation, 
  messages, 
  currentUserId, 
  isRecipient,
  onBack 
}) {
  const [newMessage, setNewMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  
  const { otherUser, questTitle, isLocked } = conversation;

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLocked) return;
    // Mock send - will be replaced with real API call
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  const handleDone = () => {
    // Mock done action - will be replaced with real API call
    console.log("Marking conversation as done");
    setShowConfirm(false);
    onBack();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-shell bg-base">
      <header className="page-header bg-surface border-b border-border flex items-center gap-2">
        <button 
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:text-text-primary hover:bg-base transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{otherUser.username}</p>
          <p className="text-xs text-accent">{questTitle}</p>
        </div>
        
        {/* Done Button - Only visible to recipient (person who posted the need) */}
        {isRecipient && !isLocked && (
          <button
            onClick={() => setShowConfirm(true)}
            className="min-h-[2.5rem] px-4 bg-accent text-text-on-accent text-sm font-semibold rounded-lg shadow-warm-sm transition-transform active:scale-95"
          >
            Done
          </button>
        )}
      </header>

      {isLocked && (
        <div className="px-4 py-3 bg-base-darker border-b border-border flex items-center justify-center gap-2 text-text-muted">
          <LockIcon className="w-4 h-4" />
          <span className="text-sm">This conversation is locked (older than 3 days)</span>
        </div>
      )}

      <div className="page-scroll scrollbar-hide">
        <div className="page-content space-y-3">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isMine
                    ? "bg-chat-mine text-text-on-accent rounded-br-md"
                    : "bg-chat-theirs text-text-primary rounded-bl-md"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${isMine ? "text-text-on-accent/70" : "text-text-muted"}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      <form 
        onSubmit={handleSend}
        className="page-header bg-surface border-t border-border flex items-center gap-3"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isLocked ? "Chat is locked" : "Type a message..."}
          disabled={isLocked}
          className="flex-1 min-h-[var(--control-height)] px-4 bg-base rounded-xl border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isLocked}
          className="w-11 h-11 bg-accent text-text-on-accent rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>

      {showConfirm && (
        <ConfirmDoneModal 
          onConfirm={handleDone}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

function ConfirmDoneModal({ onConfirm, onCancel }) {
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
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-heading text-base text-text-primary text-center mb-2">
            Mark as Done?
          </h3>
          <p className="text-text-secondary text-sm text-center mb-6">
            This will complete the quest and reward the fulfiller.
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
