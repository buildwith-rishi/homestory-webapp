// Reports API — POST /api/reports/design|execution|accounts; GET /api/reports; GET /api/reports/:id

import { fetchAPI } from "./api";

const API_PREFIX = "/api/reports";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportCategoryApi = "DESIGN" | "EXECUTION" | "ACCOUNTS";

export interface ReportMeta {
  id: string;
  projectId: string | null;
  projectName?: string;
  reportType: ReportCategoryApi;
  fileName: string;
  reportUrl: string;
  fileSize: number;
  /** Normalized from API `createdAt` or `generatedAt` */
  generatedAt: string;
  generatedBy?: { id: string; name: string };
  generatedById?: string;
  project?: { id: string; projectName: string; projectNumber?: string };
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

export interface ListReportsParams {
  projectId?: string;
  reportType?: ReportCategoryApi;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

/** POST /api/reports/design */
export interface GenerateDesignReportBody {
  projectId: string;
}

/** POST /api/reports/execution */
export interface GenerateExecutionReportBody {
  projectId: string;
}

/** POST /api/reports/accounts */
export interface GenerateAccountsReportBody {
  dateFrom: string;
  dateTo: string;
}

// ─── Normalization ────────────────────────────────────────────────────────────

function pickGeneratedAt(raw: Record<string, unknown>): string {
  const created = raw.createdAt;
  const generated = raw.generatedAt;
  if (typeof created === "string" && created) return created;
  if (typeof generated === "string" && generated) return generated;
  return "";
}

function pickGeneratedBy(
  raw: Record<string, unknown>,
): { id: string; name: string } | undefined {
  const direct = raw.generatedBy;
  if (direct && typeof direct === "object") {
    const g = direct as Record<string, unknown>;
    const id = String(g.id ?? g.userId ?? "");
    const name = String(g.name ?? g.fullName ?? g.full_name ?? "");
    if (id || name) return { id, name: name || "—" };
  }
  const user = raw.createdBy ?? raw.user ?? raw.generatedByUser;
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    const id = String(u.id ?? "");
    const name = String(u.name ?? u.fullName ?? u.email ?? "");
    if (id || name) return { id, name: name || "—" };
  }
  return undefined;
}

function normalizeReportMeta(raw: Record<string, unknown>): ReportMeta {
  const project = raw.project;
  let projectObj: ReportMeta["project"];
  if (project && typeof project === "object") {
    const p = project as Record<string, unknown>;
    projectObj = {
      id: String(p.id ?? ""),
      projectName: String(p.projectName ?? p.name ?? ""),
      projectNumber: p.projectNumber ? String(p.projectNumber) : undefined,
    };
  }

  const pid =
    raw.projectId != null ? String(raw.projectId) : projectObj?.id ?? null;

  const generatedBy = pickGeneratedBy(raw);

  const rtUpper = String(raw.reportType ?? "").toUpperCase();
  const reportType: ReportCategoryApi =
    rtUpper === "EXECUTION" || rtUpper === "ACCOUNTS" || rtUpper === "DESIGN"
      ? rtUpper
      : "DESIGN";

  return {
    id: String(raw.id ?? ""),
    projectId: pid && pid !== "null" ? pid : null,
    projectName:
      typeof raw.projectName === "string"
        ? raw.projectName
        : projectObj?.projectName,
    reportType,
    fileName: String(raw.fileName ?? ""),
    reportUrl: String(raw.reportUrl ?? ""),
    fileSize: Number(raw.fileSize ?? 0),
    generatedAt: pickGeneratedAt(raw),
    generatedBy,
    generatedById:
      typeof raw.generatedById === "string"
        ? raw.generatedById
        : generatedBy?.id,
    project: projectObj,
  };
}

function normalizeGeneratePayload(raw: unknown): GenerateReportResponse {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const reportNested = obj.report;
  const reportSource =
    reportNested && typeof reportNested === "object"
      ? (reportNested as Record<string, unknown>)
      : obj;

  const report = normalizeReportMeta(reportSource);

  const dataRaw = obj.data;
  const data =
    dataRaw && typeof dataRaw === "object" && !Array.isArray(dataRaw)
      ? (dataRaw as Record<string, unknown>)
      : {};

  return {
    success: obj.success !== false,
    report,
    data,
  };
}

function extractReportsArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;

  if (Array.isArray(o.reports)) return o.reports;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.results)) return o.results;

  const data = o.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.reports)) return d.reports;
    if (Array.isArray(d.items)) return d.items;
  }
  return [];
}

function normalizeReportListPayload(
  raw: unknown,
  params: ListReportsParams,
): ReportListResponse {
  const reportsRaw = extractReportsArray(raw);
  const meta =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  let pagination = meta.pagination as
    | Record<string, unknown>
    | undefined;

  if (!pagination && meta.data && typeof meta.data === "object") {
    pagination = (meta.data as Record<string, unknown>).pagination as
      | Record<string, unknown>
      | undefined;
  }

  const limit =
    typeof pagination?.limit === "number"
      ? pagination.limit
      : params.limit ?? 20;
  const offset =
    typeof pagination?.offset === "number"
      ? pagination.offset
      : params.offset ?? 0;

  let total: number | undefined =
    typeof pagination?.total === "number" ? pagination.total : undefined;

  if (total == null && typeof meta.total === "number") total = meta.total;

  const reports = reportsRaw
    .filter((r): r is Record<string, unknown> => r != null && typeof r === "object")
    .map((r) => normalizeReportMeta(r));

  if (total == null) total = reports.length;

  return {
    success: meta.success !== false,
    reports,
    pagination: { total, limit, offset },
  };
}

// ─── Generate ─────────────────────────────────────────────────────────────────

export async function generateDesignReport(
  body: GenerateDesignReportBody,
): Promise<GenerateReportResponse> {
  const raw = await fetchAPI<unknown>(`${API_PREFIX}/design`, {
    method: "POST",
    body: JSON.stringify({ projectId: body.projectId }),
  });
  return normalizeGeneratePayload(raw);
}

export async function generateExecutionReport(
  body: GenerateExecutionReportBody,
): Promise<GenerateReportResponse> {
  const raw = await fetchAPI<unknown>(`${API_PREFIX}/execution`, {
    method: "POST",
    body: JSON.stringify({ projectId: body.projectId }),
  });
  return normalizeGeneratePayload(raw);
}

export async function generateAccountsReport(
  body: GenerateAccountsReportBody,
): Promise<GenerateReportResponse> {
  const raw = await fetchAPI<unknown>(`${API_PREFIX}/accounts`, {
    method: "POST",
    body: JSON.stringify({
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
    }),
  });
  return normalizeGeneratePayload(raw);
}

// ─── List / detail ─────────────────────────────────────────────────────────────

export async function listReports(
  params: ListReportsParams = {},
): Promise<ReportListResponse> {
  const query = new URLSearchParams();
  if (params.projectId) query.set("projectId", params.projectId);
  if (params.reportType) query.set("reportType", params.reportType);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const qs = query.toString();
  const raw = await fetchAPI<unknown>(`${API_PREFIX}${qs ? `?${qs}` : ""}`);
  return normalizeReportListPayload(raw, params);
}

export async function getReportById(id: string): Promise<ReportMeta> {
  const raw = await fetchAPI<unknown>(`${API_PREFIX}/${id}`);
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const inner = obj.report;
  const src =
    inner && typeof inner === "object"
      ? (inner as Record<string, unknown>)
      : obj;
  return normalizeReportMeta(src);
}
