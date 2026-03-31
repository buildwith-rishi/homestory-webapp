import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  differenceInDays,
  parseISO,
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "date-fns";
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
  Phone,
  Hammer,
  PaintBucket,
  ReceiptText,
  UserCog,
  BarChart3,
} from "lucide-react";
import { StatCard } from "../../components/dashboard/StatCard";
import { WelcomeBanner } from "../../components/dashboard/WelcomeBanner";
import { RevenueChart } from "../../components/dashboard/RevenueChart";
import { LeadSourceChart } from "../../components/dashboard/LeadSourceChart";
import { DashboardGrid } from "../../components/dashboard/DashboardGrid";
import { WidgetLibraryModal } from "../../components/dashboard/WidgetLibraryModal";
import { WIDGET_REGISTRY } from "../../components/dashboard/widgets";
import { Card, Button, Badge, Progress } from "../../components/ui";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";
import { useUIStore } from "../../stores/uiStore";
import { useAuth } from "../../contexts/AuthContext";
import { getProjectStages, getAllPayments } from "../../services/projectApi";
import { listMeetings } from "../../services/meetingApi";
import { listLeads } from "../../services/leadApi";
import { getUpcomingTasks } from "../../services/tasksApi";
import { useProjectStore } from "../../stores/projectStore";
import type { ProjectStageData, Meeting } from "../../types";

export const DashboardOverview: React.FC = () => {
  const { selectedProject } = useProjectFilter();
  const { openWidgetLibrary, dashboardWidgets } = useUIStore();
  const { can, canAny, roleId } = useAuth();
  const navigate = useNavigate();
  // Use the shared project store so Dashboard and Projects page always see the same data
  const {
    projects,
    fetchProjects: fetchProjectsFromStore,
    isLoading: projectsLoading,
  } = useProjectStore();

  // DESIGNER role: redirect away from Dashboard overview to Projects
  useEffect(() => {
    if (roleId === "DESIGNER") {
      navigate("/dashboard/projects", { replace: true });
    }
  }, [roleId, navigate]);
  const [showCustomWidgets, setShowCustomWidgets] = useState(false);
  const canAddMoreWidgets =
    new Set(dashboardWidgets.map((w) => w.widgetId)).size <
    WIDGET_REGISTRY.length;
  const [pipelineTypeFilter, setPipelineTypeFilter] = useState<string>("all");
  const [projectCategoryFilter, setProjectCategoryFilter] =
    useState<string>("all");
  const [projectStagesMap, setProjectStagesMap] = useState<
    Record<string, ProjectStageData[]>
  >({});
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const [todaysMeetings, setTodaysMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [revenueThisMonth, setRevenueThisMonth] = useState<number>(0);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [tasksDueToday, setTasksDueToday] = useState<number>(0);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);

  useEffect(() => {
    // Use the shared store fetch (same call as the Projects page)
    fetchProjectsFromStore();
  }, [fetchProjectsFromStore]);

  // Fetch stages for all projects in parallel (for the deadlines section)
  useEffect(() => {
    if (projects.length === 0) return;
    const fetchStages = async () => {
      try {
        const stageResults = await Promise.allSettled(
          projects.map((p) =>
            getProjectStages(p.id).then((res) => ({
              projectId: p.id,
              // @ts-ignore
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
        console.error("Failed to fetch project stages", error);
      }
    };
    fetchStages();
  }, [projects]);

  // Pipeline type filter options for deadline filtering
  const pipelineTypeFilterOptions = [
    { value: "all", label: "All Projects" },
    { value: "DESIGN_ONLY", label: "Architecture" },
    { value: "DESIGN_AND_EXECUTION", label: "Interiors" },
  ];

  // Sub-category options shown when Architecture or Interiors is selected
  const projectCategoryOptions = [
    { value: "all", label: "All" },
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "COMMERCIAL", label: "Commercial" },
  ];

  // Sparkline data for stat cards (last 7 days)
  const projectsSparkline = [18, 20, 19, 22, 21, 23, 24];
  const leadsSparkline = [58, 62, 59, 65, 63, 67, 68];
  const revenueSparkline = [38, 41, 39, 43, 42, 44, 45];
  const meetingsSparkline = [4, 6, 5, 7, 6, 4, 5];

  // Derive stats from projects — same logic as the Projects page
  const totalProjectsCount = projects.length;

  // Fetch total leads count
  useEffect(() => {
    const fetchLeads = async () => {
      setLeadsLoading(true);
      try {
        const res = await listLeads({ limit: 1 });
        setTotalLeads(res.total || 0);
      } catch (err) {
        console.error("Failed to fetch leads count", err);
      } finally {
        setLeadsLoading(false);
      }
    };
    fetchLeads();
  }, []);

  // Fetch revenue this month
  useEffect(() => {
    const fetchRevenue = async () => {
      setRevenueLoading(true);
      try {
        const today = new Date();
        const res = await getAllPayments({
          dateFrom: startOfMonth(today).toISOString(),
          dateTo: endOfMonth(today).toISOString(),
          limit: 500,
        });
        const payments = res.payments || [];
        const total = payments.reduce((sum, p) => {
          const s = (p.status || "").toUpperCase();
          if (s !== "COLLECTED" && s !== "PARTIALLY_PAID") return sum;
          return (
            sum + Number(p.actualAmount ?? p.invoiceAmount ?? p.amount ?? 0)
          );
        }, 0);
        setRevenueThisMonth(total);
        // Count pending/overdue payments for ACCOUNTS role
        const pending = payments.filter((p) => {
          const s = (p.status || "").toUpperCase();
          return s === "PENDING" || s === "OVERDUE";
        }).length;
        setPendingPaymentsCount(pending);
      } catch (err) {
        console.error("Failed to fetch revenue", err);
      } finally {
        setRevenueLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  // Fetch tasks due today
  useEffect(() => {
    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const tasks = await getUpcomingTasks();
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const dueToday = tasks.filter((t) =>
          t.dueDate ? t.dueDate.slice(0, 10) === todayStr : false,
        ).length;
        setTasksDueToday(dueToday);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Format revenue for display
  const formatRevenue = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };
  useEffect(() => {
    const fetchTodaysMeetings = async () => {
      setMeetingsLoading(true);
      try {
        const today = new Date();
        const response = await listMeetings({
          dateFrom: startOfDay(today).toISOString(),
          dateTo: endOfDay(today).toISOString(),
          limit: 50,
        });
        setTodaysMeetings(response.meetings);
      } catch (err) {
        console.error("Failed to fetch today's meetings", err);
        setTodaysMeetings([]);
      } finally {
        setMeetingsLoading(false);
      }
    };
    fetchTodaysMeetings();
  }, []);

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
          projectCategory: project.projectCategory,
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

    // Filter by project category (Residential / Commercial)
    if (projectCategoryFilter !== "all") {
      filtered = filtered.filter(
        (d) =>
          (d as any).projectCategory?.toUpperCase() === projectCategoryFilter,
      );
    }

    return filtered;
  }, [
    allDeadlines,
    selectedProject,
    pipelineTypeFilter,
    projectCategoryFilter,
  ]);

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
              disabled={!canAddMoreWidgets}
            >
              <Plus className="w-4 h-4 mr-2" />
              {canAddMoreWidgets ? "Add Widget" : "All Widgets Added"}
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

          {/* Role-Specific Quick Actions Banner */}
          {roleId === "SITE_ENGINEER" && (
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                    <Hammer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Site Engineer Dashboard
                    </p>
                    <p className="text-xs text-gray-600">
                      Track tasks, upload photos, and report issues from the
                      field
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/app")}
                    className="rounded-xl"
                  >
                    Open Mobile View
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/app/issues/report")}
                    className="rounded-xl"
                  >
                    Report Issue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {roleId === "ACCOUNTS" && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                    <ReceiptText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Finance & Accounts View
                    </p>
                    <p className="text-xs text-gray-600">
                      Payment tracking, invoices, and financial reports
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/dashboard/analytics")}
                    className="rounded-xl"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" /> Reports
                  </Button>
                </div>
              </div>
            </div>
          )}

          {(roleId === "DESIGNER" || roleId === "DESIGN_HEAD") && (
            <div className="bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
                    <PaintBucket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {roleId === "DESIGN_HEAD"
                        ? "Lead Designer Overview"
                        : "Designer Workspace"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Manage design tasks, project stages and deliverables
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/dashboard/projects")}
                    className="rounded-xl"
                  >
                    View Projects
                  </Button>
                  {roleId === "DESIGN_HEAD" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate("/dashboard/users")}
                      className="rounded-xl"
                    >
                      <UserCog className="w-4 h-4 mr-1" /> Manage Team
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {(roleId === "BDR" || roleId === "SALES") && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-100 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {roleId === "SALES" ? "Sales Workspace" : "BDR Workspace"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Lead pipeline, follow-ups, and meeting scheduling
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/dashboard/leads")}
                    className="rounded-xl"
                  >
                    View Leads
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/bdr")}
                    className="rounded-xl"
                  >
                    {roleId === "SALES" ? "Open Sales App" : "Open BDR App"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stat Cards Grid – role-aware */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Projects – visible to roles with projects.read */}
            {can("projects.read") && (
              <StatCard
                icon={FolderKanban}
                label="Total Projects"
                value={totalProjectsCount}
                loading={projectsLoading}
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
                value={totalLeads}
                loading={leadsLoading}
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
                value={formatRevenue(revenueThisMonth)}
                loading={revenueLoading}
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
                value={todaysMeetings.length}
                loading={meetingsLoading}
                iconColor="rose"
                sparklineData={meetingsSparkline}
                animated={true}
              />
            )}

            {/* Tasks – shown to Site Engineers, Designers & PMs */}
            {can("tasks.read") && !can("dashboard.*") && (
              <StatCard
                icon={CheckCircle}
                label="Tasks Due Today"
                value={tasksDueToday}
                loading={tasksLoading}
                change={{ value: 3, isPositive: false }}
                iconColor="primary"
                sparklineData={[3, 5, 4, 7, 6, 8, 7]}
                animated={true}
              />
            )}

            {/* Payments – shown to ACCOUNTS */}
            {roleId === "ACCOUNTS" && (
              <StatCard
                icon={DollarSign}
                label="Pending Payments"
                value={pendingPaymentsCount}
                loading={revenueLoading}
                change={{ value: 2, isPositive: false }}
                iconColor="teal"
                sparklineData={[5, 8, 7, 9, 10, 11, 12]}
                animated={true}
              />
            )}
          </div>

          {/* Dashboard Content Grid */}
          <div className="space-y-8">
            {/* Full Row: Revenue Chart */}
            {canAny(["reports.view", "dashboard.*"]) && (
              <div className="w-full">
                <RevenueChart />
              </div>
            )}

            {/* Second Row: Lead Sources & Project Deadlines */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Lead Sources & Payments */}
              <div className="space-y-8 flex flex-col h-full">
                {canAny(["reports.view", "dashboard.*"]) && (
                    <div className="flex-1 w-full h-full min-h-[450px]">
                      <LeadSourceChart />
                    </div>
                )}

                {/* Payments summary – only for ACCOUNTS role */}
                {roleId === "ACCOUNTS" && (
                  <Card>
                    <div className="p-4 border-b border-ash/10">
                      <h2 className="font-display text-display-sm text-secondary flex items-center gap-2">
                        <ReceiptText className="w-4 h-4 text-green-600" />
                        Payments Summary
                      </h2>
                    </div>
                    <div className="p-4 space-y-3">
                      {[
                        {
                          label: "Received",
                          count: "₹18.4L",
                          color: "text-green-600",
                        },
                        {
                          label: "Pending",
                          count: "₹7.2L",
                          color: "text-orange-500",
                        },
                        {
                          label: "Overdue",
                          count: "₹2.1L",
                          color: "text-red-500",
                        },
                        {
                          label: "This Month",
                          count: "₹9.8L",
                          color: "text-blue-600",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <span className="font-body text-sm text-secondary">
                            {item.label}
                          </span>
                          <span
                            className={`font-body font-semibold text-sm ${item.color}`}
                          >
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column: Project Deadlines Section – gated by projects.read */}
              <div className="flex flex-col h-full w-full">
                {can("projects.read") && (
                  <Card className="animate-scale-in flex flex-col h-full w-full bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="px-6 pt-6 border-b border-gray-100 bg-white shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
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

                  {/* Pipeline Type Filter Pills (Level 1) */}
                  <div className="flex items-center gap-2 flex-wrap">
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
                            setProjectCategoryFilter("all");
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

                  {/* Sub-category Filter Pills (Level 2) – shown when Architecture or Interiors selected */}
                  {pipelineTypeFilter !== "all" && (
                    <div className="flex items-center gap-2 mt-2 pl-1">
                      <span className="text-xs text-gray-400 font-medium mr-1">
                        {pipelineTypeFilter === "DESIGN_ONLY"
                          ? "Architecture"
                          : "Interiors"}
                        :
                      </span>
                      {projectCategoryOptions.map((cat) => {
                        const baseFiltered = allDeadlines.filter(
                          (d) => d.pipelineType === pipelineTypeFilter,
                        );
                        const catCount =
                          cat.value === "all"
                            ? baseFiltered.length
                            : baseFiltered.filter(
                                (d) =>
                                  (
                                    d as any
                                  ).projectCategory?.toUpperCase() ===
                                  cat.value,
                              ).length;
                        const isCatActive =
                          projectCategoryFilter === cat.value;

                        return (
                          <button
                            key={cat.value}
                            onClick={() => {
                              setProjectCategoryFilter(cat.value);
                              setShowAllDeadlines(false);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                              isCatActive
                                ? "bg-orange-100 text-orange-700 border border-orange-300"
                                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {cat.label}
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                                  isCatActive
                                    ? "bg-orange-200 text-orange-700"
                                    : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {catCount}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex-1 px-6 md:px-8 pb-6 pt-6 space-y-4 overflow-y-auto custom-scrollbar bg-white">
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
                      onClick={() => navigate("/dashboard/projects")}
                      className="w-full py-2.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors border border-dashed border-orange-200 hover:border-orange-300"
                    >
                      + {filteredDeadlines.length - 5} more project
                      {filteredDeadlines.length - 5 !== 1 ? "s" : ""} — View
                      All Projects
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
                          ? `No ${pipelineTypeFilterOptions.find((o) => o.value === pipelineTypeFilter)?.label}${projectCategoryFilter !== "all" ? ` · ${projectCategoryOptions.find((c) => c.value === projectCategoryFilter)?.label}` : ""} projects with upcoming deadlines.`
                          : "No upcoming deadlines for the selected filter."}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
            {/* end projects.read guard */}
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
};
