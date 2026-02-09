import { create } from "zustand";
import { Meeting } from "../types";
import * as meetingAPI from "../services/meetingApi";

/**
 * =============================================================================
 * MEETING STORE - TDD SPECIFICATIONS
 * =============================================================================
 *
 * EXPECTED BEHAVIOR WITH REAL API INTEGRATION:
 *
 * 1. fetchMeetings()
 *    GIVEN: User has valid auth token
 *    WHEN: fetchMeetings() is called
 *    THEN: Should call meetingAPI.listMeetings() and update state with meetings
 *    AND: Should set isLoading to true during fetch, false after
 *    AND: Should clear any previous errors
 *
 *    GIVEN: API call fails
 *    WHEN: fetchMeetings() is called
 *    THEN: Should set error state with error message
 *    AND: Should set isLoading to false
 *
 * 2. createMeeting()
 *    GIVEN: Valid meeting data
 *    WHEN: createMeeting(data) is called
 *    THEN: Should call meetingAPI.createMeeting(data)
 *    AND: Should add returned meeting to state
 *    AND: Should clear any previous errors
 *
 *    GIVEN: API call fails (validation error, network error, etc.)
 *    WHEN: createMeeting(data) is called
 *    THEN: Should set error state with error message
 *    AND: Should not modify meetings array
 *    AND: Should throw error for caller to handle
 *
 * 3. updateMeeting()
 *    GIVEN: Valid meeting ID and update data
 *    WHEN: updateMeeting(id, updates) is called
 *    THEN: Should call meetingAPI.updateMeeting(id, updates)
 *    AND: Should update meeting in state with API response
 *    AND: Should update currentMeeting if it matches the ID
 *    AND: Should clear any previous errors
 *
 *    GIVEN: API call fails
 *    WHEN: updateMeeting(id, updates) is called
 *    THEN: Should set error state with error message
 *    AND: Should not modify state
 *    AND: Should throw error for caller to handle
 *
 * 4. deleteMeeting()
 *    GIVEN: Valid meeting ID
 *    WHEN: deleteMeeting(id) is called
 *    THEN: Should call meetingAPI.deleteMeeting(id)
 *    AND: Should remove meeting from state after successful API call
 *    AND: Should clear currentMeeting if it matches the deleted ID
 *    AND: Should clear any previous errors
 *
 *    GIVEN: API call fails
 *    WHEN: deleteMeeting(id) is called
 *    THEN: Should set error state with error message
 *    AND: Should not modify state
 *    AND: Should throw error for caller to handle
 *
 * 5. Error Handling Pattern
 *    - All API calls wrapped in try-catch
 *    - Error state updated with user-friendly messages
 *    - isLoading properly managed in all scenarios
 *    - Errors thrown to allow caller to handle UI feedback
 *
 * =============================================================================
 */

interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  isLoading: boolean;
  error: string | null;
  fetchMeetings: () => Promise<void>;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  createMeeting: (
    meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Meeting>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  meetings: [],
  currentMeeting: null,
  isLoading: false,
  error: null,

  fetchMeetings: async () => {
    set({ isLoading: true, error: null });

    try {
      // Call real API to fetch meetings
      const response = await meetingAPI.listMeetings();

      set({
        meetings: response.meetings,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch meetings";

      set({
        isLoading: false,
        error: errorMessage,
      });

      console.error("Error fetching meetings:", error);
    }
  },

  setCurrentMeeting: (meeting: Meeting | null) => {
    set({ currentMeeting: meeting });
  },

  createMeeting: async (meetingData) => {
    set({ error: null });

    try {
      // Map Meeting fields to CreateMeetingRequest fields
      // Determine entityType and entityId from available fields
      let entityType: "LEAD" | "PROJECT" | "CUSTOMER" = "LEAD";
      let entityId = "";

      if (meetingData.leadId) {
        entityType = "LEAD";
        entityId = meetingData.leadId;
      } else if (meetingData.projectId) {
        entityType = "PROJECT";
        entityId = meetingData.projectId;
      } else if (meetingData.customerId) {
        entityType = "CUSTOMER";
        entityId = meetingData.customerId;
      }
      // If no entityId provided, we'll create a meeting without an entity link
      // The API should handle this case (standalone meeting)

      const createRequest: meetingAPI.CreateMeetingRequest = {
        title: meetingData.title,
        description: meetingData.description,
        entityType,
        entityId: entityId || (undefined as any), // Some APIs accept empty/missing entityId
        scheduledAt: meetingData.scheduledDate,
        duration: meetingData.duration,
        location: meetingData.location,
        attendees: meetingData.attendees,
      };

      // Call real API to create meeting
      const newMeeting = await meetingAPI.createMeeting(createRequest);

      set((state) => ({
        meetings: [...state.meetings, newMeeting],
        error: null,
      }));

      return newMeeting;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create meeting";

      set({ error: errorMessage });
      console.error("Error creating meeting:", error);
      throw error; // Re-throw for caller to handle
    }
  },

  updateMeeting: async (id: string, updates: Partial<Meeting>) => {
    set({ error: null });

    try {
      // Map Meeting updates to UpdateMeetingRequest
      const updateRequest: meetingAPI.UpdateMeetingRequest = {
        title: updates.title,
        description: updates.description,
        scheduledAt: updates.scheduledDate,
        duration: updates.duration,
        location: updates.location,
        attendees: updates.attendees,
        status: updates.status,
        recordingUrl: updates.recordingUrl,
      };

      // Call real API to update meeting
      const updatedMeeting = await meetingAPI.updateMeeting(id, updateRequest);

      set((state) => ({
        meetings: state.meetings.map((m) => (m.id === id ? updatedMeeting : m)),
        currentMeeting:
          state.currentMeeting?.id === id
            ? updatedMeeting
            : state.currentMeeting,
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update meeting";

      set({ error: errorMessage });
      console.error("Error updating meeting:", error);
      throw error; // Re-throw for caller to handle
    }
  },

  deleteMeeting: async (id: string) => {
    set({ error: null });

    try {
      // Call real API to delete meeting
      await meetingAPI.deleteMeeting(id);

      set((state) => ({
        meetings: state.meetings.filter((m) => m.id !== id),
        currentMeeting:
          state.currentMeeting?.id === id ? null : state.currentMeeting,
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete meeting";

      set({ error: errorMessage });
      console.error("Error deleting meeting:", error);
      throw error; // Re-throw for caller to handle
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
