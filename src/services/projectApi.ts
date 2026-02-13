// Project API Service
// Handles all project-related API operations

import type {
  Project,
  ProjectStageData,
  ProjectPayment,
  ProjectTask,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateStageRequest,
  UpdatePaymentRequest,
  StageTemplate,
  StageTemplatePhaseType,
  CreateStageTemplateRequest,
  UpdateStageTemplateRequest,
  ReorderStageTemplatesRequest,
  PauseProjectRequest,
  PauseStatusResponse,
  OptionItem,
  OptionItemWithDescription,
  StageOption,
  PropertySubtypeOptions,
  ProjectReference,
  ProjectReferencesResponse,
  AddLinkReferenceRequest,
  UpdateReferenceRequest,
  ProjectTestimonial,
  CreateTestimonialRequest,
  UpdateTestimonialRequest,
  TestimonialAnalytics,
  TaskMatrix,
  MatrixTask,
  MatrixCategory,
  MatrixStats,
  TaskAttachment,
  CreateMatrixRequest,
  CreateMatrixResponse,
  UpdateMatrixRequest,
  UpdateTaskStatusRequest,
  UpdateMatrixTaskRequest,
  NotifyCustomerRequest,
  NotifyCustomerResponse,
  HandoverActivity,
  CreateHandoverActivityRequest,
  UpdateHandoverActivityRequest,
  HandoverPhoto,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Project API Base URL:", API_BASE_URL);

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  console.log("🔑 Auth token exists:", !!token);
  console.log("🔑 Auth token length:", token?.length || 0);
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
// Response Interfaces
// ==========================================

export interface ListProjectsResponse {
  projects: Project[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListProjectsParams {
  status?: string;
  pipelineType?: string;
  projectCategory?: string;
  limit?: number;
  offset?: number;
}

export interface ProjectStagesResponse {
  stages: ProjectStageData[];
  currentStageCode: string;
  currentPhase: string;
}

export interface ProjectPaymentsResponse {
  payments: ProjectPayment[];
  totalValue: string;
  paidAmount: string;
}

export interface AvailableStagesResponse {
  available: StageTemplate[];
  existing: string[];
  pipelineType: string;
}

export interface ProjectTasksResponse {
  tasks: ProjectTask[];
}

export interface AddStageRequest {
  stageTemplateId?: string;
  stageCode?: string;
  stageName?: string;
  phaseType?: string;
  orderIndex?: number;
}

export interface ReorderStagesRequest {
  stages: { stageCode: string; orderIndex: number }[];
}

// ==========================================
// API Functions
// ==========================================

/**
 * List projects with optional filters
 * GET /api/projects
 */
export async function listProjects(
  params?: ListProjectsParams,
): Promise<ListProjectsResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.pipelineType)
      searchParams.append("pipelineType", params.pipelineType);
    if (params?.projectCategory)
      searchParams.append("projectCategory", params.projectCategory);
    if (params?.limit !== undefined)
      searchParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      searchParams.append("offset", params.offset.toString());

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/api/projects${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<ListProjectsResponse>(response);
  } catch (error) {
    console.error("Error listing projects:", error);
    throw error;
  }
}

/**
 * Create a new project
 * POST /api/projects
 */
export async function createProject(
  data: CreateProjectRequest,
): Promise<Project> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await handleResponse<any>(response);
    // API may wrap response as { project: { ... } }
    return result.project || result;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

/**
 * Get a project by ID
 * GET /api/projects/:id
 */
export async function getProjectById(id: string): Promise<Project> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<any>(response);
    // API may wrap response as { project: { ... } }
    return data.project || data;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
}

/**
 * Update a project
 * PUT /api/projects/:id
 */
export async function updateProject(
  id: string,
  data: UpdateProjectRequest,
): Promise<Project> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await handleResponse<any>(response);
    // API may wrap response as { project: { ... } }
    return result.project || result;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

/**
 * Delete a project
 * DELETE /api/projects/:id
 */
export async function deleteProject(id: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

/**
 * Get project stages
 * GET /api/projects/:id/stages
 */
export async function getProjectStages(
  projectId: string,
): Promise<ProjectStagesResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/stages`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return handleResponse<ProjectStagesResponse>(response);
  } catch (error) {
    console.error("Error fetching project stages:", error);
    throw error;
  }
}

/**
 * Add a stage to a project (from template or custom)
 * POST /api/projects/:id/stages
 */
export async function addProjectStage(
  projectId: string,
  data: AddStageRequest,
): Promise<ProjectStageData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/stages`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );

    return handleResponse<ProjectStageData>(response);
  } catch (error) {
    console.error("Error adding project stage:", error);
    throw error;
  }
}

/**
 * Update a project stage
 * PUT /api/projects/:id/stages/:stageCode
 */
export async function updateProjectStage(
  projectId: string,
  stageCode: string,
  data: UpdateStageRequest,
): Promise<ProjectStageData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/stages/${stageCode}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );

    return handleResponse<ProjectStageData>(response);
  } catch (error) {
    console.error("Error updating project stage:", error);
    throw error;
  }
}

/**
 * Delete a project stage
 * DELETE /api/projects/:id/stages/:stageCode
 */
export async function deleteProjectStage(
  projectId: string,
  stageCode: string,
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/stages/${stageCode}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error deleting project stage:", error);
    throw error;
  }
}

/**
 * Reorder project stages
 * POST /api/projects/:id/stages/reorder
 */
export async function reorderProjectStages(
  projectId: string,
  data: ReorderStagesRequest,
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/stages/reorder`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );

    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error reordering project stages:", error);
    throw error;
  }
}

/**
 * Get available stage templates for a project
 * GET /api/projects/:id/available-stages
 */
export async function getAvailableStages(
  projectId: string,
): Promise<AvailableStagesResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/available-stages`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return handleResponse<AvailableStagesResponse>(response);
  } catch (error) {
    console.error("Error fetching available stages:", error);
    throw error;
  }
}

/**
 * Get project payments
 * GET /api/projects/:id/payments
 */
export async function getProjectPayments(
  projectId: string,
): Promise<ProjectPaymentsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/payments`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return handleResponse<ProjectPaymentsResponse>(response);
  } catch (error) {
    console.error("Error fetching project payments:", error);
    throw error;
  }
}

/**
 * Update a project payment
 * PUT /api/projects/:id/payments/:paymentId
 */
export async function updateProjectPayment(
  projectId: string,
  paymentId: string,
  data: UpdatePaymentRequest,
): Promise<ProjectPayment> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/payments/${paymentId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );

    return handleResponse<ProjectPayment>(response);
  } catch (error) {
    console.error("Error updating project payment:", error);
    throw error;
  }
}

/**
 * Get project tasks
 * GET /api/projects/:id/tasks
 */
export async function getProjectTasks(
  projectId: string,
): Promise<ProjectTasksResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/tasks`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return handleResponse<ProjectTasksResponse>(response);
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    throw error;
  }
}

// ==========================================
// Status Management Endpoints
// ==========================================

/**
 * Start a project (YET_TO_START → ONGOING)
 * POST /api/projects/:id/start
 */
export async function startProject(projectId: string): Promise<Project> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/start`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    const data = await handleResponse<any>(response);
    return data.project || data;
  } catch (error) {
    console.error("Error starting project:", error);
    throw error;
  }
}

/**
 * Pause a project (ONGOING → PAUSED)
 * POST /api/projects/:id/pause
 */
export async function pauseProject(
  projectId: string,
  data: PauseProjectRequest,
): Promise<Project> {
  try {
    const url = `${API_BASE_URL}/api/projects/${projectId}/pause`;
    const headers = getAuthHeaders();
    const body = JSON.stringify(data);

    console.log("🔵 Pause Project API Call:");
    console.log("URL:", url);
    console.log("Headers:", headers);
    console.log("Body:", body);
    console.log("Request data:", data);

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    console.log("🔵 Response status:", response.status);
    console.log("🔵 Response ok:", response.ok);

    const result = await handleResponse<any>(response);
    console.log("🔵 Result:", result);
    return result.project || result;
  } catch (error) {
    console.error("❌ Error pausing project:", error);
    throw error;
  }
}

/**
 * Resume a paused project (PAUSED → ONGOING)
 * POST /api/projects/:id/resume
 */
export async function resumeProject(projectId: string): Promise<Project> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/resume`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    const data = await handleResponse<any>(response);
    return data.project || data;
  } catch (error) {
    console.error("Error resuming project:", error);
    throw error;
  }
}

/**
 * Complete a project (ONGOING → COMPLETED)
 * POST /api/projects/:id/complete
 */
export async function completeProject(projectId: string): Promise<Project> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/complete`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    const data = await handleResponse<any>(response);
    return data.project || data;
  } catch (error) {
    console.error("Error completing project:", error);
    throw error;
  }
}

/**
 * Cancel a project
 * POST /api/projects/:id/cancel
 */
export async function cancelProject(projectId: string): Promise<Project> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/cancel`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    const data = await handleResponse<any>(response);
    return data.project || data;
  } catch (error) {
    console.error("Error cancelling project:", error);
    throw error;
  }
}

/**
 * Get pause status for a project
 * GET /api/projects/:id/pause-status
 */
export async function getPauseStatus(
  projectId: string,
): Promise<PauseStatusResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/pause-status`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    return handleResponse<PauseStatusResponse>(response);
  } catch (error) {
    console.error("Error fetching pause status:", error);
    throw error;
  }
}

// ==================== PROJECT OPTIONS API ====================

/**
 * Fetch project categories
 * GET /api/projects/options/categories
 */
export async function getProjectCategories(): Promise<OptionItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/categories`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<{ categories: OptionItem[] }>(response);
    return result.categories || [];
  } catch (error) {
    console.error("Error fetching project categories:", error);
    throw error;
  }
}

/**
 * Fetch budget tiers
 * GET /api/projects/options/budget-tiers
 */
export async function getBudgetTiers(): Promise<OptionItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/budget-tiers`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<{ budgetTiers: OptionItem[] }>(
      response,
    );
    return result.budgetTiers || [];
  } catch (error) {
    console.error("Error fetching budget tiers:", error);
    throw error;
  }
}

/**
 * Fetch scope types
 * GET /api/projects/options/scope-types
 */
export async function getScopeTypes(): Promise<OptionItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/scope-types`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<{ scopeTypes: OptionItem[] }>(response);
    return result.scopeTypes || [];
  } catch (error) {
    console.error("Error fetching scope types:", error);
    throw error;
  }
}

/**
 * Fetch pipeline types
 * GET /api/projects/options/pipeline-types
 */
export async function getPipelineTypes(): Promise<OptionItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/pipeline-types`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<{ pipelineTypes: OptionItem[] }>(
      response,
    );
    return result.pipelineTypes || [];
  } catch (error) {
    console.error("Error fetching pipeline types:", error);
    throw error;
  }
}

/**
 * Fetch property subtypes (grouped by category)
 * GET /api/projects/options/property-subtypes
 */
export async function getPropertySubtypes(): Promise<PropertySubtypeOptions> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/property-subtypes`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<{ subtypes: PropertySubtypeOptions }>(
      response,
    );
    return result.subtypes || {};
  } catch (error) {
    console.error("Error fetching property subtypes:", error);
    throw error;
  }
}

/**
 * Fetch project statuses
 * GET /api/projects/options/statuses
 */
export async function getProjectStatuses(): Promise<
  OptionItemWithDescription[]
> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/statuses`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<OptionItemWithDescription[]>(response);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching project statuses:", error);
    throw error;
  }
}

/**
 * Fetch project stages
 * GET /api/projects/options/stages
 */
export async function getProjectStageOptions(): Promise<StageOption[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/stages`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<{ stages: StageOption[] }>(response);
    return result.stages || [];
  } catch (error) {
    console.error("Error fetching project stage options:", error);
    throw error;
  }
}

/**
 * Fetch stage statuses
 * GET /api/projects/options/stage-statuses
 */
export async function getStageStatuses(): Promise<OptionItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/stage-statuses`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<{ stageStatuses: OptionItem[] }>(
      response,
    );
    return result.stageStatuses || [];
  } catch (error) {
    console.error("Error fetching stage statuses:", error);
    throw error;
  }
}

/**
 * Fetch reference categories
 * GET /api/projects/options/reference-categories
 */
export async function getReferenceCategories(): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/reference-categories`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<string[]>(response);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching reference categories:", error);
    throw error;
  }
}

// ─── Project References (Inspirations) ───────────────────────────────────────

/**
 * List all references for a project
 * GET /api/projects/:projectId/references
 */
export async function getProjectReferences(
  projectId: string,
): Promise<ProjectReferencesResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/references`,
      { headers: getAuthHeaders() },
    );
    return handleResponse<ProjectReferencesResponse>(response);
  } catch (error) {
    console.error("Error fetching project references:", error);
    throw error;
  }
}

/**
 * Get a single reference by ID
 * GET /api/projects/:projectId/references/:referenceId
 */
export async function getProjectReference(
  projectId: string,
  referenceId: string,
): Promise<ProjectReference> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/references/${referenceId}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse<ProjectReference>(response);
  } catch (error) {
    console.error("Error fetching project reference:", error);
    throw error;
  }
}

/**
 * Add a link reference (Pinterest, Instagram, etc.)
 * POST /api/projects/:projectId/references/link
 */
export async function addLinkReference(
  projectId: string,
  data: AddLinkReferenceRequest,
): Promise<ProjectReference> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/references/link`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    return handleResponse<ProjectReference>(response);
  } catch (error) {
    console.error("Error adding link reference:", error);
    throw error;
  }
}

/**
 * Upload a file reference (image, PDF, document)
 * POST /api/projects/:projectId/references/upload
 * Uses multipart/form-data
 */
export async function uploadFileReference(
  projectId: string,
  file: File,
  category: string,
  notes?: string,
  tags?: string[],
): Promise<ProjectReference> {
  try {
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (notes) formData.append("notes", notes);
    if (tags && tags.length > 0) formData.append("tags", tags.join(","));

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/references/upload`,
      {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      },
    );
    return handleResponse<ProjectReference>(response);
  } catch (error) {
    console.error("Error uploading file reference:", error);
    throw error;
  }
}

/**
 * Update a reference
 * PUT /api/projects/:projectId/references/:referenceId
 */
export async function updateProjectReference(
  projectId: string,
  referenceId: string,
  data: UpdateReferenceRequest,
): Promise<ProjectReference> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/references/${referenceId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    return handleResponse<ProjectReference>(response);
  } catch (error) {
    console.error("Error updating project reference:", error);
    throw error;
  }
}

/**
 * Delete a reference
 * DELETE /api/projects/:projectId/references/:referenceId
 */
export async function deleteProjectReference(
  projectId: string,
  referenceId: string,
): Promise<void> {
  try {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/references/${referenceId}`,
      {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
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
  } catch (error) {
    console.error("Error deleting project reference:", error);
    throw error;
  }
}

/**
 * Download a file reference
 * GET /api/projects/:projectId/references/:referenceId/download
 */
export async function downloadProjectReference(
  projectId: string,
  referenceId: string,
): Promise<Blob> {
  try {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/references/${referenceId}/download`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    return response.blob();
  } catch (error) {
    console.error("Error downloading reference:", error);
    throw error;
  }
}

/**
 * Fetch reference types
 * GET /api/projects/options/reference-types
 */
export async function getReferenceTypes(): Promise<
  OptionItemWithDescription[]
> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/options/reference-types`,
      { headers: getAuthHeaders() },
    );
    const result = await handleResponse<OptionItemWithDescription[]>(response);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching reference types:", error);
    throw error;
  }
}

// ==========================================
// Testimonials API
// ==========================================

/**
 * List testimonials for a project
 * GET /api/projects/:id/testimonials
 */
export async function getProjectTestimonials(
  projectId: string,
): Promise<ProjectTestimonial[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/testimonials`,
    { headers: getAuthHeaders() },
  );
  return handleResponse<ProjectTestimonial[]>(response);
}

/**
 * Get a single testimonial
 * GET /api/projects/:id/testimonials/:testimonialId
 */
export async function getProjectTestimonial(
  projectId: string,
  testimonialId: string,
): Promise<ProjectTestimonial> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/testimonials/${testimonialId}`,
    { headers: getAuthHeaders() },
  );
  return handleResponse<ProjectTestimonial>(response);
}

/**
 * Create a testimonial
 * POST /api/projects/:id/testimonials
 */
export async function createTestimonial(
  projectId: string,
  data: CreateTestimonialRequest,
): Promise<ProjectTestimonial> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/testimonials`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    },
  );
  return handleResponse<ProjectTestimonial>(response);
}

/**
 * Update a testimonial
 * PUT /api/projects/:id/testimonials/:testimonialId
 */
export async function updateTestimonial(
  projectId: string,
  testimonialId: string,
  data: UpdateTestimonialRequest,
): Promise<ProjectTestimonial> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/testimonials/${testimonialId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    },
  );
  return handleResponse<ProjectTestimonial>(response);
}

/**
 * Delete a testimonial
 * DELETE /api/projects/:id/testimonials/:testimonialId
 */
export async function deleteTestimonial(
  projectId: string,
  testimonialId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/testimonials/${testimonialId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        errorData.error ||
        `Delete failed: ${response.status}`,
    );
  }
}

/**
 * Upload media to a testimonial
 * POST /api/projects/:id/testimonials/:testimonialId/upload
 */
export async function uploadTestimonialMedia(
  projectId: string,
  testimonialId: string,
  file: File,
  mediaType: "PHOTO" | "VIDEO" | "AUDIO",
): Promise<ProjectTestimonial> {
  const token = localStorage.getItem("auth_token");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mediaType", mediaType);

  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/testimonials/${testimonialId}/upload`,
    {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    },
  );
  return handleResponse<ProjectTestimonial>(response);
}

/**
 * Update testimonial status
 * PUT /api/projects/:id/testimonials/:testimonialId/status
 */
export async function updateTestimonialStatus(
  projectId: string,
  testimonialId: string,
  status: string,
): Promise<ProjectTestimonial> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/testimonials/${testimonialId}/status`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    },
  );
  return handleResponse<ProjectTestimonial>(response);
}

/**
 * List all testimonials (analytics)
 * GET /api/testimonials
 */
export async function listAllTestimonials(): Promise<{
  testimonials: ProjectTestimonial[];
  total: number;
  limit: number;
  offset: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/testimonials`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Get testimonial analytics by designer
 * GET /api/testimonials/analytics
 */
export async function getTestimonialAnalytics(): Promise<TestimonialAnalytics> {
  const response = await fetch(`${API_BASE_URL}/api/testimonials/analytics`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<TestimonialAnalytics>(response);
}

/**
 * Get testimonial statuses
 * GET /api/testimonials/options/statuses
 */
export async function getTestimonialStatuses(): Promise<
  OptionItemWithDescription[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/testimonials/options/statuses`,
    { headers: getAuthHeaders() },
  );
  const result = await handleResponse<OptionItemWithDescription[]>(response);
  return Array.isArray(result) ? result : [];
}

// ==========================================
// Stage Templates API Functions
// ==========================================

export interface StageTemplatesResponse {
  templates: StageTemplate[];
}

export interface StageTemplatePhaseTypesResponse {
  phaseTypes: StageTemplatePhaseType[];
}

export interface StageTemplateDetailResponse {
  template: StageTemplate;
}

/**
 * Get all stage templates
 * GET /api/stage-templates?includeInactive=false
 */
export async function getStageTemplates(
  includeInactive: boolean = false,
): Promise<StageTemplatesResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/stage-templates?includeInactive=${includeInactive}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<StageTemplatesResponse>(response);
  } catch (error) {
    console.error("Error fetching stage templates:", error);
    throw error;
  }
}

/**
 * Get stage template phase types
 * GET /api/stage-templates/phase-types
 */
export async function getStageTemplatePhaseTypes(): Promise<StageTemplatePhaseTypesResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/stage-templates/phase-types`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<StageTemplatePhaseTypesResponse>(response);
  } catch (error) {
    console.error("Error fetching stage template phase types:", error);
    throw error;
  }
}

/**
 * Get a single stage template by ID
 * GET /api/stage-templates/:id
 */
export async function getStageTemplate(
  templateId: string,
): Promise<StageTemplateDetailResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/stage-templates/${templateId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<StageTemplateDetailResponse>(response);
  } catch (error) {
    console.error("Error fetching stage template:", error);
    throw error;
  }
}

/**
 * Create a new stage template
 * POST /api/stage-templates
 */
export async function createStageTemplate(
  data: CreateStageTemplateRequest,
): Promise<StageTemplate> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stage-templates`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<StageTemplate>(response);
  } catch (error) {
    console.error("Error creating stage template:", error);
    throw error;
  }
}

/**
 * Update a stage template
 * PUT /api/stage-templates/:id
 */
export async function updateStageTemplate(
  templateId: string,
  data: UpdateStageTemplateRequest,
): Promise<StageTemplate> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/stage-templates/${templateId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    return handleResponse<StageTemplate>(response);
  } catch (error) {
    console.error("Error updating stage template:", error);
    throw error;
  }
}

/**
 * Delete a stage template
 * DELETE /api/stage-templates/:id
 */
export async function deleteStageTemplate(
  templateId: string,
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/stage-templates/${templateId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error deleting stage template:", error);
    throw error;
  }
}

/**
 * Reorder stage templates
 * POST /api/stage-templates/reorder
 */
export async function reorderStageTemplates(
  data: ReorderStageTemplatesRequest,
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/stage-templates/reorder`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error reordering stage templates:", error);
    throw error;
  }
}

/**
 * Seed default stage templates
 * POST /api/stage-templates/seed
 */
export async function seedStageTemplates(): Promise<{
  message: string;
  templates: StageTemplate[];
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stage-templates/seed`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; templates: StageTemplate[] }>(
      response,
    );
  } catch (error) {
    console.error("Error seeding stage templates:", error);
    throw error;
  }
}

// ==========================================
// Stage Task Matrix API Functions
// ==========================================

/**
 * Helper function to verify stage exists before creating matrix
 * This prevents race conditions when stage is just created
 */
async function verifyStageExists(
  projectId: string,
  stageIdentifier: string,
  maxAttempts: number = 5,
): Promise<boolean> {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const url = `${API_BASE_URL}/api/projects/${projectId}/stages`;
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const stages = data.stages || [];
        const exists = stages.some(
          (stage: any) =>
            stage.id === stageIdentifier ||
            stage.stageCode === stageIdentifier ||
            stage.stageTemplateId === stageIdentifier,
        );

        if (exists) {
          console.log(
            `[verifyStageExists] Stage "${stageIdentifier}" verified on attempt ${attempt}`,
          );
          return true;
        }
      }

      // Wait before next attempt with exponential backoff
      if (attempt < maxAttempts) {
        const waitTime = Math.min(1000 * Math.pow(1.5, attempt - 1), 3000);
        console.log(
          `[verifyStageExists] Stage not found yet, waiting ${waitTime}ms before retry ${attempt + 1}/${maxAttempts}`,
        );
        await delay(waitTime);
      }
    } catch (error) {
      console.warn(
        `[verifyStageExists] Error checking stage existence (attempt ${attempt}):`,
        error,
      );
      if (attempt < maxAttempts) {
        await delay(500 * attempt);
      }
    }
  }

  return false;
}

/**
 * Create a day-wise task matrix for a project stage with race condition protection
 * POST /api/projects/:projectId/stages/:stageIdentifier/matrix
 *
 * Note: The backend expects stageCode (e.g. "DESIGN_INITIAL_CONSULTATION")
 * as the stage identifier, consistent with other stage endpoints.
 *
 * This function includes retry logic with exponential backoff to handle
 * cases where the stage was just created and may not be fully committed yet.
 */
export async function createTaskMatrix(
  projectId: string,
  stageIdentifier: string,
  data: CreateMatrixRequest,
  verifyStage: boolean = true,
): Promise<CreateMatrixResponse> {
  const MAX_RETRIES = 3;
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // First, verify the stage exists if requested (default: true)
  if (verifyStage) {
    console.log(
      `[createTaskMatrix] Verifying stage "${stageIdentifier}" exists before creating matrix...`,
    );
    const stageExists = await verifyStageExists(projectId, stageIdentifier);
    if (!stageExists) {
      throw new Error(
        `Stage "${stageIdentifier}" not found after verification. The stage may not be fully created yet. Please try again in a moment.`,
      );
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${API_BASE_URL}/api/projects/${projectId}/stages/${stageIdentifier}/matrix`;
      console.log(
        `[createTaskMatrix] POST attempt ${attempt}/${MAX_RETRIES}:`,
        url,
        "payload",
        data,
      );

      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      console.log(
        `[createTaskMatrix] status ${response.status} on attempt ${attempt}`,
      );

      // Explicit 404 check - retry if it's a race condition, fail fast for genuine 404s
      if (response.status === 404) {
        let detail = "";
        try {
          const body = await response.json();
          detail = body.message || body.error || "";
        } catch {
          // ignore parse failure
        }

        const errorMsg =
          `404 Not Found: Stage "${stageIdentifier}" not found. ${detail}`.trim();
        console.warn(`[createTaskMatrix] ${errorMsg}`);

        // If verification passed but we still get 404, retry with exponential backoff
        if (attempt < MAX_RETRIES) {
          const waitTime = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
          console.log(
            `[createTaskMatrix] Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`,
          );
          await delay(waitTime);
          lastError = new Error(errorMsg);
          continue; // Retry
        } else {
          throw new Error(errorMsg);
        }
      }

      // For other errors or success, handle normally
      const result = await handleResponse<any>(response);
      console.log(`[createTaskMatrix] Success on attempt ${attempt}`);

      // Handle potential wrapper: { matrix, categories, tasks, message } or direct
      if (result.matrix && result.message)
        return result as CreateMatrixResponse;
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If it's a 404 and we have retries left, continue to next iteration
      if (lastError.message.includes("404") && attempt < MAX_RETRIES) {
        console.warn(
          `[createTaskMatrix] Attempt ${attempt} failed with 404, will retry...`,
        );
        continue;
      }

      // For non-404 errors, throw immediately
      if (!lastError.message.includes("404")) {
        console.error("Error creating task matrix (non-404):", error);
        throw error;
      }

      // Last attempt failed
      if (attempt === MAX_RETRIES) {
        console.error("Error creating task matrix after all retries:", error);
        throw error;
      }
    }
  }

  // Should not reach here, but throw last error if we do
  throw (
    lastError || new Error("Failed to create task matrix after all retries")
  );
}

/**
 * Get matrix by stage
 * GET /api/projects/:projectId/stages/:stageId/matrix
 * Returns null if no matrix exists (404)
 */
export async function getMatrixByStage(
  projectId: string,
  stageId: string,
): Promise<TaskMatrix | null> {
  try {
    const url = `${API_BASE_URL}/api/projects/${projectId}/stages/${stageId}/matrix`;
    console.log("[getMatrixByStage] GET", url);
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    console.log("[getMatrixByStage] status:", response.status);
    // 404 means no matrix exists yet — return null instead of throwing
    if (response.status === 404) {
      return null;
    }
    const result = await handleResponse<any>(response);
    return result.matrix || result;
  } catch (error) {
    console.error("Error fetching matrix by stage:", error);
    throw error;
  }
}

/**
 * Get matrix by ID
 * GET /api/matrices/:matrixId
 */
export async function getMatrixById(matrixId: string): Promise<TaskMatrix> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matrices/${matrixId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const result = await handleResponse<any>(response);
    return result.matrix || result;
  } catch (error) {
    console.error("Error fetching matrix:", error);
    throw error;
  }
}

/**
 * Update matrix
 * PUT /api/matrices/:matrixId
 */
export async function updateMatrix(
  matrixId: string,
  data: UpdateMatrixRequest,
): Promise<TaskMatrix> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matrices/${matrixId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<any>(response);
    return result.matrix || result;
  } catch (error) {
    console.error("Error updating matrix:", error);
    throw error;
  }
}

/**
 * Delete matrix
 * DELETE /api/matrices/:matrixId
 */
export async function deleteMatrix(
  matrixId: string,
): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matrices/${matrixId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error deleting matrix:", error);
    throw error;
  }
}

/**
 * List all matrices for a project
 * GET /api/projects/:projectId/matrices
 */
export async function getProjectMatrices(
  projectId: string,
): Promise<TaskMatrix[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/matrices`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<any>(response);
    if (Array.isArray(result)) return result;
    return result.matrices || [];
  } catch (error) {
    console.error("Error fetching project matrices:", error);
    throw error;
  }
}

/**
 * Get matrix progress stats
 * GET /api/matrices/:matrixId/stats
 */
export async function getMatrixStats(matrixId: string): Promise<MatrixStats> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/matrices/${matrixId}/stats`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<any>(response);
    return result.stats || result;
  } catch (error) {
    console.error("Error fetching matrix stats:", error);
    throw error;
  }
}

/**
 * Update task status
 * PUT /api/tasks/:taskId/status
 */
export async function updateMatrixTaskStatus(
  taskId: string,
  data: UpdateTaskStatusRequest,
): Promise<MatrixTask> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<any>(response);
    return result.task || result;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

/**
 * Update a matrix task's details (title, description, category, etc.)
 * PUT /api/tasks/:taskId
 */
export async function updateMatrixTask(
  taskId: string,
  data: UpdateMatrixTaskRequest,
): Promise<MatrixTask> {
  try {
    // Strip out undefined values to keep payload clean
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );
    console.log("[updateMatrixTask] PUT /api/tasks/" + taskId, cleanData);
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanData),
    });
    const result = await handleResponse<any>(response);
    return result.task || result;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

/**
 * Get task details
 * GET /api/tasks/:taskId
 */
export async function getMatrixTaskDetails(
  taskId: string,
): Promise<MatrixTask> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const result = await handleResponse<any>(response);
    return result.task || result;
  } catch (error) {
    console.error("Error fetching task details:", error);
    throw error;
  }
}

/**
 * Get tasks for a specific day
 * GET /api/matrices/:matrixId/day/:dayNumber
 */
export async function getMatrixDayTasks(
  matrixId: string,
  dayNumber: number,
): Promise<MatrixTask[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/matrices/${matrixId}/day/${dayNumber}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<any>(response);
    if (Array.isArray(result)) return result;
    return result.tasks || result.dayTasks || [];
  } catch (error) {
    console.error("Error fetching day tasks:", error);
    throw error;
  }
}

/**
 * Get tasks by category
 * GET /api/categories/:categoryId/tasks?matrixId=...
 */
export async function getCategoryTasks(
  categoryId: string,
  matrixId?: string,
): Promise<MatrixTask[]> {
  try {
    const params = matrixId ? `?matrixId=${matrixId}` : "";
    const response = await fetch(
      `${API_BASE_URL}/api/categories/${categoryId}/tasks${params}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<any>(response);
    if (Array.isArray(result)) return result;
    return result.tasks || [];
  } catch (error) {
    console.error("Error fetching category tasks:", error);
    throw error;
  }
}

/**
 * Upload attachment to a task (multipart)
 * POST /api/matrix-tasks/:taskId/attachments
 */
export async function uploadTaskAttachment(
  taskId: string,
  file: File,
  attachmentType: string,
  description?: string,
): Promise<TaskAttachment> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("attachmentType", attachmentType);
    if (description) {
      formData.append("description", description);
    }

    const token = localStorage.getItem("auth_token");
    const response = await fetch(
      `${API_BASE_URL}/api/matrix-tasks/${taskId}/attachments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );
    const result = await handleResponse<any>(response);
    console.log("[uploadTaskAttachment] Raw response:", result);
    // Handle various response shapes from the API
    const attachment =
      result.attachment || result.data?.attachment || result.data || result;
    return attachment;
  } catch (error) {
    console.error("Error uploading task attachment:", error);
    throw error;
  }
}

/**
 * List task attachments
 * GET /api/matrix-tasks/:taskId/attachments
 */
export async function getTaskAttachments(
  taskId: string,
): Promise<TaskAttachment[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/matrix-tasks/${taskId}/attachments`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<any>(response);
    console.log("[getTaskAttachments] Raw response:", result);
    // Handle various response shapes from the API
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.attachments)) return result.attachments;
    if (Array.isArray(result.data?.attachments)) return result.data.attachments;
    if (Array.isArray(result.data)) return result.data;
    console.warn("[getTaskAttachments] Unexpected response shape:", result);
    return [];
  } catch (error) {
    console.error("Error fetching task attachments:", error);
    throw error;
  }
}

/**
 * Delete attachment
 * DELETE /api/attachments/:attachmentId
 */
export async function deleteTaskAttachment(
  attachmentId: string,
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/attachments/${attachmentId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error deleting attachment:", error);
    throw error;
  }
}

/**
 * Send completion email to customer
 * POST /api/tasks/:taskId/notify-customer
 */
export async function notifyCustomerTaskComplete(
  taskId: string,
  data: NotifyCustomerRequest,
): Promise<NotifyCustomerResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/tasks/${taskId}/notify-customer`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    const result = await handleResponse<any>(response);
    return result.notification || result;
  } catch (error) {
    console.error("Error notifying customer:", error);
    throw error;
  }
}

/**
 * Get valid task statuses for matrix
 * GET /api/matrices/options/statuses
 */
export async function getMatrixTaskStatuses(): Promise<OptionItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/matrices/options/statuses`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<
      OptionItem[] | { statuses: OptionItem[] }
    >(response);
    if (Array.isArray(result)) return result;
    return (result as { statuses: OptionItem[] }).statuses || [];
  } catch (error) {
    console.error("Error fetching matrix task statuses:", error);
    throw error;
  }
}

/**
 * Get attachment types
 * GET /api/matrices/options/attachment-types
 */
export async function getMatrixAttachmentTypes(): Promise<OptionItem[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/matrices/options/attachment-types`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<
      OptionItem[] | { attachmentTypes: OptionItem[] }
    >(response);
    if (Array.isArray(result)) return result;
    return (result as { attachmentTypes: OptionItem[] }).attachmentTypes || [];
  } catch (error) {
    console.error("Error fetching attachment types:", error);
    throw error;
  }
}

// ==========================================
// Handover & Goodwill API Functions
// ==========================================

/**
 * Get handover activities for a project
 * GET /api/projects/:projectId/handover/activities
 */
export async function getHandoverActivities(
  projectId: string,
): Promise<HandoverActivity[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/handover/activities`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<
      HandoverActivity[] | { activities: HandoverActivity[] }
    >(response);
    if (Array.isArray(result)) return result;
    return (result as { activities: HandoverActivity[] }).activities || [];
  } catch (error) {
    console.error("Error fetching handover activities:", error);
    throw error;
  }
}

/**
 * Create a handover activity
 * POST /api/projects/:projectId/handover/activities
 */
export async function createHandoverActivity(
  projectId: string,
  data: CreateHandoverActivityRequest,
): Promise<HandoverActivity> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/handover/activities`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    const result = await handleResponse<any>(response);
    return result.activity || result;
  } catch (error) {
    console.error("Error creating handover activity:", error);
    throw error;
  }
}

/**
 * Update a handover activity
 * PUT /api/projects/:projectId/handover/activities/:activityId
 */
export async function updateHandoverActivity(
  projectId: string,
  activityId: string,
  data: UpdateHandoverActivityRequest,
): Promise<HandoverActivity> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/handover/activities/${activityId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    const result = await handleResponse<any>(response);
    return result.activity || result;
  } catch (error) {
    console.error("Error updating handover activity:", error);
    throw error;
  }
}

/**
 * Delete a handover activity
 * DELETE /api/projects/:projectId/handover/activities/:activityId
 */
export async function deleteHandoverActivity(
  projectId: string,
  activityId: string,
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/handover/activities/${activityId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error deleting handover activity:", error);
    throw error;
  }
}

/**
 * Seed default handover activities for a project
 * POST /api/projects/:projectId/handover/seed
 */
export async function seedHandoverActivities(
  projectId: string,
): Promise<HandoverActivity[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/handover/seed`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<
      HandoverActivity[] | { activities: HandoverActivity[] }
    >(response);
    if (Array.isArray(result)) return result;
    return (result as { activities: HandoverActivity[] }).activities || [];
  } catch (error) {
    console.error("Error seeding handover activities:", error);
    throw error;
  }
}

/**
 * Get handover photos for a project
 * GET /api/projects/:projectId/handover/photos
 */
export async function getHandoverPhotos(
  projectId: string,
): Promise<HandoverPhoto[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/handover/photos`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const result = await handleResponse<
      HandoverPhoto[] | { photos: HandoverPhoto[] }
    >(response);
    if (Array.isArray(result)) return result;
    return (result as { photos: HandoverPhoto[] }).photos || [];
  } catch (error) {
    console.error("Error fetching handover photos:", error);
    throw error;
  }
}

/**
 * Upload a handover photo
 * POST /api/projects/:projectId/handover/photos (multipart/form-data)
 */
export async function uploadHandoverPhoto(
  projectId: string,
  file: File,
  caption?: string,
  isPublic?: boolean,
): Promise<HandoverPhoto> {
  try {
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    formData.append("file", file);
    if (caption) formData.append("caption", caption);
    if (isPublic !== undefined) formData.append("isPublic", String(isPublic));

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/handover/photos`,
      {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      },
    );
    const result = await handleResponse<any>(response);
    return result.photo || result;
  } catch (error) {
    console.error("Error uploading handover photo:", error);
    throw error;
  }
}

/**
 * Delete a handover photo
 * DELETE /api/projects/:projectId/handover/photos/:photoId
 */
export async function deleteHandoverPhoto(
  projectId: string,
  photoId: string,
): Promise<{ message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/handover/photos/${photoId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Error deleting handover photo:", error);
    throw error;
  }
}

// Export all functions as a default object for easier imports
const ProjectAPI = {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStages,
  addProjectStage,
  updateProjectStage,
  deleteProjectStage,
  reorderProjectStages,
  getAvailableStages,
  getProjectPayments,
  updateProjectPayment,
  getProjectTasks,
  startProject,
  pauseProject,
  resumeProject,
  completeProject,
  cancelProject,
  getPauseStatus,
  // Project Options
  getProjectCategories,
  getBudgetTiers,
  getScopeTypes,
  getPipelineTypes,
  getPropertySubtypes,
  getProjectStatuses,
  getProjectStageOptions,
  getStageStatuses,
  getReferenceCategories,
  getReferenceTypes,
  // Project References
  getProjectReferences,
  getProjectReference,
  addLinkReference,
  uploadFileReference,
  updateProjectReference,
  deleteProjectReference,
  downloadProjectReference,
  // Testimonials
  getProjectTestimonials,
  getProjectTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  uploadTestimonialMedia,
  updateTestimonialStatus,
  listAllTestimonials,
  getTestimonialAnalytics,
  getTestimonialStatuses,
  // Stage Templates
  getStageTemplates,
  getStageTemplatePhaseTypes,
  getStageTemplate,
  createStageTemplate,
  updateStageTemplate,
  deleteStageTemplate,
  reorderStageTemplates,
  seedStageTemplates,
  // Stage Task Matrix
  createTaskMatrix,
  getMatrixByStage,
  getMatrixById,
  updateMatrix,
  deleteMatrix,
  getProjectMatrices,
  getMatrixStats,
  updateMatrixTaskStatus,
  updateMatrixTask,
  getMatrixTaskDetails,
  getMatrixDayTasks,
  getCategoryTasks,
  uploadTaskAttachment,
  getTaskAttachments,
  deleteTaskAttachment,
  notifyCustomerTaskComplete,
  getMatrixTaskStatuses,
  getMatrixAttachmentTypes,
  // Handover & Goodwill
  getHandoverActivities,
  createHandoverActivity,
  updateHandoverActivity,
  deleteHandoverActivity,
  seedHandoverActivities,
  getHandoverPhotos,
  uploadHandoverPhoto,
  deleteHandoverPhoto,
};

export default ProjectAPI;
