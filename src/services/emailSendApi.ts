// Email Send API Service
// Uses shared fetchAPI from api.ts for consistent base URL, auth, and token refresh
import { fetchAPI } from "./api";

export interface SendEmailRequest {
  to: string;
  toName?: string;
  subject: string;
  templateName?: string;
  variables?: Record<string, string>;
  emailType?: string;
  projectId?: string;
  accountId?: string;
  htmlBody?: string;
  textBody?: string;
  cc?: string;
}

export interface SendTemplateEmailRequest {
  templateName: string;
  to: string;
  toName?: string;
  variables?: Record<string, string>;
  emailType?: string;
  accountId?: string;
  projectId?: string;
  subject?: string;
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
  messageId?: string;
}

export async function sendEmail(data: SendEmailRequest): Promise<SendEmailResponse> {
  return fetchAPI<SendEmailResponse>("/api/emails/send", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendTemplateEmail(data: SendTemplateEmailRequest): Promise<SendEmailResponse> {
  // Use the same /api/emails/send endpoint for template emails
  return fetchAPI<SendEmailResponse>("/api/emails/send", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

const EmailSendAPI = {
  sendEmail,
  sendTemplateEmail,
};

export default EmailSendAPI;
