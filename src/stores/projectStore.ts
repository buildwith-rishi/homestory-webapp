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
  createProjectPayment: (
    projectId: string,
    data: CreatePaymentRequest,
  ) => Promise<void>;
  deleteProjectPayment: (projectId: string, paymentId: string) => Promise<void>;
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

  // Task Management
  createTask: (data: CreateTaskRequest) => Promise<Task>;
  updateTask: (taskId: string, data: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<Task>;
  fetchUpcomingTasks: () => Promise<void>;
  fetchAllTasks: () => Promise<void>;
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
        projectPayments: response.payments || [],
        totalPaymentValue: response.totalValue || "0",
        totalPaidAmount: response.paidAmount || "0",
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

      // Remove any payment milestones the backend auto-seeds on creation
      // so projects start with a clean, empty payments list
      try {
        const paymentsResponse = await projectAPI.getProjectPayments(
          createdProject.id,
        );
        const autoCreated = paymentsResponse.payments || [];
        await Promise.all(
          autoCreated.map((p) => projectAPI.deleteProjectPayment(p.id)),
        );
      } catch (cleanupErr) {
        // Non-fatal: log but don't block project creation
        console.warn(
          "Could not remove auto-created payment milestones:",
          cleanupErr,
        );
      }

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

  // Task Management Methods
  createTask: async (data: CreateTaskRequest, retryCount = 0) => {
    const MAX_RETRIES = 2;
    set({ tasksLoading: true, tasksError: null });
    try {
      const newTask = await tasksAPI.createTask(data);
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
      const updatedTask = await tasksAPI.updateTask(taskId, data);
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
}));
