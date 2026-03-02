import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  FileText,
  Users,
  Send,
  Trash2,
  Edit3,
  Check,
  X,
  Clock,
  Circle,
  Radio,
  ArrowLeft,
  Waves,
  CheckSquare,
  Plus,
  GripVertical,
  WifiOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useMeetingRoomStore } from "../../stores/meetingRoomStore";
import { useMeetingRecording } from "../../hooks/useMeetingRecording";
import Logo from "../../components/shared/Logo";
import { PageLoader, Spinner } from "../../components/ui";

// Speaker colors matching the website theme
const speakerColors = [
  {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    gradient: "from-rose-500 to-rose-600",
  },
  {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    dot: "bg-cyan-500",
    gradient: "from-cyan-500 to-cyan-600",
  },
];

export const MeetingRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const meetingIdFromState = (location.state as { meetingId?: string })
    ?.meetingId;

  const [activeTab, setActiveTab] = useState<"transcript" | "notes">(
    "transcript",
  );
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [newCheckpoint, setNewCheckpoint] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Recording indicator state
  const [showRecordingIndicator, setShowRecordingIndicator] = useState(false);
  const [isTranscriptionProcessing, setIsTranscriptionProcessing] =
    useState(false);

  // ─── Store (API-driven state) ────────────────────────────────────────
  const {
    isInMeeting,
    meetingTitle,
    meetingStartTime,
    isTranscribing,
    participants,
    notes,
    discussionPoints,
    isLoading: storeLoading,
    error: storeError,
    startMeeting,
    loadMeetingData,
    endMeeting,
    toggleTranscription,
    addNote,
    deleteNote,
    updateNote,
    toggleDiscussionPoint,
    addDiscussionPoint,
    removeDiscussionPoint,
    setTranscripts: setStoreTranscripts,
    clearError,
  } = useMeetingRoomStore();

  // ─── Recording hook (WebSocket + microphone) ─────────────────────────
  const {
    isRecording,
    connectionState,
    transcripts: liveTranscripts,
    summary,
    processingStage,
    audioLevel,
    error: recordingError,
    isMuted,
    formattedDuration,
    startRecording,
    stopRecording,
    toggleMute,
  } = useMeetingRecording(meetingIdFromState || null);

  // Sync live transcripts to the store so they persist
  useEffect(() => {
    if (liveTranscripts.length > 0) {
      setStoreTranscripts(
        liveTranscripts.map((t) => ({
          id: t.id,
          speaker: t.speaker,
          speakerId: t.speakerId,
          text: t.text,
          timestamp: t.timestamp,
          isFinal: t.isFinal,
        })),
      );
    }
  }, [liveTranscripts, setStoreTranscripts]);

  // Use live transcripts from the recording hook (they have interim + final)
  const transcripts = liveTranscripts;

  // Track transcription processing state
  useEffect(() => {
    if (processingStage === "transcribing" || processingStage === "analyzing") {
      setIsTranscriptionProcessing(true);
    } else {
      setIsTranscriptionProcessing(false);
    }
  }, [processingStage]);

  // ─── Elapsed time (from meetingStartTime) ────────────────────────────
  const [elapsedTime, setElapsedTime] = useState("00:00");

  useEffect(() => {
    if (!meetingStartTime) return;
    const interval = setInterval(() => {
      const diff = Date.now() - meetingStartTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      if (hours > 0) {
        setElapsedTime(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      } else {
        setElapsedTime(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [meetingStartTime]);

  // ─── Initialize meeting on mount ─────────────────────────────────────
  useEffect(() => {
    const initMeeting = async () => {
      if (!isInMeeting && meetingIdFromState) {
        // Load real meeting data from API
        await loadMeetingData(meetingIdFromState);
        startMeeting("", meetingIdFromState); // Title will be set by loadMeetingData
      } else if (!isInMeeting && !meetingIdFromState) {
        // No meeting ID — redirect back
        navigate("/dashboard/meetings");
      }
    };
    initMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
      // Show recording indicator for 2 seconds
      setShowRecordingIndicator(true);
      setTimeout(() => {
        setShowRecordingIndicator(false);
      }, 2000);
    }
  };

  const handleEndMeeting = async () => {
    const currentId = meetingIdFromState;
    if (isRecording) {
      stopRecording();
    }
    await endMeeting();
    // Navigate to meeting details so user can see transcript once it's ready
    if (currentId) {
      navigate(`/dashboard/meetings/${currentId}`);
    } else {
      navigate("/dashboard/meetings");
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      await addNote(newNote.trim());
      setNewNote("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const handleSaveEdit = async () => {
    if (editingNoteId && editingNoteContent.trim()) {
      await updateNote(editingNoteId, editingNoteContent.trim());
      setEditingNoteId(null);
      setEditingNoteContent("");
    }
  };

  const handleAddCheckpoint = () => {
    if (newCheckpoint.trim()) {
      addDiscussionPoint(newCheckpoint.trim());
      setNewCheckpoint("");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine the active speaker from the latest transcript
  const lastTranscript = transcripts[transcripts.length - 1];
  const activeSpeakerId = lastTranscript?.speakerId ?? 0;

  // Connection status indicator
  const connectionBadge = () => {
    switch (connectionState) {
      case "connected":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 text-xs font-medium">Live</span>
          </div>
        );
      case "connecting":
      case "reconnecting":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full">
            <Loader2 className="w-3 h-3 text-yellow-600 animate-spin" />
            <span className="text-yellow-600 text-xs font-medium">
              {connectionState === "connecting"
                ? "Connecting..."
                : "Reconnecting..."}
            </span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
            <WifiOff className="w-3 h-3 text-red-500" />
            <span className="text-red-600 text-xs font-medium">
              Disconnected
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-500 text-xs font-medium">Idle</span>
          </div>
        );
    }
  };

  // Error display
  const activeError = recordingError || storeError;

  // ─── Loading State ───────────────────────────────────────────────────
  if (storeLoading) {
    return <PageLoader message="Loading meeting..." />;
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-[60]">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/meetings")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-gray-200" />
          <Logo className="h-8" />
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <h1 className="text-gray-900 font-semibold text-sm">
              {meetingTitle || "Voice Meeting"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {participants.length} participant
                {participants.length !== 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isRecording ? formattedDuration : elapsedTime}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-600 text-xs font-medium">
                Recording
              </span>
            </div>
          )}
          {processingStage && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
              <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
              <span className="text-blue-600 text-xs font-medium capitalize">
                {processingStage}...
              </span>
            </div>
          )}
          {connectionBadge()}
        </div>
      </header>

      {/* Error Banner */}
      {activeError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{activeError}</p>
          <button
            onClick={() => clearError()}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Discussion Points (from API) */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-orange-600" />
                Discussion Points
              </h2>
              <div className="text-xs text-gray-500">
                {discussionPoints.filter((dp) => dp.checked).length}/
                {discussionPoints.length}
              </div>
            </div>
            <p className="text-xs text-gray-600">Track discussion topics</p>
          </div>

          {/* Discussion Points List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {discussionPoints.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  No discussion points yet
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Add topics to discuss
                </p>
              </div>
            ) : (
              discussionPoints.map((point, index) => (
                <div
                  key={point.key}
                  className={`group relative bg-gray-50 rounded-lg border transition-all ${
                    point.checked
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <div className="pt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <button
                      onClick={() => toggleDiscussionPoint(point.key)}
                      className="pt-0.5 flex-shrink-0"
                    >
                      {point.checked ? (
                        <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-relaxed ${
                          point.checked
                            ? "text-gray-500 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {point.label}
                      </p>
                      {point.notes && (
                        <p className="text-xs text-gray-400 mt-1">
                          {point.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeDiscussionPoint(point.key)}
                      className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600">
                      {index + 1}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Discussion Point */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCheckpoint}
                onChange={(e) => setNewCheckpoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddCheckpoint();
                  }
                }}
                placeholder="Add discussion point..."
                className="flex-1 bg-white text-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
              />
              <button
                onClick={handleAddCheckpoint}
                disabled={!newCheckpoint.trim()}
                className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to add quickly
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-4 pb-4 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Progress</span>
              <span className="font-semibold">
                {discussionPoints.length > 0
                  ? Math.round(
                      (discussionPoints.filter((dp) => dp.checked).length /
                        discussionPoints.length) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                style={{
                  width: `${
                    discussionPoints.length > 0
                      ? (discussionPoints.filter((dp) => dp.checked).length /
                          discussionPoints.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Voice Participants Grid */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              {/* Active Speaker Card */}
              <div className="mb-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div
                          className={`w-32 h-32 rounded-full bg-gradient-to-br ${
                            speakerColors[
                              activeSpeakerId % speakerColors.length
                            ].gradient
                          } flex items-center justify-center text-white text-4xl font-bold shadow-lg`}
                        >
                          {(
                            lastTranscript?.speaker ||
                            participants[0]?.name ||
                            "U"
                          )
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>

                        {/* Audio Level Rings */}
                        {isRecording && audioLevel > 0.05 && (
                          <>
                            <div
                              className="absolute inset-0 rounded-full border-4 border-orange-200 animate-ping opacity-20"
                              style={{
                                margin: `-${Math.max(8, audioLevel * 40)}px`,
                                width: `calc(100% + ${Math.max(16, audioLevel * 80)}px)`,
                                height: `calc(100% + ${Math.max(16, audioLevel * 80)}px)`,
                              }}
                            />
                            <div
                              className="absolute inset-0 rounded-full border-4 border-orange-100 animate-ping opacity-10"
                              style={{
                                animationDelay: "0.2s",
                                margin: `-${Math.max(16, audioLevel * 60)}px`,
                                width: `calc(100% + ${Math.max(32, audioLevel * 120)}px)`,
                                height: `calc(100% + ${Math.max(32, audioLevel * 120)}px)`,
                              }}
                            />
                          </>
                        )}

                        {/* Status Badge */}
                        <div
                          className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow ${
                            isRecording
                              ? "bg-emerald-500"
                              : isMuted
                                ? "bg-red-500"
                                : "bg-gray-400"
                          }`}
                        >
                          {isRecording ? (
                            <Waves className="w-4 h-4 text-white" />
                          ) : isMuted ? (
                            <MicOff className="w-4 h-4 text-white" />
                          ) : (
                            <Mic className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>

                      <h3 className="mt-6 text-xl font-semibold text-gray-900">
                        {lastTranscript?.speaker ||
                          participants[0]?.name ||
                          "You"}
                      </h3>
                      <p
                        className={`text-sm font-medium mt-1 flex items-center justify-center gap-1 ${
                          isRecording ? "text-emerald-600" : "text-gray-500"
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <Radio className="w-3 h-3" />
                            {isMuted ? "Muted" : "Currently Speaking"}
                          </>
                        ) : (
                          "Ready to record"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recording Indicator Toast */}
              {showRecordingIndicator && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                      <Radio className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Recording Started!</p>
                      <p className="text-emerald-100 text-sm">
                        You can start speaking now
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Participants Grid (from API) */}
              {participants.length > 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {participants.map((participant, index) => {
                    const colorSet =
                      speakerColors[index % speakerColors.length];
                    const isActive =
                      lastTranscript?.speaker === participant.name;

                    return (
                      <div
                        key={participant.id}
                        className={`bg-white rounded-xl border p-4 transition-all ${
                          isActive
                            ? "border-orange-300 shadow-md ring-2 ring-orange-100"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="relative">
                            <div
                              className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorSet.gradient} flex items-center justify-center text-white text-lg font-semibold shadow`}
                            >
                              {participant.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow ${
                                participant.isMuted
                                  ? "bg-red-500"
                                  : isActive
                                    ? "bg-emerald-500"
                                    : "bg-gray-400"
                              }`}
                            >
                              {participant.isMuted ? (
                                <MicOff className="w-3 h-3 text-white" />
                              ) : isActive ? (
                                <Waves className="w-3 h-3 text-white" />
                              ) : (
                                <Mic className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <h4 className="mt-3 font-medium text-gray-900 text-sm truncate w-full">
                            {participant.name}
                          </h4>
                          <p
                            className={`text-xs mt-0.5 ${
                              isActive
                                ? "text-emerald-600"
                                : participant.isMuted
                                  ? "text-red-500"
                                  : "text-gray-500"
                            }`}
                          >
                            {participant.role === "HOST" && "(Host) "}
                            {isActive
                              ? "Speaking"
                              : participant.isMuted
                                ? "Muted"
                                : "Connected"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Transcription Preview */}
              {isTranscribing && transcripts.length > 0 && (
                <div className="mt-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          speakerColors[
                            (lastTranscript?.speakerId ?? 0) %
                              speakerColors.length
                          ]?.dot || "bg-orange-500"
                        } animate-pulse`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            speakerColors[
                              (lastTranscript?.speakerId ?? 0) %
                                speakerColors.length
                            ]?.text || "text-orange-700"
                          }`}
                        >
                          {lastTranscript?.speaker}
                        </p>
                        <p
                          className={`text-gray-700 mt-1 text-sm leading-relaxed ${
                            !lastTranscript?.isFinal ? "italic opacity-70" : ""
                          }`}
                        >
                          {lastTranscript?.text}
                          {!lastTranscript?.isFinal && (
                            <span className="inline-block w-1.5 h-4 bg-orange-500 ml-0.5 animate-pulse" />
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {lastTranscript
                          ? formatTime(lastTranscript.timestamp)
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Summary Card (shown after meeting processing) */}
              {summary && (
                <div className="mt-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      AI Meeting Summary
                    </h3>
                    <p className="text-blue-800 text-sm leading-relaxed mb-4">
                      {summary.summary}
                    </p>
                    {summary.keyPoints.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                          Key Points
                        </h4>
                        <ul className="space-y-1">
                          {summary.keyPoints.map((point: any, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-blue-800 flex items-start gap-2"
                            >
                              <span className="text-blue-400 mt-1">•</span>
                              {typeof point === "string"
                                ? point
                                : point?.text ||
                                  point?.point ||
                                  JSON.stringify(point)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {summary.actionItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                          Action Items
                        </h4>
                        <ul className="space-y-1">
                          {summary.actionItems.map((item: any, i: number) => {
                            const text =
                              typeof item === "string"
                                ? item
                                : item?.task ||
                                  item?.text ||
                                  item?.action ||
                                  JSON.stringify(item);
                            return (
                              <li
                                key={i}
                                className="text-sm text-blue-800 flex items-start gap-2"
                              >
                                <CheckSquare className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                {text}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="max-w-lg mx-auto flex items-center justify-center gap-4">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                disabled={!isRecording}
                className="relative group flex flex-col items-center gap-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    !isRecording
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isMuted
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {isMuted ? "Unmute" : "Mute"}
                </span>
              </button>

              {/* Recording Button */}
              <button
                onClick={handleToggleRecording}
                className="relative group flex flex-col items-center gap-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {connectionState === "connecting" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Circle
                      className={`w-6 h-6 ${isRecording ? "fill-current" : ""}`}
                    />
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {isRecording ? "Stop Rec" : "Record"}
                </span>
              </button>

              {/* Transcription Toggle */}
              <button
                onClick={toggleTranscription}
                className="relative group flex flex-col items-center gap-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    isTranscribing
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Transcript
                </span>
              </button>

              {/* Divider */}
              <div className="w-px h-12 bg-gray-200 mx-2" />

              {/* End Call */}
              <button
                onClick={handleEndMeeting}
                disabled={isTranscriptionProcessing}
                className="relative group flex flex-col items-center gap-1"
                title={
                  isTranscriptionProcessing
                    ? "Please wait while transcription is being processed..."
                    : "End the meeting"
                }
              >
                <div
                  className={`w-20 h-14 rounded-2xl text-white flex items-center justify-center transition-all shadow-sm ${
                    isTranscriptionProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {isTranscriptionProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Phone className="w-6 h-6 rotate-[135deg]" />
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {isTranscriptionProcessing ? "Processing..." : "End Call"}
                </span>
                {/* Tooltip for disabled state */}
                {isTranscriptionProcessing && (
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
                    Transcription processing...
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Notes & Transcript */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("transcript")}
              className={`flex-1 py-4 text-sm font-medium transition-all relative ${
                activeTab === "transcript"
                  ? "text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Transcript
                {transcripts.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs">
                    {transcripts.filter((t) => t.isFinal).length}
                  </span>
                )}
              </div>
              {activeTab === "transcript" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-4 text-sm font-medium transition-all relative ${
                activeTab === "notes"
                  ? "text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
                {notes.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs">
                    {notes.length}
                  </span>
                )}
              </div>
              {activeTab === "notes" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Transcript Tab */}
            {activeTab === "transcript" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Transcription Processing Indicator */}
                {isTranscriptionProcessing && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          Processing transcription...
                        </p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          {processingStage === "transcribing"
                            ? "Converting audio to text"
                            : processingStage === "analyzing"
                              ? "Analyzing conversation"
                              : "Please wait, this may take a few moments"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {transcripts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {isRecording
                        ? "Listening for speech..."
                        : isTranscribing
                          ? "Start recording to see transcripts"
                          : "Transcription is paused"}
                    </p>
                    {!isRecording && (
                      <button
                        onClick={handleToggleRecording}
                        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                      >
                        Start Recording
                      </button>
                    )}
                  </div>
                ) : (
                  transcripts.map((transcript, index) => {
                    const colorSet =
                      speakerColors[
                        transcript.speakerId % speakerColors.length
                      ];
                    const showSpeakerLabel =
                      index === 0 ||
                      transcripts[index - 1].speakerId !== transcript.speakerId;

                    return (
                      <div key={transcript.id}>
                        {showSpeakerLabel && (
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`w-6 h-6 rounded-full bg-gradient-to-br ${colorSet.gradient} flex items-center justify-center`}
                            >
                              <span className="text-white text-xs font-medium">
                                {transcript.speaker
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .substring(0, 2)}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-medium ${colorSet.text}`}
                            >
                              {transcript.speaker}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTime(transcript.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`ml-8 p-3 rounded-lg ${colorSet.bg} border ${colorSet.border} ${
                            !transcript.isFinal ? "opacity-70 italic" : ""
                          }`}
                        >
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {transcript.text}
                            {!transcript.isFinal && (
                              <span className="inline-block w-1 h-3.5 bg-gray-400 ml-0.5 animate-pulse" />
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No notes yet</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Add notes during the meeting
                      </p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="group bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) =>
                                setEditingNoteContent(e.target.value)
                              }
                              className="w-full bg-white text-gray-700 rounded-lg p-3 text-sm resize-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="p-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {note.content}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(note.timestamp)}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditingNoteContent(note.content);
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Input */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddNote();
                        }
                      }}
                      placeholder="Add a note..."
                      className="flex-1 bg-white text-gray-700 rounded-xl px-4 py-3 text-sm resize-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
                      rows={2}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="self-end p-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
