import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Users2, FolderKanban, ArrowLeft } from "lucide-react";
import {
  KanbanBoardVertical,
  KanbanData,
  KanbanTask,
  AddCardPrimarySelectConfig,
} from "../../components/kanban/KanbanBoardVertical";
import { useProjectStore } from "../../stores/projectStore";
import { useLeadStore } from "../../stores/leadStore";
import { Lead, LeadStage, Project, ProjectStageCode } from "../../types";
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

const KanbanView: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>("leads");

  const { projects, fetchProjects } = useProjectStore();
  const { leads, fetchLeads } = useLeadStore();

  // Leads Kanban Data
  const [leadsKanbanData, setLeadsKanbanData] = useState<KanbanData>({
    columns: {
      inquiry: { id: "inquiry", title: "Inquiry", taskIds: [], color: "blue" },
      contacted: {
        id: "contacted",
        title: "Contacted",
        taskIds: [],
        color: "yellow",
      },
      meeting_scheduled: {
        id: "meeting_scheduled",
        title: "Meeting Scheduled",
        taskIds: [],
        color: "purple",
      },
      proposal_sent: {
        id: "proposal_sent",
        title: "Proposal Sent",
        taskIds: [],
        color: "orange",
      },
      negotiation: {
        id: "negotiation",
        title: "Negotiation",
        taskIds: [],
        color: "pink",
      },
      won: { id: "won", title: "Won", taskIds: [], color: "green" },
      lost: { id: "lost", title: "Lost", taskIds: [], color: "red" },
    },
    tasks: {},
    columnOrder: [
      "inquiry",
      "contacted",
      "meeting_scheduled",
      "proposal_sent",
      "negotiation",
      "won",
      "lost",
    ],
  });

  // Projects Kanban Data
  const [projectsKanbanData, setProjectsKanbanData] = useState<KanbanData>({
    columns: {
      lead: { id: "lead", title: "Lead", taskIds: [], color: "gray" },
      site_visit: {
        id: "site_visit",
        title: "Site Visit",
        taskIds: [],
        color: "blue",
      },
      proposal: {
        id: "proposal",
        title: "Proposal",
        taskIds: [],
        color: "purple",
      },
      design: { id: "design", title: "Design", taskIds: [], color: "orange" },
      execution: {
        id: "execution",
        title: "Execution",
        taskIds: [],
        color: "yellow",
      },
      handover: {
        id: "handover",
        title: "Handover",
        taskIds: [],
        color: "green",
      },
      warranty: {
        id: "warranty",
        title: "Warranty",
        taskIds: [],
        color: "teal",
      },
    },
    tasks: {},
    columnOrder: [
      "lead",
      "site_visit",
      "proposal",
      "design",
      "execution",
      "handover",
      "warranty",
    ],
  });

  // Fetch data on mount
  useEffect(() => {
    fetchLeads();
    fetchProjects();
  }, [fetchLeads, fetchProjects]);

  // Update Leads Kanban when leads change
  useEffect(() => {
    if (leads.length === 0) return;

    const tasks: Record<string, KanbanTask> = {};
    const columns = { ...leadsKanbanData.columns };

    // Reset taskIds
    Object.keys(columns).forEach((colId) => {
      columns[colId].taskIds = [];
    });

    // Convert leads to kanban tasks
    leads.forEach((lead: Lead) => {
      const columnId = mapLeadStageToColumn(lead.stage);
      if (!columns[columnId]) return;

      tasks[lead.id] = {
        id: lead.id,
        content: lead.name,
        metadata: lead as any,
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
      const columnId = mapProjectStageToColumn(project.currentStage);
      if (!columns[columnId]) return;

      tasks[project.id] = {
        id: project.id,
        content: project.projectName || project.name,
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

  // Helper: Map lead stage to column
  const mapLeadStageToColumn = (stage: LeadStage): string => {
    const mapping: Record<LeadStage, string> = {
      [LeadStage.INQUIRY]: "inquiry",
      [LeadStage.CONTACTED]: "contacted",
      [LeadStage.MEETING_SCHEDULED]: "meeting_scheduled",
      [LeadStage.PROPOSAL_SENT]: "proposal_sent",
      [LeadStage.NEGOTIATION]: "negotiation",
      [LeadStage.WON]: "won",
      [LeadStage.LOST]: "lost",
    };
    return mapping[stage] || "inquiry";
  };

  // Helper: Map project stage to column
  const mapProjectStageToColumn = (stage?: ProjectStageCode): string => {
    if (!stage) return "lead";

    const mapping: Record<ProjectStageCode, string> = {
      [ProjectStageCode.LEAD]: "lead",
      [ProjectStageCode.SITE_VISIT]: "site_visit",
      [ProjectStageCode.PROPOSAL]: "proposal",
      [ProjectStageCode.DESIGN]: "design",
      [ProjectStageCode.EXECUTION]: "execution",
      [ProjectStageCode.HANDOVER]: "handover",
      [ProjectStageCode.WARRANTY]: "warranty",
    };
    return mapping[stage] || "lead";
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

  // Handle data changes for leads
  const handleLeadsDataChange = (newData: KanbanData) => {
    setLeadsKanbanData(newData);
    toast.success("Lead status updated");
    // TODO: Update lead status via API
  };

  // Handle data changes for projects
  const handleProjectsDataChange = (newData: KanbanData) => {
    setProjectsKanbanData(newData);
    toast.success("Project stage updated");
    // TODO: Update project stage via API
  };

  // Create lead select options
  const leadSelectConfig = useMemo<AddCardPrimarySelectConfig>(
    () => ({
      label: "Select Lead",
      placeholder: "Choose a lead...",
      options: leads.map((lead) => ({
        value: lead.id,
        label: lead.name,
        metadata: lead as unknown as Record<string, unknown>,
      })),
      required: true,
      emptyStateText: "No leads available. Create a lead first.",
    }),
    [leads],
  );

  // Create project select options
  const projectSelectConfig = useMemo<AddCardPrimarySelectConfig>(
    () => ({
      label: "Select Project",
      placeholder: "Choose a project...",
      options: projects.map((project) => ({
        value: project.id,
        label: project.projectName || project.name,
        metadata: project as unknown as Record<string, unknown>,
      })),
      required: true,
      emptyStateText: "No projects available. Create a project first.",
    }),
    [projects],
  );

  const currentData =
    activeView === "leads" ? leadsKanbanData : projectsKanbanData;
  const handleDataChange =
    activeView === "leads" ? handleLeadsDataChange : handleProjectsDataChange;
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
        <KanbanBoardVertical
          initialData={currentData}
          onDataChange={handleDataChange}
          onTaskClick={handleTaskClick}
          addCardPrimarySelect={
            activeView === "leads" ? leadSelectConfig : projectSelectConfig
          }
          addCardAssigneeOptions={
            activeView === "leads"
              ? LEAD_ASSIGNEE_OPTIONS
              : PROJECT_ASSIGNEE_OPTIONS
          }
          addCardAssigneeLabel="Assign to:"
          addCardDueDateLabel="Due date:"
        />
      </div>
    </div>
  );
};

export default KanbanView;
