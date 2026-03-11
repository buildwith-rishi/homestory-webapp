// Meeting API Service
// Handles all meeting-related API operations

import type {
  Meeting,
  MeetingEntityType,
  MeetingStatus,
  MeetingType,
  Participant,
  MeetingNote,
  DiscussionPoint,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Meeting API Base URL:", API_BASE_URL);

/**
 * =============================================================================
 * TDD TEST SPECIFICATIONS
 * =============================================================================
 *
 * These inline test specifications document the expected behavior before implementation.
 * While we don't have a formal test runner, these serve as our test-first approach.
 *
 * TEST SUITE: Meeting API Service
 *
 * 1. getAuthHeaders()
 *    GIVEN: Valid auth token in localStorage
 *    WHEN: getAuthHeaders() is called
 *    THEN: Should return headers with Authorization Bearer token
 *
 *    GIVEN: No auth token in localStorage
 *    WHEN: getAuthHeaders() is called
 *    THEN: Should return headers without Authorization header
 *
 * 2. handleResponse<T>()
 *    GIVEN: Successful API response (status 200-299)
 *    WHEN: handleResponse() is called
 *    THEN: Should parse and return JSON data
 *
 *    GIVEN: Error API response (status 400+)
 *    WHEN: handleResponse() is called
 *    THEN: Should throw Error with message from response body
 *
 *    GIVEN: Error response with invalid JSON
 *    WHEN: handleResponse() is called
 *    THEN: Should throw Error with status text
 *
 * 3. listMeetings()
 *    GIVEN: Valid auth token
 *    WHEN: listMeetings() is called with no filters
 *    THEN: Should GET /api/meetings and return { meetings: [], total, page, limit }
 *
 *    GIVEN: Valid filters (entityType, entityId, status, dateFrom, dateTo)
 *    WHEN: listMeetings() is called with filters
 *    THEN: Should GET /api/meetings?entityType=LEAD&entityId=123&status=scheduled...
 *
 * 4. getMeetingById()
 *    GIVEN: Valid meeting ID
 *    WHEN: getMeetingById(id) is called
 *    THEN: Should GET /api/meetings/:id and return Meeting with transcript
 *
 *    GIVEN: Invalid meeting ID
 *    WHEN: getMeetingById(id) is called
 *    THEN: Should throw Error "Meeting not found"
 *
 * 5. createMeeting()
 *    GIVEN: Valid meeting data { title, description, entityType, entityId, scheduledAt }
 *    WHEN: createMeeting(data) is called
 *    THEN: Should POST /api/meetings and return created Meeting
 *
 *    GIVEN: Invalid data (missing required fields)
 *    WHEN: createMeeting(data) is called
 *    THEN: Should throw Error with validation message
 *
 * 6. updateMeeting()
 *    GIVEN: Valid meeting ID and update data
 *    WHEN: updateMeeting(id, updates) is called
 *    THEN: Should PUT /api/meetings/:id and return updated Meeting
 *
 *    GIVEN: Invalid meeting ID
 *    WHEN: updateMeeting(id, updates) is called
 *    THEN: Should throw Error "Meeting not found"
 *
 * 7. deleteMeeting()
 *    GIVEN: Valid meeting ID
 *    WHEN: deleteMeeting(id) is called
 *    THEN: Should DELETE /api/meetings/:id and return success message
 *
 *    GIVEN: Invalid meeting ID
 *    WHEN: deleteMeeting(id) is called
 *    THEN: Should throw Error "Meeting not found"
 *
 * 8. getMeetingStatuses()
 *    GIVEN: Valid auth token
 *    WHEN: getMeetingStatuses() is called
 *    THEN: Should GET /api/meetings/statuses and return array of status options
 *
 * 9. addParticipant()
 *    GIVEN: Valid meeting ID and participant data { name, email, phone }
 *    WHEN: addParticipant(meetingId, participantData) is called
 *    THEN: Should POST /api/meetings/:id/participants and return created Participant
 *
 *    GIVEN: Invalid meeting ID
 *    WHEN: addParticipant(meetingId, participantData) is called
 *    THEN: Should throw Error "Meeting not found"
 *
 *    GIVEN: Invalid participant data (missing required fields)
 *    WHEN: addParticipant(meetingId, participantData) is called
 *    THEN: Should throw Error with validation message
 *
 * 10. removeParticipant()
 *     GIVEN: Valid meeting ID and participant ID
 *     WHEN: removeParticipant(meetingId, participantId) is called
 *     THEN: Should DELETE /api/meetings/:id/participants/:participantId and return success message
 *
 *     GIVEN: Invalid meeting ID or participant ID
 *     WHEN: removeParticipant(meetingId, participantId) is called
 *     THEN: Should throw Error "Participant not found"
 *
 * 11. getNotes()
 *     GIVEN: Valid meeting ID
 *     WHEN: getNotes(meetingId) is called
 *     THEN: Should GET /api/meetings/:id/notes and return array of MeetingNote
 *
 *     GIVEN: Invalid meeting ID
 *     WHEN: getNotes(meetingId) is called
 *     THEN: Should throw Error "Meeting not found"
 *
 *     GIVEN: Meeting with no notes
 *     WHEN: getNotes(meetingId) is called
 *     THEN: Should return empty array []
 *
 * 12. addNote()
 *     GIVEN: Valid meeting ID and note data { content, timestamp }
 *     WHEN: addNote(meetingId, noteData) is called
 *     THEN: Should POST /api/meetings/:id/notes with request body and return created MeetingNote
 *
 *     GIVEN: Invalid meeting ID
 *     WHEN: addNote(meetingId, noteData) is called
 *     THEN: Should throw Error "Meeting not found"
 *
 *     GIVEN: Invalid note data (missing content or timestamp)
 *     WHEN: addNote(meetingId, noteData) is called
 *     THEN: Should throw Error with validation message
 *
 * 13. updateNote()
 *     GIVEN: Valid meeting ID, note ID, and content
 *     WHEN: updateNote(meetingId, noteId, content) is called
 *     THEN: Should PUT /api/meetings/:id/notes/:noteId with request body and return updated MeetingNote
 *
 *     GIVEN: Invalid meeting ID or note ID
 *     WHEN: updateNote(meetingId, noteId, content) is called
 *     THEN: Should throw Error "Note not found"
 *
 *     GIVEN: Empty content
 *     WHEN: updateNote(meetingId, noteId, content) is called
 *     THEN: Should throw Error with validation message
 *
 * 14. deleteNote()
 *     GIVEN: Valid meeting ID and note ID
 *     WHEN: deleteNote(meetingId, noteId) is called
 *     THEN: Should DELETE /api/meetings/:id/notes/:noteId and return success message
 *
 *     GIVEN: Invalid meeting ID or note ID
 *     WHEN: deleteNote(meetingId, noteId) is called
 *     THEN: Should throw Error "Note not found"
 *
 * =============================================================================
 * PHASE 4: RECORDING & ADVANCED FEATURES
 * =============================================================================
 *
 * 15. startRecording()
 *     GIVEN: Valid meeting ID
 *     WHEN: startRecording(meetingId) is called
 *     THEN: Should POST /api/meetings/:id/start and return updated Meeting with recording status
 *
 *     GIVEN: Invalid meeting ID
 *     WHEN: startRecording(meetingId) is called
 *     THEN: Should throw Error "Meeting not found"
 *
 *     GIVEN: Meeting already has active recording
 *     WHEN: startRecording(meetingId) is called
 *     THEN: Should throw Error "Recording already in progress"
 *
 * 16. endRecording()
 *     GIVEN: Valid meeting ID and audio data { audioBase64, contentType }
 *     WHEN: endRecording(meetingId, audioData) is called
 *     THEN: Should POST /api/meetings/:id/end with base64 audio and return Meeting with transcript
 *
 *     GIVEN: Invalid meeting ID
 *     WHEN: endRecording(meetingId, audioData) is called
 *     THEN: Should throw Error "Meeting not found"
 *
 *     GIVEN: No active recording for meeting
 *     WHEN: endRecording(meetingId, audioData) is called
 *     THEN: Should throw Error "No active recording found"
 *
 *     GIVEN: Invalid audio data (missing audioBase64 or contentType)
 *     WHEN: endRecording(meetingId, audioData) is called
 *     THEN: Should throw Error with validation message
 *
 * 17. updateSpeakerMap()
 *     GIVEN: Valid meeting ID and speaker map { [speakerId]: speakerName }
 *     WHEN: updateSpeakerMap(meetingId, speakerMap) is called
 *     THEN: Should PUT /api/meetings/:id/speaker-map and return updated Meeting with speaker names
 *
 *     GIVEN: Invalid meeting ID
 *     WHEN: updateSpeakerMap(meetingId, speakerMap) is called
 *     THEN: Should throw Error "Meeting not found"
 *
 *     GIVEN: Empty speaker map
 *     WHEN: updateSpeakerMap(meetingId, speakerMap) is called
 *     THEN: Should throw Error "Speaker map cannot be empty"
 *
 * 18. regenerate()
 *     GIVEN: Valid meeting ID and type "summary"
 *     WHEN: regenerate(meetingId, "summary") is called
 *     THEN: Should POST /api/meetings/:id/regenerate?type=summary and return Meeting with new summary
 *
 *     GIVEN: Valid meeting ID and type "transcription"
 *     WHEN: regenerate(meetingId, "transcription") is called
 *     THEN: Should POST /api/meetings/:id/regenerate?type=transcription and return Meeting with new transcript
 *
 *     GIVEN: Valid meeting ID and type "all"
 *     WHEN: regenerate(meetingId, "all") is called
 *     THEN: Should POST /api/meetings/:id/regenerate?type=all and return Meeting with regenerated content
 *
 *     GIVEN: Invalid meeting ID
 *     WHEN: regenerate(meetingId, type) is called
 *     THEN: Should throw Error "Meeting not found"
 *
 *     GIVEN: Meeting without recording/transcript
 *     WHEN: regenerate(meetingId, type) is called
 *     THEN: Should throw Error "No recording available for regeneration"
 *
 * 19. sendNotifications()
 *     GIVEN: Valid meeting ID
 *     WHEN: sendNotifications(meetingId) is called
 *     THEN: Should POST /api/meetings/:id/notify and return { success: true, message, sentCount }
 *
 *     GIVEN: Invalid meeting ID
 *     WHEN: sendNotifications(meetingId) is called
 *     THEN: Should throw Error "Meeting not found"
 *
 *     GIVEN: Meeting with no participants
 *     WHEN: sendNotifications(meetingId) is called
 *     THEN: Should return { success: true, message: "No participants to notify", sentCount: 0 }
 *
 * =============================================================================
 */

// Request payload for creating meetings
export interface CreateMeetingRequest {
  title: string;
  description?: string;
  entityType: MeetingEntityType;
  entityId?: string; // Optional - meetings can be standalone without entity link
  scheduledAt: string; // ISO 8601 format
  duration?: number;
  location?: string;
  attendees?: string[];
  type?: MeetingType;
  projectId?: string;
  leadId?: string;
  participants?: Array<{ name: string; role?: string; email?: string }>;
  discussionPoints?: Array<{ key: string; label: string; checked: boolean }>;
}

// Request payload for updating meetings
export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  scheduledAt?: string;
  duration?: number;
  location?: string;
  attendees?: string[];
  status?: MeetingStatus;
  recordingUrl?: string;
  leadId?: string;
  projectId?: string;
}

// Request payload for adding participants
export interface AddParticipantRequest {
  userId?: string; // For team members — auto-fills name/email/phone
  name?: string; // Required if no userId (external participant)
  email?: string;
  phone?: string;
  contactId?: string; // Optional link to a CRM contact
}

// Request payload for adding notes
export interface AddNoteRequest {
  content: string;
  timestamp: number; // Timestamp in seconds
}

// Request payload for updating notes
export interface UpdateNoteRequest {
  content: string;
}

// Phase 4: Recording & Advanced Features Request Types

// Request payload for ending recording with audio data
export interface EndRecordingRequest {
  audioBase64: string;
  contentType: string; // e.g., "audio/webm", "audio/mp3", "audio/wav"
}

// Speaker map type for mapping speaker IDs to names
export type SpeakerMap = Record<string, string>;

// Regeneration type options
export type RegenerateType = "summary" | "transcription" | "all";

// Notification response
export interface NotificationResponse {
  success: boolean;
  message: string;
  sentCount: number;
}

// Response types
export interface MeetingsListResponse {
  meetings: Meeting[];
  total: number;
  page: number;
  limit: number;
}

export interface MeetingStatusOption {
  value: MeetingStatus;
  label: string;
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Map a raw API meeting object to our Meeting type.
 * The server returns fields like transcriptJson, transcriptText, etc.
 * We normalize them to our local type while keeping originals.
 */
function mapApiMeetingToMeeting(raw: any): Meeting {
  if (!raw) return raw;
  return {
    ...raw,
    // Map server transcript fields to our local type
    transcription:
      raw.transcriptJson && raw.transcriptJson.length > 0
        ? raw.transcriptJson.map((seg: any, idx: number) => ({
            speaker: seg.speaker || `Speaker ${idx + 1}`,
            text: seg.text || seg.content || "",
            timestamp: seg.timestamp || seg.startTime || 0,
          }))
        : raw.transcription || [],
    // Keep raw fields as well for direct access
    transcriptJson: raw.transcriptJson,
    transcriptText: raw.transcriptText,
    audioUrl: raw.audioUrl,
    // Map summary/actionItems/keyPoints if they exist
    summary: raw.summary || raw.aiAnalysis?.summary || undefined,
    actionItems: raw.actionItems || raw.aiAnalysis?.actionItems || [],
    keyPoints: raw.keyPoints || raw.aiAnalysis?.keyPoints || [],
    // Ensure attendees array exists
    attendees: raw.attendees || [],
    participants: raw.participants || [],
  };
}

/**
 * Unwrap single-meeting API responses.
 * The server wraps single meetings in { meeting: {...} }.
 */
function unwrapMeetingResponse(data: any): Meeting {
  const raw = data?.meeting || data;
  return mapApiMeetingToMeeting(raw);
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

/**
 * List all meetings with optional filters
 * GET /api/meetings
 */
export async function listMeetings(params?: {
  entityType?: MeetingEntityType;
  entityId?: string;
  status?: MeetingStatus;
  dateFrom?: string; // ISO 8601 format
  dateTo?: string; // ISO 8601 format
  page?: number;
  limit?: number;
  search?: string;
}): Promise<MeetingsListResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.entityType)
        queryParams.append("entityType", params.entityType);
      if (params.entityId) queryParams.append("entityId", params.entityId);
      if (params.status) queryParams.append("status", params.status);
      if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
      if (params.dateTo) queryParams.append("dateTo", params.dateTo);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
    }

    const url = `${API_BASE_URL}/api/meetings${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    console.log("Fetching meetings:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<any>(response);
    console.log("Meetings fetched:", data);

    // Normalize each meeting from raw API fields
    const meetings = (data.meetings || []).map(mapApiMeetingToMeeting);

    // Debug: Log first meeting to see what fields we get
    if (meetings.length > 0) {
      console.log("First meeting structure:", {
        id: meetings[0].id,
        title: meetings[0].title,
        scheduledAt: meetings[0].scheduledAt,
        scheduledDate: meetings[0].scheduledDate,
        createdAt: meetings[0].createdAt,
        status: meetings[0].status,
      });
    }

    return {
      meetings,
      total: data.total || meetings.length,
      page: data.page || 1,
      limit: data.limit || meetings.length,
    };
  } catch (error) {
    console.error("Error fetching meetings:", error);
    throw error;
  }
}

/**
 * Get a meeting by ID (includes transcript and AI analysis if available)
 * GET /api/meetings/:id
 */
export async function getMeetingById(id: string): Promise<Meeting> {
  try {
    console.log("Fetching meeting by ID:", id);
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<any>(response);
    const meeting = unwrapMeetingResponse(data);
    console.log("Meeting fetched:", meeting);
    return meeting;
  } catch (error) {
    console.error("Error fetching meeting:", error);
    throw error;
  }
}

/**
 * Create a new meeting
 * POST /api/meetings
 */
export async function createMeeting(
  meeting: CreateMeetingRequest,
): Promise<Meeting> {
  try {
    console.log("Creating meeting:", meeting);
    const response = await fetch(`${API_BASE_URL}/api/meetings`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(meeting),
    });

    const data = await handleResponse<any>(response);
    const newMeeting = unwrapMeetingResponse(data);
    console.log("Meeting created successfully:", newMeeting);
    console.log("Created meeting date fields:", {
      scheduledAt: newMeeting.scheduledAt,
      scheduledDate: newMeeting.scheduledDate,
      createdAt: newMeeting.createdAt,
    });
    return newMeeting;
  } catch (error) {
    console.error("Error creating meeting:", error);
    throw error;
  }
}

/**
 * Update a meeting
 * PUT /api/meetings/:id
 */
export async function updateMeeting(
  id: string,
  updates: UpdateMeetingRequest,
): Promise<Meeting> {
  try {
    console.log("Updating meeting:", id, updates);
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await handleResponse<any>(response);
    const updatedMeeting = unwrapMeetingResponse(data);
    console.log("Meeting updated successfully:", updatedMeeting);
    return updatedMeeting;
  } catch (error) {
    console.error("Error updating meeting:", error);
    throw error;
  }
}

/**
 * Delete a meeting
 * DELETE /api/meetings/:id
 */
export async function deleteMeeting(
  id: string,
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Deleting meeting:", id);
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await handleResponse<{ success: boolean; message: string }>(
      response,
    );
    console.log("Meeting deleted successfully");
    return result;
  } catch (error) {
    console.error("Error deleting meeting:", error);
    throw error;
  }
}

/**
 * Get available meeting statuses
 * GET /api/meetings/statuses
 */
export async function getMeetingStatuses(): Promise<MeetingStatusOption[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/meetings/statuses`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<{ statuses: MeetingStatusOption[] }>(
      response,
    );
    console.log("Meeting statuses fetched:", data.statuses);
    return data.statuses;
  } catch (error) {
    console.error("Error fetching meeting statuses:", error);
    throw error;
  }
}

// Fallback status options when API is unavailable
export const DEFAULT_MEETING_STATUSES: MeetingStatusOption[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/**
 * Add a participant to a meeting
 * POST /api/meetings/:id/participants
 */
export async function addParticipant(
  meetingId: string,
  participantData: AddParticipantRequest,
): Promise<Participant> {
  try {
    console.log("Adding participant to meeting:", meetingId, participantData);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/participants`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(participantData),
      },
    );

    const participant = await handleResponse<Participant>(response);
    console.log("Participant added successfully:", participant);
    return participant;
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
}

/**
 * Remove a participant from a meeting
 * DELETE /api/meetings/:id/participants/:participantId
 */
export async function removeParticipant(
  meetingId: string,
  participantId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Removing participant from meeting:", meetingId, participantId);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/participants/${participantId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    const result = await handleResponse<{
      success: boolean;
      message: string;
    }>(response);
    console.log("Participant removed successfully");
    return result;
  } catch (error) {
    console.error("Error removing participant:", error);
    throw error;
  }
}

/**
 * Get all notes for a meeting
 * GET /api/meetings/:id/notes
 */
export async function getNotes(meetingId: string): Promise<MeetingNote[]> {
  try {
    console.log("Fetching notes for meeting:", meetingId);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/notes`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    const data = await handleResponse<{ notes: MeetingNote[] }>(response);
    console.log("Notes fetched:", data.notes);
    return data.notes;
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }
}

/**
 * Add a note to a meeting
 * POST /api/meetings/:id/notes
 */
export async function addNote(
  meetingId: string,
  noteData: AddNoteRequest,
): Promise<MeetingNote> {
  try {
    console.log("Adding note to meeting:", meetingId, noteData);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/notes`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(noteData),
      },
    );

    const note = await handleResponse<MeetingNote>(response);
    console.log("Note added successfully:", note);
    return note;
  } catch (error) {
    console.error("Error adding note:", error);
    throw error;
  }
}

/**
 * Update a meeting note
 * PUT /api/meetings/:id/notes/:noteId
 */
export async function updateNote(
  meetingId: string,
  noteId: string,
  content: string,
): Promise<MeetingNote> {
  try {
    console.log("Updating note:", meetingId, noteId, content);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/notes/${noteId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content } as UpdateNoteRequest),
      },
    );

    const note = await handleResponse<MeetingNote>(response);
    console.log("Note updated successfully:", note);
    return note;
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
}

/**
 * Delete a meeting note
 * DELETE /api/meetings/:id/notes/:noteId
 */
export async function deleteNote(
  meetingId: string,
  noteId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Deleting note:", meetingId, noteId);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/notes/${noteId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    const result = await handleResponse<{
      success: boolean;
      message: string;
    }>(response);
    console.log("Note deleted successfully");
    return result;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
}

/**
 * =============================================================================
 * PHASE 4: RECORDING & ADVANCED FEATURES IMPLEMENTATION
 * =============================================================================
 */

/**
 * Start recording a meeting
 * POST /api/meetings/:id/start
 */
export async function startRecording(meetingId: string): Promise<Meeting> {
  try {
    console.log("Starting recording for meeting:", meetingId);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/start`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    const data = await handleResponse<any>(response);
    const meeting = unwrapMeetingResponse(data);
    console.log("Recording started successfully:", meeting);
    return meeting;
  } catch (error) {
    console.error("Error starting recording:", error);
    throw error;
  }
}

/**
 * End recording a meeting and upload audio
 * POST /api/meetings/:id/end
 */
export async function endRecording(
  meetingId: string,
  audioData: EndRecordingRequest,
): Promise<Meeting> {
  try {
    console.log("Ending recording for meeting:", meetingId);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/end`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(audioData),
      },
    );

    const data = await handleResponse<any>(response);
    const meeting = unwrapMeetingResponse(data);
    console.log("Recording ended successfully:", meeting);
    return meeting;
  } catch (error) {
    console.error("Error ending recording:", error);
    throw error;
  }
}

/**
 * Update speaker mapping for a meeting transcript
 * PUT /api/meetings/:id/speaker-map
 */
export async function updateSpeakerMap(
  meetingId: string,
  speakerMap: SpeakerMap,
): Promise<Meeting> {
  try {
    console.log("Updating speaker map for meeting:", meetingId, speakerMap);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/speaker-map`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ speakerMap }),
      },
    );

    const data = await handleResponse<any>(response);
    const meeting = unwrapMeetingResponse(data);
    console.log("Speaker map updated successfully:", meeting);
    return meeting;
  } catch (error) {
    console.error("Error updating speaker map:", error);
    throw error;
  }
}

/**
 * Regenerate summary, transcription, or both for a meeting
 * POST /api/meetings/:id/regenerate
 */
export async function regenerate(
  meetingId: string,
  type: RegenerateType,
): Promise<Meeting> {
  try {
    console.log(`Regenerating ${type} for meeting:`, meetingId);

    const queryParams = new URLSearchParams();
    queryParams.append("type", type);

    const url = `${API_BASE_URL}/api/meetings/${meetingId}/regenerate?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<any>(response);
    const meeting = unwrapMeetingResponse(data);
    console.log("Regeneration completed successfully:", meeting);
    return meeting;
  } catch (error) {
    console.error("Error regenerating content:", error);
    throw error;
  }
}

/**
 * Send notifications to meeting participants
 * POST /api/meetings/:id/notify
 */
export async function sendNotifications(
  meetingId: string,
): Promise<NotificationResponse> {
  try {
    console.log("Sending notifications for meeting:", meetingId);
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/notify`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    const result = await handleResponse<NotificationResponse>(response);
    console.log("Notifications sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending notifications:", error);
    throw error;
  }
}

/**
 * Get available meeting types
 * GET /api/meetings/types
 */
export async function getMeetingTypes(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/meetings/types`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<string[]>(response);
    console.log("Meeting types fetched:", data);
    return data;
  } catch (error) {
    console.error("Error fetching meeting types:", error);
    // Return defaults if endpoint not available
    return [
      "CLIENT_INTAKE",
      "DESIGN_PRESENTATION",
      "SITE_VISIT",
      "PROGRESS_REVIEW",
      "HANDOVER",
      "GENERAL",
    ];
  }
}

/**
 * Get discussion point templates for a meeting type
 * GET /api/meetings/discussion-points/:type
 */
export async function getDiscussionPoints(
  meetingType: string,
): Promise<Array<{ key: string; label: string; checked: boolean }>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/discussion-points/${meetingType}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    const data =
      await handleResponse<
        Array<{ key: string; label: string; checked: boolean }>
      >(response);
    console.log("Discussion points fetched:", data);
    return data;
  } catch (error) {
    console.error("Error fetching discussion points:", error);
    return [];
  }
}

/**
 * Update a discussion point during a live meeting
 * PUT /api/meetings/:id/discussion-points/:pointKey
 */
export async function updateDiscussionPoint(
  meetingId: string,
  pointKey: string,
  data: { checked: boolean; notes?: string },
): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/meetings/${meetingId}/discussion-points/${pointKey}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );

    await handleResponse<void>(response);
    console.log("Discussion point updated:", pointKey);
  } catch (error) {
    console.error("Error updating discussion point:", error);
    throw error;
  }
}

/**
 * Import a meeting transcript (Minutes of Meeting)
 * POST /api/meetings/import-transcript (multipart/form-data)
 */
export async function importTranscript(params: {
  title: string;
  description?: string;
  meetingType: string;
  entityType: string;
  scheduledAt: string;
  transcript?: File;
  transcriptText?: string;
  participants?: string;
}): Promise<any> {
  try {
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    formData.append("title", params.title);
    if (params.description) formData.append("description", params.description);
    formData.append("meetingType", params.meetingType);
    formData.append("entityType", params.entityType);
    formData.append("scheduledAt", params.scheduledAt);
    if (params.transcript) formData.append("transcript", params.transcript);
    if (params.transcriptText)
      formData.append("transcriptText", params.transcriptText);
    if (params.participants)
      formData.append("participants", params.participants);

    const response = await fetch(
      `${API_BASE_URL}/api/meetings/import-transcript`,
      {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Import failed: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error importing transcript:", error);
    throw error;
  }
}

// Export all functions as a default object for easier imports
const MeetingAPI = {
  listMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMeetingStatuses,
  addParticipant,
  removeParticipant,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  // Phase 4: Recording & Advanced Features
  startRecording,
  endRecording,
  updateSpeakerMap,
  regenerate,
  sendNotifications,
  // Meeting Types & Discussion Points
  getMeetingTypes,
  getDiscussionPoints,
  updateDiscussionPoint,
  importTranscript,
  DEFAULT_MEETING_STATUSES,
};

export default MeetingAPI;
