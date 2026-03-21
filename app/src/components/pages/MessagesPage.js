"use client";

import { useState } from "react";
import { conversations, chatMessages, currentUser } from "@/lib/mockData";
import { LockIcon, ArrowLeftIcon } from "@/components/icons";
import ChatView from "@/components/ChatView";

export default function MessagesPage() {
  const [activeSection, setActiveSection] = useState("needs");
  const [selectedConversation, setSelectedConversation] = useState(null);

  const currentConversations = activeSection === "needs" 
    ? conversations.needs 
    : conversations.fulfillments;

  if (selectedConversation) {
    const messages = chatMessages[selectedConversation.id] || [];
    const isRecipient = activeSection === "needs"; // If in "needs", current user is the recipient
    
    return (
      <ChatView
        conversation={selectedConversation}
        messages={messages}
        currentUserId={currentUser.id}
        isRecipient={isRecipient}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 bg-surface border-b border-border">
        <h1 className="font-pixel text-[12px] text-text-primary mb-4">Messages</h1>
        
        {/* Tab Switcher */}
        <div className="flex bg-base rounded-xl p-1">
          <button
            onClick={() => setActiveSection("needs")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeSection === "needs"
                ? "bg-surface text-accent shadow-warm-sm"
                : "text-text-muted"
            }`}
          >
            Needs
          </button>
          <button
            onClick={() => setActiveSection("fulfillments")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeSection === "fulfillments"
                ? "bg-surface text-accent shadow-warm-sm"
                : "text-text-muted"
            }`}
          >
            Fulfillments
          </button>
        </div>
      </header>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {currentConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="text-text-muted">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {currentConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                onClick={() => setSelectedConversation(conv)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation, onClick }) {
  const { questTitle, otherUser, lastMessage, timestamp, isLocked } = conversation;
  
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m ago`;
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-start gap-3 hover:bg-base-darker transition-colors text-left"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-text-on-accent font-semibold text-lg shrink-0">
        {otherUser.username.charAt(0).toUpperCase()}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-text-primary truncate">
            {otherUser.username}
          </span>
          <span className="text-xs text-text-muted shrink-0 ml-2">
            {formatTime(timestamp)}
          </span>
        </div>
        <p className="text-sm text-accent font-medium mb-1">{questTitle}</p>
        <div className="flex items-center gap-2">
          {isLocked && <LockIcon className="w-3 h-3 text-text-muted shrink-0" />}
          <p className={`text-sm truncate ${isLocked ? "text-text-muted" : "text-text-secondary"}`}>
            {lastMessage}
          </p>
        </div>
      </div>
    </button>
  );
}
