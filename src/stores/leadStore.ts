import { create } from 'zustand';
import { Lead, LeadFilters, LeadStage, PipelineStats, LeadSource } from '../types';

interface LeadState {
  leads: Lead[];
  currentLead: Lead | null;
  filters: LeadFilters;
  pipelineStats: PipelineStats;
  isLoading: boolean;
  fetchLeads: () => Promise<void>;
  setCurrentLead: (lead: Lead | null) => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  moveLead: (id: string, newStage: LeadStage) => Promise<void>;
  setFilters: (filters: LeadFilters) => void;
  calculatePipelineStats: () => void;
}

const mockLeads: Lead[] = [
  {
    id: 'l1',
    name: 'Priya Mehta',
    email: 'priya.mehta@email.com',
    phone: '+91 98765 11111',
    source: LeadSource.INSTAGRAM,
    stage: LeadStage.MEETING_SCHEDULED,
    projectType: '3BHK Renovation',
    location: 'Koramangala',
    budget: 4500000,
    notes: 'Interested in modern minimalist design',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-17T00:00:00Z',
  },
  {
    id: 'l2',
    name: 'Arun Patel',
    email: 'arun.patel@email.com',
    phone: '+91 98765 22222',
    source: LeadSource.WEBSITE,
    stage: LeadStage.PROPOSAL_SENT,
    projectType: 'Villa Construction',
    location: 'Sarjapur Road',
    budget: 15000000,
    notes: 'Requires eco-friendly materials',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'l3',
    name: 'Lakshmi Iyer',
    email: 'lakshmi.iyer@email.com',
    phone: '+91 98765 33333',
    source: LeadSource.REFERRAL,
    stage: LeadStage.CONTACTED,
    projectType: '2BHK Interior',
    location: 'Jayanagar',
    budget: 2500000,
    createdAt: '2026-01-17T00:00:00Z',
    updatedAt: '2026-01-17T00:00:00Z',
  },
];

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: mockLeads,
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

  fetchLeads: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ leads: mockLeads, isLoading: false });
    get().calculatePipelineStats();
  },

  setCurrentLead: (lead: Lead | null) => {
    set({ currentLead: lead });
  },

  addLead: async (leadData) => {
    const newLead: Lead = {
      ...leadData,
      id: `l${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      leads: [...state.leads, newLead],
    }));
    get().calculatePipelineStats();
  },

  updateLead: async (id: string, updates: Partial<Lead>) => {
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
      ),
      currentLead:
        state.currentLead?.id === id
          ? { ...state.currentLead, ...updates, updatedAt: new Date().toISOString() }
          : state.currentLead,
    }));
    get().calculatePipelineStats();
  },

  moveLead: async (id: string, newStage: LeadStage) => {
    await get().updateLead(id, { stage: newStage });
  },

  setFilters: (filters: LeadFilters) => {
    set({ filters });
  },

  calculatePipelineStats: () => {
    const { leads } = get();
    const stats: PipelineStats = {
      inquiry: leads.filter((l) => l.stage === LeadStage.INQUIRY).length,
      contacted: leads.filter((l) => l.stage === LeadStage.CONTACTED).length,
      meetingScheduled: leads.filter((l) => l.stage === LeadStage.MEETING_SCHEDULED).length,
      proposalSent: leads.filter((l) => l.stage === LeadStage.PROPOSAL_SENT).length,
      negotiation: leads.filter((l) => l.stage === LeadStage.NEGOTIATION).length,
      won: leads.filter((l) => l.stage === LeadStage.WON).length,
      lost: leads.filter((l) => l.stage === LeadStage.LOST).length,
      conversionRate: leads.length > 0 ? (leads.filter((l) => l.stage === LeadStage.WON).length / leads.length) * 100 : 0,
    };
    set({ pipelineStats: stats });
  },
}));
