import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  KanbanBoard,
  KanbanData,
  KanbanTask,
} from "../../components/kanban/KanbanBoard";
import { useLeadStore } from "../../stores/leadStore";
import { LeadStage, Lead } from "../../types";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  List,
  ArrowLeft,
} from "lucide-react";
import Button from "../../components/ui/Button";

const LeadsKanban: React.FC = () => {
  const navigate = useNavigate();
  const { leads, isLoading, fetchLeads } = useLeadStore();
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    columns: {
      "col-inquiry": {
        id: "col-inquiry",
        title: "Inquiry",
        taskIds: [],
        color: "#3B82F6",
      },
      "col-contacted": {
        id: "col-contacted",
        title: "Contacted",
        taskIds: [],
        color: "#8B5CF6",
      },
      "col-meeting": {
        id: "col-meeting",
        title: "Meeting Scheduled",
        taskIds: [],
        color: "#F59E0B",
      },
      "col-proposal": {
        id: "col-proposal",
        title: "Proposal Sent",
        taskIds: [],
        color: "#10B981",
      },
      "col-negotiation": {
        id: "col-negotiation",
        title: "Negotiation",
        taskIds: [],
        color: "#EF4444",
      },
      "col-won": {
        id: "col-won",
        title: "Won",
        taskIds: [],
        color: "#059669",
      },
      "col-lost": {
        id: "col-lost",
        title: "Lost",
        taskIds: [],
        color: "#6B7280",
      },
    },
    tasks: {},
    columnOrder: [
      "col-inquiry",
      "col-contacted",
      "col-meeting",
      "col-proposal",
      "col-negotiation",
      "col-won",
      "col-lost",
    ],
  });

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (leads.length > 0) {
      // Convert leads to kanban tasks
      const tasks: Record<string, KanbanTask> = {};
      const columnTaskIds: Record<string, string[]> = {
        "col-inquiry": [],
        "col-contacted": [],
        "col-meeting": [],
        "col-proposal": [],
        "col-negotiation": [],
        "col-won": [],
        "col-lost": [],
      };

      leads.forEach((lead) => {
        const taskId = `lead-${lead.id}`;
        tasks[taskId] = {
          id: taskId,
          content: lead.name,
          metadata: lead as unknown as Record<string, unknown>,
        };

        // Map lead stage to column
        const stageToColumn: Record<LeadStage, string> = {
          [LeadStage.INQUIRY]: "col-inquiry",
          [LeadStage.CONTACTED]: "col-contacted",
          [LeadStage.MEETING_SCHEDULED]: "col-meeting",
          [LeadStage.PROPOSAL_SENT]: "col-proposal",
          [LeadStage.NEGOTIATION]: "col-negotiation",
          [LeadStage.WON]: "col-won",
          [LeadStage.LOST]: "col-lost",
        };

        const columnId = stageToColumn[lead.stage];
        if (columnId && columnTaskIds[columnId]) {
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
    // TODO: Update lead stages in backend based on column changes
  };

  const renderLeadCard = (task: KanbanTask) => {
    const lead = task.metadata as unknown as Lead;
    if (!lead) return <div className="text-xs">{task.content}</div>;

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
          renderTaskCard={renderLeadCard}
          theme="light"
        />
      </div>
    </div>
  );
};

export default LeadsKanban;
