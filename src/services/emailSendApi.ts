// Email Send API Service
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ghs.oneweekmvps.com";

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

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
  const response = await fetch(`${API_BASE_URL}/api/emails/send`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<SendEmailResponse>(response);
}

export async function sendTemplateEmail(data: SendTemplateEmailRequest): Promise<SendEmailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/emails/send-template`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<SendEmailResponse>(response);
}

const EmailSendAPI = {
  sendEmail,
  sendTemplateEmail,
};

export default EmailSendAPI;
