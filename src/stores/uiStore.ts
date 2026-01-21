import { create } from "zustand";
import { NotificationType, DashboardWidget } from "../types";

interface UIState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  notifications: NotificationType[];
  // Widget Layout State
  dashboardWidgets: DashboardWidget[];
  widgetLibraryOpen: boolean;

  // Sidebar Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Modal Actions
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Notification Actions
  addNotification: (
    notification: Omit<NotificationType, "id" | "createdAt" | "read">,
  ) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Widget Actions
  openWidgetLibrary: () => void;
  closeWidgetLibrary: () => void;
  addWidget: (widgetId: string) => void;
  removeWidget: (instanceId: string) => void;
  updateWidgetPosition: (
    instanceId: string,
    position: { x: number; y: number },
  ) => void;
  updateWidgetSize: (
    instanceId: string,
    size: { w: number; h: number },
  ) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  resetDashboard: () => void;
}

// Default widget layout for new users
const DEFAULT_WIDGETS: DashboardWidget[] = [];

// Load widgets from localStorage
const loadWidgetsFromStorage = (): DashboardWidget[] => {
  try {
    const stored = localStorage.getItem("dashboard-widgets");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load widgets from storage:", e);
  }
  return DEFAULT_WIDGETS;
};

// Save widgets to localStorage
const saveWidgetsToStorage = (widgets: DashboardWidget[]) => {
  try {
    localStorage.setItem("dashboard-widgets", JSON.stringify(widgets));
  } catch (e) {
    console.error("Failed to save widgets to storage:", e);
  }
};

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  activeModal: null,
  notifications: [],
  dashboardWidgets: loadWidgetsFromStorage(),
  widgetLibraryOpen: false,

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  openModal: (modalId: string) => {
    set({ activeModal: modalId });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  addNotification: (notificationData) => {
    const newNotification: NotificationType = {
      ...notificationData,
      id: `n${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50),
    }));
  },

  markNotificationRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // Widget Actions
  openWidgetLibrary: () => {
    set({ widgetLibraryOpen: true });
  },

  closeWidgetLibrary: () => {
    set({ widgetLibraryOpen: false });
  },

  addWidget: (widgetId: string) => {
    const currentWidgets = get().dashboardWidgets;

    // Calculate position for new widget (add to end)
    const newPosition = {
      x: currentWidgets.length % 3,
      y: Math.floor(currentWidgets.length / 3),
    };

    const newWidget: DashboardWidget = {
      instanceId: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      widgetId,
      position: newPosition,
      size: { w: 1, h: 1 },
    };

    const updatedWidgets = [...currentWidgets, newWidget];
    saveWidgetsToStorage(updatedWidgets);
    set({ dashboardWidgets: updatedWidgets });
  },

  removeWidget: (instanceId: string) => {
    const updatedWidgets = get().dashboardWidgets.filter(
      (w) => w.instanceId !== instanceId,
    );
    saveWidgetsToStorage(updatedWidgets);
    set({ dashboardWidgets: updatedWidgets });
  },

  updateWidgetPosition: (
    instanceId: string,
    position: { x: number; y: number },
  ) => {
    const updatedWidgets = get().dashboardWidgets.map((w) =>
      w.instanceId === instanceId ? { ...w, position } : w,
    );
    saveWidgetsToStorage(updatedWidgets);
    set({ dashboardWidgets: updatedWidgets });
  },

  updateWidgetSize: (instanceId: string, size: { w: number; h: number }) => {
    const updatedWidgets = get().dashboardWidgets.map((w) =>
      w.instanceId === instanceId ? { ...w, size } : w,
    );
    saveWidgetsToStorage(updatedWidgets);
    set({ dashboardWidgets: updatedWidgets });
  },

  reorderWidgets: (widgets: DashboardWidget[]) => {
    saveWidgetsToStorage(widgets);
    set({ dashboardWidgets: widgets });
  },

  resetDashboard: () => {
    saveWidgetsToStorage(DEFAULT_WIDGETS);
    set({ dashboardWidgets: DEFAULT_WIDGETS });
  },
}));
