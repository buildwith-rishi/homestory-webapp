import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Users2,
  FolderKanban,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  TrendingUp,
  UserPlus,
  X,
  Loader2,
  AlertTriangle,
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
import { convertLeadToCustomer } from "../../services/customerApi";
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
  UNQUALIFIED: "col-unqualified",
  CONVERTED: "col-converted",
};

const isUnqualifiedLead = (lead: Lead) =>
  lead.status === "UNQUALIFIED";

// Map column ID to API status
const columnToStatus: Record<string, string> = {
  "col-new": "NEW",
  "col-working": "WORKING",
  "col-qualified": "QUALIFIED",
  "col-unqualified": "UNQUALIFIED",
  "col-disqualified": "DISQUALIFIED",
  "col-converted": "CONVERTED",
};

const formatProjectCurrency = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    return `₹${value.toLocaleString("en-IN")}`;
  }

  const raw = String(value).trim();
  if (!raw) return "";

  const cleanedNumeric = raw
    .replace(/\\u20B9/gi, "")
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .trim();

  const parsed = Number(cleanedNumeric);
  if (Number.isFinite(parsed)) {
    return `₹${parsed.toLocaleString("en-IN")}`;
  }

  return raw.replace(/\\u20B9/gi, "₹");
};

const KanbanView: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>("leads");

  const { projects, fetchProjects } = useProjectStore();
  const { leads, fetchLeads, moveLeadByStatus, addLead } = useLeadStore();

  // Lead conversion modal state
  const [pendingConversion, setPendingConversion] = useState<{
    leadId: string;
    leadName: string;
    fromCol: string;
  } | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Filter for already converted leads
  const [showAlreadyConverted, setShowAlreadyConverted] = useState(false);


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
      "col-unqualified": {
        id: "col-unqualified",
        title: "Unqualified",
        taskIds: [],
        color: "#9CA3AF", // Slate
      },
      "col-disqualified": {
        id: "col-disqualified",
        title: "Disqualified",
        taskIds: [],
        color: "#6B7280", // Gray
      },
      "col-converted": {
        id: "col-converted",
        title: "Converted (Ready to Onboard)",
        taskIds: [],
        color: "#059669", // Green
      },
    },
    tasks: {},
    columnOrder: [
      "col-new",
      "col-working",
      "col-qualified",
      "col-unqualified",
      "col-disqualified",
      "col-converted",
    ],
  });

  // Projects Kanban Data
  const [projectsKanbanData, setProjectsKanbanData] = useState<KanbanData>({
    columns: {
      contract_onboarding: {
        id: "contract_onboarding",
        title: "Contract & Onboarding",
        taskIds: [],
        color: "gray",
      },
      client_consultation: {
        id: "client_consultation",
        title: "Client Consultation & Requirement Detailing",
        taskIds: [],
        color: "blue",
      },
      site_validation: {
        id: "site_validation",
        title: "Site Validation & Data Collection",
        taskIds: [],
        color: "cyan",
      },
      design_development: {
        id: "design_development",
        title: "Design Development",
        taskIds: [],
        color: "purple",
      },
      costing_estimation: {
        id: "costing_estimation",
        title: "Costing / Estimation",
        taskIds: [],
        color: "amber",
      },
      material_finalization: {
        id: "material_finalization",
        title: "Material & Drawings Finalization",
        taskIds: [],
        color: "indigo",
      },
      design_handover: {
        id: "design_handover",
        title: "Design Handover to Execution",
        taskIds: [],
        color: "violet",
      },
      execution_all_site_activities: {
        id: "execution_all_site_activities",
        title: "Execution (All Site Activities)",
        taskIds: [],
        color: "orange",
      },
      cleaning_setup: {
        id: "cleaning_setup",
        title: "Cleaning & Setup",
        taskIds: [],
        color: "yellow",
      },
      decor_styling: {
        id: "decor_styling",
        title: "Decor & Styling",
        taskIds: [],
        color: "pink",
      },
      testing_qc: {
        id: "testing_qc",
        title: "Testing, QC & Snagging",
        taskIds: [],
        color: "red",
      },
      handover_closure: {
        id: "handover_closure",
        title: "Handover & Closure",
        taskIds: [],
        color: "green",
      },
    },
    tasks: {},
    columnOrder: [
      "contract_onboarding",
      "client_consultation",
      "site_validation",
      "design_development",
      "costing_estimation",
      "material_finalization",
      "design_handover",
      "execution_all_site_activities",
      "cleaning_setup",
      "decor_styling",
      "testing_qc",
      "handover_closure",
    ],
  });

  // Fetch data on mount
  useEffect(() => {
    console.log("KanbanView: Fetching leads and projects...");
    fetchLeads();
    fetchProjects();
  }, [fetchLeads, fetchProjects]);

  // Update Leads Kanban when leads change - using API status
  useEffect(() => {
    console.log("KanbanView: Leads changed:", leads.length, "leads");
    
    // Deduplicate leads by ID first
    const uniqueLeadsMap = new Map<string, Lead>();
    let duplicatesFound = 0;
    
    leads.forEach((lead: Lead) => {
      if (uniqueLeadsMap.has(lead.id)) {
        duplicatesFound++;
        console.warn(`Duplicate lead found and removed: ${lead.name} (${lead.id})`);
      } else {
        uniqueLeadsMap.set(lead.id, lead);
      }
    });
    
    const uniqueLeads = Array.from(uniqueLeadsMap.values());
    
    if (duplicatesFound > 0) {
      console.warn(`⚠️ Removed ${duplicatesFound} duplicate leads. Original: ${leads.length}, Unique: ${uniqueLeads.length}`);
    }
    
    console.log("Unique leads data:", uniqueLeads);
    
    const tasks: Record<string, KanbanTask> = {};
    const columns = { ...leadsKanbanData.columns };
    
    let alreadyConvertedCount = 0;
    const seenLeadIds = new Set<string>();

    // Reset taskIds
    Object.keys(columns).forEach((colId) => {
      columns[colId].taskIds = [];
    });

    // Convert leads to kanban tasks based on API status
    uniqueLeads.forEach((lead: Lead) => {
      // Skip if we've already processed this lead (extra safety check)
      if (seenLeadIds.has(lead.id)) {
        console.warn(`Skipping duplicate lead in processing: ${lead.name} (${lead.id})`);
        return;
      }
      seenLeadIds.add(lead.id);
      
      // Skip leads that have already been converted to customers (unless filter is on)
      // These are in the system as customers now, no need to show in Kanban by default
      const leadMetadata = lead as any;
      const isAlreadyConverted = !!(leadMetadata.convertedToAccount || leadMetadata.convertedToAccountId);
      
      if (isAlreadyConverted && !showAlreadyConverted) {
        alreadyConvertedCount++;
        return;
      }
      
      // Use API status field, fallback to NEW if not set
      const apiStatus = lead.status || "NEW";
      const columnId = isUnqualifiedLead(lead)
        ? "col-unqualified"
        : statusToColumn[apiStatus] || "col-new";
      if (!columns[columnId]) return;

      tasks[lead.id] = {
        id: lead.id,
        content: lead.name || lead.email || `Lead ${lead.id}`,
        metadata: lead as unknown as Record<string, unknown>,
      };

      // Only add if not already in the column (extra safety)
      if (!columns[columnId].taskIds.includes(lead.id)) {
        columns[columnId].taskIds.push(lead.id);
      }
    });

    console.log("KanbanView: Lead columns after processing:");
    console.log(`  Filtered out ${alreadyConvertedCount} leads that are already converted to customers`);
    Object.keys(columns).forEach((colId) => {
      console.log(`  ${colId} (${columns[colId].title}): ${columns[colId].taskIds.length} leads`);
    });

    setLeadsKanbanData((prev) => ({
      ...prev,
      columns,
      tasks,
    }));
  }, [leads, showAlreadyConverted]);

  // Update Projects Kanban when projects change
  useEffect(() => {
    console.log("KanbanView: Projects changed:", projects.length, "projects");
    
    // Deduplicate projects by ID first
    const uniqueProjectsMap = new Map<string, Project>();
    let duplicatesFound = 0;
    
    projects.forEach((project: Project) => {
      if (uniqueProjectsMap.has(project.id)) {
        duplicatesFound++;
        console.warn(`Duplicate project found and removed: ${project.projectName || project.name} (${project.id})`);
      } else {
        uniqueProjectsMap.set(project.id, project);
      }
    });
    
    const uniqueProjects = Array.from(uniqueProjectsMap.values());
    
    if (duplicatesFound > 0) {
      console.warn(`⚠️ Removed ${duplicatesFound} duplicate projects. Original: ${projects.length}, Unique: ${uniqueProjects.length}`);
    }
    
    console.log("Unique projects data:", uniqueProjects);
    
    const tasks: Record<string, KanbanTask> = {};
    const columns = { ...projectsKanbanData.columns };
    const seenProjectIds = new Set<string>();

    // Reset taskIds
    Object.keys(columns).forEach((colId) => {
      columns[colId].taskIds = [];
    });

    // Convert projects to kanban tasks
    uniqueProjects.forEach((project: Project) => {
      // Skip if we've already processed this project (extra safety check)
      if (seenProjectIds.has(project.id)) {
        console.warn(`Skipping duplicate project in processing: ${project.projectName || project.name} (${project.id})`);
        return;
      }
      seenProjectIds.add(project.id);
      
      const columnId = mapProjectStageToColumn(project.currentStageCode);
      if (!columns[columnId]) return;

      tasks[project.id] = {
        id: project.id,
        content: project.projectName || project.name || "Untitled Project",
        metadata: project as any,
      };

      // Only add if not already in the column (extra safety)
      if (!columns[columnId].taskIds.includes(project.id)) {
        columns[columnId].taskIds.push(project.id);
      }
    });

    console.log("KanbanView: Project columns after processing:");
    Object.keys(columns).forEach((colId) => {
      console.log(`  ${colId} (${columns[colId].title}): ${columns[colId].taskIds.length} projects`);
    });

    setProjectsKanbanData((prev) => ({
      ...prev,
      columns,
      tasks,
    }));
  }, [projects]);

  // Helper: Map project stage to column
  const mapProjectStageToColumn = (stageCode?: string | null): string => {
    if (!stageCode) return "contract_onboarding";

    const mapping: Record<string, string> = {
      CONTRACT_ONBOARDING: "contract_onboarding",
      CLIENT_CONSULTATION: "client_consultation",
      SITE_VALIDATION: "site_validation",
      DESIGN_DEVELOPMENT: "design_development",
      COSTING_ESTIMATION: "costing_estimation",
      MATERIAL_FINALIZATION: "material_finalization",
      DESIGN_HANDOVER: "design_handover",
      EXECUTION: "execution_all_site_activities",
      CLEANING_SETUP: "cleaning_setup",
      DECOR_STYLING: "decor_styling",
      TESTING_QC: "testing_qc",
      HANDOVER_CLOSURE: "handover_closure",
      // Legacy stage mappings for backward compatibility
      ENQUIRY: "contract_onboarding",
      DESIGN_SIGNUP: "client_consultation",
      DESIGN: "design_development",
      FIRST_PRESENTATION: "site_validation",
      FINAL_DESIGN: "material_finalization",
      COSTING: "costing_estimation",
      HANDOVER: "handover_closure",
      TESTIMONIAL: "handover_closure",
    };
    return mapping[stageCode] || "contract_onboarding";
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

      // If dragged to the Converted column, show confirmation modal before
      // calling the conversion API
      if (toCol === "col-converted") {
        const leadName = task?.content || taskId;
        // Guard: check if lead is already converted before even showing the modal
        const leadMeta = task?.metadata as any;
        const alreadyConverted = !!(leadMeta?.convertedToAccount || leadMeta?.convertedToAccountId);
        if (alreadyConverted) {
          toast.error(
            `"${leadName}" has already been converted to a customer.`,
          );
          // Revert the drag
          fetchLeads();
          return;
        }
        setPendingConversion({ leadId: taskId, leadName, fromCol });
        return; // halt here — modal will handle the rest
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

  // Called when user confirms lead conversion in the modal
  const handleConfirmConversion = useCallback(async () => {
    if (!pendingConversion) return;
    const { leadId, leadName } = pendingConversion;

    // Guard: re-check task metadata in case the lead was already converted
    const task = leadsKanbanData.tasks[leadId];
    const leadMeta = task?.metadata as any;
    if (leadMeta?.convertedToAccount || leadMeta?.convertedToAccountId) {
      toast.error(`"${leadName}" has already been converted to a customer.`);
      setPendingConversion(null);
      fetchLeads();
      return;
    }

    setIsConverting(true);
    try {
      await convertLeadToCustomer(leadId, leadName);
      toast.success(
        `"${leadName}" has been converted to a customer successfully!`,
      );
      setPendingConversion(null);
      // fetchLeads will filter out the converted lead since convertedToAccountId is now set
      fetchLeads();
    } catch (error) {
      console.error("Failed to convert lead to customer:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to convert lead. Please try again.",
      );
      // Revert the kanban drag by refreshing
      fetchLeads();
      setPendingConversion(null);
    } finally {
      setIsConverting(false);
    }
  }, [pendingConversion, fetchLeads, leadsKanbanData.tasks]);

  // Called when user cancels the conversion modal
  const handleCancelConversion = useCallback(() => {
    setPendingConversion(null);
    // Revert the kanban UI by re-fetching the original state
    fetchLeads();
  }, [fetchLeads]);

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
            { value: "UNQUALIFIED", label: "Unqualified" },
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
        contract_onboarding: "CONTRACT_ONBOARDING",
        client_consultation: "CLIENT_CONSULTATION",
        site_validation: "SITE_VALIDATION",
        design_development: "DESIGN_DEVELOPMENT",
        costing_estimation: "COSTING_ESTIMATION",
        material_finalization: "MATERIAL_FINALIZATION",
        design_handover: "DESIGN_HANDOVER",
        execution_all_site_activities: "EXECUTION",
        cleaning_setup: "CLEANING_SETUP",
        decor_styling: "DECOR_STYLING",
        testing_qc: "TESTING_QC",
        handover_closure: "HANDOVER_CLOSURE",
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
        label: project.projectName || project.name || "Untitled Project",
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
          <h4
            className={`font-semibold text-[13px] leading-tight truncate ${
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
    [],
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
                  {formatProjectCurrency(project.totalValue)}
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
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-6 h-6 text-orange-500" />
              Kanban Board
            </h1>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveView("leads");
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
          
          {/* Filter: Show Already Converted Leads */}
          {activeView === "leads" && (
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={showAlreadyConverted}
                onChange={(e) => setShowAlreadyConverted(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-xs font-medium text-gray-700">
                Show Already Onboarded
              </span>
            </label>
          )}
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

      {/* Lead Conversion Confirmation Modal (Portal) */}
      {pendingConversion &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Convert Lead to Customer?
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    This action will create a customer profile
                  </p>
                </div>
                <button
                  onClick={handleCancelConversion}
                  disabled={isConverting}
                  className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-1">
                    Lead being converted
                  </p>
                  <p className="text-xl font-bold text-emerald-900">
                    {pendingConversion.leadName}
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Converting this lead will create a{" "}
                    <strong>Customer</strong> profile in the system. The lead
                    will be removed from your pipeline and will appear in the
                    Customers section.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 px-6 pb-6">
                <button
                  onClick={handleCancelConversion}
                  disabled={isConverting}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmConversion}
                  disabled={isConverting}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold text-sm hover:from-emerald-600 hover:to-green-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Yes, Convert to Customer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default KanbanView;
