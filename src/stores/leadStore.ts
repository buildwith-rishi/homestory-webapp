import { create } from "zustand";
import {
  Lead,
  LeadFilters,
  LeadStage,
  PipelineStats,
  LeadSource,
} from "../types";
import LeadAPI, {
  Lead as APILead,
  LeadStatus,
  LeadAssignee,
  LeadAssigneesResponse,
} from "../services/leadApi";

// API status values from GET /api/leads/statuses
export type APILeadStatus =
  | "NEW"
  | "WORKING"
  | "QUALIFIED"
  | "DISQUALIFIED"
  | "UNQUALIFIED"
  | "CONVERTED";

interface LeadState {
  leads: Lead[];
  currentLead: Lead | null;
  filters: LeadFilters;
  pipelineStats: PipelineStats;
  isLoading: boolean;
  leadStatuses: LeadStatus[];
  unassignedLeads: Lead[];
  isAssigning: boolean;
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
  assignLead: (
    leadId: string,
    assigneeUserId: string,
    notes?: string,
  ) => Promise<void>;
  bulkAssignLeads: (
    leadIds: string[],
    assigneeUserId: string,
    notes?: string,
  ) => Promise<void>;
  fetchUnassignedLeads: (limit?: number, offset?: number) => Promise<void>;
  fetchLeadAssignees: (leadId: string) => Promise<LeadAssignee[]>;
  addLeadAssignees: (
    leadId: string,
    userIds: string[],
    notes?: string,
  ) => Promise<void>;
  removeLeadAssignee: (leadId: string, userId: string) => Promise<void>;
}

// Helper to convert API lead to frontend Lead type
const convertAPILeadToLead = (apiLead: APILead): Lead => {
  // Map API status to frontend stage (for backwards compatibility)
  const statusToStage: Record<string, LeadStage> = {
    NEW: LeadStage.INQUIRY,
    WORKING: LeadStage.CONTACTED,
    QUALIFIED: LeadStage.PROPOSAL_SENT,
    DISQUALIFIED: LeadStage.LOST,
    UNQUALIFIED: LeadStage.LOST,
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
    assignedTo: apiLead.assignedTo || null,
    assignedToId: apiLead.assignedToId || null,
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
  unassignedLeads: [],
  isAssigning: false,

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
      const response = await LeadAPI.listLeads({ limit: 1000 });
      console.log("Fetched leads from API:", response);

      // Convert API leads to frontend Lead type
      const convertedLeads = (response.leads || []).map(convertAPILeadToLead);

      // Deduplicate leads by ID (in case API returns duplicates)
      const uniqueLeadsMap = new Map<string, Lead>();
      convertedLeads.forEach((lead) => {
        if (!uniqueLeadsMap.has(lead.id)) {
          uniqueLeadsMap.set(lead.id, lead);
        }
      });
      const uniqueLeads = Array.from(uniqueLeadsMap.values());

      if (uniqueLeads.length !== convertedLeads.length) {
        console.warn(
          `⚠️ Removed ${convertedLeads.length - uniqueLeads.length} duplicate leads from API response`,
        );
      }

      set({ leads: uniqueLeads, isLoading: false });
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
      // Forward all supported API fields
      const apiUpdates: Partial<APILead> = {};
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.email !== undefined) apiUpdates.email = updates.email;
      if (updates.phone !== undefined) apiUpdates.phone = updates.phone;
      if (updates.status !== undefined) apiUpdates.status = updates.status;
      if (updates.notes !== undefined) apiUpdates.notes = updates.notes;
      if (updates.source !== undefined) apiUpdates.source = updates.source;
      if ("assignedToId" in updates)
        apiUpdates.assignedToId = updates.assignedToId;
      if (updates.companyName !== undefined)
        apiUpdates.companyName = updates.companyName;
      if (updates.householdOrCompany !== undefined)
        apiUpdates.householdOrCompany = updates.householdOrCompany;
      if (updates.score !== undefined) apiUpdates.score = updates.score;
      if (updates.serviceInterest !== undefined)
        apiUpdates.serviceInterest = updates.serviceInterest;
      if (updates.propertyType !== undefined)
        apiUpdates.propertyType = updates.propertyType;
      if (updates.area !== undefined) apiUpdates.area = updates.area;
      if (updates.city !== undefined) apiUpdates.city = updates.city;
      if (updates.location !== undefined)
        apiUpdates.location = updates.location;
      if (updates.message !== undefined) apiUpdates.message = updates.message;
      if (updates.requirements !== undefined)
        apiUpdates.requirements = updates.requirements;
      if (updates.projectType !== undefined)
        apiUpdates.projectType = updates.projectType;
      if (updates.homeType !== undefined)
        apiUpdates.homeType = updates.homeType;
      if (updates.projectStage !== undefined)
        apiUpdates.projectStage = updates.projectStage;
      if (updates.startTimeline !== undefined)
        apiUpdates.startTimeline = updates.startTimeline;
      if (updates.budgetComfort !== undefined)
        apiUpdates.budgetComfort = updates.budgetComfort;
      if (updates.projectScope !== undefined)
        apiUpdates.projectScope = updates.projectScope;
      if (updates.floorPlanUrl !== undefined)
        apiUpdates.floorPlanUrl = updates.floorPlanUrl;
      if (updates.wantsExperienceCenterVisit !== undefined)
        apiUpdates.wantsExperienceCenterVisit =
          updates.wantsExperienceCenterVisit;
      if (updates.canWhatsApp !== undefined)
        apiUpdates.canWhatsApp = updates.canWhatsApp;
      if (updates.referrerName !== undefined)
        apiUpdates.referrerName = updates.referrerName;
      if (updates.referrerPhone !== undefined)
        apiUpdates.referrerPhone = updates.referrerPhone;
      if (updates.referrerProjectNumber !== undefined)
        apiUpdates.referrerProjectNumber = updates.referrerProjectNumber;
      if (updates.agentAgencyName !== undefined)
        apiUpdates.agentAgencyName = updates.agentAgencyName;
      if (updates.agentAgencyDetails !== undefined)
        apiUpdates.agentAgencyDetails = updates.agentAgencyDetails;

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

  assignLead: async (
    leadId: string,
    assigneeUserId: string,
    notes?: string,
  ) => {
    set({ isAssigning: true });
    try {
      await LeadAPI.assignLead(leadId, { assigneeUserId, notes });
      // Refresh leads after assignment
      await get().fetchLeads();
    } catch (error) {
      console.error("Failed to assign lead:", error);
      throw error;
    } finally {
      set({ isAssigning: false });
    }
  },

  bulkAssignLeads: async (
    leadIds: string[],
    assigneeUserId: string,
    notes?: string,
  ) => {
    set({ isAssigning: true });
    try {
      await LeadAPI.bulkAssignLeads({ leadIds, assigneeUserId, notes });
      // Refresh leads after bulk assignment
      await get().fetchLeads();
    } catch (error) {
      console.error("Failed to bulk assign leads:", error);
      throw error;
    } finally {
      set({ isAssigning: false });
    }
  },

  fetchUnassignedLeads: async (limit?: number, offset?: number) => {
    set({ isLoading: true });
    try {
      const response = await LeadAPI.getUnassignedLeads({ limit, offset });
      const convertedLeads = (response.leads || []).map(convertAPILeadToLead);
      set({ unassignedLeads: convertedLeads, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch unassigned leads:", error);
      set({ unassignedLeads: [], isLoading: false });
    }
  },

  fetchLeadAssignees: async (leadId: string): Promise<LeadAssignee[]> => {
    try {
      const response = await LeadAPI.getLeadAssignees(leadId);
      return response.assignees || [];
    } catch (error) {
      console.error("Failed to fetch lead assignees:", error);
      return [];
    }
  },

  addLeadAssignees: async (
    leadId: string,
    userIds: string[],
    notes?: string,
  ) => {
    set({ isAssigning: true });
    try {
      await LeadAPI.addLeadAssignees(leadId, { userIds, notes });
      // Refresh leads after adding assignees
      await get().fetchLeads();
    } catch (error) {
      console.error("Failed to add lead assignees:", error);
      throw error;
    } finally {
      set({ isAssigning: false });
    }
  },

  removeLeadAssignee: async (leadId: string, userId: string) => {
    set({ isAssigning: true });
    try {
      await LeadAPI.removeLeadAssignee(leadId, userId);
      // Refresh leads after removing assignee
      await get().fetchLeads();
    } catch (error) {
      console.error("Failed to remove lead assignee:", error);
      throw error;
    } finally {
      set({ isAssigning: false });
    }
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
        (l) =>
          l.status === "DISQUALIFIED" ||
          l.status === "UNQUALIFIED" ||
          l.stage === LeadStage.LOST,
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
