import { create } from "zustand";

export interface TranscriptEntry {
  id: string;
  speaker: string;
  speakerId: number;
  text: string;
  timestamp: Date;
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
}

interface MeetingRoomState {
  // Meeting status
  isInMeeting: boolean;
  meetingStartTime: Date | null;
  meetingTitle: string;

  // Controls
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;

  // Participants
  participants: {
    id: string;
    name: string;
    isMuted: boolean;
    isVideoOn: boolean;
  }[];

  // Transcription
  isTranscribing: boolean;
  transcripts: TranscriptEntry[];

  // Notes
  notes: MeetingNote[];

  // Completed meetings history
  completedMeetings: CompletedMeeting[];

  // Actions
  startMeeting: (title: string) => void;
  endMeeting: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => void;
  toggleTranscription: () => void;
  addTranscript: (speaker: string, speakerId: number, text: string) => void;
  addNote: (content: string) => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, content: string) => void;
}

export const useMeetingRoomStore = create<MeetingRoomState>((set, get) => ({
  // Initial state
  isInMeeting: false,
  meetingStartTime: null,
  meetingTitle: "",

  isMuted: false,
  isVideoOn: true,
  isScreenSharing: false,
  isRecording: false,

  participants: [{ id: "1", name: "You", isMuted: false, isVideoOn: true }],

  isTranscribing: true,
  transcripts: [],

  notes: [],

  completedMeetings: [
    {
      id: "completed-1",
      title: "Design Review - Kumar Residence",
      date: new Date("2026-01-18T14:30:00"),
      duration: "1 hr 15 mins",
      participants: ["Priya Kumar", "Design Team"],
      notes: [
        {
          id: "n1",
          content: "Client wants more natural lighting in living room",
          timestamp: new Date("2026-01-18T14:45:00"),
        },
        {
          id: "n2",
          content: "Budget increase approved for premium flooring",
          timestamp: new Date("2026-01-18T15:00:00"),
        },
        {
          id: "n3",
          content: "Follow up on kitchen cabinet samples by Jan 25",
          timestamp: new Date("2026-01-18T15:30:00"),
        },
      ],
      transcript: [
        {
          id: "t1",
          speaker: "Priya Kumar",
          speakerId: 1,
          text: "I really like the open floor plan concept",
          timestamp: new Date("2026-01-18T14:35:00"),
        },
        {
          id: "t2",
          speaker: "You",
          speakerId: 0,
          text: "We can definitely incorporate that with the structural changes",
          timestamp: new Date("2026-01-18T14:35:30"),
        },
      ],
    },
  ],

  // Actions
  startMeeting: (title: string) =>
    set({
      isInMeeting: true,
      meetingStartTime: new Date(),
      meetingTitle: title || "New Meeting",
      transcripts: [],
      notes: [],
      isMuted: false,
      isVideoOn: true,
      isScreenSharing: false,
      isRecording: false,
      isTranscribing: true,
    }),

  endMeeting: () => {
    const state = get();
    const completedMeeting: CompletedMeeting = {
      id: `completed-${Date.now()}`,
      title: state.meetingTitle,
      date: state.meetingStartTime || new Date(),
      duration: calculateDuration(state.meetingStartTime),
      participants: state.participants.map((p) => p.name),
      notes: [...state.notes],
      transcript: [...state.transcripts],
    };

    set((state) => ({
      isInMeeting: false,
      meetingStartTime: null,
      meetingTitle: "",
      completedMeetings: [completedMeeting, ...state.completedMeetings],
    }));
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideo: () => set((state) => ({ isVideoOn: !state.isVideoOn })),
  toggleScreenShare: () =>
    set((state) => ({ isScreenSharing: !state.isScreenSharing })),
  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),
  toggleTranscription: () =>
    set((state) => ({ isTranscribing: !state.isTranscribing })),

  addTranscript: (speaker: string, speakerId: number, text: string) =>
    set((state) => ({
      transcripts: [
        ...state.transcripts,
        {
          id: `transcript-${Date.now()}`,
          speaker,
          speakerId,
          text,
          timestamp: new Date(),
        },
      ],
    })),

  addNote: (content: string) =>
    set((state) => ({
      notes: [
        ...state.notes,
        {
          id: `note-${Date.now()}`,
          content,
          timestamp: new Date(),
        },
      ],
    })),

  deleteNote: (id: string) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    })),

  updateNote: (id: string, content: string) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, content } : note,
      ),
    })),
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
