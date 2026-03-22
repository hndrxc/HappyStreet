"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchNearbyQuests } from "@/lib/api";
import useSocket from "@/lib/useSocket";
import QuestCard from "./QuestCard";
import HappinessRatingModal from "./HappinessRatingModal";
import JoyCoinToast from "./JoyCoinToast";
import { ArrowLeftIcon, CompassIcon } from "./icons";
import { useAuth } from "@/context/AuthContext";

export default function HotspotQuestList({ hotspot, onBack }) {
  const [questsList, setQuestsList] = useState(null);
  const [completingQuest, setCompletingQuest] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [pendingCompletion, setPendingCompletion] = useState(null);
  const [completionError, setCompletionError] = useState("");
  const [toast, setToast] = useState({ visible: false, coinAmount: 0, category: null });
  const { socket } = useSocket();
  const { user } = useAuth();
  const userId = user?.id || user?._id || null;
  const hotspotId = hotspot?.id || hotspot?._id || null;

  useEffect(() => {
    if (!hotspotId) return;

    let isCancelled = false;
    fetchNearbyQuests({ hotspotId, lat: null, lon: null })
      .then((data) => {
        if (!isCancelled) {
          setQuestsList(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setQuestsList([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [hotspotId]);

  useEffect(() => {
    if (!socket) return;

    const onQuestCompleted = (data) => {
      const qId = data.quest?.id || data.quest?._id;
      if (!qId) return;

      const isPendingQuest = pendingCompletion && String(pendingCompletion.questId) === String(qId);
      const isPendingRecipient =
        userId && data.recipient_id && String(data.recipient_id) === String(userId);

      if (isPendingQuest && isPendingRecipient) {
        setRemovingId(qId);
        setToast({
          visible: true,
          coinAmount: pendingCompletion.coinAmount || 0,
          category: pendingCompletion.category || null,
        });
        setPendingCompletion(null);
        setTimeout(() => {
          setQuestsList((prev) =>
            Array.isArray(prev)
              ? prev.filter((q) => String(q.id || q._id || q.quest_id) !== String(qId))
              : prev
          );
          setRemovingId(null);
        }, 400);
        return;
      }

      setQuestsList((prev) =>
        Array.isArray(prev)
          ? prev.map((q) =>
            (String(q.id || q._id || q.quest_id) === String(qId))
            ? { ...q, completions: (q.completions || 0) + 1 }
            : q
          )
          : prev
      );
    };

    const onQuestCompletionRejected = (data) => {
      if (!pendingCompletion) return;
      if (String(data?.questId) !== String(pendingCompletion.questId)) return;
      setPendingCompletion(null);
      setCompletionError("Could not complete this quest right now. Please try again.");
    };

    socket.on("quest_completed", onQuestCompleted);
    socket.on("quest_completion_rejected", onQuestCompletionRejected);
    return () => {
      socket.off("quest_completed", onQuestCompleted);
      socket.off("quest_completion_rejected", onQuestCompletionRejected);
    };
  }, [socket, pendingCompletion, userId]);

  const handleComplete = (quest) => {
    if (!socket || !userId || !hotspotId) return;

    const questId = quest.id || quest._id || quest.quest_id;
    if (!questId) return;

    setCompletionError("");
    socket.emit("join_quest", { questId, userId, hotspotId });
    setCompletingQuest(quest);
  };

  const handleRatingSubmit = useCallback(({ questId, happinessRating }) => {
    if (!completingQuest || !socket || !userId || !hotspotId) return;

    setCompletionError("");
    setPendingCompletion({
      questId,
      coinAmount: completingQuest.coin_reward || 0,
      category: completingQuest.category,
    });

    socket.emit("complete_quest", {
      questId,
      happinessRating,
      userId,
      hotspotId,
    });
    setCompletingQuest(null);
  }, [completingQuest, socket, userId, hotspotId]);

  const handleRatingCancel = () => {
    setCompletingQuest(null);
  };

  const handleToastDone = useCallback(() => {
    setToast({ visible: false, coinAmount: 0, category: null });
  }, []);

  const isLoading = questsList === null;
  const displayQuests = Array.isArray(questsList) ? questsList : [];

  return (
    <div className="page-shell">
      <header className="page-header bg-surface border-b border-border flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-base-darker transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
        <h1 className="font-heading text-base text-text-primary truncate">
          {hotspot.name}
        </h1>
      </header>

      <div className="page-scroll scrollbar-hide">
        <div className="page-content space-y-3">
          {completionError && (
            <p className="text-sm text-error text-center">{completionError}</p>
          )}

          {isLoading ? (
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
          ) : displayQuests.length === 0 ? (
            <div className="page-center py-16">
              <div className="w-16 h-16 rounded-full bg-base-darker flex items-center justify-center mb-4">
                <CompassIcon className="w-8 h-8 text-text-muted" />
              </div>
              <p className="font-heading text-sm text-text-primary mb-1">
                No quests here yet
              </p>
              <p className="text-sm text-text-muted">
                Check back soon or try another hotspot
              </p>
            </div>
          ) : (
            <div className="card-stack-center space-y-3">
              {displayQuests.map((quest) => {
                const qId = quest.id || quest._id || quest.quest_id;
                const isRemoving = String(removingId) === String(qId);
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
              })}
            </div>
          )}
        </div>
      </div>

      <HappinessRatingModal
        quest={completingQuest}
        isOpen={!!completingQuest}
        onSubmit={handleRatingSubmit}
        onCancel={handleRatingCancel}
      />

      <JoyCoinToast
        coinAmount={toast.coinAmount}
        category={toast.category}
        visible={toast.visible}
        onDone={handleToastDone}
      />
    </div>
  );
}
