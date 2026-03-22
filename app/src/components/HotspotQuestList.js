"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [requestModal, setRequestModal] = useState(null);
  const [waitingForMatch, setWaitingForMatch] = useState(false);
  const [questqIds, setQuestqIds] = useState(hotspot?.questq_ids || []);

  const { user } = useAuth();
  const { socket } = useSocket(user);
  const userId = user?.id || user?._id || null;
  const hotspotId = hotspot?.id || hotspot?._id || null;
  const isAtHotspot = user?.hotspot_id && hotspotId && String(user.hotspot_id) === String(hotspotId);

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

  // Keep questq_ids live via socket
  useEffect(() => {
    if (!socket || !hotspotId) return;
    const onHotspotUpdated = (data) => {
      const updatedId = data.hotspot_id || data._id || data.id;
      if (String(updatedId) === String(hotspotId)) {
        setQuestqIds(data.questq_ids || []);
      }
    };
    socket.on("hotspot_updated", onHotspotUpdated);
    return () => socket.off("hotspot_updated", onHotspotUpdated);
  }, [socket, hotspotId]);

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
              String(q.id || q._id || q.quest_id) === String(qId)
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

    const onRequestSent = () => {
      setWaitingForMatch(true);
      setTimeout(() => setWaitingForMatch(false), 3000);
    };

    socket.on("quest_completed", onQuestCompleted);
    socket.on("quest_completion_rejected", onQuestCompletionRejected);
    socket.on("task_request_sent", onRequestSent);

    return () => {
      socket.off("quest_completed", onQuestCompleted);
      socket.off("quest_completion_rejected", onQuestCompletionRejected);
      socket.off("task_request_sent", onRequestSent);
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

  const handleTaskAction = (quest, action) => {
    if (!isAtHotspot) return;
    setRequestModal({ quest, action });
  };

  const handleTaskActionConfirm = (description) => {
    if (!requestModal || !socket || !user || !hotspotId) {
      setRequestModal(null);
      return;
    }

    const quest = requestModal.quest;
    const task = {
      id: String(quest.id || quest._id || quest.quest_id),
      title: quest.title,
      category: quest.category,
      coin_reward: quest.coin_reward || 0,
    };

    socket.emit("task_request", {
      task,
      hotspotId,
      hotspotName: hotspot?.name,
      action: requestModal.action,
      userId,
      description: description || "",
    });

    setRequestModal(null);
  };

  const handleTaskActionCancel = () => {
    setRequestModal(null);
  };

  const handleAcceptQuest = (questId) => {
    if (!socket || !userId || !hotspotId || !isAtHotspot) return;
    socket.emit("quest_queue_accept", { hotspotId, questId, userId });
  };

  const isLoading = questsList === null;
  const displayQuests = Array.isArray(questsList) ? questsList : [];
  const questMap = new Map(displayQuests.map((q) => [String(q.id || q._id), q]));

  // Filter queue entries that have people waiting
  const activeRequests = questqIds.filter((entry) => {
    const recipients = Array.isArray(entry.recipient_ids) ? entry.recipient_ids : [];
    return recipients.length > 0;
  });

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

      {!isAtHotspot && (
        <div className="px-4 py-2 bg-base-darker border-b border-border text-center">
          <p className="text-xs text-text-muted">
            Visit this hotspot to request or accept quests
          </p>
        </div>
      )}

      {waitingForMatch && (
        <div className="px-4 py-3 bg-accent/10 border-b border-accent/20 text-center">
          <p className="text-sm text-accent font-medium animate-pulse">
            Request submitted
          </p>
        </div>
      )}

      <div className="page-scroll scrollbar-hide">
        <div className="page-content space-y-3">
          {completionError && (
            <p className="text-sm text-error text-center">{completionError}</p>
          )}

          {/* Requested Quests Panel */}
          {activeRequests.length > 0 && (
            <div className="card-stack-center">
              <h2 className="font-heading text-sm text-text-primary mb-2">Requested Quests</h2>
              <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
                {activeRequests.map((entry) => {
                  const quest = questMap.get(String(entry.quest_id));
                  const recipients = Array.isArray(entry.recipient_ids) ? entry.recipient_ids : [];
                  const count = recipients.length;

                  return (
                    <div key={entry.quest_id} className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {quest?.title || entry.quest_id}
                        </p>
                        <p className="text-xs text-text-muted">
                          {count} {count === 1 ? "person" : "people"} waiting
                        </p>
                        {recipients.slice(0, 3).map((r, i) => {
                          const desc = typeof r === "object" ? r.description : "";
                          return desc ? (
                            <p key={i} className="text-xs text-text-secondary truncate mt-0.5 italic">
                              &quot;{desc}&quot;
                            </p>
                          ) : null;
                        })}
                      </div>
                      <button
                        onClick={() => handleAcceptQuest(entry.quest_id)}
                        disabled={!isAtHotspot}
                        className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
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
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleTaskAction(quest, "request")}
                        disabled={!isAtHotspot}
                        className="min-h-[2.25rem] rounded-xl text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Request Help
                      </button>
                      <button
                        onClick={() => handleTaskAction(quest, "offer")}
                        disabled={!isAtHotspot}
                        className="min-h-[2.25rem] rounded-xl text-sm font-semibold border border-border text-text-secondary hover:bg-base transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Offer Help
                      </button>
                    </div>
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

      {requestModal && (
        <TaskActionConfirmModal
          quest={requestModal.quest}
          action={requestModal.action}
          onConfirm={handleTaskActionConfirm}
          onCancel={handleTaskActionCancel}
        />
      )}
    </div>
  );
}

function TaskActionConfirmModal({ quest, action, onConfirm, onCancel }) {
  const isRequest = action === "request";
  const [description, setDescription] = useState("");

  return (
    <>
      <div
        className="fixed inset-0 bg-text-primary/30 z-50"
        onClick={onCancel}
      />
      <div className="modal-center z-50">
        <div className="bg-surface rounded-2xl p-6 shadow-warm max-w-sm w-full animate-fade-in">
          <h3 className="font-heading text-base text-text-primary text-center mb-2">
            {isRequest ? "Request this quest?" : "Offer help for this quest?"}
          </h3>
          <p className="text-text-secondary text-sm text-center mb-4">
            {quest.title}
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe who you are and where you are at this hotspot..."
            rows={3}
            className="w-full rounded-xl border border-border bg-base p-3 text-sm text-text-primary placeholder:text-text-muted resize-none mb-4 focus:outline-none focus:border-accent"
          />
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-border rounded-xl text-text-secondary font-medium transition-colors hover:bg-base"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(description)}
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
