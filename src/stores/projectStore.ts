import { create } from "zustand";
import type {
  Project,
  ProjectFilters,
  ProjectStageData,
  ProjectPayment,
  Task,
  StageTemplate,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateStageRequest,
  UpdatePaymentRequest,
  CreatePaymentRequest,
  PauseProjectRequest,
  PauseStatusResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "../types";
import * as projectAPI from "../services/projectApi";
import * as tasksAPI from "../services/tasksApi";
import { notifyTaskConflictWarnings } from "../utils/taskConflictWarnings";
import type {
  AddStageRequest,
  ReorderStagesRequest,
  ListProjectsParams,
} from "../services/projectApi";

const fetchProjectsInFlight = new Map<string, Promise<void>>();

const getProjectsRequestKey = (params?: ListProjectsParams): string => {
  if (!params) return "__default__";
  const sortedEntries = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return JSON.stringify(sortedEntries);
};

interface ProjectState {
  // State
  projects: Project[];
  currentProject: Project | null;
  filters: ProjectFilters;
  projectStages: ProjectStageData[];
  projectPayments: ProjectPayment[];
  projectTasks: Task[];
  upcomingTasks: Task[];
  allTasks: Task[];
  tasksLoading: boolean;
  tasksError: string | null;
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
  fetchProjectTasks: (projectId: string, retryCount?: number) => Promise<void>;
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
  createProjectPayment: (
    projectId: string,
    data: CreatePaymentRequest,
  ) => Promise<void>;
  deleteProjectPayment: (projectId: string, paymentId: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: CreateProjectRequest) => Promise<Project>;
  updateProject: (id: string, updates: UpdateProjectRequest) => Promise<Project>;
  setFilters: (filters: ProjectFilters) => void;
  clearError: () => void;
  mergePaymentUpdate: (payment: ProjectPayment) => void;
  fetchPaymentById: (paymentId: string) => Promise<void>;

  // Status Management
  startProject: (projectId: string) => Promise<void>;
  pauseProject: (projectId: string, data: PauseProjectRequest) => Promise<void>;
  resumeProject: (projectId: string) => Promise<void>;
  completeProject: (projectId: string) => Promise<void>;
  cancelProject: (projectId: string) => Promise<void>;
  fetchPauseStatus: (projectId: string) => Promise<PauseStatusResponse>;
  pauseStatus: PauseStatusResponse | null;

  // Task Management
  createTask: (data: CreateTaskRequest, retryCount?: number) => Promise<Task>;
  updateTask: (
    taskId: string,
    data: UpdateTaskRequest,
    retryCount?: number,
  ) => Promise<Task>;
  deleteTask: (taskId: string, retryCount?: number) => Promise<void>;
  completeTask: (taskId: string, retryCount?: number) => Promise<Task>;
  fetchUpcomingTasks: (retryCount?: number) => Promise<void>;
  fetchAllTasks: (retryCount?: number) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  filters: {},
  projectStages: [],
  projectPayments: [],
  projectTasks: [],
  upcomingTasks: [],
  allTasks: [],
  tasksLoading: false,
  tasksError: null,
  availableStages: [],
  currentStageCode: null,
  currentPhase: null,
  totalPaymentValue: "0",
  totalPaidAmount: "0",
  isLoading: false,
  error: null,
  pauseStatus: null,

  fetchProjects: async (params?: ListProjectsParams) => {
    const requestKey = getProjectsRequestKey(params);
    const existingRequest = fetchProjectsInFlight.get(requestKey);
    if (existingRequest) {
      await existingRequest;
      return;
    }

    const fetchPromise = (async () => {
    set({ isLoading: true, error: null });
    try {
      // Use a high limit by default so all projects are loaded
      const response = await projectAPI.listProjects(params ?? { limit: 1000 });

      // Deduplicate projects by ID
      const uniqueProjectsMap = new Map<string, Project>();
      (response.projects || []).forEach((project) => {
        uniqueProjectsMap.set(project.id, project);
      });
      const uniqueProjects = Array.from(uniqueProjectsMap.values());

      // Log if duplicates were removed
      if (uniqueProjects.length < (response.projects || []).length) {
        console.warn(
          `Removed ${(response.projects || []).length - uniqueProjects.length} duplicate projects from API response`,
        );
      }

      set({ projects: uniqueProjects, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch projects";
      set({ isLoading: false, error: errorMessage });
    }
    })();

    fetchProjectsInFlight.set(requestKey, fetchPromise);
    try {
      await fetchPromise;
    } finally {
      if (fetchProjectsInFlight.get(requestKey) === fetchPromise) {
        fetchProjectsInFlight.delete(requestKey);
      }
    }
  },

  fetchProjectById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectAPI.getProjectById(id);
      const yetToStart =
        String(project.status ?? "").toUpperCase() === "YET_TO_START";
      set({
        currentProject: project,
        isLoading: false,
        ...(yetToStart
          ? {
              projectStages: [],
              currentStageCode: null,
              currentPhase: null,
            }
          : {}),
      });
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
      // Preserve any documents stored from individual upload responses that the
      // list endpoint does not return (backend only returns receiptUrl, not documents[]).
      set((state) => ({
        projectPayments: (response.payments || []).map((freshPayment) => {
          const existing = state.projectPayments.find(
            (p) => p.id === freshPayment.id,
          );
          // Priority order for documents:
          // 1. Fresh API documents[] (authoritative if present)
          // 2. In-memory existing documents from a previous upload response
          // 3. Synthesised single-document from legacy receiptUrl field
          // 4. null/undefined (no documents known)
          const documents =
            freshPayment.documents?.length
              ? freshPayment.documents
              : existing?.documents?.length
                ? existing.documents
                : freshPayment.receiptUrl
                  ? [
                      {
                        id: undefined,
                        url: freshPayment.receiptUrl,
                        fileName:
                          freshPayment.receiptFileName || "Receipt",
                        documentType: "receipt",
                        createdAt: freshPayment.updatedAt,
                      },
                    ]
                  : freshPayment.documents;
          return { ...freshPayment, documents };
        }),
        totalPaymentValue: response.totalValue || "0",
        totalPaidAmount: response.paidAmount || "0",
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch project payments";
      set({ isLoading: false, error: errorMessage });
    }
  },

  fetchProjectTasks: async (projectId: string, retryCount = 0) => {
    const MAX_RETRIES = 2;
    set({ tasksLoading: true, tasksError: null });
    try {
      const tasks = await tasksAPI.getTasks(projectId);
      // Ensure tasks is always an array
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      set({ projectTasks: tasksArray, tasksLoading: false, tasksError: null });
    } catch (error) {
      // Retry logic for transient errors
      if (
        retryCount < MAX_RETRIES &&
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("503"))
      ) {
        console.log(`Retrying fetchProjectTasks... attempt ${retryCount + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return get().fetchProjectTasks(projectId, retryCount + 1);
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch project tasks. Please refresh to try again.";
      set({ tasksLoading: false, tasksError: errorMessage });
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
      
      // Re-fetch project to ensure status/progress is in sync
      await get().fetchProjectById(projectId);

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
      
      // Re-fetch project to ensure status/progress is in sync
      await get().fetchProjectById(projectId);

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
      
      // Re-fetch project to ensure status/progress is in sync
      await get().fetchProjectById(projectId);

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
      
      // Re-fetch project to ensure status/progress is in sync
      await get().fetchProjectById(projectId);

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
      
      // Re-fetch project to ensure paidAmount/status is in sync
      await get().fetchProjectById(projectId);

      // Re-fetch payments to get updated data
      const response = await projectAPI.getProjectPayments(projectId);
      set({
        projectPayments: response.payments || [],
        totalPaymentValue: response.totalValue || "0",
        totalPaidAmount: response.paidAmount || "0",
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

  createProjectPayment: async (
    projectId: string,
    data: CreatePaymentRequest,
  ) => {
    set({ isLoading: true, error: null });
    try {
      await projectAPI.createProjectPayment(projectId, data);

      // Re-fetch project to ensure paidAmount/status is in sync
      await get().fetchProjectById(projectId);

      const response = await projectAPI.getProjectPayments(projectId);
      set({
        projectPayments: response.payments || [],
        totalPaymentValue: response.totalValue || "0",
        totalPaidAmount: response.paidAmount || "0",
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create payment milestone";
      set({ isLoading: false, error: errorMessage });
      throw errorMessage;
    }
  },

  deleteProjectPayment: async (projectId: string, paymentId: string) => {
    try {
      await projectAPI.deleteProjectPayment(paymentId);
      
      // Re-fetch project to ensure paidAmount/status is in sync
      await get().fetchProjectById(projectId);

      const response = await projectAPI.getProjectPayments(projectId);
      set({
        projectPayments: response.payments || [],
        totalPaymentValue: response.totalValue || "0",
        totalPaidAmount: response.paidAmount || "0",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete payment milestone";
      throw errorMessage;
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
      const response = await projectAPI.listProjects({ limit: 1000 });
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
      return updatedProject;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update project";
      set({ isLoading: false, error: errorMessage });
      throw error;
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

  // Task Management Methods
  createTask: async (data: CreateTaskRequest, retryCount = 0) => {
    const MAX_RETRIES = 2;
    set({ tasksLoading: true, tasksError: null });
    try {
      const { task: newTask, conflictWarnings } =
        await tasksAPI.createTask(data);
      notifyTaskConflictWarnings(conflictWarnings);
      set((state) => ({
        projectTasks: [...state.projectTasks, newTask],
        allTasks: [...state.allTasks, newTask],
        upcomingTasks:
          newTask.dueDate && !newTask.completed
            ? [...state.upcomingTasks, newTask].sort(
                (a, b) =>
                  new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
              )
            : state.upcomingTasks,
        tasksLoading: false,
      }));
      return newTask;
    } catch (error) {
      // Retry logic for transient errors
      if (
        retryCount < MAX_RETRIES &&
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("503"))
      ) {
        console.log(`Retrying createTask... attempt ${retryCount + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return get().createTask(data, retryCount + 1);
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create task. Please try again.";
      set({ tasksLoading: false, tasksError: errorMessage });
      throw error;
    }
  },

  updateTask: async (
    taskId: string,
    data: UpdateTaskRequest,
    retryCount = 0,
  ) => {
    const MAX_RETRIES = 2;
    const state = get();
    const originalTask =
      state.projectTasks.find((t) => t.id === taskId) ||
      state.allTasks.find((t) => t.id === taskId);

    // Optimistic update
    const optimisticTask = originalTask ? { ...originalTask, ...data } : null;
    if (optimisticTask) {
      set((state) => ({
        projectTasks: state.projectTasks.map((task) =>
          task.id === taskId ? optimisticTask : task,
        ),
        upcomingTasks: state.upcomingTasks.map((task) =>
          task.id === taskId ? optimisticTask : task,
        ),
        allTasks: state.allTasks.map((task) =>
          task.id === taskId ? optimisticTask : task,
        ),
      }));
    }

    try {
      const { task: updatedTask, conflictWarnings } =
        await tasksAPI.updateTask(taskId, data);
      notifyTaskConflictWarnings(conflictWarnings);
      set((state) => ({
        projectTasks: state.projectTasks.map((task) =>
          task.id === taskId ? updatedTask : task,
        ),
        upcomingTasks: state.upcomingTasks.map((task) =>
          task.id === taskId ? updatedTask : task,
        ),
        allTasks: state.allTasks.map((task) =>
          task.id === taskId ? updatedTask : task,
        ),
        tasksError: null,
      }));
      return updatedTask;
    } catch (error) {
      // Rollback optimistic update on failure
      if (originalTask) {
        set((state) => ({
          projectTasks: state.projectTasks.map((task) =>
            task.id === taskId ? originalTask : task,
          ),
          upcomingTasks: state.upcomingTasks.map((task) =>
            task.id === taskId ? originalTask : task,
          ),
          allTasks: state.allTasks.map((task) =>
            task.id === taskId ? originalTask : task,
          ),
        }));
      }

      // Retry logic for transient errors
      if (
        retryCount < MAX_RETRIES &&
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("503"))
      ) {
        console.log(`Retrying updateTask... attempt ${retryCount + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return get().updateTask(taskId, data, retryCount + 1);
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update task. Please try again.";
      set({ tasksError: errorMessage });
      throw error;
    }
  },

  deleteTask: async (taskId: string, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const state = get();
    const originalTask =
      state.projectTasks.find((t) => t.id === taskId) ||
      state.allTasks.find((t) => t.id === taskId);

    // Optimistic delete - remove immediately from UI
    set((state) => ({
      projectTasks: state.projectTasks.filter((task) => task.id !== taskId),
      upcomingTasks: state.upcomingTasks.filter((task) => task.id !== taskId),
      allTasks: state.allTasks.filter((task) => task.id !== taskId),
    }));

    try {
      await tasksAPI.deleteTask(taskId);
      set({ tasksError: null });
    } catch (error) {
      // Rollback optimistic delete on failure
      if (originalTask) {
        set((state) => ({
          projectTasks: [...state.projectTasks, originalTask],
          upcomingTasks:
            originalTask.dueDate && !originalTask.completed
              ? [...state.upcomingTasks, originalTask]
              : state.upcomingTasks,
          allTasks: [...state.allTasks, originalTask],
        }));
      }

      // Retry logic for transient errors
      if (
        retryCount < MAX_RETRIES &&
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("503"))
      ) {
        console.log(`Retrying deleteTask... attempt ${retryCount + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return get().deleteTask(taskId, retryCount + 1);
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete task. Please try again.";
      set({ tasksError: errorMessage });
      throw error;
    }
  },

  completeTask: async (taskId: string, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const state = get();
    const originalTask =
      state.projectTasks.find((t) => t.id === taskId) ||
      state.allTasks.find((t) => t.id === taskId);

    // Optimistic update - mark as completed immediately
    const optimisticTask = originalTask
      ? {
          ...originalTask,
          completed: true,
          status: "COMPLETED" as const,
          completedAt: new Date().toISOString(),
        }
      : null;

    if (optimisticTask) {
      set((state) => ({
        projectTasks: state.projectTasks.map((task) =>
          task.id === taskId ? optimisticTask : task,
        ),
        upcomingTasks: state.upcomingTasks.filter((task) => task.id !== taskId),
        allTasks: state.allTasks.map((task) =>
          task.id === taskId ? optimisticTask : task,
        ),
      }));
    }

    try {
      const completedTask = await tasksAPI.completeTask(taskId);
      set((state) => ({
        projectTasks: state.projectTasks.map((task) =>
          task.id === taskId ? completedTask : task,
        ),
        upcomingTasks: state.upcomingTasks.filter((task) => task.id !== taskId),
        allTasks: state.allTasks.map((task) =>
          task.id === taskId ? completedTask : task,
        ),
        tasksError: null,
      }));
      return completedTask;
    } catch (error) {
      // Rollback optimistic update on failure
      if (originalTask) {
        set((state) => ({
          projectTasks: state.projectTasks.map((task) =>
            task.id === taskId ? originalTask : task,
          ),
          upcomingTasks:
            originalTask.dueDate && !originalTask.completed
              ? [...state.upcomingTasks, originalTask].sort(
                  (a, b) =>
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime(),
                )
              : state.upcomingTasks,
          allTasks: state.allTasks.map((task) =>
            task.id === taskId ? originalTask : task,
          ),
        }));
      }

      // Retry logic for transient errors
      if (
        retryCount < MAX_RETRIES &&
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("503"))
      ) {
        console.log(`Retrying completeTask... attempt ${retryCount + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return get().completeTask(taskId, retryCount + 1);
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to complete task. Please try again.";
      set({ tasksError: errorMessage });
      throw error;
    }
  },

  fetchUpcomingTasks: async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    set({ tasksLoading: true, tasksError: null });
    try {
      const tasks = await tasksAPI.getUpcomingTasks();
      set({ upcomingTasks: tasks, tasksLoading: false, tasksError: null });
    } catch (error) {
      // Retry logic for transient errors
      if (
        retryCount < MAX_RETRIES &&
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("503"))
      ) {
        console.log(`Retrying fetchUpcomingTasks... attempt ${retryCount + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return get().fetchUpcomingTasks(retryCount + 1);
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch upcoming tasks. Pull down to retry.";
      set({ tasksLoading: false, tasksError: errorMessage });
    }
  },

  fetchAllTasks: async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    set({ tasksLoading: true, tasksError: null });
    try {
      const tasks = await tasksAPI.getTasks();
      set({ allTasks: tasks, tasksLoading: false, tasksError: null });
    } catch (error) {
      // Retry logic for transient errors
      if (
        retryCount < MAX_RETRIES &&
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("503"))
      ) {
        console.log(`Retrying fetchAllTasks... attempt ${retryCount + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        );
        return get().fetchAllTasks(retryCount + 1);
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch tasks. Pull down to retry.";
      set({ tasksLoading: false, tasksError: errorMessage });
    }
  },

  clearError: () => {
    set({ error: null, tasksError: null });
  },

  // Merge a single updated payment into the store (e.g. from an upload response)
  // without triggering a full refetch. Preserves documents that the list endpoint
  // does not return.
  mergePaymentUpdate: (payment: ProjectPayment) => {
    set((state) => ({
      projectPayments: state.projectPayments.map((p) =>
        p.id === payment.id ? { ...p, ...payment } : p,
      ),
    }));
  },

  // Fetch a single payment by ID and merge it into the store.
  // The individual-payment endpoint returns the full documents[] array that the
  // list endpoint omits — this is the key call that makes uploaded receipts
  // visible again after a page reload or a multi-user session.
  fetchPaymentById: async (paymentId: string) => {
    try {
      const payment = await projectAPI.getPaymentById(paymentId);
      // Synthesise documents[] from receiptUrl if the API still returns none
      if (!payment.documents?.length && payment.receiptUrl) {
        payment.documents = [
          {
            id: undefined,
            url: payment.receiptUrl,
            fileName: payment.receiptFileName || "Receipt",
            documentType: "receipt",
            createdAt: payment.updatedAt,
          },
        ];
      }
      set((state) => ({
        projectPayments: state.projectPayments.map((p) =>
          p.id === paymentId ? { ...p, ...payment } : p,
        ),
      }));
    } catch {
      // Silently ignore — the endpoint may not exist on older backends.
      // The UI falls back to whatever data is already in the store.
    }
  },
}));
