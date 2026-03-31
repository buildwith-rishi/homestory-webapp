import { create } from "zustand";
import * as meetingAPI from "../services/meetingApi";
import type { Meeting, DiscussionPoint } from "../types";

/**
 * =============================================================================
 * MEETING ROOM STORE — Zustand (fully API-driven, no mock data)
 * =============================================================================
 */

export interface TranscriptEntry {
  id: string;
  speaker: string;
  speakerId: number;
  text: string;
  timestamp: Date;
  isFinal?: boolean;
}

export interface MeetingNote {
  id: string;
  content: string;
  timestamp: Date;
}

export interface CompletedMeeting {
  id: string;
  title: string;
  date: Date;
  duration: string;
  participants: string[];
  notes: MeetingNote[];
  transcript: TranscriptEntry[];
  meetingId?: string;
}

interface MeetingRoomState {
  isInMeeting: boolean;
  meetingStartTime: Date | null;
  meetingTitle: string;
  currentMeetingId: string | null;
  currentMeeting: Meeting | null;

  isMuted: boolean;
  isRecording: boolean;
  isTranscribing: boolean;

  participants: Array<{
    id: string;
    name: string;
    role?: string;
    isMuted: boolean;
  }>;

  transcripts: TranscriptEntry[];
  notes: MeetingNote[];
  discussionPoints: DiscussionPoint[];
  completedMeetings: CompletedMeeting[];

  isLoading: boolean;
  error: string | null;

  startMeeting: (title: string, meetingId?: string) => void;
  loadMeetingData: (meetingId: string) => Promise<void>;
  endMeeting: () => Promise<void>;

  toggleMute: () => void;
  toggleRecording: () => Promise<void>;
  toggleTranscription: () => void;

  addTranscript: (
    speaker: string,
    speakerId: number,
    text: string,
    isFinal?: boolean,
  ) => void;
  setTranscripts: (transcripts: TranscriptEntry[]) => void;
  clearTranscripts: () => void;

  addNote: (content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, content: string) => Promise<void>;

  setDiscussionPoints: (points: DiscussionPoint[]) => void;
  toggleDiscussionPoint: (key: string, notes?: string) => Promise<void>;
  addDiscussionPoint: (label: string) => void;
  removeDiscussionPoint: (key: string) => void;

  setCurrentMeeting: (meeting: Meeting | null) => void;
  clearError: () => void;
}

export const useMeetingRoomStore = create<MeetingRoomState>((set, get) => ({
  isInMeeting: false,
  meetingStartTime: null,
  meetingTitle: "",
  currentMeetingId: null,
  currentMeeting: null,

  isMuted: false,
  isRecording: false,
  isTranscribing: true,

  participants: [{ id: "host", name: "You", role: "HOST", isMuted: false }],

  transcripts: [],
  notes: [],
  discussionPoints: [],
  completedMeetings: [],

  isLoading: false,
  error: null,

  startMeeting: (title: string, meetingId?: string) =>
    set({
      isInMeeting: true,
      meetingStartTime: new Date(),
      meetingTitle: title || "New Meeting",
      currentMeetingId: meetingId || null,
      transcripts: [],
      notes: [],
      isMuted: false,
      isRecording: false,
      isTranscribing: true,
      error: null,
    }),

  loadMeetingData: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await meetingAPI.getMeetingById(meetingId);

      const participants: MeetingRoomState["participants"] = meeting.participants
        ? meeting.participants.map((p) => ({
            id: p.id,
            name: p.name,
            role: undefined,
            isMuted: false,
          }))
        : [];

      if (!participants.some((p) => p.name === "You")) {
        participants.unshift({
          id: "host",
          name: "You",
          role: "HOST",
          isMuted: false,
        });
      }

      set({
        currentMeeting: meeting,
        currentMeetingId: meetingId,
        meetingTitle: meeting.title,
        participants,
        discussionPoints: meeting.discussionPoints || [],
        isLoading: false,
      });

      try {
        const notesData = await meetingAPI.getNotes(meetingId);
        set({
          notes: notesData.map((n) => ({
            id: n.id,
            content: n.content,
            timestamp: new Date(n.createdAt),
          })),
        });
      } catch {
        console.warn("Could not load meeting notes");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load meeting";
      set({ isLoading: false, error: message });
    }
  },

  endMeeting: async () => {
    const state = get();
    const meetingId = state.currentMeetingId;

    if (meetingId) {
      try {
        // Just update the meeting status to completed.
        // Audio upload is handled separately by useMeetingRecording hook.
        await meetingAPI.updateMeeting(meetingId, { status: "completed" });
      } catch (error) {
        console.error("Error ending meeting via API:", error);
      }
    }

    const completedMeeting: CompletedMeeting = {
      id: `completed-${Date.now()}`,
      title: state.meetingTitle,
      date: state.meetingStartTime || new Date(),
      duration: calculateDuration(state.meetingStartTime),
      participants: state.participants.map((p) => p.name),
      notes: [...state.notes],
      transcript: [...state.transcripts],
      meetingId: meetingId || undefined,
    };

    set((s) => ({
      isInMeeting: false,
      meetingStartTime: null,
      meetingTitle: "",
      currentMeetingId: null,
      currentMeeting: null,
      isRecording: false,
      isTranscribing: false,
      completedMeetings: [completedMeeting, ...s.completedMeetings],
    }));
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  toggleRecording: async () => {
    const state = get();
    const newRecording = !state.isRecording;
    set({ isRecording: newRecording });

    if (state.currentMeetingId) {
      try {
        if (newRecording) {
          await meetingAPI.startRecording(state.currentMeetingId);
        } else {
          await meetingAPI.endRecording(state.currentMeetingId, {
            audioBase64: "",
            contentType: "audio/webm",
          });
        }
      } catch (error) {
        console.error("Error toggling recording via API:", error);
        set({ isRecording: !newRecording });
      }
    }
  },

  toggleTranscription: () =>
    set((s) => ({ isTranscribing: !s.isTranscribing })),

  addTranscript: (speaker, speakerId, text, isFinal = true) =>
    set((s) => ({
      transcripts: [
        ...s.transcripts,
        {
          id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          speaker,
          speakerId,
          text,
          timestamp: new Date(),
          isFinal,
        },
      ],
    })),

  setTranscripts: (transcripts) => set({ transcripts }),
  clearTranscripts: () => set({ transcripts: [] }),

  addNote: async (content: string) => {
    const state = get();
    const newNote: MeetingNote = {
      id: `note-${Date.now()}`,
      content,
      timestamp: new Date(),
    };
    set((s) => ({ notes: [...s.notes, newNote] }));

    if (state.currentMeetingId) {
      try {
        await meetingAPI.addNote(state.currentMeetingId, {
          content,
          timestamp: Math.floor(newNote.timestamp.getTime() / 1000),
        });
      } catch (error) {
        console.error("Error persisting note:", error);
      }
    }
  },

  deleteNote: async (id: string) => {
    const state = get();
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    if (state.currentMeetingId) {
      try {
        await meetingAPI.deleteNote(state.currentMeetingId, id);
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  },

  updateNote: async (id: string, content: string) => {
    const state = get();
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, content } : n)),
    }));
    if (state.currentMeetingId) {
      try {
        await meetingAPI.updateNote(state.currentMeetingId, id, content);
      } catch (error) {
        console.error("Error updating note:", error);
      }
    }
  },

  setDiscussionPoints: (points) => set({ discussionPoints: points }),

  toggleDiscussionPoint: async (key: string, notes?: string) => {
    const state = get();
    set((s) => ({
      discussionPoints: s.discussionPoints.map((dp) =>
        dp.key === key
          ? { ...dp, checked: !dp.checked, notes: notes || dp.notes }
          : dp,
      ),
    }));

    if (state.currentMeetingId) {
      const point = state.discussionPoints.find((dp) => dp.key === key);
      if (point) {
        try {
          await meetingAPI.updateDiscussionPoint(state.currentMeetingId, key, {
            checked: !point.checked,
            notes,
          });
        } catch (error) {
          console.error("Error updating discussion point:", error);
          set((s) => ({
            discussionPoints: s.discussionPoints.map((dp) =>
              dp.key === key ? { ...dp, checked: point.checked } : dp,
            ),
          }));
        }
      }
    }
  },

  addDiscussionPoint: (label: string) =>
    set((s) => ({
      discussionPoints: [
        ...s.discussionPoints,
        { key: `dp-${Date.now()}`, label, checked: false },
      ],
    })),

  removeDiscussionPoint: (key: string) =>
    set((s) => ({
      discussionPoints: s.discussionPoints.filter((dp) => dp.key !== key),
    })),

  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),
  clearError: () => set({ error: null }),
}));

function calculateDuration(startTime: Date | null): string {
  if (!startTime) return "0 mins";
  const diff = Date.now() - startTime.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""} ${remainingMins} min${remainingMins !== 1 ? "s" : ""}`;
  }
  return `${minutes} min${minutes !== 1 ? "s" : ""}`;
}
