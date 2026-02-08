import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Search,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { Card, Button, Badge, Progress } from "../../components/ui";
import { NewProjectModal } from "../../components/dashboard/NewProjectModal";
import { StageTemplatesPanel } from "../../components/dashboard/stages/StageTemplatesPanel";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";
import { useProjectStore } from "../../stores/projectStore";
import type { Project, CreateProjectRequest } from "../../types";
import toast from "react-hot-toast";

// --- Helper functions ---

const getStageLabel = (code: string | null | undefined): string => {
  if (!code) return "\u2014";
  const map: Record<string, string> = {
    ENQUIRY: "Enquiry",
    DESIGN_SIGNUP: "Design Signup",
    DESIGN: "Design",
    FIRST_PRESENTATION: "First Presentation",
    FINAL_DESIGN: "Final Design",
    COSTING: "Costing",
    EXECUTION: "Execution",
    HANDOVER: "Handover",
    TESTIMONIAL: "Testimonial",
  };
  return (
    map[code] ||
    code
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

const stageColors: Record<string, string> = {
  ENQUIRY: "bg-gray-100 text-gray-700",
  DESIGN_SIGNUP: "bg-blue-100 text-blue-700",
  DESIGN: "bg-blue-100 text-blue-700",
  FIRST_PRESENTATION: "bg-indigo-100 text-indigo-700",
  FINAL_DESIGN: "bg-violet-100 text-violet-700",
  COSTING: "bg-amber-100 text-amber-700",
  EXECUTION: "bg-orange-100 text-orange-700",
  HANDOVER: "bg-emerald-100 text-emerald-700",
  TESTIMONIAL: "bg-green-100 text-green-700",
};

const STAGE_ORDER = [
  "ENQUIRY",
  "DESIGN_SIGNUP",
  "DESIGN",
  "FIRST_PRESENTATION",
  "FINAL_DESIGN",
  "COSTING",
  "EXECUTION",
  "HANDOVER",
  "TESTIMONIAL",
];

const getProgressFromStage = (code: string | null | undefined): number => {
  if (!code) return 0;
  const idx = STAGE_ORDER.indexOf(code);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
};

const getStatusDisplay = (
  status: string,
): { key: "on_track" | "at_risk" | "delayed" | "completed"; label: string } => {
  switch (status) {
    case "ACTIVE":
    case "active":
      return { key: "on_track", label: "Active" };
    case "YET_TO_START":
      return { key: "on_track", label: "Yet to Start" };
    case "PAUSED":
    case "ON_HOLD":
    case "on_hold":
      return { key: "at_risk", label: "Paused" };
    case "CANCELLED":
      return { key: "delayed", label: "Cancelled" };
    case "COMPLETED":
    case "completed":
      return { key: "completed", label: "Completed" };
    default:
      return { key: "on_track", label: status };
  }
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> =
  {
    on_track: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    at_risk: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
    },
    delayed: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    completed: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
    },
  };

const formatCurrency = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return "\u20B90";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "\u20B90";
  if (num >= 10000000) return `\u20B9${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `\u20B9${(num / 100000).toFixed(0)}L`;
  if (num >= 1000) return `\u20B9${(num / 1000).toFixed(0)}K`;
  return `\u20B9${num}`;
};

const getInitials = (name: string | undefined | null): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const getTeamMembers = (
  project: Project,
): { initials: string; name: string }[] => {
  const members: { initials: string; name: string }[] = [];
  if (project.assignedDesigner?.name) {
    members.push({
      initials: getInitials(project.assignedDesigner.name),
      name: project.assignedDesigner.name,
    });
  }
  if (project.assignedPM?.name) {
    members.push({
      initials: getInitials(project.assignedPM.name),
      name: project.assignedPM.name,
    });
  }
  return members;
};

// --- Component ---

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);

  const { projects, isLoading, error, fetchProjects, addProject, clearError } =
    useProjectStore();

  const { selectedProject } = useProjectFilter();

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Apply both project filter and search filter
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by selected project from navbar
    if (selectedProject) {
      filtered = filtered.filter((p) => p.id === selectedProject.id);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.projectName || p.name || "").toLowerCase().includes(q) ||
          (p.lead?.name || "").toLowerCase().includes(q) ||
          (p.propertyCity || "").toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [projects, selectedProject, searchQuery]);

  // Compute stats from real data
  const stats = useMemo(() => {
    const totalProjects = projects.length;

    const inProgress = projects.filter(
      (p) =>
        p.status === "ACTIVE" ||
        p.status === "active" ||
        p.status === "YET_TO_START",
    ).length;

    const totalValue = projects.reduce((sum, p) => {
      const v =
        typeof p.totalValue === "string"
          ? parseFloat(p.totalValue)
          : p.totalValue || 0;
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

    const uniqueMembers = new Set<string>();
    projects.forEach((p) => {
      if (p.assignedDesigner?.id) uniqueMembers.add(p.assignedDesigner.id);
      if (p.assignedPM?.id) uniqueMembers.add(p.assignedPM.id);
    });

    return {
      totalProjects,
      inProgress,
      totalValue: formatCurrency(totalValue),
      teamMembers: uniqueMembers.size,
    };
  }, [projects]);

  const handleCreateProject = async (request: CreateProjectRequest) => {
    try {
      await addProject(request);
      toast.success("Project created successfully!");
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleViewDetails = (project: Project) => {
    navigate(`/dashboard/projects/${project.id}`);
  };

  // --- Loading State ---
  if (isLoading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading projects...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load projects
        </h3>
        <p className="text-gray-600 mb-4 text-center max-w-md">{error}</p>
        <Button
          className="rounded-xl"
          onClick={() => {
            clearError();
            fetchProjects();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filter Indicator */}
      {selectedProject && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {(selectedProject.name || "")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-orange-900">
                Viewing Filtered Projects
              </p>
              <p className="text-xs text-orange-700">
                {selectedProject.name} - {selectedProject.client}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage all interior design projects
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-white border border-gray-300 rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-colors ${
                view === "grid"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-2 rounded-lg transition-colors ${
                view === "table"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="outline"
            className="rounded-xl text-gray-600 border-gray-300 hover:bg-gray-50"
            onClick={() => setShowTemplatesPanel(true)}
          >
            <Settings2 className="w-4 h-4 mr-1" />
            Templates
          </Button>
          <Button className="rounded-xl" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalProjects}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.inProgress}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalValue}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.teamMembers}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Inline loading indicator for refetches */}
      {isLoading && projects.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Refreshing...
        </div>
      )}

      {/* Projects Grid */}
      {view === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const statusInfo = getStatusDisplay(project.status);
            const statusColor = statusColors[statusInfo.key];
            const stageCode = project.currentStageCode || "";
            const progress = getProgressFromStage(stageCode);
            const team = getTeamMembers(project);
            const displayName =
              project.projectName || project.name || "Untitled";
            const clientName = project.lead?.name || "\u2014";

            return (
              <Card
                key={project.id}
                className="p-5 rounded-xl hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{clientName}</p>
                  </div>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    className={`text-xs rounded-lg ${stageColors[stageCode] || "bg-gray-100 text-gray-700"}`}
                  >
                    {getStageLabel(stageCode)}
                  </Badge>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs ${statusColor.bg} ${statusColor.text}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}
                    />
                    {statusInfo.label}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created
                    </span>
                    <span className="font-medium">
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "\u2014"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Budget
                    </span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(project.totalValue)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex -space-x-2">
                    {team.length > 0 ? (
                      team.map((member, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                          title={member.name}
                        >
                          {member.initials}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => handleViewDetails(project)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProjects.map((project, index) => {
                  const statusInfo = getStatusDisplay(project.status);
                  const statusColor = statusColors[statusInfo.key];
                  const stageCode = project.currentStageCode || "";
                  const progress = getProgressFromStage(stageCode);
                  const team = getTeamMembers(project);
                  const displayName =
                    project.projectName || project.name || "Untitled";
                  const clientName = project.lead?.name || "\u2014";

                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-gradient-to-r hover:from-orange-50/40 hover:to-transparent transition-all group cursor-pointer ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      }`}
                      onClick={() => handleViewDetails(project)}
                    >
                      {/* Project Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                            {getInitials(displayName)}
                          </div>
                          <p className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                            {displayName}
                          </p>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 font-medium">
                          {clientName}
                        </p>
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Badge
                            className={`text-xs px-2.5 py-1 rounded-md font-semibold ${stageColors[stageCode] || "bg-gray-100 text-gray-700"}`}
                          >
                            {getStageLabel(stageCode)}
                          </Badge>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20">
                            <Progress value={progress} className="h-2" />
                          </div>
                          <span className="text-xs font-bold text-gray-900 min-w-[35px]">
                            {progress}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}
                            />
                            <span>{statusInfo.label}</span>
                          </div>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap">
                            {project.createdAt
                              ? new Date(project.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
                              : "\u2014"}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                            {formatCurrency(project.totalValue)}
                          </span>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          {team.length > 0 ? (
                            <div className="flex -space-x-1.5">
                              {team.map((member, idx) => (
                                <div
                                  key={idx}
                                  className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
                                  title={member.name}
                                >
                                  {member.initials}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              \u2014
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg hover:bg-orange-50 hover:text-orange-600 text-xs px-3 py-1.5 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(project);
                            }}
                          >
                            View
                          </Button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Grid Empty State */}
      {view === "grid" && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No projects found
          </h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Stage Templates Panel (Full-screen overlay) */}
      {showTemplatesPanel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <StageTemplatesPanel onBack={() => setShowTemplatesPanel(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
