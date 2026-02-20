import React, { useMemo, useState, useEffect } from "react";
import { differenceInDays, parseISO } from "date-fns";
import {
  FolderKanban,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  LayoutGrid,
  Plus,
  DollarSign,
  Wrench,
  FileCheck,
  Phone,
} from "lucide-react";
import { StatCard } from "../../components/dashboard/StatCard";
import { WelcomeBanner } from "../../components/dashboard/WelcomeBanner";
import { RevenueChart } from "../../components/dashboard/RevenueChart";
import { LeadSourceChart } from "../../components/dashboard/LeadSourceChart";
import { ActivityFeed } from "../../components/dashboard/ActivityFeed";
import { DashboardGrid } from "../../components/dashboard/DashboardGrid";
import { WidgetLibraryModal } from "../../components/dashboard/WidgetLibraryModal";
import { Card, Button, Badge, Progress } from "../../components/ui";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";
import { useUIStore } from "../../stores/uiStore";
import { useAuth } from "../../contexts/AuthContext";
import { getRoleDisplayName } from "../../config/rbac";
import { listProjects, getProjectStages } from "../../services/projectApi";
import type { Project, ProjectStageData } from "../../types";

export const DashboardOverview: React.FC = () => {
  const { selectedProject } = useProjectFilter();
  const { openWidgetLibrary } = useUIStore();
  const { can, canAny, roleId } = useAuth();
  const [showCustomWidgets, setShowCustomWidgets] = useState(false);
  const [pipelineTypeFilter, setPipelineTypeFilter] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStagesMap, setProjectStagesMap] = useState<
    Record<string, ProjectStageData[]>
  >({});
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await listProjects({ limit: 100 });
        // @ts-ignore - Handle potential API response structure variations
        const projectsData: Project[] = Array.isArray(data)
          ? data
          : (data as any).projects || [];
        setProjects(projectsData);

        // Fetch stages for all projects in parallel to get tentative dates
        const stageResults = await Promise.allSettled(
          projectsData.map((p) =>
            getProjectStages(p.id).then((res) => ({
              projectId: p.id,
              // @ts-ignore - API may return stages in different shapes
              stages: (Array.isArray(res)
                ? res
                : (res as any)?.stages || []) as ProjectStageData[],
            })),
          ),
        );
        const stagesMap: Record<string, ProjectStageData[]> = {};
        stageResults.forEach((result) => {
          if (result.status === "fulfilled") {
            stagesMap[result.value.projectId] = result.value.stages;
          }
        });
        setProjectStagesMap(stagesMap);
      } catch (error) {
        console.error("Failed to fetch projects", error);
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  // Pipeline type filter options for deadline filtering
  const pipelineTypeFilterOptions = [
    { value: "all", label: "All Projects" },
    { value: "DESIGN_ONLY", label: "Design Only" },
    { value: "DESIGN_AND_EXECUTION", label: "Design & Execution" },
  ];

  // Sparkline data for stat cards (last 7 days)
  const projectsSparkline = [18, 20, 19, 22, 21, 23, 24];
  const leadsSparkline = [58, 62, 59, 65, 63, 67, 68];
  const revenueSparkline = [38, 41, 39, 43, 42, 44, 45];
  const meetingsSparkline = [4, 6, 5, 7, 6, 4, 5];

  // Filter projects based on selection
  const filteredProjects = useMemo(() => {
    const allProjects = [
      {
        id: "1",
        name: "Modern 3BHK - Sharma Family",
        stage: "Design",
        progress: 65,
        color: "bg-blue-500",
      },
      {
        id: "2",
        name: "Luxury Villa - Kumar Residence",
        stage: "Execution",
        progress: 40,
        color: "bg-orange-500",
      },
      {
        id: "3",
        name: "Contemporary 2BHK - Patel Home",
        stage: "Material",
        progress: 75,
        color: "bg-purple-500",
      },
    ];

    if (!selectedProject) return allProjects;
    return allProjects.filter((p) => p.id === selectedProject.id);
  }, [selectedProject]);

  // Filter meetings based on selection (map to projects by name/client)
  const filteredMeetings = useMemo(() => {
    const allMeetings = [
      {
        time: "10:00 AM",
        client: "Rajesh Kumar",
        type: "Site Visit",
        status: "Upcoming",
        avatar: "RK",
        projectId: "2", // Kumar Residence
      },
      {
        time: "2:30 PM",
        client: "Priya Sharma",
        type: "Design Review",
        status: "Upcoming",
        avatar: "PS",
        projectId: "1", // Sharma Family
      },
      {
        time: "4:00 PM",
        client: "Amit Patel",
        type: "Consultation",
        status: "In Progress",
        avatar: "AP",
        projectId: "3", // Patel Home
      },
    ];

    if (!selectedProject) return allMeetings;
    return allMeetings.filter((m) => m.projectId === selectedProject.id);
  }, [selectedProject]);

  // All deadlines data
  const allDeadlines = useMemo(() => {
    return projects
      .filter((p) => {
        // Filter out completed or cancelled projects
        const status = p.status?.toUpperCase();
        if (status === "COMPLETED" || status === "CANCELLED") return false;
        return true;
      })
      .map((project) => {
        let deadlineDate: Date | null = null;
        let daysLeft = 9999; // Sort to bottom if no deadline
        let deadlineStr = "Schedule Pending";
        let deadlineLabel = "Project Deadline";

        // 1. Prefer the project-level tentative handover date
        if (project.tentativeHandoverDate) {
          deadlineDate = parseISO(project.tentativeHandoverDate);
          deadlineLabel = "Handover Deadline";
        }

        // 2. Fallback: derive from stages — use the current active/ongoing stage first,
        //    then the earliest pending stage that has a tentativeEndDate
        if (!deadlineDate) {
          const stages = projectStagesMap[project.id] || [];
          // Find current ongoing stage
          const ongoingStage = stages.find(
            (s) =>
              (s.status === "ONGOING" ||
                s.status === "IN_PROGRESS" ||
                s.status === "CURRENT") &&
              s.tentativeEndDate,
          );
          // Find earliest pending stage with a tentative date
          const pendingStages = stages
            .filter(
              (s) =>
                (s.status === "PENDING" || s.status === "NOT_STARTED") &&
                s.tentativeEndDate,
            )
            .sort((a, b) => {
              const da = a.tentativeEndDate
                ? new Date(a.tentativeEndDate).getTime()
                : Infinity;
              const db = b.tentativeEndDate
                ? new Date(b.tentativeEndDate).getTime()
                : Infinity;
              return da - db;
            });

          const targetStage = ongoingStage || pendingStages[0];
          if (targetStage?.tentativeEndDate) {
            deadlineDate = parseISO(targetStage.tentativeEndDate);
            deadlineLabel = targetStage.stageName || "Stage";
          }
        }

        if (deadlineDate) {
          daysLeft = differenceInDays(deadlineDate, new Date());
          deadlineStr = deadlineDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }

        let status = "no-deadline";
        if (deadlineDate) {
          status = "on-track";
          if (daysLeft < 0) status = "overdue";
          else if (daysLeft <= 3) status = "critical";
          else if (daysLeft <= 7) status = "urgent";
          else if (daysLeft <= 14) status = "warning";
        }

        // Format stage name
        const formattedStage = project.currentStageCode
          ? project.currentStageCode
              .replace(/_/g, " ")
              .toLowerCase()
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : "Unknown";

        return {
          id: project.id,
          name: project.projectName || project.name || "Untitled Project",
          deadline: deadlineStr,
          deadlineLabel,
          daysLeft,
          status,
          stage: formattedStage,
          pipelineType: project.pipelineType,
          progress: 50, // Default progress as it's not in Project type
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [projects, projectStagesMap]);

  // Filter deadlines based on selection
  const filteredDeadlines = useMemo(() => {
    let filtered = allDeadlines;

    // Filter by selected project if any
    if (selectedProject) {
      filtered = filtered.filter((d) => d.id === selectedProject.id);
    }

    // Filter by pipeline type
    if (pipelineTypeFilter !== "all") {
      filtered = filtered.filter((d) => d.pipelineType === pipelineTypeFilter);
    }

    return filtered;
  }, [allDeadlines, selectedProject, pipelineTypeFilter]);

  // Show filtered message when a specific project is selected
  const isFiltered = selectedProject !== null;

  return (
    <div className="space-y-4">
      {/* Widget Library Modal */}
      <WidgetLibraryModal />

      {/* Welcome Banner with Customize Option */}
      <div className="flex items-start justify-between gap-4">
        <WelcomeBanner />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant={showCustomWidgets ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowCustomWidgets(!showCustomWidgets)}
            className="rounded-xl whitespace-nowrap"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            {showCustomWidgets ? "Standard View" : "Custom Widgets"}
          </Button>
          {showCustomWidgets && (
            <Button
              variant="primary"
              size="sm"
              onClick={openWidgetLibrary}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
          )}
        </div>
      </div>

      {/* Custom Widget Grid (when enabled) */}
      {showCustomWidgets ? (
        <DashboardGrid />
      ) : (
        <>
          {/* Filter Indicator */}
          {isFiltered && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Viewing: {selectedProject?.name}
                </p>
                <p className="text-xs text-gray-600">
                  Dashboard data filtered for this project only
                </p>
              </div>
            </div>
          )}

          {/* Stat Cards Grid – role-aware */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Projects – visible to roles with projects.read */}
            {can("projects.read") && (
              <StatCard
                icon={FolderKanban}
                label="Active Projects"
                value={24}
                change={{ value: 12, isPositive: true }}
                iconColor="primary"
                sparklineData={projectsSparkline}
                animated={true}
              />
            )}

            {/* Leads – visible to roles with leads.read */}
            {can("leads.read") && (
              <StatCard
                icon={Users}
                label="Total Leads"
                value={68}
                change={{ value: 8, isPositive: true }}
                iconColor="teal"
                sparklineData={leadsSparkline}
                animated={true}
              />
            )}

            {/* Revenue – visible to admin/PM/accounts roles */}
            {canAny(["payments.*", "reports.view", "dashboard.*"]) && (
              <StatCard
                icon={TrendingUp}
                label="Revenue This Month"
                value="₹45.2L"
                change={{ value: 15, isPositive: true }}
                iconColor="olive"
                sparklineData={revenueSparkline}
              />
            )}

            {/* Meetings – visible to roles with meetings.read */}
            {can("meetings.read") && (
              <StatCard
                icon={Calendar}
                label="Meetings Today"
                value={5}
                iconColor="rose"
                sparklineData={meetingsSparkline}
                animated={true}
              />
            )}

            {/* Tasks – shown to Site Engineers & PMs */}
            {can("tasks.read") && !can("dashboard.*") && (
              <StatCard
                icon={CheckCircle}
                label="Tasks Due Today"
                value={7}
                change={{ value: 3, isPositive: false }}
                iconColor="primary"
                sparklineData={[3, 5, 4, 7, 6, 8, 7]}
                animated={true}
              />
            )}
          </div>

          {/* Charts Grid – only for roles with reports/dashboard access */}
          {canAny(["reports.view", "dashboard.*"]) && (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <RevenueChart />
              </div>
              <div>
                <LeadSourceChart />
              </div>
            </div>
          )}

          {/* Projects and Activity Grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="animate-scale-in">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Projects
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Track your ongoing projects
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All →
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                          {project.name}
                        </h3>
                        <Badge>{project.stage}</Badge>
                      </div>
                      <div className="space-y-2">
                        <Progress value={project.progress} />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {project.progress}% Complete
                          </span>
                          <span className="text-gray-500">Due in 12 days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProjects.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No projects found for the selected filter.</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="animate-scale-in">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Today's Meetings
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Your schedule for today
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Calendar →
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  {filteredMeetings.map((meeting, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
                        {meeting.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {meeting.time} - {meeting.client}
                        </p>
                        <p className="text-sm text-gray-600">{meeting.type}</p>
                      </div>
                      <Badge
                        variant={
                          meeting.status === "In Progress" ? "info" : "neutral"
                        }
                      >
                        {meeting.status}
                      </Badge>
                    </div>
                  ))}
                  {filteredMeetings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No meetings scheduled for the selected project.</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Project Deadlines Section */}
              <Card className="animate-scale-in">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Project Deadlines
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Upcoming project due dates
                        </p>
                      </div>
                      {/* Results Count Badge */}
                      <Badge
                        variant={
                          filteredDeadlines.length === 0
                            ? "neutral"
                            : filteredDeadlines.some(
                                  (d) =>
                                    d.status === "critical" ||
                                    d.status === "urgent",
                                )
                              ? "error"
                              : "info"
                        }
                      >
                        {filteredDeadlines.length}{" "}
                        {filteredDeadlines.length === 1
                          ? "Project"
                          : "Projects"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllDeadlines((prev) => !prev)}
                    >
                      {showAllDeadlines ? "Show Less ↑" : "View All →"}
                    </Button>
                  </div>

                  {/* Pipeline Type Filter Pills */}
                  <div className="flex items-center gap-2">
                    {pipelineTypeFilterOptions.map((option) => {
                      const count =
                        option.value === "all"
                          ? allDeadlines.length
                          : allDeadlines.filter(
                              (d) => d.pipelineType === option.value,
                            ).length;
                      const isActive = pipelineTypeFilter === option.value;

                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setPipelineTypeFilter(option.value);
                            setShowAllDeadlines(false);
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {option.label}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {count}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {(showAllDeadlines
                    ? filteredDeadlines
                    : filteredDeadlines.slice(0, 5)
                  ).map((project, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-all cursor-pointer ${
                        project.status === "critical" ||
                        project.status === "overdue"
                          ? "border-red-300 bg-red-50"
                          : project.status === "urgent"
                            ? "border-orange-300 bg-orange-50"
                            : project.status === "warning"
                              ? "border-yellow-300 bg-yellow-50"
                              : project.status === "no-deadline"
                                ? "border-gray-200 bg-gray-50/50"
                                : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      {/* Status Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          project.status === "critical" ||
                          project.status === "overdue"
                            ? "bg-red-100"
                            : project.status === "urgent"
                              ? "bg-orange-100"
                              : project.status === "warning"
                                ? "bg-yellow-100"
                                : project.status === "no-deadline"
                                  ? "bg-gray-100"
                                  : "bg-green-100"
                        }`}
                      >
                        {project.status === "critical" ||
                        project.status === "overdue" ||
                        project.status === "urgent" ? (
                          <AlertTriangle
                            className={`w-5 h-5 ${
                              project.status === "critical" ||
                              project.status === "overdue"
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          />
                        ) : project.status === "warning" ? (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        ) : project.status === "no-deadline" ? (
                          <Calendar className="w-5 h-5 text-gray-400" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {project.name}
                          </p>
                          <Badge
                            variant={
                              project.stage === "Design"
                                ? "info"
                                : project.stage === "Execution"
                                  ? "warning"
                                  : project.stage === "Handover"
                                    ? "success"
                                    : "neutral"
                            }
                            className="text-xs"
                          >
                            {project.stage}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress
                              value={project.progress}
                              className="h-1.5"
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {project.progress}%
                          </span>
                        </div>
                      </div>

                      {/* Deadline Info */}
                      <div className="text-right flex-shrink-0">
                        {project.status === "no-deadline" ? (
                          <>
                            <p className="text-sm font-semibold text-gray-500">
                              No deadline set
                            </p>
                            <p className="text-xs text-gray-400">
                              Schedule Pending
                            </p>
                          </>
                        ) : (
                          <>
                            <p
                              className={`text-sm font-semibold ${
                                project.status === "critical" ||
                                project.status === "overdue"
                                  ? "text-red-700"
                                  : project.status === "urgent"
                                    ? "text-orange-600"
                                    : project.status === "warning"
                                      ? "text-yellow-600"
                                      : "text-gray-700"
                              }`}
                            >
                              {project.deadline}
                            </p>
                            <p
                              className={`text-xs font-medium ${
                                project.status === "overdue"
                                  ? "text-red-500"
                                  : project.status === "critical" ||
                                      project.status === "urgent"
                                    ? "text-orange-500"
                                    : project.status === "warning"
                                      ? "text-yellow-500"
                                      : "text-gray-400"
                              }`}
                            >
                              {project.status === "overdue"
                                ? `${Math.abs(project.daysLeft)}d overdue`
                                : `${project.daysLeft}d left`}{" "}
                              · {project.deadlineLabel}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {!showAllDeadlines && filteredDeadlines.length > 5 && (
                    <button
                      onClick={() => setShowAllDeadlines(true)}
                      className="w-full py-2.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors border border-dashed border-orange-200 hover:border-orange-300"
                    >
                      + {filteredDeadlines.length - 5} more project
                      {filteredDeadlines.length - 5 !== 1 ? "s" : ""} — View All
                    </button>
                  )}
                  {filteredDeadlines.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">
                        No Deadlines Found
                      </p>
                      <p className="text-sm text-gray-500">
                        {pipelineTypeFilter !== "all"
                          ? `No "${pipelineTypeFilterOptions.find((o) => o.value === pipelineTypeFilter)?.label}" projects with upcoming deadlines.`
                          : "No upcoming deadlines for the selected filter."}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <ActivityFeed />
              <Card>
                <div className="p-4 border-b border-ash/10">
                  <h2 className="font-display text-display-sm text-secondary">
                    Lead Pipeline
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { stage: "New", count: 32, color: "ash" },
                    { stage: "Qualified", count: 18, color: "teal" },
                    { stage: "Meeting", count: 8, color: "olive" },
                    { stage: "Proposal", count: 5, color: "primary" },
                    { stage: "Won", count: 3, color: "teal" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-body text-sm text-secondary">
                        {item.stage}
                      </span>
                      <span className="font-body font-medium text-secondary">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="p-4 border-b border-ash/10">
                  <h2 className="font-display text-display-sm text-secondary">
                    Quick Actions
                  </h2>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <Button variant="ghost" className="h-20 flex flex-col gap-2">
                    <Calendar size={20} />
                    <span className="text-xs">Schedule Meeting</span>
                  </Button>
                  <Button variant="ghost" className="h-20 flex flex-col gap-2">
                    <Users size={20} />
                    <span className="text-xs">Add Lead</span>
                  </Button>
                  <Button variant="ghost" className="h-20 flex flex-col gap-2">
                    <FolderKanban size={20} />
                    <span className="text-xs">New Project</span>
                  </Button>
                  <Button variant="ghost" className="h-20 flex flex-col gap-2">
                    <TrendingUp size={20} />
                    <span className="text-xs">Send Update</span>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
