import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Ban,
  CalendarDays,
} from "lucide-react";
import { Card, Badge } from "../../ui";
import { useProjectStore } from "../../../stores/projectStore";
import type {
  ProjectStageData,
  UpdateStageRequest,
  StageStatus,
} from "../../../types";
import toast from "react-hot-toast";

interface Props {
  stages: ProjectStageData[];
  currentStageCode: string | null;
  projectId: string;
  onDelete: (stageCode: string) => void;
  onMoveUp: (stageCode: string) => void;
  onMoveDown: (stageCode: string) => void;
  onOpenMatrix?: (stage: ProjectStageData) => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  ONGOING: <Clock className="w-4 h-4 text-blue-500" />,
  PENDING: <AlertCircle className="w-4 h-4 text-gray-400" />,
  NOT_APPLICABLE: <Ban className="w-4 h-4 text-gray-300" />,
};

const statusBadge: Record<string, { className: string; label: string }> = {
  COMPLETED: {
    className: "bg-green-100 text-green-700 border-green-200",
    label: "Completed",
  },
  ONGOING: {
    className: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Ongoing",
  },
  PENDING: {
    className: "bg-gray-100 text-gray-600 border-gray-200",
    label: "Pending",
  },
  NOT_APPLICABLE: {
    className: "bg-gray-50 text-gray-400 border-gray-100",
    label: "N/A",
  },
};

const formatDate = (d?: string | null) => {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatEnumLabel = (value: string): string => {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .replace(/AND/g, "&")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const ProjectStagesTableView: React.FC<Props> = ({
  stages,
  currentStageCode,
  projectId,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpenMatrix,
}) => {
  const { updateProjectStage } = useProjectStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    status: string;
    tentativeEndDate: string;
    remarks: string;
  }>({
    status: "",
    tentativeEndDate: "",
    remarks: "",
  });
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openEdit = (stage: ProjectStageData) => {
    setEditingId(stage.id);
    setEditForm({
      status: stage.status,
      tentativeEndDate: stage.tentativeEndDate
        ? stage.tentativeEndDate.split("T")[0]
        : "",
      remarks: stage.remarks || "",
    });
    setActionMenuId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (stage: ProjectStageData) => {
    setIsSaving(true);
    try {
      const data: UpdateStageRequest = {
        status: editForm.status as StageStatus,
      };
      if (editForm.tentativeEndDate)
        data.tentativeEndDate = editForm.tentativeEndDate;
      if (editForm.remarks) data.remarks = editForm.remarks;

      await updateProjectStage(projectId, stage.stageCode, data);
      toast.success(`Stage "${stage.stageName}" updated`);
      setEditingId(null);
    } catch {
      toast.error("Failed to update stage");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-white/80 border-gray-200/50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">
                #
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Phase
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, idx) => {
              const isEditing = editingId === stage.id;
              const isCurrent = stage.stageCode === currentStageCode;
              const badge = statusBadge[stage.status] || statusBadge.PENDING;

              return (
                <tr
                  key={stage.id}
                  className={`border-b border-gray-100 last:border-0 transition-colors ${
                    isCurrent ? "bg-orange-50/50" : "hover:bg-gray-50/50"
                  }`}
                >
                  {/* Order */}
                  <td className="py-3 px-4">
                    <span className="text-xs text-gray-400 font-mono">
                      {stage.orderIndex}
                    </span>
                  </td>

                  {/* Stage Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {statusIcons[stage.status] || statusIcons.PENDING}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900">
                            {stage.stageName}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {stage.stageCode}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Phase */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        stage.phaseType === "DESIGN"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-teal-50 text-teal-600"
                      }`}
                    >
                      {formatEnumLabel(stage.phaseType)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {isEditing ? (
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value })
                        }
                        className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="NOT_APPLICABLE">Not Applicable</option>
                      </select>
                    ) : (
                      <Badge
                        className={`${badge.className} border text-xs px-2 py-0.5`}
                      >
                        {badge.label}
                      </Badge>
                    )}
                  </td>

                  {/* Timeline */}
                  <td className="py-3 px-4">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.tentativeEndDate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            tentativeEndDate: e.target.value,
                          })
                        }
                        className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(stage.startDate)}
                        <span className="text-gray-300">&rarr;</span>
                        {formatDate(stage.endDate || stage.tentativeEndDate)}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => saveEdit(stage)}
                          disabled={isSaving}
                          className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-md hover:bg-orange-600 disabled:opacity-50"
                        >
                          {isSaving ? "..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-gray-500 px-2 py-1 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => onMoveUp(stage.stageCode)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onMoveDown(stage.stageCode)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {onOpenMatrix && (
                          <button
                            onClick={() => onOpenMatrix(stage)}
                            className="p-1 text-gray-400 hover:text-orange-600"
                            title="Day Plan"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(stage)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(stage.stageCode)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
