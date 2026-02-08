import { create } from "zustand";
import {
  Lead,
  LeadFilters,
  LeadStage,
  PipelineStats,
  LeadSource,
} from "../types";
import LeadAPI, { Lead as APILead, LeadStatus } from "../services/leadApi";

// API status values from GET /api/leads/statuses
export type APILeadStatus =
  | "NEW"
  | "WORKING"
  | "QUALIFIED"
  | "DISQUALIFIED"
  | "CONVERTED";

interface LeadState {
  leads: Lead[];
  currentLead: Lead | null;
  filters: LeadFilters;
  pipelineStats: PipelineStats;
  isLoading: boolean;
  leadStatuses: LeadStatus[];
  fetchLeads: () => Promise<void>;
  fetchLeadStatuses: () => Promise<LeadStatus[]>;
  setCurrentLead: (lead: Lead | null) => void;
  addLead: (
    lead: Omit<Lead, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  moveLead: (id: string, newStage: LeadStage) => Promise<void>;
  moveLeadByStatus: (id: string, newStatus: string) => Promise<void>;
  setFilters: (filters: LeadFilters) => void;
  calculatePipelineStats: () => void;
}

// Helper to convert API lead to frontend Lead type
const convertAPILeadToLead = (apiLead: APILead): Lead => {
  // Map API status to frontend stage (for backwards compatibility)
  const statusToStage: Record<string, LeadStage> = {
    NEW: LeadStage.INQUIRY,
    WORKING: LeadStage.CONTACTED,
    QUALIFIED: LeadStage.PROPOSAL_SENT,
    DISQUALIFIED: LeadStage.LOST,
    CONVERTED: LeadStage.WON,
  };

  return {
    id: apiLead.id || "",
    name: apiLead.name || "",
    email: apiLead.email || "",
    phone: apiLead.phone || "",
    source: (apiLead.source as LeadSource) || LeadSource.OTHER,
    stage: statusToStage[apiLead.status || "NEW"] || LeadStage.INQUIRY,
    status: apiLead.status,
    projectType: apiLead.propertyType || apiLead.projectType,
    location: apiLead.location || apiLead.locality,
    city: apiLead.city,
    budget:
      typeof apiLead.budget === "string"
        ? parseInt(apiLead.budget)
        : apiLead.budget,
    budgetRange: apiLead.budgetRange,
    notes: apiLead.notes,
    createdAt: apiLead.createdAt || new Date().toISOString(),
    updatedAt: apiLead.updatedAt || new Date().toISOString(),
    // Include additional fields from API
    stageHistory: apiLead.stageHistory,
    contacts: apiLead.contacts,
    activities: apiLead.activities,
  } as Lead;
};

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  currentLead: null,
  filters: {},
  pipelineStats: {
    inquiry: 0,
    contacted: 0,
    meetingScheduled: 0,
    proposalSent: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
    conversionRate: 0,
  },
  isLoading: false,
  leadStatuses: [],

  fetchLeadStatuses: async () => {
    try {
      const statuses = await LeadAPI.getLeadStatuses();
      set({ leadStatuses: statuses });
      return statuses;
    } catch (error) {
      console.error("Failed to fetch lead statuses:", error);
      return [];
    }
  },

  fetchLeads: async () => {
    set({ isLoading: true });
    try {
      const response = await LeadAPI.listLeads({ limit: 100 });
      console.log("Fetched leads from API:", response);

      // Convert API leads to frontend Lead type
      const convertedLeads = (response.leads || []).map(convertAPILeadToLead);

      set({ leads: convertedLeads, isLoading: false });
      get().calculatePipelineStats();
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      set({ leads: [], isLoading: false });
    }
  },

  setCurrentLead: (lead: Lead | null) => {
    set({ currentLead: lead });
  },

  addLead: async (leadData) => {
    try {
      // Create lead via API
      const apiLeadData = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source?.toUpperCase() || "WEBSITE",
      };

      console.log("Creating lead via API:", apiLeadData);
      const newApiLead = await LeadAPI.createLead(apiLeadData);
      console.log("Lead created:", newApiLead);

      // Convert to frontend Lead type
      const newLead = convertAPILeadToLead(newApiLead);

      set((state) => ({
        leads: [newLead, ...state.leads],
      }));
      get().calculatePipelineStats();

      return newLead;
    } catch (error) {
      console.error("Failed to create lead:", error);
      throw error;
    }
  },

  updateLead: async (id: string, updates: Partial<Lead>) => {
    try {
      // Update lead via API
      const apiUpdates: Partial<APILead> = {};
      if (updates.name) apiUpdates.name = updates.name;
      if (updates.email) apiUpdates.email = updates.email;
      if (updates.phone) apiUpdates.phone = updates.phone;
      if (updates.status) apiUpdates.status = updates.status;
      if (updates.notes) apiUpdates.notes = updates.notes;

      console.log("Updating lead via API:", id, apiUpdates);
      const updatedApiLead = await LeadAPI.updateLead(id, apiUpdates);
      console.log("Lead updated:", updatedApiLead);

      // Convert to frontend Lead type
      const updatedLead = convertAPILeadToLead(updatedApiLead);

      set((state) => ({
        leads: state.leads.map((l) =>
          l.id === id ? { ...l, ...updatedLead } : l,
        ),
        currentLead:
          state.currentLead?.id === id
            ? { ...state.currentLead, ...updatedLead }
            : state.currentLead,
      }));
      get().calculatePipelineStats();
    } catch (error) {
      console.error("Failed to update lead:", error);
      throw error;
    }
  },

  moveLead: async (id: string, newStage: LeadStage) => {
    // Map frontend stage to API status
    const stageToStatus: Record<LeadStage, string> = {
      [LeadStage.INQUIRY]: "NEW",
      [LeadStage.CONTACTED]: "WORKING",
      [LeadStage.MEETING_SCHEDULED]: "WORKING",
      [LeadStage.PROPOSAL_SENT]: "QUALIFIED",
      [LeadStage.NEGOTIATION]: "QUALIFIED",
      [LeadStage.WON]: "CONVERTED",
      [LeadStage.LOST]: "DISQUALIFIED",
    };

    const newStatus = stageToStatus[newStage];
    await get().moveLeadByStatus(id, newStatus);
  },

  moveLeadByStatus: async (id: string, newStatus: string) => {
    try {
      console.log("Moving lead to new status:", id, newStatus);

      // Update lead status via API
      const updatedApiLead = await LeadAPI.updateLead(id, {
        status: newStatus,
      });
      console.log("Lead status updated:", updatedApiLead);

      // Convert to frontend Lead type
      const updatedLead = convertAPILeadToLead(updatedApiLead);

      set((state) => ({
        leads: state.leads.map((l) =>
          l.id === id ? { ...l, ...updatedLead, status: newStatus } : l,
        ),
      }));
      get().calculatePipelineStats();
    } catch (error) {
      console.error("Failed to move lead:", error);
      throw error;
    }
  },

  setFilters: (filters: LeadFilters) => {
    set({ filters });
  },

  calculatePipelineStats: () => {
    const { leads } = get();
    // Calculate stats based on API status field
    const stats: PipelineStats = {
      inquiry: leads.filter(
        (l) => l.status === "NEW" || l.stage === LeadStage.INQUIRY,
      ).length,
      contacted: leads.filter(
        (l) => l.status === "WORKING" || l.stage === LeadStage.CONTACTED,
      ).length,
      meetingScheduled: leads.filter(
        (l) => l.stage === LeadStage.MEETING_SCHEDULED,
      ).length,
      proposalSent: leads.filter(
        (l) => l.status === "QUALIFIED" || l.stage === LeadStage.PROPOSAL_SENT,
      ).length,
      negotiation: leads.filter((l) => l.stage === LeadStage.NEGOTIATION)
        .length,
      won: leads.filter(
        (l) => l.status === "CONVERTED" || l.stage === LeadStage.WON,
      ).length,
      lost: leads.filter(
        (l) => l.status === "DISQUALIFIED" || l.stage === LeadStage.LOST,
      ).length,
      conversionRate:
        leads.length > 0
          ? (leads.filter(
              (l) => l.status === "CONVERTED" || l.stage === LeadStage.WON,
            ).length /
              leads.length) *
            100
          : 0,
    };
    set({ pipelineStats: stats });
  },
}));
