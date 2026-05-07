// Reports API Service
// Handles all report generation and retrieval operations

import { fetchAPI } from "./api";

const API_PREFIX = "/api/reports";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportMeta {
  id: string;
  projectId: string | null;
  projectName?: string;
  reportType: "DESIGN" | "EXECUTION" | "ACCOUNTS";
  fileName: string;
  reportUrl: string;
  fileSize: number;
  generatedAt: string;
  generatedBy?: { id: string; name: string };
  generatedById?: string;
  project?: { id: string; projectName: string; projectNumber: string };
}

export interface ReportListResponse {
  success: boolean;
  reports: ReportMeta[];
  pagination: { total: number; limit: number; offset: number };
}

export interface GenerateReportResponse {
  success: boolean;
  report: ReportMeta;
  data: Record<string, unknown>;
}

// ─── Generate Design Report ───────────────────────────────────────────────────

export interface DesignReportParams {
  sections?: string[];
  excludeSections?: string[];
  stageCode?: string;
  stageCodes?: string[];
  taskStatus?: string;
  taskStatuses?: string[];
  assignedTo?: string;
  userId?: string;
  role?: string;
  includeExternal?: boolean;
  varianceThreshold?: number;
  delayGainDays?: number;
  showVarianceOnly?: boolean;
  includeRisks?: boolean;
  overdueOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export async function generateDesignReport(
  projectId: string,
  params: DesignReportParams = {}
): Promise<GenerateReportResponse> {
  return fetchAPI<GenerateReportResponse>(
    `${API_PREFIX}/design/${projectId}`,
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

// ─── Generate Execution Report ────────────────────────────────────────────────

export interface ExecutionReportParams {
  sections?: string[];
  stageCode?: string;
  taskStatus?: string;
  includeRisks?: boolean;
  overdueOnly?: boolean;
}

export async function generateExecutionReport(
  projectId: string,
  params: ExecutionReportParams = {}
): Promise<GenerateReportResponse> {
  return fetchAPI<GenerateReportResponse>(
    `${API_PREFIX}/execution/${projectId}`,
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

// ─── Generate Accounts Report ─────────────────────────────────────────────────

export interface AccountsReportParams {
  projectId?: string;
}

export async function generateAccountsReport(
  params: AccountsReportParams = {}
): Promise<GenerateReportResponse> {
  return fetchAPI<GenerateReportResponse>(`${API_PREFIX}/accounts`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ─── List All Reports ─────────────────────────────────────────────────────────

export interface ListReportsParams {
  projectId?: string;
  reportType?: "DESIGN" | "EXECUTION" | "ACCOUNTS";
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export async function listReports(
  params: ListReportsParams = {}
): Promise<ReportListResponse> {
  const query = new URLSearchParams();
  if (params.projectId) query.set("projectId", params.projectId);
  if (params.reportType) query.set("reportType", params.reportType);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const qs = query.toString();
  return fetchAPI<ReportListResponse>(`${API_PREFIX}${qs ? `?${qs}` : ""}`);
}

// ─── Get Report By ID ─────────────────────────────────────────────────────────

export async function getReportById(id: string): Promise<ReportMeta & { success: boolean }> {
  return fetchAPI<ReportMeta & { success: boolean }>(`${API_PREFIX}/${id}`);
}

// ─── Get Reports By Project ───────────────────────────────────────────────────

export interface ProjectReportsParams {
  reportType?: "DESIGN" | "EXECUTION" | "ACCOUNTS";
  limit?: number;
  offset?: number;
}

export async function getReportsByProject(
  projectId: string,
  params: ProjectReportsParams = {}
): Promise<ReportListResponse> {
  const query = new URLSearchParams();
  if (params.reportType) query.set("reportType", params.reportType);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const qs = query.toString();
  return fetchAPI<ReportListResponse>(
    `${API_PREFIX}/project/${projectId}${qs ? `?${qs}` : ""}`
  );
}
