import { create } from 'zustand';
import { Project, ProjectFilters, ProjectStage, Task } from '../types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  filters: ProjectFilters;
  tasks: Task[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId?: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  setFilters: (filters: ProjectFilters) => void;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Kumar Residence',
    location: 'HSR Layout, Bangalore',
    customerId: 'c1',
    stage: ProjectStage.EXECUTION,
    progress: 60,
    startDate: '2025-11-01',
    estimatedEndDate: '2026-04-01',
    siteEngineerId: 'e1',
    budget: 8500000,
    status: 'active',
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2026-01-18T00:00:00Z',
  },
  {
    id: '2',
    name: 'Sharma 3BHK',
    location: 'Indiranagar, Bangalore',
    customerId: 'c2',
    stage: ProjectStage.FINISHING,
    progress: 85,
    startDate: '2025-09-15',
    estimatedEndDate: '2026-02-15',
    siteEngineerId: 'e1',
    budget: 6200000,
    status: 'active',
    createdAt: '2025-09-15T00:00:00Z',
    updatedAt: '2026-01-18T00:00:00Z',
  },
  {
    id: '3',
    name: 'Reddy Villa',
    location: 'Whitefield, Bangalore',
    customerId: 'c3',
    stage: ProjectStage.PRE_CONSTRUCTION,
    progress: 15,
    startDate: '2026-01-10',
    estimatedEndDate: '2026-08-10',
    siteEngineerId: 'e2',
    budget: 12000000,
    status: 'active',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-18T00:00:00Z',
  },
];

const mockTasks: Task[] = [
  {
    id: 't1',
    projectId: '1',
    title: 'Inspect electrical rough-in',
    description: 'Check all conduits, switch boxes, and panel installation',
    dueDate: '2026-01-18',
    dueTime: '14:00',
    completed: false,
    assignedTo: 'e1',
    createdAt: '2026-01-17T00:00:00Z',
  },
  {
    id: 't2',
    projectId: '1',
    title: 'Upload progress photos',
    description: 'Take photos of electrical work and plumbing',
    dueDate: '2026-01-18',
    dueTime: '17:00',
    completed: false,
    assignedTo: 'e1',
    createdAt: '2026-01-17T00:00:00Z',
  },
  {
    id: 't3',
    projectId: '1',
    title: 'Material delivery check',
    description: 'Verify tiles delivery and quality',
    dueDate: '2026-01-18',
    dueTime: '10:00',
    completed: true,
    assignedTo: 'e1',
    createdAt: '2026-01-17T00:00:00Z',
    completedAt: '2026-01-18T10:30:00Z',
  },
  {
    id: 't4',
    projectId: '2',
    title: 'Quality check - tiles',
    description: 'Inspect tile laying in bathroom',
    dueDate: '2026-01-18',
    dueTime: '16:00',
    completed: false,
    assignedTo: 'e1',
    createdAt: '2026-01-17T00:00:00Z',
  },
];

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: mockProjects,
  currentProject: null,
  filters: {},
  tasks: mockTasks,
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ projects: mockProjects, isLoading: false });
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
    const newProject: Project = {
      ...projectData,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: [...state.projects, newProject],
    }));
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
          : state.currentProject,
    }));
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              completedAt: updates.completed ? new Date().toISOString() : t.completedAt,
            }
          : t
      ),
    }));
  },

  setFilters: (filters: ProjectFilters) => {
    set({ filters });
  },
}));
