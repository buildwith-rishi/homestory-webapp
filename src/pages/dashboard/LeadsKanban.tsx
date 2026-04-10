import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  KanbanBoard,
  KanbanData,
  KanbanTask,
} from "../../components/kanban/KanbanBoard";
import {
  AddLeadCardFormWithButton,
  type NewLeadCardData,
} from "../../components/kanban/AddLeadCardForm";
import { useLeadStore } from "../../stores/leadStore";
import { Lead, LeadSource } from "../../types";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  List,
  ArrowLeft,
  User,
  FileText,
} from "lucide-react";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import LeadKanbanStatusWarningModal from "../../components/kanban/LeadKanbanStatusWarningModal";
import {
  toastLeadKanbanStatusFailure,
  getLeadKanbanStatusErrorMessage,
  isLeadActiveProjectsStatusConflict,
} from "../../utils/leadKanbanToast";

const LEAD_ASSIGNEES = [
  { id: "unassigned", name: "Unassigned" },
  { id: "sales-lead", name: "Sales Lead" },
  { id: "design-consultant", name: "Design Consultant" },
  { id: "project-manager", name: "Project Manager" },
  { id: "operations-team", name: "Operations Team" },
];

// Map column IDs to API status values
const columnToStatus: Record<string, string> = {
  "col-new": "NEW",
  "col-working": "WORKING",
  "col-qualified": "QUALIFIED",
  "col-disqualified": "DISQUALIFIED",
  "col-converted": "CONVERTED",
};

const LeadsKanban: React.FC = () => {
  const navigate = useNavigate();
  const { leads, isLoading, fetchLeads, moveLeadByStatus, addLead } =
    useLeadStore();

  const [leadStatusBlockMessage, setLeadStatusBlockMessage] = useState<
    string | null
  >(null);

  // Generate lead selection options for the dropdown
  const leadSelectOptions = useMemo(() => {
    return leads.map((lead) => ({
      value: `lead-${lead.id}`,
      label: lead.name || lead.email || `Lead ${lead.id}`,
      metadata: lead as unknown as Record<string, unknown>,
    }));
  }, [leads]);

  // Kanban columns based on API statuses
  const [kanbanData, setKanbanData] = useState<KanbanData>({
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

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (leads.length > 0) {
      // Convert leads to kanban tasks based on API status
      const tasks: Record<string, KanbanTask> = {};
      const columnTaskIds: Record<string, string[]> = {
        "col-new": [],
        "col-working": [],
        "col-qualified": [],
        "col-disqualified": [],
        "col-converted": [],
      };

      // Map API status to column ID
      const statusToColumn: Record<string, string> = {
        NEW: "col-new",
        WORKING: "col-working",
        QUALIFIED: "col-qualified",
        DISQUALIFIED: "col-disqualified",
        CONVERTED: "col-converted",
      };

      leads.forEach((lead) => {
        const taskId = `lead-${lead.id}`;
        tasks[taskId] = {
          id: taskId,
          content: lead.name || lead.email || "Unknown Lead",
          metadata: lead as unknown as Record<string, unknown>,
        };

        // Use API status field, default to NEW
        const status = lead.status || "NEW";
        const columnId = statusToColumn[status] || "col-new";

        if (columnTaskIds[columnId]) {
          columnTaskIds[columnId].push(taskId);
        }
      });

      setKanbanData((prev) => ({
        ...prev,
        tasks,
        columns: Object.keys(prev.columns).reduce(
          (acc, colId) => ({
            ...acc,
            [colId]: {
              ...prev.columns[colId],
              taskIds: columnTaskIds[colId] || [],
            },
          }),
          {},
        ),
      }));
    } else {
      // Clear tasks when no leads
      setKanbanData((prev) => ({
        ...prev,
        tasks: {},
        columns: Object.keys(prev.columns).reduce(
          (acc, colId) => ({
            ...acc,
            [colId]: {
              ...prev.columns[colId],
              taskIds: [],
            },
          }),
          {},
        ),
      }));
    }
  }, [leads]);

  const handleTaskClick = (task: KanbanTask) => {
    const lead = task.metadata as unknown as Lead;
    if (lead?.id) {
      navigate(`/dashboard/leads/${lead.id}`);
    }
  };

  const handleDataChange = (newData: KanbanData) => {
    setKanbanData(newData);
  };

  const handleTaskColumnChange = useCallback(
    async (taskId: string, fromCol: string, toCol: string) => {
      const newStatus = columnToStatus[toCol];
      const oldStatus = columnToStatus[fromCol];
      if (!newStatus) return;

      // Extract lead ID from task ID (format: "lead-{id}")
      const leadId = taskId.replace("lead-", "");

      // Get column titles for the toast message
      const fromTitle = kanbanData.columns[fromCol]?.title || oldStatus;
      const toTitle = kanbanData.columns[toCol]?.title || newStatus;

      try {
        // Update lead status via API
        await moveLeadByStatus(leadId, newStatus);
        toast.success(`Lead moved from ${fromTitle} to ${toTitle}`);
      } catch (error) {
        console.error("Failed to update lead status:", error);
        const msg = getLeadKanbanStatusErrorMessage(error);
        if (isLeadActiveProjectsStatusConflict(msg)) {
          setLeadStatusBlockMessage(msg);
        } else {
          toastLeadKanbanStatusFailure(error);
        }
        fetchLeads();
      }
    },
    [moveLeadByStatus, fetchLeads, kanbanData.columns],
  );

  // -----------------------------------------------------------------------
  // Handle new lead card from AddLeadCardForm - Creates lead via API
  // -----------------------------------------------------------------------
  const handleLeadCardAdd = useCallback(
    async (columnId: string, data: NewLeadCardData) => {
      // Determine the initial status based on the column
      const statusFromColumn = columnToStatus[columnId] || "NEW";

      try {
        // Create lead via API with required fields
        const newLead = await addLead({
          name: data.title,
          email: data.email || "",
          phone: data.contactNumber || "",
          source:
            (data.source?.toUpperCase() as LeadSource) || LeadSource.OTHER,
          stage: undefined as unknown as Lead["stage"], // Will be set by API based on status
        });

        // If the column is not "new", update the status after creation
        if (statusFromColumn !== "NEW" && newLead?.id) {
          await moveLeadByStatus(newLead.id, statusFromColumn);
        }

        toast.success("Lead created successfully!");

        // Refresh leads to get the latest data
        fetchLeads();
      } catch (error) {
        console.error("Failed to create lead:", error);
        toast.error("Failed to create lead");
      }
    },
    [addLead, moveLeadByStatus, fetchLeads],
  );

  // -----------------------------------------------------------------------
  // Custom add card form renderer for the Kanban columns
  // -----------------------------------------------------------------------
  const renderAddCardForm = useCallback(
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
          assignees={LEAD_ASSIGNEES.filter((a) => a.id !== "unassigned").map(
            (a) => ({ value: a.id, label: a.name }),
          )}
          leadStages={[
            { value: "inquiry", label: "Inquiry" },
            { value: "contacted", label: "Contacted" },
            { value: "meeting_scheduled", label: "Meeting Scheduled" },
            { value: "proposal_sent", label: "Proposal Sent" },
            { value: "negotiation", label: "Negotiation" },
            { value: "won", label: "Won" },
            { value: "lost", label: "Lost" },
          ]}
        />
      );
    },
    [handleLeadCardAdd],
  );

  const renderLeadCard = (task: KanbanTask) => {
    const lead = task.metadata as unknown as Lead;

    // Parse content to extract notes if present (format: "Lead Name - Notes text")
    const contentParts = task.content.split(" - ");
    const hasNotes = contentParts.length > 1;
    const displayName = contentParts[0];
    const notes = hasNotes ? contentParts.slice(1).join(" - ") : null;

    if (!lead) {
      // For newly added cards without lead metadata
      return (
        <div className={`space-y-1.5 ${task.completed ? "opacity-60" : ""}`}>
          <h4
            className={`font-semibold text-[13px] leading-tight ${
              task.completed ? "line-through text-gray-500" : "text-gray-900"
            }`}
          >
            {displayName}
          </h4>

          {notes && (
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-start gap-1.5">
                <FileText
                  size={11}
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-[11px] text-gray-700 leading-snug">
                  {notes}
                </p>
              </div>
            </div>
          )}

          {/* Assignment and Due Date badges */}
          {(task.assignedTo || task.endDate) && (
            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
              {task.assignedTo && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  <User size={10} />
                  {task.assignedTo}
                </span>
              )}
              {task.endDate && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                  <Calendar size={10} />
                  {new Date(task.endDate).toLocaleDateString()}
                </span>
              )}
            </div>
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
                  ₹{lead.budget.toLocaleString()}
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

        {/* Show notes if added via the form */}
        {notes && (
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-md">
            <div className="flex items-start gap-1.5">
              <FileText
                size={11}
                className="text-blue-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-gray-700 leading-snug">{notes}</p>
            </div>
          </div>
        )}

        {/* Assignment and Due Date badges */}
        {(task.assignedTo || task.endDate) && (
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
            {task.assignedTo && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                <User size={10} />
                {task.assignedTo}
              </span>
            )}
            {task.endDate && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                <Calendar size={10} />
                {new Date(task.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-900 text-lg">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/leads")}
              className="rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Button>
            <div className="h-5 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Leads Pipeline
              </h1>
              <p className="text-gray-600 text-xs mt-0.5">
                Drag and drop leads to update their stage
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate("/dashboard/leads")}
            className="rounded-xl"
          >
            <List className="w-4 h-4" />
            List View
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          initialData={kanbanData}
          onDataChange={handleDataChange}
          onTaskClick={handleTaskClick}
          onTaskColumnChange={handleTaskColumnChange}
          renderTaskCard={renderLeadCard}
          theme="light"
          selectConfig={{
            label: "Select Lead",
            placeholder: "Choose a lead...",
            options: leadSelectOptions,
          }}
          assignees={LEAD_ASSIGNEES}
          renderAddCardForm={renderAddCardForm}
        />
      </div>

      <LeadKanbanStatusWarningModal
        open={!!leadStatusBlockMessage}
        message={leadStatusBlockMessage ?? ""}
        onClose={() => setLeadStatusBlockMessage(null)}
      />
    </div>
  );
};

export default LeadsKanban;
