import { create } from "zustand";

/**
 * Global UI flag for session expiry (parallel to CustomEvent) so the modal
 * always updates even if events are missed or stacking order hid the dialog.
 */
type SessionExpiredUiState = {
  visible: boolean;
  show: () => void;
  hide: () => void;
};

export const useSessionExpiredStore = create<SessionExpiredUiState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
