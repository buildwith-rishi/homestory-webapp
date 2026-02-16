import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
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
  ChevronDown,
  Check,
  UserPlus,
  Users,
  X,
  Loader2,
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
import LeadAPI, { LeadAssignee } from "../../services/leadApi";
import { adminAPI } from "../../services/api";
import { Lead, LeadStage, LeadSource, Project, AdminUser } from "../../types";
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

  // BDR (Business Development Representatives) state
  const [bdrUsers, setBdrUsers] = useState<AdminUser[]>([]);
  const [bdrDropdownOpen, setBdrDropdownOpen] = useState<string | null>(null);
  const [bdrDropdownPos, setBdrDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const bdrButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Multi-select for bulk assign
  const [selectedKanbanLeads, setSelectedKanbanLeads] = useState<Set<string>>(
    new Set(),
  );
  const [bulkAssignDropdownOpen, setBulkAssignDropdownOpen] = useState(false);

  // Assignee panel state
  const [assigneePanelOpen, setAssigneePanelOpen] = useState<string | null>(
    null,
  );
  const [assigneePanelPos, setAssigneePanelPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [leadAssignees, setLeadAssignees] = useState<LeadAssignee[]>([]);
  const [assigneesLoading, setAssigneesLoading] = useState(false);
  const [addAssigneeDropdown, setAddAssigneeDropdown] = useState(false);
  const assigneePanelRef = useRef<HTMLDivElement | null>(null);

  // Assignment loading state
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch BDR users on mount
  useEffect(() => {
    const fetchBDRs = async () => {
      try {
        const response = await adminAPI.getAllUsers();
        let usersList: AdminUser[] = [];

        if (response && typeof response === "object") {
          if ("users" in response && Array.isArray(response.users)) {
            usersList = response.users;
          } else if (Array.isArray(response)) {
            usersList = response;
          }
        }

        // Deduplicate users by id
        const seen = new Set<string>();
        const uniqueUsers = usersList.filter((u) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        });

        setBdrUsers(uniqueUsers);
      } catch (error) {
        console.error("Failed to fetch BDR users:", error);
        setBdrUsers([]);
      }
    };
    fetchBDRs();
  }, []);

  // BDR dropdown closes via backdrop click (in portal), no separate handler needed

  // Handle BDR assignment via /assign API
  const handleAssignBDR = useCallback(
    async (leadId: string, bdrId: string | null) => {
      setIsAssigning(true);
      try {
        await LeadAPI.assignLead(leadId, {
          assigneeUserId: bdrId || "",
        });
        toast.success(bdrId ? "BDR assigned successfully" : "BDR unassigned");
        setBdrDropdownOpen(null);
        setBdrDropdownPos(null);
        fetchLeads();
      } catch (error) {
        console.error("Failed to assign BDR:", error);
        toast.error("Failed to assign BDR");
      } finally {
        setIsAssigning(false);
      }
    },
    [fetchLeads],
  );

  // Open BDR dropdown positioned relative to button
  const openBdrDropdown = useCallback(
    (leadId: string) => {
      if (bdrDropdownOpen === leadId) {
        setBdrDropdownOpen(null);
        setBdrDropdownPos(null);
        return;
      }
      const btn = bdrButtonRefs.current[leadId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setBdrDropdownPos({ top: rect.bottom + 4, left: rect.left });
      }
      setBdrDropdownOpen(leadId);
    },
    [bdrDropdownOpen],
  );

  // ─── Assignee Panel Handlers ──────────────────────────────────────────────

  const openAssigneePanel = useCallback(
    async (leadId: string, anchorEl: HTMLElement) => {
      const rect = anchorEl.getBoundingClientRect();
      setAssigneePanelPos({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 280),
      });
      setAssigneePanelOpen(leadId);
      setAssigneesLoading(true);
      setAddAssigneeDropdown(false);
      try {
        const data = await LeadAPI.getLeadAssignees(leadId);
        setLeadAssignees(data.assignees || []);
      } catch (error) {
        console.error("Failed to fetch assignees:", error);
        setLeadAssignees([]);
      } finally {
        setAssigneesLoading(false);
      }
    },
    [],
  );

  const closeAssigneePanel = useCallback(() => {
    setAssigneePanelOpen(null);
    setAssigneePanelPos(null);
    setLeadAssignees([]);
    setAddAssigneeDropdown(false);
  }, []);

  const handleRemoveAssignee = useCallback(
    async (leadId: string, userId: string) => {
      try {
        await LeadAPI.removeLeadAssignee(leadId, userId);
        setLeadAssignees((prev) => prev.filter((a) => a.id !== userId));
        toast.success("Assignee removed");
        fetchLeads();
      } catch (error) {
        console.error("Failed to remove assignee:", error);
        toast.error("Failed to remove assignee");
      }
    },
    [fetchLeads],
  );

  const handleAddAssignee = useCallback(
    async (leadId: string, userId: string) => {
      try {
        await LeadAPI.addLeadAssignees(leadId, { userIds: [userId] });
        // Re-fetch assignees to get updated list
        const data = await LeadAPI.getLeadAssignees(leadId);
        setLeadAssignees(data.assignees || []);
        toast.success("Assignee added");
        setAddAssigneeDropdown(false);
        fetchLeads();
      } catch (error) {
        console.error("Failed to add assignee:", error);
        toast.error("Failed to add assignee");
      }
    },
    [fetchLeads],
  );

  // ─── Bulk Selection Handlers ──────────────────────────────────────────────

  const toggleLeadSelection = useCallback((leadId: string) => {
    setSelectedKanbanLeads((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKanbanLeads(new Set());
    setBulkAssignDropdownOpen(false);
  }, []);

  const handleBulkAssign = useCallback(
    async (userId: string) => {
      if (selectedKanbanLeads.size === 0) return;
      const user = bdrUsers.find((u) => u.id === userId);
      if (
        !window.confirm(
          `Assign ${selectedKanbanLeads.size} lead${selectedKanbanLeads.size > 1 ? "s" : ""} to ${user?.name || "user"}?`,
        )
      )
        return;
      setIsAssigning(true);
      try {
        await LeadAPI.bulkAssignLeads({
          leadIds: [...selectedKanbanLeads],
          assigneeUserId: userId,
        });
        toast.success(
          `Assigned ${selectedKanbanLeads.size} lead${selectedKanbanLeads.size > 1 ? "s" : ""} successfully`,
        );
        clearSelection();
        fetchLeads();
      } catch (error) {
        console.error("Failed to bulk assign:", error);
        toast.error("Failed to bulk assign leads");
      } finally {
        setIsAssigning(false);
      }
    },
    [selectedKanbanLeads, clearSelection, fetchLeads, bdrUsers],
  );

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

  const renderLeadCard = useCallback(
    (task: KanbanTask) => {
      const lead = task.metadata as unknown as Lead;
      const isSelected = selectedKanbanLeads.has(task.id);
      const showCheckbox = selectedKanbanLeads.size > 0 || isSelected;

      if (!lead) {
        return (
          <div
            className={`relative space-y-1.5 ${task.completed ? "opacity-60" : ""}`}
          >
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
        <div
          className={`relative space-y-1.5 group/card ${task.completed ? "opacity-60" : ""}`}
        >
          {/* Checkbox for bulk selection */}
          <div
            className={`absolute -top-1 -left-1 z-10 ${showCheckbox ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"} transition-opacity`}
          >
            <label
              className="flex items-center justify-center w-5 h-5 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleLeadSelection(lead.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-1 cursor-pointer"
              />
            </label>
          </div>
          <h4
            className={`font-semibold text-[13px] leading-tight truncate ${showCheckbox ? "pl-5" : ""} ${
              task.completed ? "line-through text-gray-500" : "text-gray-900"
            }`}
          >
            {lead.name}
          </h4>
          {/* Unassigned lead indicator */}
          {!lead.assignedTo && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-[10px] font-medium text-orange-600">
                No BDR
              </span>
            </div>
          )}
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
            </div>
            {/* BDR Assignment Section */}
            <div className="pt-1 flex items-center gap-1.5">
              <button
                ref={(el) => {
                  bdrButtonRefs.current[lead.id] = el;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  openBdrDropdown(lead.id);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-blue-50 transition-colors group"
              >
                <User
                  size={10}
                  className={
                    lead.assignedTo ? "text-blue-500" : "text-gray-400"
                  }
                />
                <span
                  className={`text-[10px] font-medium ${lead.assignedTo ? "text-blue-600" : "text-gray-400 italic"}`}
                >
                  {lead.assignedTo?.name || "Assign BDR"}
                </span>
                <ChevronDown
                  size={10}
                  className={`transition-transform ${bdrDropdownOpen === lead.id ? "rotate-180" : ""} text-gray-400 group-hover:text-gray-600`}
                />
              </button>
              {/* View Assignees button */}
              {lead.assignedTo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openAssigneePanel(lead.id, e.currentTarget);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex items-center gap-0.5 px-1 py-0.5 rounded-md hover:bg-purple-50 transition-colors text-[10px] text-purple-500 hover:text-purple-700"
                  title="View / manage assignees"
                >
                  <Users size={10} />
                </button>
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
        </div>
      );
    },
    [
      bdrDropdownOpen,
      bdrUsers,
      handleAssignBDR,
      selectedKanbanLeads,
      toggleLeadSelection,
      openAssigneePanel,
    ],
  );

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

  // Find the currently opened lead for the BDR dropdown portal
  const openLead = useMemo(() => {
    if (!bdrDropdownOpen) return null;
    return leads.find((l) => l.id === bdrDropdownOpen) || null;
  }, [bdrDropdownOpen, leads]);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* BDR Dropdown Portal */}
      {bdrDropdownOpen &&
        bdrDropdownPos &&
        openLead &&
        createPortal(
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 99998 }}
              onClick={() => {
                setBdrDropdownOpen(null);
                setBdrDropdownPos(null);
              }}
            />
            {/* Dropdown */}
            <div
              className="fixed w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
              style={{
                zIndex: 99999,
                top: bdrDropdownPos.top,
                left: bdrDropdownPos.left,
                maxHeight: "280px",
              }}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50 rounded-t-lg">
                Assign BDR
              </div>
              <div className="max-h-[230px] overflow-y-auto">
                <button
                  onClick={() => handleAssignBDR(openLead.id, null)}
                  disabled={isAssigning}
                  className={`w-full px-3 py-2 text-left text-[11px] hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    !openLead.assignedTo
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600"
                  }`}
                >
                  <span className="w-4 flex-shrink-0">
                    {isAssigning ? (
                      <Loader2
                        size={12}
                        className="animate-spin text-gray-400"
                      />
                    ) : !openLead.assignedTo ? (
                      <Check size={12} className="text-blue-500" />
                    ) : null}
                  </span>
                  <span>Unassigned</span>
                </button>
                {bdrUsers.map((bdr) => {
                  const isSelected = openLead.assignedTo?.id === bdr.id;
                  const roleLabel = bdr.role
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <button
                      key={bdr.id}
                      onClick={() => handleAssignBDR(openLead.id, bdr.id)}
                      disabled={isAssigning}
                      className={`w-full px-3 py-2 text-left text-[11px] hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="w-4 flex-shrink-0">
                        {isSelected ? (
                          <Check size={12} className="text-blue-500" />
                        ) : null}
                      </span>
                      <span className="truncate">{bdr.name}</span>
                      <span className="text-[9px] text-gray-400 ml-auto flex-shrink-0">
                        {roleLabel}
                      </span>
                    </button>
                  );
                })}
                {bdrUsers.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-gray-400 italic text-center">
                    No users available
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Assignee Management Panel Portal */}
      {assigneePanelOpen &&
        assigneePanelPos &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 99996 }}
              onClick={closeAssigneePanel}
            />
            {/* Panel */}
            <div
              ref={assigneePanelRef}
              className="fixed w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
              style={{
                zIndex: 99997,
                top: assigneePanelPos.top,
                left: assigneePanelPos.left,
                maxHeight: "360px",
              }}
            >
              <div className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  Lead Assignees
                </span>
                <button
                  onClick={closeAssigneePanel}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                >
                  <X size={11} className="text-gray-500" />
                </button>
              </div>
              <div className="max-h-[240px] overflow-y-auto">
                {assigneesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                ) : leadAssignees.length === 0 ? (
                  <div className="px-3 py-4 text-[11px] text-gray-400 italic text-center">
                    No assignees found
                  </div>
                ) : (
                  leadAssignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{
                          backgroundColor: `hsl(${(assignee.name.charCodeAt(0) * 37) % 360}, 55%, 50%)`,
                        }}
                      >
                        {assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-gray-800 truncate">
                          {assignee.name}
                        </div>
                        <div className="text-[9px] text-gray-400">
                          {assignee.role
                            ?.replace(/_/g, " ")
                            .replace(/\b\w/g, (c: string) => c.toUpperCase()) ||
                            "Member"}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveAssignee(assigneePanelOpen!, assignee.id)
                        }
                        className="p-0.5 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        title="Remove assignee"
                      >
                        <X
                          size={11}
                          className="text-gray-400 hover:text-red-500"
                        />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {/* Add Assignee Section */}
              <div className="border-t border-gray-100 p-2">
                {!addAssigneeDropdown ? (
                  <button
                    onClick={() => setAddAssigneeDropdown(true)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-purple-600 hover:bg-purple-50 rounded-md transition-colors font-medium"
                  >
                    <UserPlus size={11} />
                    Add Assignee
                  </button>
                ) : (
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 px-1 mb-1">
                      Select user to co-assign:
                    </div>
                    <div className="max-h-[120px] overflow-y-auto">
                      {bdrUsers
                        .filter(
                          (u) => !leadAssignees.some((a) => a.id === u.id),
                        )
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() =>
                              handleAddAssignee(assigneePanelOpen!, user.id)
                            }
                            className="w-full px-2 py-1.5 text-left text-[11px] hover:bg-purple-50 flex items-center gap-2 rounded-md transition-colors text-gray-700"
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                              style={{
                                backgroundColor: `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 55%, 50%)`,
                              }}
                            >
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="truncate">{user.name}</span>
                          </button>
                        ))}
                      {bdrUsers.filter(
                        (u) => !leadAssignees.some((a) => a.id === u.id),
                      ).length === 0 && (
                        <div className="px-2 py-1.5 text-[10px] text-gray-400 italic text-center">
                          All users already assigned
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setAddAssigneeDropdown(false)}
                      className="w-full mt-1 px-2 py-1 text-[10px] text-gray-500 hover:text-gray-700 text-center"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Bulk Assign Toolbar - bottom floating bar */}
      {activeView === "leads" &&
        selectedKanbanLeads.size > 0 &&
        createPortal(
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 px-5 py-3 flex items-center gap-4"
            style={{ zIndex: 99995 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                <Users size={14} className="text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {selectedKanbanLeads.size} lead
                {selectedKanbanLeads.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="relative">
              <button
                onClick={() => setBulkAssignDropdownOpen((v) => !v)}
                disabled={isAssigning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAssigning ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                {isAssigning ? "Assigning..." : "Assign BDR"}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${bulkAssignDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {bulkAssignDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1 max-h-[240px] overflow-y-auto">
                  {bdrUsers.map((bdr) => {
                    const roleLabel = bdr.role
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase());
                    return (
                      <button
                        key={bdr.id}
                        onClick={() => handleBulkAssign(bdr.id)}
                        disabled={isAssigning}
                        className="w-full px-3 py-2 text-left text-[11px] hover:bg-purple-50 flex items-center gap-2 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                          style={{
                            backgroundColor: `hsl(${(bdr.name.charCodeAt(0) * 37) % 360}, 55%, 50%)`,
                          }}
                        >
                          {bdr.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="truncate">{bdr.name}</span>
                        <span className="text-[9px] text-gray-400 ml-auto flex-shrink-0">
                          {roleLabel}
                        </span>
                      </button>
                    );
                  })}
                  {bdrUsers.length === 0 && (
                    <div className="px-3 py-2 text-[11px] text-gray-400 italic text-center">
                      No users available
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          </div>,
          document.body,
        )}

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
            onClick={() => {
              setActiveView("leads");
              setSelectedKanbanLeads(new Set());
            }}
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
            onClick={() => {
              setActiveView("projects");
              setSelectedKanbanLeads(new Set());
            }}
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
