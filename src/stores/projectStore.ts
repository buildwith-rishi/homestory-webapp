import { create } from "zustand";
import {
  Project,
  ProjectFilters,
  Task,
  ProjectStageData,
  ProjectPayment,
  ProjectTask,
  UpdateStageRequest,
  UpdatePaymentRequest,
  ProjectStageCode,
  PipelineType,
  ProjectCategory,
  ScopeType,
  BudgetTier,
  PropertySubtype,
} from "../types";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  filters: ProjectFilters;
  tasks: Task[];
  projectStages: ProjectStageData[];
  projectPayments: ProjectPayment[];
  projectTasks: ProjectTask[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  fetchProjectStages: (projectId: string) => Promise<void>;
  fetchProjectPayments: (projectId: string) => Promise<void>;
  fetchProjectTasks: (projectId: string) => Promise<void>;
  updateProjectStage: (
    projectId: string,
    stageCode: string,
    data: UpdateStageRequest,
  ) => Promise<void>;
  updateProjectPayment: (
    projectId: string,
    paymentId: string,
    data: UpdatePaymentRequest,
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  fetchTasks: (projectId?: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  addProject: (
    project: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  setFilters: (filters: ProjectFilters) => void;
  clearError: () => void;
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Modern 3BHK Interior",
    projectName: "Modern 3BHK Interior",
    leadId: "lead-1",
    pipelineType: PipelineType.DESIGN_AND_EXECUTION,
    projectCategory: ProjectCategory.RESIDENTIAL,
    scopeType: ScopeType.FULL_HOME,
    budgetTier: BudgetTier.PREMIUM,
    propertySubtype: PropertySubtype.APARTMENT,
    propertySizeSqft: 1500,
    propertyBHK: "3BHK",
    propertyAddress: "HSR Layout, Bangalore",
    propertyCity: "Bangalore",
    totalValue: 2800000,
    currentStage: ProjectStageCode.DESIGN,
    status: "active",
    progress: 65,
    assignedDesigner: { id: "d1", name: "Arjun Rao", email: "arjun@ghs.com" },
    assignedPM: { id: "pm1", name: "Priya Kumar", email: "priya@ghs.com" },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "2",
    name: "Luxury Villa Renovation",
    projectName: "Luxury Villa Renovation",
    leadId: "lead-2",
    pipelineType: PipelineType.DESIGN_AND_EXECUTION,
    projectCategory: ProjectCategory.RESIDENTIAL,
    scopeType: ScopeType.TURNKEY,
    budgetTier: BudgetTier.LUXURY,
    propertySubtype: PropertySubtype.VILLA,
    propertySizeSqft: 3200,
    propertyBHK: "4BHK",
    propertyAddress: "Whitefield, Bangalore",
    propertyCity: "Bangalore",
    totalValue: 5500000,
    currentStage: ProjectStageCode.EXECUTION,
    status: "active",
    progress: 40,
    assignedDesigner: {
      id: "d2",
      name: "Rahul Sharma",
      email: "rahul@ghs.com",
    },
    assignedPM: { id: "pm2", name: "Meera Gupta", email: "meera@ghs.com" },
    createdAt: "2025-12-15T00:00:00Z",
    updatedAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "3",
    name: "Contemporary 2BHK",
    projectName: "Contemporary 2BHK",
    leadId: "lead-3",
    pipelineType: PipelineType.DESIGN_ONLY,
    projectCategory: ProjectCategory.RESIDENTIAL,
    scopeType: ScopeType.INTERIORS,
    budgetTier: BudgetTier.MID_RANGE,
    propertySubtype: PropertySubtype.APARTMENT,
    propertySizeSqft: 1100,
    propertyBHK: "2BHK",
    propertyAddress: "Indiranagar, Bangalore",
    propertyCity: "Bangalore",
    totalValue: 1800000,
    currentStage: ProjectStageCode.PROPOSAL,
    status: "active",
    progress: 75,
    assignedDesigner: { id: "d1", name: "Arjun Rao", email: "arjun@ghs.com" },
    createdAt: "2025-12-20T00:00:00Z",
    updatedAt: "2026-01-18T00:00:00Z",
  },
];

const mockTasks: Task[] = [
  {
    id: "t1",
    projectId: "1",
    title: "Inspect electrical rough-in",
    description: "Check all conduits, switch boxes, and panel installation",
    dueDate: "2026-01-18",
    dueTime: "14:00",
    completed: false,
    assignedTo: "e1",
    createdAt: "2026-01-17T00:00:00Z",
  },
  {
    id: "t2",
    projectId: "1",
    title: "Upload progress photos",
    description: "Take photos of electrical work and plumbing",
    dueDate: "2026-01-18",
    dueTime: "17:00",
    completed: false,
    assignedTo: "e1",
    createdAt: "2026-01-17T00:00:00Z",
  },
  {
    id: "t3",
    projectId: "1",
    title: "Material delivery check",
    description: "Verify tiles delivery and quality",
    dueDate: "2026-01-18",
    dueTime: "10:00",
    completed: true,
    assignedTo: "e1",
    createdAt: "2026-01-17T00:00:00Z",
    completedAt: "2026-01-18T10:30:00Z",
  },
  {
    id: "t4",
    projectId: "2",
    title: "Quality check - tiles",
    description: "Inspect tile laying in bathroom",
    dueDate: "2026-01-18",
    dueTime: "16:00",
    completed: false,
    assignedTo: "e1",
    createdAt: "2026-01-17T00:00:00Z",
  },
];

export const useProjectStore = create<ProjectState>((set) => ({
  projects: mockProjects,
  currentProject: null,
  filters: {},
  tasks: mockTasks,
  projectStages: [],
  projectPayments: [],
  projectTasks: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ projects: mockProjects, isLoading: false });
  },

  fetchProjectById: async (id: string) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    const project = mockProjects.find((p) => p.id === id);
    if (project) {
      set({ currentProject: project, isLoading: false });
    } else {
      set({ error: "Project not found", isLoading: false });
    }
  },

  fetchProjectStages: async (_projectId: string) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Return empty array for now - can be populated with mock data later if needed
    set({ projectStages: [], isLoading: false });
  },

  fetchProjectPayments: async (_projectId: string) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Return empty array for now - can be populated with mock data later if needed
    set({ projectPayments: [], isLoading: false });
  },

  fetchProjectTasks: async (_projectId: string) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Return empty array for now - can be populated with mock data later if needed
    set({ projectTasks: [], isLoading: false });
  },

  updateProjectStage: async (
    _projectId: string,
    stageCode: string,
    data: UpdateStageRequest,
  ) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      projectStages: state.projectStages.map((stage) =>
        stage.stageCode === stageCode
          ? ({ ...stage, ...data } as ProjectStageData)
          : stage,
      ),
      isLoading: false,
    }));
  },

  updateProjectPayment: async (
    _projectId: string,
    paymentId: string,
    data: UpdatePaymentRequest,
  ) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      projectPayments: state.projectPayments.map((payment) =>
        payment.id === paymentId
          ? ({ ...payment, ...data } as ProjectPayment)
          : payment,
      ),
      isLoading: false,
    }));
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject:
        state.currentProject?.id === id ? null : state.currentProject,
      isLoading: false,
    }));
  },

  fetchTasks: async (projectId?: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    const filteredTasks = projectId
      ? mockTasks.filter((t) => t.projectId === projectId)
      : mockTasks;
    set({ tasks: filteredTasks, isLoading: false });
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  addProject: async (projectData) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      projects: [...state.projects, newProject],
      isLoading: false,
    }));
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p,
      ),
      currentProject:
        state.currentProject?.id === id
          ? {
              ...state.currentProject,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : state.currentProject,
      isLoading: false,
    }));
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              completedAt: updates.completed
                ? new Date().toISOString()
                : t.completedAt,
            }
          : t,
      ),
    }));
  },

  setFilters: (filters: ProjectFilters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null });
  },
}));
