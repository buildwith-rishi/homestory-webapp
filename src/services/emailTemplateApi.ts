// Email Template API Service
// Base URL should match your API documentation
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

console.log("Email Template API Base URL:", API_BASE_URL);

// ─── TypeScript Interfaces ────────────────────────────────────────

export interface EmailTemplateVariable {
  name: string;
  required: boolean;
  description?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  category: string;
  description?: string;
  variables?: EmailTemplateVariable[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  category: string;
  description?: string;
  variables?: EmailTemplateVariable[];
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  category?: string;
  description?: string;
  variables?: EmailTemplateVariable[];
}

export interface ListTemplatesResponse {
  templates: EmailTemplate[];
  total?: number;
  page?: number;
  limit?: number;
}

// ─── Helper Functions ─────────────────────────────────────────────

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
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// ─── API Functions ────────────────────────────────────────────────

/**
 * List all email templates
 * GET /api/emails/templates
 */
export async function listTemplates(): Promise<EmailTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/api/emails/templates`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<ListTemplatesResponse | EmailTemplate[]>(
    response,
  );

  // Handle both response formats: { templates: [...] } or [...]
  if (Array.isArray(data)) {
    return data;
  }
  return data.templates || [];
}

/**
 * Get a single email template by ID
 * GET /api/emails/templates/:id
 */
export async function getTemplateById(id: string): Promise<EmailTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/emails/templates/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse<EmailTemplate>(response);
}

/**
 * Create a new email template
 * POST /api/emails/templates
 */
export async function createTemplate(
  data: CreateTemplateRequest,
): Promise<EmailTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/emails/templates`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<EmailTemplate>(response);
}

/**
 * Update an existing email template
 * PUT /api/emails/templates/:id
 */
export async function updateTemplate(
  id: string,
  data: UpdateTemplateRequest,
): Promise<EmailTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/emails/templates/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<EmailTemplate>(response);
}

/**
 * Delete an email template
 * DELETE /api/emails/templates/:id
 */
export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/emails/templates/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await handleResponse<{ success: boolean; message?: string }>(response);
}

// ─── Default Export ───────────────────────────────────────────────

const EmailTemplateAPI = {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};

export default EmailTemplateAPI;
