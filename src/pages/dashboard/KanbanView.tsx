import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Users2,
  FolderKanban,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  TrendingUp,
} from "lucide-react";
import {
  KanbanBoard,
  KanbanData,
  KanbanTask,
  SelectConfig,
} from "../../components/kanban/KanbanBoard";
import {
  AddLeadCardFormWithButton,
  type NewLeadCardData,
} from "../../components/kanban/AddLeadCardForm";
import { useProjectStore } from "../../stores/projectStore";
import { useLeadStore } from "../../stores/leadStore";
import { addActivityEntry } from "../../stores/kanbanActivityLog";
import ProjectAPI from "../../services/projectApi";
import { Lead, LeadStage, LeadSource, Project } from "../../types";
import toast from "react-hot-toast";

type ViewType = "leads" | "projects";

// Assignee options for leads
const LEAD_ASSIGNEE_OPTIONS = [
  "Unassigned",
  "Sales Lead",
  "Design Consultant",
  "Project Manager",
  "Operations Team",
];

// Assignee options for projects
const PROJECT_ASSIGNEE_OPTIONS = [
  "Unassigned",
  "Design Lead",
  "Project Manager",
  "Site Supervisor",
  "Operations Team",
];

// Map API status to column ID
const statusToColumn: Record<string, string> = {
  NEW: "col-new",
  WORKING: "col-working",
  QUALIFIED: "col-qualified",
  DISQUALIFIED: "col-disqualified",
  CONVERTED: "col-converted",
};

// Map column ID to API status
const columnToStatus: Record<string, string> = {
  "col-new": "NEW",
  "col-working": "WORKING",
  "col-qualified": "QUALIFIED",
  "col-disqualified": "DISQUALIFIED",
  "col-converted": "CONVERTED",
};

const KanbanView: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>("leads");

  const { projects, fetchProjects } = useProjectStore();
  const { leads, fetchLeads, moveLeadByStatus, addLead } = useLeadStore();

  // Leads Kanban Data - Using API statuses
  const [leadsKanbanData, setLeadsKanbanData] = useState<KanbanData>({
    columns: {
      "col-new": {
        id: "col-new",
        title: "New",
        taskIds: [],
        color: "#3B82F6", // Blue
      },
      "col-working": {
        id: "col-working",
        title: "Working",
        taskIds: [],
        color: "#F59E0B", // Amber
      },
      "col-qualified": {
        id: "col-qualified",
        title: "Qualified",
        taskIds: [],
        color: "#10B981", // Emerald
      },
      "col-disqualified": {
        id: "col-disqualified",
        title: "Disqualified",
        taskIds: [],
        color: "#6B7280", // Gray
      },
      "col-converted": {
        id: "col-converted",
        title: "Converted",
        taskIds: [],
        color: "#059669", // Green
      },
    },
    tasks: {},
    columnOrder: [
      "col-new",
      "col-working",
      "col-qualified",
      "col-disqualified",
      "col-converted",
    ],
  });

  // Projects Kanban Data
  const [projectsKanbanData, setProjectsKanbanData] = useState<KanbanData>({
    columns: {
      enquiry: { id: "enquiry", title: "Enquiry", taskIds: [], color: "gray" },
      design_signup: {
        id: "design_signup",
        title: "Design Signup",
        taskIds: [],
        color: "blue",
      },
      design: { id: "design", title: "Design", taskIds: [], color: "purple" },
      first_presentation: {
        id: "first_presentation",
        title: "First Presentation",
        taskIds: [],
        color: "indigo",
      },
      final_design: {
        id: "final_design",
        title: "Final Design",
        taskIds: [],
        color: "violet",
      },
      costing: {
        id: "costing",
        title: "Costing",
        taskIds: [],
        color: "amber",
      },
      execution: {
        id: "execution",
        title: "Execution",
        taskIds: [],
        color: "orange",
      },
      handover: {
        id: "handover",
        title: "Handover",
        taskIds: [],
        color: "green",
      },
      testimonial: {
        id: "testimonial",
        title: "Testimonial",
        taskIds: [],
        color: "teal",
      },
    },
    tasks: {},
    columnOrder: [
      "enquiry",
      "design_signup",
      "design",
      "first_presentation",
      "final_design",
      "costing",
      "execution",
      "handover",
      "testimonial",
    ],
  });

  // Fetch data on mount
  useEffect(() => {
    fetchLeads();
    fetchProjects();
  }, [fetchLeads, fetchProjects]);

  // Update Leads Kanban when leads change - using API status
  useEffect(() => {
    if (leads.length === 0) return;

    const tasks: Record<string, KanbanTask> = {};
    const columns = { ...leadsKanbanData.columns };

    // Reset taskIds
    Object.keys(columns).forEach((colId) => {
      columns[colId].taskIds = [];
    });

    // Convert leads to kanban tasks based on API status
    leads.forEach((lead: Lead) => {
      // Use API status field, fallback to NEW if not set
      const apiStatus = lead.status || "NEW";
      const columnId = statusToColumn[apiStatus] || "col-new";
      if (!columns[columnId]) return;

      tasks[lead.id] = {
        id: lead.id,
        content: lead.name || lead.email || `Lead ${lead.id}`,
        metadata: lead as unknown as Record<string, unknown>,
      };

      columns[columnId].taskIds.push(lead.id);
    });

    setLeadsKanbanData((prev) => ({
      ...prev,
      columns,
      tasks,
    }));
  }, [leads]);

  // Update Projects Kanban when projects change
  useEffect(() => {
    if (projects.length === 0) return;

    const tasks: Record<string, KanbanTask> = {};
    const columns = { ...projectsKanbanData.columns };

    // Reset taskIds
    Object.keys(columns).forEach((colId) => {
      columns[colId].taskIds = [];
    });

    // Convert projects to kanban tasks
    projects.forEach((project: Project) => {
      const columnId = mapProjectStageToColumn(project.currentStageCode);
      if (!columns[columnId]) return;

      tasks[project.id] = {
        id: project.id,
        content: project.projectName || project.name || "Untitled Project",
        metadata: project as any,
      };

      columns[columnId].taskIds.push(project.id);
    });

    setProjectsKanbanData((prev) => ({
      ...prev,
      columns,
      tasks,
    }));
  }, [projects]);

  // Helper: Map project stage to column
  const mapProjectStageToColumn = (stageCode?: string | null): string => {
    if (!stageCode) return "enquiry";

    const mapping: Record<string, string> = {
      ENQUIRY: "enquiry",
      DESIGN_SIGNUP: "design_signup",
      DESIGN: "design",
      FIRST_PRESENTATION: "first_presentation",
      FINAL_DESIGN: "final_design",
      COSTING: "costing",
      EXECUTION: "execution",
      HANDOVER: "handover",
      TESTIMONIAL: "testimonial",
    };
    return mapping[stageCode] || "enquiry";
  };

  // Handle lead card click
  const handleLeadClick = (task: KanbanTask) => {
    const lead = task.metadata as unknown as Lead;
    navigate(`/dashboard/leads/${lead.id}`);
  };

  // Handle project card click
  const handleProjectClick = (task: KanbanTask) => {
    const project = task.metadata as unknown as Project;
    navigate(`/dashboard/projects/${project.id}`);
  };

  // Handle data changes for leads (detect new cards and log activity)
  const handleLeadsDataChange = useCallback(
    (newData: KanbanData) => {
      // Detect newly added tasks by comparing task keys
      const oldTaskIds = new Set(Object.keys(leadsKanbanData.tasks));
      const newTaskIds = Object.keys(newData.tasks);

      for (const taskId of newTaskIds) {
        if (!oldTaskIds.has(taskId)) {
          const task = newData.tasks[taskId];
          // Find which column contains this new task
          let columnName = "Unknown";
          for (const col of Object.values(newData.columns)) {
            if (col.taskIds.includes(taskId)) {
              columnName = col.title;
              break;
            }
          }

          addActivityEntry({
            action: "card_added",
            cardTitle: task.content,
            columnName,
            assignedTo: task.assignedTo,
            priority: task.priority,
          });
        }
      }

      setLeadsKanbanData(newData);
    },
    [leadsKanbanData.tasks],
  );

  // Handle data changes for projects
  const handleProjectsDataChange = (newData: KanbanData) => {
    setProjectsKanbanData(newData);
  };

  // Persist lead status change via API
  const handleLeadColumnChange = useCallback(
    async (taskId: string, fromCol: string, toCol: string) => {
      const newStatus = columnToStatus[toCol];
      const oldStatus = columnToStatus[fromCol];
      if (!newStatus) return;

      // Log the move activity
      const task = leadsKanbanData.tasks[taskId];
      const fromColumn = leadsKanbanData.columns[fromCol];
      const toColumn = leadsKanbanData.columns[toCol];
      if (task) {
        addActivityEntry({
          action: "card_moved",
          cardTitle: task.content,
          columnName: toColumn?.title || toCol,
          fromColumn: fromColumn?.title || fromCol,
          assignedTo: task.assignedTo,
          priority: task.priority,
        });
      }

      try {
        await moveLeadByStatus(taskId, newStatus);
        toast.success(
          `Lead moved from ${fromColumn?.title || oldStatus} to ${toColumn?.title || newStatus}`,
        );
        // Auto-refresh to sync with backend
        fetchLeads();
      } catch (error) {
        console.error("Failed to update lead status:", error);
        toast.error("Failed to update status. Reverting...");
        fetchLeads();
      }
    },
    [moveLeadByStatus, fetchLeads, leadsKanbanData],
  );

  // Handle new lead card creation via API
  const handleLeadCardAdd = useCallback(
    async (columnId: string, data: NewLeadCardData) => {
      const statusFromColumn = columnToStatus[columnId] || "NEW";

      try {
        // Create lead via API
        const newLead = await addLead({
          name: data.title,
          email: data.email || "",
          phone: data.contactNumber || "",
          source:
            (data.source?.toUpperCase() as LeadSource) || LeadSource.OTHER,
          stage: LeadStage.INQUIRY, // Default stage (API will set status)
        });

        // If not in "New" column, update status after creation
        if (statusFromColumn !== "NEW" && newLead?.id) {
          await moveLeadByStatus(newLead.id, statusFromColumn);
        }

        toast.success("Lead created successfully!");
        fetchLeads();
      } catch (error) {
        console.error("Failed to create lead:", error);
        toast.error("Failed to create lead");
      }
    },
    [addLead, moveLeadByStatus, fetchLeads],
  );

  // Custom add card form renderer for leads
  const renderLeadAddCardForm = useCallback(
    (
      columnId: string,
      _onAddCard: (columnId: string, data: NewLeadCardData) => void,
      theme: "light" | "dark",
    ) => {
      return (
        <AddLeadCardFormWithButton
          onSubmit={(data: NewLeadCardData) => {
            handleLeadCardAdd(columnId, data);
          }}
          theme={theme}
          assignees={LEAD_ASSIGNEE_OPTIONS.filter(
            (a) => a !== "Unassigned",
          ).map((a) => ({
            value: a.toLowerCase().replace(/\s+/g, "-"),
            label: a,
          }))}
          leadStages={[
            { value: "NEW", label: "New" },
            { value: "WORKING", label: "Working" },
            { value: "QUALIFIED", label: "Qualified" },
            { value: "DISQUALIFIED", label: "Disqualified" },
            { value: "CONVERTED", label: "Converted" },
          ]}
        />
      );
    },
    [handleLeadCardAdd],
  );

  // Persist project stage change via API
  const handleProjectColumnChange = useCallback(
    async (taskId: string, _fromCol: string, toCol: string) => {
      const columnToStage: Record<string, string> = {
        enquiry: "ENQUIRY",
        design_signup: "DESIGN_SIGNUP",
        design: "DESIGN",
        first_presentation: "FIRST_PRESENTATION",
        final_design: "FINAL_DESIGN",
        costing: "COSTING",
        execution: "EXECUTION",
        handover: "HANDOVER",
        testimonial: "TESTIMONIAL",
      };

      const newStageCode = columnToStage[toCol];
      if (!newStageCode) return;

      try {
        await ProjectAPI.updateProject(taskId, {
          currentStageCode: newStageCode,
        });
        toast.success("Project stage updated");
        // Auto-refresh to sync with backend
        fetchProjects();
      } catch (error) {
        console.error("Failed to update project stage:", error);
        toast.error("Failed to update stage. Reverting...");
        fetchProjects();
      }
    },
    [fetchProjects],
  );

  // Create lead select options
  const leadSelectConfig = useMemo<SelectConfig>(
    () => ({
      label: "Select Lead",
      placeholder: "Choose a lead...",
      options: leads.map((lead) => ({
        value: lead.id,
        label: lead.name,
      })),
      required: true,
    }),
    [leads],
  );

  // Create project select options
  const projectSelectConfig = useMemo<SelectConfig>(
    () => ({
      label: "Select Project",
      placeholder: "Choose a project...",
      options: projects.map((project) => ({
        value: project.id,
        label: project.projectName || project.name,
      })),
      required: true,
    }),
    [projects],
  );

  // Create assignee options based on view
  const assigneeOptions = useMemo(() => {
    const options =
      activeView === "leads" ? LEAD_ASSIGNEE_OPTIONS : PROJECT_ASSIGNEE_OPTIONS;
    return options.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, "_"),
      name: name,
    }));
  }, [activeView]);

  // ─── Rich Card Renderers ─────────────────────────────────────────────────

  const renderLeadCard = useCallback((task: KanbanTask) => {
    const lead = task.metadata as unknown as Lead;
    if (!lead) {
      return (
        <div className={`space-y-1.5 ${task.completed ? "opacity-60" : ""}`}>
          <h4
            className={`font-semibold text-[13px] leading-tight ${
              task.completed ? "line-through text-gray-500" : "text-gray-900"
            }`}
          >
            {task.content}
          </h4>
          {task.assignedTo && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-[10px]">
              <User size={10} />
              {task.assignedTo}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={`space-y-1.5 ${task.completed ? "opacity-60" : ""}`}>
        <h4
          className={`font-semibold text-[13px] leading-tight truncate ${
            task.completed ? "line-through text-gray-500" : "text-gray-900"
          }`}
        >
          {lead.name}
        </h4>
        <div className="space-y-0.5 text-[11px] text-gray-500">
          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone size={10} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1">
              <Mail size={10} className="text-gray-400 flex-shrink-0" />
              <span className="truncate max-w-[180px]">{lead.email}</span>
            </div>
          )}
          {lead.location && (
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{lead.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            {lead.budget && (
              <div className="flex items-center gap-0.5">
                <DollarSign
                  size={10}
                  className="text-green-500 flex-shrink-0"
                />
                <span className="font-medium text-gray-700">
                  \u20B9{lead.budget.toLocaleString()}
                </span>
              </div>
            )}
            {lead.createdAt && (
              <div className="flex items-center gap-0.5">
                <Calendar size={10} className="text-gray-400 flex-shrink-0" />
                <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        {lead.source && (
          <div className="pt-1">
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-orange-50 text-orange-600 border border-orange-200/50">
              {lead.source}
            </span>
          </div>
        )}
        {task.assignedTo && (
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              <User size={10} />
              {task.assignedTo}
            </span>
          </div>
        )}
      </div>
    );
  }, []);

  const renderProjectCard = useCallback((task: KanbanTask) => {
    const project = task.metadata as unknown as Project;
    if (!project) {
      return (
        <div className={`space-y-1.5 ${task.completed ? "opacity-60" : ""}`}>
          <h4
            className={`font-semibold text-[13px] leading-tight ${
              task.completed ? "line-through text-gray-500" : "text-gray-900"
            }`}
          >
            {task.content}
          </h4>
          {task.assignedTo && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-[10px]">
              <User size={10} />
              {task.assignedTo}
            </span>
          )}
        </div>
      );
    }

    const projectName =
      project.projectName || project.name || "Untitled Project";

    return (
      <div className={`space-y-1.5 ${task.completed ? "opacity-60" : ""}`}>
        <h4
          className={`font-semibold text-[13px] leading-tight truncate ${
            task.completed ? "line-through text-gray-500" : "text-gray-900"
          }`}
        >
          {projectName}
        </h4>
        <div className="space-y-0.5 text-[11px] text-gray-500">
          {(project.propertyAddress || project.propertyCity) && (
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {project.propertyAddress || project.propertyCity}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            {project.totalValue && (
              <div className="flex items-center gap-0.5">
                <DollarSign
                  size={10}
                  className="text-green-500 flex-shrink-0"
                />
                <span className="font-medium text-gray-700">
                  \u20B9
                  {parseFloat(String(project.totalValue)).toLocaleString()}
                </span>
              </div>
            )}
            {project.propertySizeSqft && (
              <div className="flex items-center gap-0.5">
                <TrendingUp size={10} className="text-gray-400 flex-shrink-0" />
                <span>{project.propertySizeSqft} sqft</span>
              </div>
            )}
          </div>
          {(project.assignedDesigner?.name || project.assignedPM?.name) && (
            <div className="flex items-center gap-1 pt-0.5">
              <User size={10} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {project.assignedDesigner?.name || project.assignedPM?.name}
              </span>
            </div>
          )}
          {project.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar size={10} className="text-gray-400 flex-shrink-0" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        {(project.pipelineType ||
          project.projectCategory ||
          project.scopeType) && (
          <div className="flex flex-wrap gap-1 pt-1">
            {project.pipelineType && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-blue-50 text-blue-600 border border-blue-200/50">
                {project.pipelineType}
              </span>
            )}
            {project.projectCategory && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-purple-50 text-purple-600 border border-purple-200/50">
                {project.projectCategory}
              </span>
            )}
            {project.scopeType && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-orange-50 text-orange-600 border border-orange-200/50">
                {project.scopeType}
              </span>
            )}
          </div>
        )}
        {task.assignedTo && (
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              <User size={10} />
              {task.assignedTo}
            </span>
          </div>
        )}
      </div>
    );
  }, []);

  const renderTaskCard =
    activeView === "leads" ? renderLeadCard : renderProjectCard;

  const currentData =
    activeView === "leads" ? leadsKanbanData : projectsKanbanData;
  const handleDataChange =
    activeView === "leads" ? handleLeadsDataChange : handleProjectsDataChange;
  const handleColumnChange =
    activeView === "leads" ? handleLeadColumnChange : handleProjectColumnChange;
  const handleTaskClick =
    activeView === "leads" ? handleLeadClick : handleProjectClick;

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-6 h-6 text-orange-500" />
              Kanban Board
            </h1>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView("leads")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeView === "leads"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users2 className="w-4 h-4" />
            Leads
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeView === "leads"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView("projects")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeView === "projects"
                ? "bg-white text-orange-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            Projects
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeView === "projects"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {projects.length}
            </span>
          </button>
        </div>
      </div>

      {/* Kanban Board - Full Height with proper overflow */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard
          initialData={currentData}
          onDataChange={handleDataChange}
          onTaskClick={handleTaskClick}
          onTaskColumnChange={handleColumnChange}
          renderTaskCard={renderTaskCard}
          theme="light"
          defaultZoom={0.9}
          compactMode={true}
          selectConfig={
            activeView === "leads" ? leadSelectConfig : projectSelectConfig
          }
          assignees={assigneeOptions}
          renderAddCardForm={
            activeView === "leads" ? renderLeadAddCardForm : undefined
          }
        />
      </div>
    </div>
  );
};

export default KanbanView;
