"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchNearbyQuests } from "@/lib/api";
import { quests as mockQuests } from "@/lib/mockData";
import useSocket from "@/lib/useSocket";
import QuestCard from "./QuestCard";
import HappinessRatingModal from "./HappinessRatingModal";
import JoyCoinToast from "./JoyCoinToast";
import { ArrowLeftIcon, CompassIcon } from "./icons";

export default function HotspotQuestList({ hotspot, onBack }) {
  const [questsList, setQuestsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingQuest, setCompletingQuest] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [toast, setToast] = useState({ visible: false, coinAmount: 0, category: null });
  const { socket } = useSocket();

  // Fetch quests for this hotspot
  useEffect(() => {
    const hotspotId = hotspot.id || hotspot._id;

    setLoading(true);
    fetchNearbyQuests({ hotspotId, lat: null, lon: null })
      .then((data) => {
        if (data && data.length > 0) {
          setQuestsList(data);
        } else {
          // Fallback to mock quests filtered by hotspot
          setQuestsList(
            mockQuests.filter((q) => q.hotspot_id === hotspotId)
          );
        }
      })
      .catch(() => {
        setQuestsList(
          mockQuests.filter((q) => q.hotspot_id === (hotspot.id || hotspot._id))
        );
      })
      .finally(() => setLoading(false));
  }, [hotspot]);

  // Listen for quest completions from other users
  useEffect(() => {
    if (!socket) return;

    const onQuestCompleted = (data) => {
      const qId = data.quest?.id || data.quest?._id;
      if (!qId) return;
      setQuestsList((prev) =>
        prev.map((q) =>
          (q.id === qId || q._id === qId)
            ? { ...q, completions: (q.completions || 0) + 1 }
            : q
        )
      );
    };

    socket.on("quest_completed", onQuestCompleted);
    return () => socket.off("quest_completed", onQuestCompleted);
  }, [socket]);

  const handleComplete = (quest) => {
    setCompletingQuest(quest);
  };

  const handleRatingSubmit = useCallback(({ questId, happinessRating }) => {
    const quest = completingQuest;
    if (!quest) return;

    // Emit completion via socket
    if (socket) {
      socket.emit("complete_quest", { questId, happinessRating });
    }

    // Close modal
    setCompletingQuest(null);

    // Show toast
    setToast({
      visible: true,
      coinAmount: quest.coin_reward || 0,
      category: quest.category,
    });

    // Animate card removal
    setRemovingId(questId);
    setTimeout(() => {
      setQuestsList((prev) => prev.filter((q) => (q.id || q._id) !== questId));
      setRemovingId(null);
    }, 400);
  }, [completingQuest, socket]);

  const handleRatingCancel = () => {
    setCompletingQuest(null);
  };

  const handleToastDone = useCallback(() => {
    setToast({ visible: false, coinAmount: 0, category: null });
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
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

      {/* Quest list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
        {loading ? (
          // Skeleton cards
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface rounded-2xl border border-border p-4 animate-pulse"
              >
                <div className="flex gap-2 mb-3">
                  <div className="h-4 w-16 bg-base-darker rounded-full" />
                  <div className="h-4 w-10 bg-base-darker rounded-full" />
                </div>
                <div className="h-4 w-3/4 bg-base-darker rounded mb-2" />
                <div className="h-3 w-1/2 bg-base-darker rounded mb-3" />
                <div className="h-10 w-full bg-base-darker rounded-xl" />
              </div>
            ))}
          </>
        ) : questsList.length === 0 ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-base-darker flex items-center justify-center mb-4">
              <CompassIcon className="w-8 h-8 text-text-muted" />
            </div>
            <p className="font-pixel text-[10px] text-text-primary mb-1">
              No quests here yet
            </p>
            <p className="text-xs text-text-muted">
              Check back soon or try another hotspot
            </p>
          </div>
        ) : (
          questsList.map((quest) => {
            const qId = quest.id || quest._id;
            const isRemoving = removingId === qId;
            return (
              <div
                key={qId}
                className={`transition-all duration-400 ${
                  isRemoving ? "animate-slide-right opacity-0" : ""
                }`}
              >
                <QuestCard quest={quest} onComplete={handleComplete} />
              </div>
            );
          })
        )}
      </div>

      {/* Happiness rating modal */}
      <HappinessRatingModal
        quest={completingQuest}
        isOpen={!!completingQuest}
        onSubmit={handleRatingSubmit}
        onCancel={handleRatingCancel}
      />

      {/* JoyCoin toast */}
      <JoyCoinToast
        coinAmount={toast.coinAmount}
        category={toast.category}
        visible={toast.visible}
        onDone={handleToastDone}
      />
    </div>
  );
}
