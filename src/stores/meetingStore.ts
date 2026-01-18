import { create } from 'zustand';
import { Meeting } from '../types';

interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  isLoading: boolean;
  fetchMeetings: () => Promise<void>;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  createMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
}

const mockMeetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Initial Consultation - Priya Mehta',
    leadId: 'l1',
    scheduledDate: '2026-01-20T10:00:00Z',
    duration: 60,
    location: 'Office',
    attendees: ['Priya Mehta', 'Rajesh Kumar'],
    status: 'scheduled',
    createdAt: '2026-01-17T00:00:00Z',
    updatedAt: '2026-01-17T00:00:00Z',
  },
  {
    id: 'm2',
    title: 'Site Visit - Kumar Residence',
    projectId: '1',
    customerId: 'c1',
    scheduledDate: '2026-01-19T14:00:00Z',
    duration: 120,
    location: 'HSR Layout Site',
    attendees: ['Mr. Kumar', 'Site Engineer'],
    status: 'scheduled',
    createdAt: '2026-01-16T00:00:00Z',
    updatedAt: '2026-01-16T00:00:00Z',
  },
];

export const useMeetingStore = create<MeetingState>((set) => ({
  meetings: mockMeetings,
  currentMeeting: null,
  isLoading: false,

  fetchMeetings: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ meetings: mockMeetings, isLoading: false });
  },

  setCurrentMeeting: (meeting: Meeting | null) => {
    set({ currentMeeting: meeting });
  },

  createMeeting: async (meetingData) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: `m${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      meetings: [...state.meetings, newMeeting],
    }));
  },

  updateMeeting: async (id: string, updates: Partial<Meeting>) => {
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      ),
      currentMeeting:
        state.currentMeeting?.id === id
          ? { ...state.currentMeeting, ...updates, updatedAt: new Date().toISOString() }
          : state.currentMeeting,
    }));
  },
}));
