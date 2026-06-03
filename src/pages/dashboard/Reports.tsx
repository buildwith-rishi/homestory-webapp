import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  FileText,
  Download,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Hammer,
  ReceiptText,
  Clock,
  FolderOpen,
} from "lucide-react";
import { Card, Button } from "../../components/ui";
import toast from "react-hot-toast";
import {
  listReports,
  generateDesignReport,
  generateExecutionReport,
  generateAccountsReport,
  type ReportMeta,
  type ListReportsParams,
} from "../../services/reportsApi";
import { listProjects } from "../../services/projectApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const REPORT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  DESIGN: {
    label: "Design",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <Building2 className="w-4 h-4" />,
  },
  EXECUTION: {
    label: "Execution",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    icon: <Hammer className="w-4 h-4" />,
  },
  ACCOUNTS: {
    label: "Accounts",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <ReceiptText className="w-4 h-4" />,
  },
};

function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultAccountsDateFrom(): string {
  const d = new Date();
  d.setMonth(0, 1);
  return formatYmdLocal(d);
}

function defaultAccountsDateTo(): string {
  return formatYmdLocal(new Date());
}

// ─── Generate Report Modal ────────────────────────────────────────────────────

interface Project {
  id: string;
  projectName?: string;
  projectNumber?: string;
  name?: string;
}

interface GenerateModalProps {
  onClose: () => void;
  onGenerated: () => void;
}

function GenerateReportModal({ onClose, onGenerated }: GenerateModalProps) {
  const [reportType, setReportType] = useState<"DESIGN" | "EXECUTION" | "ACCOUNTS">(
    "DESIGN",
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [accountsDateFrom, setAccountsDateFrom] = useState(defaultAccountsDateFrom);
  const [accountsDateTo, setAccountsDateTo] = useState(defaultAccountsDateTo);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setProjectsLoading(true);
    listProjects({ limit: 200 })
      .then((res) => {
        const list: Project[] = Array.isArray(res)
          ? res
          : Array.isArray((res as { projects?: Project[] }).projects)
            ? (res as { projects: Project[] }).projects
            : [];
        setProjects(list);
      })
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (reportType === "ACCOUNTS") {
      if (!accountsDateFrom || !accountsDateTo) {
        toast.error("Please select both start and end dates");
        return;
      }
      if (accountsDateFrom > accountsDateTo) {
        toast.error("Start date must be on or before end date");
        return;
      }
      setGenerating(true);
      try {
        await generateAccountsReport({
          dateFrom: accountsDateFrom,
          dateTo: accountsDateTo,
        });
        toast.success("Report generated successfully!");
        onGenerated();
        onClose();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to generate report",
        );
      } finally {
        setGenerating(false);
      }
      return;
    }

    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }

    setGenerating(true);
    try {
      if (reportType === "DESIGN") {
        await generateDesignReport({ projectId: selectedProjectId });
      } else {
        await generateExecutionReport({ projectId: selectedProjectId });
      }
      toast.success("Report generated successfully!");
      onGenerated();
      onClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate report",
      );
    } finally {
      setGenerating(false);
    }
  };

  const generateDisabled =
    generating ||
    (reportType === "ACCOUNTS"
      ? !accountsDateFrom || !accountsDateTo
      : !selectedProjectId);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto ring-1 ring-black/5 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Generate Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pt-5 pb-4 max-h-[min(70vh,640px)] overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["DESIGN", "EXECUTION", "ACCOUNTS"] as const).map((type) => {
                const cfg = REPORT_TYPE_CONFIG[type];
                const active = reportType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setReportType(type);
                      setSelectedProjectId("");
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      active
                        ? `border-orange-500 bg-orange-50 ${cfg.color}`
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className={active ? cfg.color : "text-gray-400"}>
                      {cfg.icon}
                    </span>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {reportType === "ACCOUNTS" ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                Choose the reporting period. Both dates are required to generate
                an accounts report.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date from <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={accountsDateFrom}
                    onChange={(e) => setAccountsDateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date to <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={accountsDateTo}
                    onChange={(e) => setAccountsDateTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              {projectsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading projects…
                </div>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectNumber ? `${p.projectNumber} — ` : ""}
                      {p.projectName || p.name || p.id}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleGenerate()}
            disabled={generateDisabled}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

// ─── Report Row ───────────────────────────────────────────────────────────────

function ReportRow({ report }: { report: ReportMeta }) {
  const cfg = REPORT_TYPE_CONFIG[report.reportType] ?? REPORT_TYPE_CONFIG.DESIGN;

  const handleDownload = () => {
    if (!report.reportUrl) {
      toast.error("Download URL not available");
      return;
    }
    window.open(report.reportUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {/* Report Type */}
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.color}`}
        >
          {cfg.icon}
          {cfg.label}
        </span>
      </td>

      {/* File Name */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-900 font-medium truncate max-w-xs">
            {report.fileName || "—"}
          </span>
        </div>
      </td>

      {/* Project */}
      <td className="px-4 py-3.5">
        <span className="text-sm text-gray-700">
          {report.projectName ||
            report.project?.projectName ||
            (report.projectId ? (
              <span className="text-gray-400 text-xs font-mono">
                {report.projectId.slice(0, 8)}…
              </span>
            ) : (
              <span className="text-gray-400 italic text-xs">All Projects</span>
            ))}
        </span>
      </td>

      {/* Generated At */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(report.generatedAt)}
        </div>
      </td>

      {/* Generated By */}
      <td className="px-4 py-3.5">
        <span className="text-sm text-gray-600">
          {report.generatedBy?.name || "—"}
        </span>
      </td>

      {/* File Size */}
      <td className="px-4 py-3.5">
        <span className="text-sm text-gray-500">{formatBytes(report.fileSize)}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <button
          onClick={handleDownload}
          disabled={!report.reportUrl}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium hover:bg-orange-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </td>
    </tr>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"" | "DESIGN" | "EXECUTION" | "ACCOUNTS">("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterProjects, setFilterProjects] = useState<Project[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    listProjects({ limit: 200 })
      .then((res) => {
        const list: Project[] = Array.isArray(res)
          ? res
          : Array.isArray((res as { projects?: Project[] }).projects)
            ? (res as { projects: Project[] }).projects
            : [];
        setFilterProjects(list);
      })
      .catch(() => setFilterProjects([]));
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListReportsParams = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      };
      if (filterType) params.reportType = filterType;
      if (filterProjectId) params.projectId = filterProjectId;
      if (filterFrom) params.fromDate = filterFrom;
      if (filterTo) params.toDate = filterTo;

      const res = await listReports(params);
      const list = Array.isArray(res.reports) ? res.reports : [];
      setReports(list);
      setTotal(res.pagination?.total ?? list.length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load reports";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterProjectId, filterFrom, filterTo]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  // Client-side search filter
  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.fileName?.toLowerCase().includes(q) ||
      r.projectName?.toLowerCase().includes(q) ||
      r.project?.projectName?.toLowerCase().includes(q) ||
      r.reportType?.toLowerCase().includes(q) ||
      r.generatedBy?.name?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleClearFilters = () => {
    setFilterType("");
    setFilterProjectId("");
    setFilterFrom("");
    setFilterTo("");
    setSearchQuery("");
    setPage(0);
  };

  const hasActiveFilters = filterType || filterProjectId || filterFrom || filterTo;

  // Summary counts
  const designCount = reports.filter((r) => r.reportType === "DESIGN").length;
  const executionCount = reports.filter((r) => r.reportType === "EXECUTION").length;
  const accountsCount = reports.filter((r) => r.reportType === "ACCOUNTS").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Generate and download Design, Execution, and Accounts reports
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Design */}
        <Card className="p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                Design Reports
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? "—" : designCount}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">This page</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Execution */}
        <Card className="p-4 rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                Execution Reports
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? "—" : executionCount}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">This page</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* Accounts */}
        <Card className="p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                Accounts Reports
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? "—" : accountsCount}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">This page</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ReceiptText className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search Bar */}
      <Card className="p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by file name, project, or type…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as typeof filterType);
              setPage(0);
            }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white min-w-[160px]"
          >
            <option value="">All Types</option>
            <option value="DESIGN">Design</option>
            <option value="EXECUTION">Execution</option>
            <option value="ACCOUNTS">Accounts</option>
          </select>

          {/* Toggle date filters */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              hasActiveFilters
                ? "border-orange-400 bg-orange-50 text-orange-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={() => void fetchReports()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Date Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 items-end">
            <div className="min-w-[200px] flex-1 sm:flex-initial">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Project
              </label>
              <select
                value={filterProjectId}
                onChange={(e) => {
                  setFilterProjectId(e.target.value);
                  setPage(0);
                }}
                className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">All projects</option>
                {filterProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber ? `${p.projectNumber} — ` : ""}
                    {p.projectName || p.name || p.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => {
                  setFilterFrom(e.target.value);
                  setPage(0);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => {
                  setFilterTo(e.target.value);
                  setPage(0);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Reports Table */}
      <Card className="rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <p className="text-sm font-medium text-gray-700">
            {loading
              ? "Loading…"
              : `${filteredReports.length} report${filteredReports.length !== 1 ? "s" : ""}${
                  total > PAGE_SIZE ? ` (${total} total)` : ""
                }`}
          </p>
          {total > PAGE_SIZE && (
            <p className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm text-gray-500">Loading reports…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void fetchReports()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredReports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FolderOpen className="w-12 h-12 text-gray-300" />
            <p className="text-base font-medium text-gray-500">
              No reports found
            </p>
            <p className="text-sm text-gray-400">
              {hasActiveFilters || searchQuery
                ? "Try adjusting your filters"
                : "Generate your first report using the button above"}
            </p>
            {!hasActiveFilters && !searchQuery && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowGenerateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && !error && filteredReports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Generated At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Generated By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.map((report) => (
                  <ReportRow key={report.id} report={report} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum =
                  totalPages <= 5
                    ? i
                    : page < 3
                    ? i
                    : page > totalPages - 4
                    ? totalPages - 5 + i
                    : page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === page
                        ? "bg-orange-500 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateReportModal
          onClose={() => setShowGenerateModal(false)}
          onGenerated={() => {
            setPage(0);
            void fetchReports();
          }}
        />
      )}
    </div>
  );
};
