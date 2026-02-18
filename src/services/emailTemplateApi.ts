// Email Template API Service
// Uses shared fetchAPI from api.ts for consistent base URL, auth, and token refresh
import { fetchAPI } from "./api";

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

// ─── API Functions ────────────────────────────────────────────────

/**
 * List all email templates
 * GET /api/emails/templates
 */
export async function listTemplates(): Promise<EmailTemplate[]> {
  const data = await fetchAPI<ListTemplatesResponse | EmailTemplate[]>(
    "/api/emails/templates",
    { method: "GET" },
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
  return fetchAPI<EmailTemplate>(`/api/emails/templates/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

/**
 * Create a new email template
 * POST /api/emails/templates
 */
export async function createTemplate(
  data: CreateTemplateRequest,
): Promise<EmailTemplate> {
  return fetchAPI<EmailTemplate>("/api/emails/templates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing email template
 * PUT /api/emails/templates/:id
 */
export async function updateTemplate(
  id: string,
  data: UpdateTemplateRequest,
): Promise<EmailTemplate> {
  return fetchAPI<EmailTemplate>(`/api/emails/templates/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete an email template
 * DELETE /api/emails/templates/:id
 */
export async function deleteTemplate(id: string): Promise<void> {
  await fetchAPI<{ success: boolean; message?: string }>(
    `/api/emails/templates/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
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
