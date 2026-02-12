// Tasks API Service
// Handles all task-related API operations

import type { Task, CreateTaskRequest, UpdateTaskRequest } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Tasks API Base URL:", API_BASE_URL);

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// ==========================================
// Task API Functions
// ==========================================

/**
 * Create a new task
 * @param data - Task creation data
 * @returns Promise resolving to the created task
 */
export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Task>(response);
}

/**
 * Get all tasks (optionally filtered by project)
 * @param projectId - Optional project ID to filter tasks
 * @returns Promise resolving to array of tasks
 */
export async function getTasks(projectId?: string): Promise<Task[]> {
  const url = projectId
    ? `${API_BASE_URL}/api/tasks?projectId=${projectId}`
    : `${API_BASE_URL}/api/tasks`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<
    { tasks: Task[]; total: number; limit: number; offset: number } | Task[]
  >(response);
  // API returns { tasks: [...] } object, extract the array
  if (data && typeof data === "object" && "tasks" in data) {
    return data.tasks;
  }
  // Fallback if API returns array directly
  return Array.isArray(data) ? data : [];
}

/**
 * Get upcoming tasks (tasks with upcoming due dates)
 * @returns Promise resolving to array of upcoming tasks
 */
export async function getUpcomingTasks(): Promise<Task[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/upcoming`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<
    { tasks: Task[]; total: number; limit: number; offset: number } | Task[]
  >(response);
  // API returns { tasks: [...] } object, extract the array
  if (data && typeof data === "object" && "tasks" in data) {
    return data.tasks;
  }
  // Fallback if API returns array directly
  return Array.isArray(data) ? data : [];
}

/**
 * Get all available task priorities
 * @returns Promise resolving to array of priority strings
 */
export async function getTaskPriorities(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/priorities`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<string[]>(response);
}

/**
 * Get all available task statuses
 * @returns Promise resolving to array of status strings
 */
export async function getTaskStatuses(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/statuses`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<string[]>(response);
}

/**
 * Get all available task types
 * @returns Promise resolving to array of task type strings
 */
export async function getTaskTypes(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/types`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<string[]>(response);
}

/**
 * Update an existing task
 * @param taskId - ID of the task to update
 * @param data - Task update data
 * @returns Promise resolving to the updated task
 */
export async function updateTask(
  taskId: string,
  data: UpdateTaskRequest,
): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Task>(response);
}

/**
 * Mark a task as complete
 * @param taskId - ID of the task to complete
 * @returns Promise resolving to the completed task
 */
export async function completeTask(taskId: string): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/complete`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse<Task>(response);
}

/**
 * Delete a task
 * @param taskId - ID of the task to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  // For delete operations that return 204 No Content, just check status
  if (!response.ok) {
    await handleResponse(response); // This will throw with proper error message
  }

  // Successfully deleted - return void
  return;
}
