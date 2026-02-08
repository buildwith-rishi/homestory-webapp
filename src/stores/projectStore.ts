import { create } from "zustand";
import type {
  Project,
  ProjectFilters,
  ProjectStageData,
  ProjectPayment,
  ProjectTask,
  StageTemplate,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateStageRequest,
  UpdatePaymentRequest,
  PauseProjectRequest,
  PauseStatusResponse,
} from "../types";
import * as projectAPI from "../services/projectApi";
import type {
  AddStageRequest,
  ReorderStagesRequest,
  ListProjectsParams,
} from "../services/projectApi";

interface ProjectState {
  // State
  projects: Project[];
  currentProject: Project | null;
  filters: ProjectFilters;
  projectStages: ProjectStageData[];
  projectPayments: ProjectPayment[];
  projectTasks: ProjectTask[];
  availableStages: StageTemplate[];
  currentStageCode: string | null;
  currentPhase: string | null;
  totalPaymentValue: string;
  totalPaidAmount: string;
  isLoading: boolean;
  error: string | null;

  // Methods
  fetchProjects: (params?: ListProjectsParams) => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  fetchProjectStages: (projectId: string) => Promise<void>;
  fetchProjectPayments: (projectId: string) => Promise<void>;
  fetchProjectTasks: (projectId: string) => Promise<void>;
  fetchAvailableStages: (projectId: string) => Promise<void>;
  updateProjectStage: (
    projectId: string,
    stageCode: string,
    data: UpdateStageRequest,
  ) => Promise<void>;
  addProjectStage: (projectId: string, data: AddStageRequest) => Promise<void>;
  deleteProjectStage: (projectId: string, stageCode: string) => Promise<void>;
  reorderProjectStages: (
    projectId: string,
    data: ReorderStagesRequest,
  ) => Promise<void>;
  updateProjectPayment: (
    projectId: string,
    paymentId: string,
    data: UpdatePaymentRequest,
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: CreateProjectRequest) => Promise<Project>;
  updateProject: (id: string, updates: UpdateProjectRequest) => Promise<void>;
  setFilters: (filters: ProjectFilters) => void;
  clearError: () => void;

  // Status Management
  startProject: (projectId: string) => Promise<void>;
  pauseProject: (projectId: string, data: PauseProjectRequest) => Promise<void>;
  resumeProject: (projectId: string) => Promise<void>;
  completeProject: (projectId: string) => Promise<void>;
  cancelProject: (projectId: string) => Promise<void>;
  fetchPauseStatus: (projectId: string) => Promise<PauseStatusResponse>;
  pauseStatus: PauseStatusResponse | null;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  filters: {},
  projectStages: [],
  projectPayments: [],
  projectTasks: [],
  availableStages: [],
  currentStageCode: null,
  currentPhase: null,
  totalPaymentValue: "0",
  totalPaidAmount: "0",
  isLoading: false,
  error: null,
  pauseStatus: null,

  fetchProjects: async (params?: ListProjectsParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectAPI.listProjects(params);
      set({ projects: response.projects, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch projects";
      set({ isLoading: false, error: errorMessage });
    }
  },

  fetchProjectById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectAPI.getProjectById(id);
      set({ currentProject: project, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch project";
      set({ isLoading: false, error: errorMessage });
    }
  },

  fetchProjectStages: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectAPI.getProjectStages(projectId);
      set({
        projectStages: response.stages,
        currentStageCode: response.currentStageCode,
        currentPhase: response.currentPhase,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch project stages";
      set({ isLoading: false, error: errorMessage });
    }
  },

  fetchProjectPayments: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectAPI.getProjectPayments(projectId);
      set({
        projectPayments: response.payments,
        totalPaymentValue: response.totalValue,
        totalPaidAmount: response.paidAmount,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch project payments";
      set({ isLoading: false, error: errorMessage });
    }
  },

  fetchProjectTasks: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectAPI.getProjectTasks(projectId);
      set({ projectTasks: response.tasks, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch project tasks";
      set({ isLoading: false, error: errorMessage });
    }
  },

  fetchAvailableStages: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectAPI.getAvailableStages(projectId);
      set({ availableStages: response.available, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch available stages";
      set({ isLoading: false, error: errorMessage });
    }
  },

  updateProjectStage: async (
    projectId: string,
    stageCode: string,
    data: UpdateStageRequest,
  ) => {
    set({ isLoading: true, error: null });
    try {
      await projectAPI.updateProjectStage(projectId, stageCode, data);
      // Re-fetch stages to get updated data
      const response = await projectAPI.getProjectStages(projectId);
      set({
        projectStages: response.stages,
        currentStageCode: response.currentStageCode,
        currentPhase: response.currentPhase,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update project stage";
      set({ isLoading: false, error: errorMessage });
    }
  },

  addProjectStage: async (projectId: string, data: AddStageRequest) => {
    set({ isLoading: true, error: null });
    try {
      await projectAPI.addProjectStage(projectId, data);
      // Re-fetch stages to get updated data
      const response = await projectAPI.getProjectStages(projectId);
      set({
        projectStages: response.stages,
        currentStageCode: response.currentStageCode,
        currentPhase: response.currentPhase,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add project stage";
      set({ isLoading: false, error: errorMessage });
    }
  },

  deleteProjectStage: async (projectId: string, stageCode: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectAPI.deleteProjectStage(projectId, stageCode);
      // Re-fetch stages to get updated data
      const response = await projectAPI.getProjectStages(projectId);
      set({
        projectStages: response.stages,
        currentStageCode: response.currentStageCode,
        currentPhase: response.currentPhase,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete project stage";
      set({ isLoading: false, error: errorMessage });
    }
  },

  reorderProjectStages: async (
    projectId: string,
    data: ReorderStagesRequest,
  ) => {
    set({ isLoading: true, error: null });
    try {
      await projectAPI.reorderProjectStages(projectId, data);
      // Re-fetch stages to get updated data
      const response = await projectAPI.getProjectStages(projectId);
      set({
        projectStages: response.stages,
        currentStageCode: response.currentStageCode,
        currentPhase: response.currentPhase,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reorder project stages";
      set({ isLoading: false, error: errorMessage });
    }
  },

  updateProjectPayment: async (
    projectId: string,
    paymentId: string,
    data: UpdatePaymentRequest,
  ) => {
    set({ isLoading: true, error: null });
    try {
      await projectAPI.updateProjectPayment(projectId, paymentId, data);
      // Re-fetch payments to get updated data
      const response = await projectAPI.getProjectPayments(projectId);
      set({
        projectPayments: response.payments,
        totalPaymentValue: response.totalValue,
        totalPaidAmount: response.paidAmount,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update project payment";
      set({ isLoading: false, error: errorMessage });
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectAPI.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete project";
      set({ isLoading: false, error: errorMessage });
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  addProject: async (projectData: CreateProjectRequest) => {
    set({ isLoading: true, error: null });
    try {
      const createdProject = await projectAPI.createProject(projectData);
      // Re-fetch the projects list to stay in sync
      const response = await projectAPI.listProjects();
      set({ projects: response.projects, isLoading: false });
      return createdProject;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create project";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  updateProject: async (id: string, updates: UpdateProjectRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await projectAPI.updateProject(id, updates);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject:
          state.currentProject?.id === id
            ? updatedProject
            : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update project";
      set({ isLoading: false, error: errorMessage });
    }
  },

  setFilters: (filters: ProjectFilters) => {
    set({ filters });
  },

  // ==========================================
  // Status Management Actions
  // ==========================================

  startProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await projectAPI.startProject(projectId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? updatedProject : p,
        ),
        currentProject:
          state.currentProject?.id === projectId
            ? updatedProject
            : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start project";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  pauseProject: async (projectId: string, data: PauseProjectRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await projectAPI.pauseProject(projectId, data);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? updatedProject : p,
        ),
        currentProject:
          state.currentProject?.id === projectId
            ? updatedProject
            : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to pause project";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  resumeProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await projectAPI.resumeProject(projectId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? updatedProject : p,
        ),
        currentProject:
          state.currentProject?.id === projectId
            ? updatedProject
            : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resume project";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  completeProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await projectAPI.completeProject(projectId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? updatedProject : p,
        ),
        currentProject:
          state.currentProject?.id === projectId
            ? updatedProject
            : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete project";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  cancelProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await projectAPI.cancelProject(projectId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId ? updatedProject : p,
        ),
        currentProject:
          state.currentProject?.id === projectId
            ? updatedProject
            : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cancel project";
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  fetchPauseStatus: async (projectId: string) => {
    try {
      const pauseStatus = await projectAPI.getPauseStatus(projectId);
      set({ pauseStatus });
      return pauseStatus;
    } catch (error) {
      console.error("Error fetching pause status:", error);
      set({ pauseStatus: null });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
