/**
 * =============================================================================
 * MEETING WEBSOCKET SERVICE
 * =============================================================================
 *
 * Manages WebSocket connections for real-time audio streaming and transcription
 * during live meetings. Handles:
 * - WebSocket connection lifecycle (connect, reconnect, disconnect)
 * - Audio binary streaming to server
 * - Real-time transcript event reception
 * - Connection state management
 * - Exponential backoff reconnection
 *
 * Architecture:
 * - Single responsibility: only handles the WebSocket transport layer
 * - Event-driven: emits typed events for the UI layer to consume
 * - Resilient: auto-reconnect with backoff on connection drops
 * =============================================================================
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

// Derive WebSocket URL from API base
function getWebSocketBaseUrl(): string {
  const url = new URL(API_BASE_URL);
  const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${url.host}`;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type WebSocketConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

/** Transcript chunk received from server */
export interface TranscriptEvent {
  type: "transcript";
  speaker: string;
  speakerId?: number;
  text: string;
  isFinal: boolean;
  timestamp?: number;
  confidence?: number;
}

/** Meeting status update from server */
export interface MeetingStatusEvent {
  type: "status";
  status: string;
  message?: string;
}

/** Error event from server */
export interface ServerErrorEvent {
  type: "error";
  message: string;
  code?: string;
}

/** Processing update (e.g. summary generation in progress) */
export interface ProcessingEvent {
  type: "processing";
  stage: "transcribing" | "analyzing" | "summarizing" | "complete";
  progress?: number;
  message?: string;
}

/** Summary result pushed by server after meeting ends */
export interface SummaryEvent {
  type: "summary";
  summary: string;
  actionItems?: string[];
  keyPoints?: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

/** Discussion points update */
export interface DiscussionPointEvent {
  type: "discussion_point";
  key: string;
  checked: boolean;
  notes?: string;
}

export type MeetingWSEvent =
  | TranscriptEvent
  | MeetingStatusEvent
  | ServerErrorEvent
  | ProcessingEvent
  | SummaryEvent
  | DiscussionPointEvent;

// ─── Event Handler Types ────────────────────────────────────────────────────

export interface MeetingWSEventHandlers {
  onTranscript?: (event: TranscriptEvent) => void;
  onStatus?: (event: MeetingStatusEvent) => void;
  onError?: (event: ServerErrorEvent) => void;
  onProcessing?: (event: ProcessingEvent) => void;
  onSummary?: (event: SummaryEvent) => void;
  onDiscussionPoint?: (event: DiscussionPointEvent) => void;
  onConnectionStateChange?: (state: WebSocketConnectionState) => void;
  onRawMessage?: (data: unknown) => void;
}

// ─── Configuration ──────────────────────────────────────────────────────────

export interface MeetingWSConfig {
  meetingId: string;
  /** Maximum reconnection attempts before giving up */
  maxReconnectAttempts?: number;
  /** Initial reconnection delay in ms (doubles on each retry) */
  reconnectDelay?: number;
  /** Maximum reconnection delay cap in ms */
  maxReconnectDelay?: number;
}

// ─── WebSocket Manager Class ────────────────────────────────────────────────

export class MeetingWebSocket {
  private ws: WebSocket | null = null;
  private config: Required<MeetingWSConfig>;
  private handlers: MeetingWSEventHandlers = {};
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private _connectionState: WebSocketConnectionState = "disconnected";

  constructor(config: MeetingWSConfig) {
    this.config = {
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 1000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      meetingId: config.meetingId,
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  get connectionState(): WebSocketConnectionState {
    return this._connectionState;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** Register event handlers */
  on(handlers: MeetingWSEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /** Connect to the meeting WebSocket stream */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn("[MeetingWS] Already connected");
      return;
    }

    this.intentionalClose = false;
    this._setConnectionState("connecting");

    const token = localStorage.getItem("auth_token");
    const wsBase = getWebSocketBaseUrl();
    // Use the API pattern from the docs: ws://host/ws/meetings/:id/stream
    let wsUrl = `${wsBase}/ws/meetings/${this.config.meetingId}/stream`;

    // Append auth token as query param
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }

    console.log("[MeetingWS] Connecting to:", wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = this._handleOpen.bind(this);
      this.ws.onmessage = this._handleMessage.bind(this);
      this.ws.onerror = this._handleError.bind(this);
      this.ws.onclose = this._handleClose.bind(this);
    } catch (err) {
      console.error("[MeetingWS] Connection error:", err);
      this._setConnectionState("error");
      this._scheduleReconnect();
    }
  }

  /** Send binary audio data through the WebSocket */
  sendAudio(data: Blob | ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[MeetingWS] Cannot send audio - not connected");
      return;
    }

    if (data instanceof Blob) {
      data.arrayBuffer().then((buffer) => {
        this.ws?.send(buffer);
      });
    } else {
      this.ws.send(data);
    }
  }

  /** Send a JSON message through the WebSocket */
  sendMessage(message: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[MeetingWS] Cannot send message - not connected");
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  /** Gracefully disconnect */
  disconnect(): void {
    this.intentionalClose = true;
    this._clearReconnectTimer();

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on intentional close
      this.ws.close(1000, "Client disconnecting");
      this.ws = null;
    }

    this._setConnectionState("disconnected");
    console.log("[MeetingWS] Disconnected intentionally");
  }

  // ─── Private Methods ───────────────────────────────────────────────────

  private _setConnectionState(state: WebSocketConnectionState): void {
    this._connectionState = state;
    this.handlers.onConnectionStateChange?.(state);
  }

  private _handleOpen(): void {
    console.log("[MeetingWS] Connected");
    this.reconnectAttempts = 0;
    this._setConnectionState("connected");
  }

  private _handleMessage(event: MessageEvent): void {
    try {
      // Binary data = ignore for event handling (it's echo/ack)
      if (event.data instanceof ArrayBuffer) {
        return;
      }

      const data = JSON.parse(event.data as string);
      this.handlers.onRawMessage?.(data);

      // Route to appropriate handler based on message type
      switch (data.type) {
        case "transcript":
          this.handlers.onTranscript?.(data as TranscriptEvent);
          break;
        case "status":
          this.handlers.onStatus?.(data as MeetingStatusEvent);
          break;
        case "error":
          this.handlers.onError?.(data as ServerErrorEvent);
          break;
        case "processing":
          this.handlers.onProcessing?.(data as ProcessingEvent);
          break;
        case "summary":
          this.handlers.onSummary?.(data as SummaryEvent);
          break;
        case "discussion_point":
          this.handlers.onDiscussionPoint?.(data as DiscussionPointEvent);
          break;
        default:
          console.log("[MeetingWS] Unknown message type:", data.type, data);
      }
    } catch (err) {
      console.error("[MeetingWS] Error parsing message:", err, event.data);
    }
  }

  private _handleError(event: Event): void {
    console.error("[MeetingWS] WebSocket error:", event);
    this._setConnectionState("error");
    this.handlers.onError?.({
      type: "error",
      message: "WebSocket connection error",
      code: "WS_ERROR",
    });
  }

  private _handleClose(event: CloseEvent): void {
    console.log("[MeetingWS] Connection closed:", event.code, event.reason);

    if (!this.intentionalClose) {
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error("[MeetingWS] Max reconnection attempts reached");
      this._setConnectionState("error");
      this.handlers.onError?.({
        type: "error",
        message: "Unable to reconnect to meeting server after maximum attempts",
        code: "MAX_RECONNECT",
      });
      return;
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay,
    );

    console.log(
      `[MeetingWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`,
    );

    this._setConnectionState("reconnecting");
    this.reconnectAttempts++;

    this._clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

/** Create a new MeetingWebSocket instance for a meeting */
export function createMeetingWebSocket(meetingId: string): MeetingWebSocket {
  return new MeetingWebSocket({ meetingId });
}

export default MeetingWebSocket;
