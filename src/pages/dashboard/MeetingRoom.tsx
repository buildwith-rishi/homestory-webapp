import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useMeetingRoomStore } from "../../stores/meetingRoomStore";
import Logo from "../../components/shared/Logo";

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

// Mock participants for voice call
const voiceParticipants = [
  {
    id: "1",
    name: "You",
    initials: "Y",
    isMuted: false,
    isSpeaking: false,
    isHost: true,
  },
  {
    id: "2",
    name: "Rajesh Sharma",
    initials: "RS",
    isMuted: false,
    isSpeaking: true,
    isHost: false,
  },
  {
    id: "3",
    name: "Priya Kumar",
    initials: "PK",
    isMuted: true,
    isSpeaking: false,
    isHost: false,
  },
  {
    id: "4",
    name: "Amit Patel",
    initials: "AP",
    isMuted: false,
    isSpeaking: false,
    isHost: false,
  },
];

// Mock transcript simulation
const mockTranscripts = [
  {
    speaker: "You",
    speakerId: 0,
    text: "Good morning everyone. Thank you for joining this project discussion meeting.",
  },
  {
    speaker: "Rajesh Sharma",
    speakerId: 1,
    text: "Good morning! I have reviewed the floor plans and have some feedback on the kitchen layout.",
  },
  {
    speaker: "Priya Kumar",
    speakerId: 2,
    text: "That sounds great. I was also thinking we should discuss the lighting fixtures for the living area.",
  },
  {
    speaker: "You",
    speakerId: 0,
    text: "Perfect. Let's start with Rajesh's feedback on the kitchen. Please go ahead.",
  },
  {
    speaker: "Rajesh Sharma",
    speakerId: 1,
    text: "The current layout has the sink facing away from the window. I think we should consider repositioning it for natural light.",
  },
  {
    speaker: "Amit Patel",
    speakerId: 3,
    text: "I agree with that. From an engineering perspective, the plumbing can be adjusted without major issues.",
  },
  {
    speaker: "Priya Kumar",
    speakerId: 2,
    text: "That would also improve the overall aesthetics. Can we also add a small breakfast counter?",
  },
  {
    speaker: "You",
    speakerId: 0,
    text: "Absolutely. I'll update the designs to include both changes. Let me note that down.",
  },
];

export const MeetingRoom: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"transcript" | "notes">(
    "transcript",
  );
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [transcriptIndex, setTranscriptIndex] = useState(0);
  const [activeSpeaker, setActiveSpeaker] = useState(1);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const {
    isInMeeting,
    meetingTitle,
    meetingStartTime,
    isMuted,
    isRecording,
    isTranscribing,
    transcripts,
    notes,
    startMeeting,
    endMeeting,
    toggleMute,
    toggleRecording,
    toggleTranscription,
    addTranscript,
    addNote,
    deleteNote,
    updateNote,
  } = useMeetingRoomStore();

  // Start meeting on mount
  useEffect(() => {
    if (!isInMeeting) {
      startMeeting("Project Discussion - Sharma Residence");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update elapsed time
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

  // Simulate incoming transcripts
  useEffect(() => {
    if (!isTranscribing || transcriptIndex >= mockTranscripts.length) return;

    const timeout = setTimeout(
      () => {
        const transcript = mockTranscripts[transcriptIndex];
        addTranscript(
          transcript.speaker,
          transcript.speakerId,
          transcript.text,
        );
        setActiveSpeaker(transcript.speakerId);
        setTranscriptIndex((prev) => prev + 1);
      },
      4000 + Math.random() * 2000,
    );

    return () => clearTimeout(timeout);
  }, [isTranscribing, transcriptIndex, addTranscript]);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Rotate active speaker for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpeaker((prev) => (prev + 1) % voiceParticipants.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEndMeeting = () => {
    endMeeting();
    navigate("/dashboard/meetings");
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(newNote.trim());
      setNewNote("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editingNoteContent.trim()) {
      updateNote(editingNoteId, editingNoteContent.trim());
      setEditingNoteId(null);
      setEditingNoteContent("");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Header - Matching Dashboard Style */}
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
                {voiceParticipants.length} participants
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {elapsedTime}
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

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 text-xs font-medium">Live</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
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
                          className={`w-32 h-32 rounded-full bg-gradient-to-br ${speakerColors[activeSpeaker % speakerColors.length].gradient} flex items-center justify-center text-white text-4xl font-bold shadow-lg`}
                        >
                          {voiceParticipants[activeSpeaker]?.initials || "U"}
                        </div>

                        {/* Speaking Animation Rings */}
                        <div className="absolute inset-0 -m-2">
                          <div className="w-36 h-36 rounded-full border-4 border-orange-200 animate-ping opacity-20" />
                        </div>
                        <div className="absolute inset-0 -m-4">
                          <div
                            className="w-40 h-40 rounded-full border-4 border-orange-100 animate-ping opacity-10"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>

                        {/* Speaking Indicator */}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow">
                          <Waves className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      <h3 className="mt-6 text-xl font-semibold text-gray-900">
                        {voiceParticipants[activeSpeaker]?.name || "Unknown"}
                      </h3>
                      <p className="text-sm text-emerald-600 font-medium mt-1 flex items-center justify-center gap-1">
                        <Radio className="w-3 h-3" />
                        Currently Speaking
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Participants */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {voiceParticipants.map((participant, index) => {
                  const colorSet = speakerColors[index % speakerColors.length];
                  const isActive = index === activeSpeaker;

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
                            {participant.initials}
                          </div>

                          {/* Muted/Speaking indicator */}
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
                          {participant.isHost && "(Host) "}
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

              {/* Live Transcription Preview */}
              {isTranscribing && transcripts.length > 0 && (
                <div className="mt-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${speakerColors[transcripts[transcripts.length - 1]?.speakerId % speakerColors.length]?.dot || "bg-orange-500"} animate-pulse`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${speakerColors[transcripts[transcripts.length - 1]?.speakerId % speakerColors.length]?.text || "text-orange-700"}`}
                        >
                          {transcripts[transcripts.length - 1]?.speaker}
                        </p>
                        <p className="text-gray-700 mt-1 text-sm leading-relaxed">
                          {transcripts[transcripts.length - 1]?.text}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        Just now
                      </span>
                    </div>
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
                className="relative group flex flex-col items-center gap-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    isMuted
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
                onClick={toggleRecording}
                className="relative group flex flex-col items-center gap-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <Circle
                    className={`w-6 h-6 ${isRecording ? "fill-current" : ""}`}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {isRecording ? "Stop Rec" : "Record"}
                </span>
              </button>

              {/* Transcription Button */}
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

              {/* End Call Button */}
              <button
                onClick={handleEndMeeting}
                className="relative group flex flex-col items-center gap-1"
              >
                <div className="w-20 h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-sm">
                  <Phone className="w-6 h-6 rotate-[135deg]" />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  End Call
                </span>
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
                    {transcripts.length}
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
                {transcripts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {isTranscribing
                        ? "Listening for speech..."
                        : "Transcription is paused"}
                    </p>
                    {!isTranscribing && (
                      <button
                        onClick={toggleTranscription}
                        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                      >
                        Start Transcription
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
                          className={`ml-8 p-3 rounded-lg ${colorSet.bg} border ${colorSet.border}`}
                        >
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {transcript.text}
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
                      onKeyPress={handleKeyPress}
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
