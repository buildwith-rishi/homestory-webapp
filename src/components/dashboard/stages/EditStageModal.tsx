import React, { useState } from "react";
import {
  X,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Ban,
} from "lucide-react";
import { Button, Badge } from "../../ui";
import { ProjectStageWithDays, StageStatus } from "../../../types";

// Helper functions
const formatCurrency = (value: number): string => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
};

const getStatusColor = (status: StageStatus) => {
  const colors: Record<
    StageStatus,
    { bg: string; text: string; border: string }
  > = {
    [StageStatus.COMPLETED]: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-200",
    },
    [StageStatus.ONGOING]: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    [StageStatus.PENDING]: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-200",
    },
    [StageStatus.NOT_APPLICABLE]: {
      bg: "bg-gray-50",
      text: "text-gray-400",
      border: "border-gray-200",
    },
  };
  return colors[status];
};

interface EditStageModalProps {
  stage: ProjectStageWithDays;
  onClose: () => void;
  onSave: (updates: {
    startDate?: string;
    estimatedEndDate?: string;
    totalBudget?: number;
    remarks?: string;
    status?: StageStatus;
  }) => void;
}

export const EditStageModal: React.FC<EditStageModalProps> = ({
  stage,
  onClose,
  onSave,
}) => {
  const [startDate, setStartDate] = useState(stage.startDate || "");
  const [estimatedEndDate, setEstimatedEndDate] = useState(
    stage.estimatedEndDate || "",
  );
  const [totalBudget, setTotalBudget] = useState(stage.totalBudget.toString());
  const [remarks, setRemarks] = useState(stage.remarks || "");
  const [status, setStatus] = useState(stage.status);
  const [errors, setErrors] = useState<{
    startDate?: string;
    endDate?: string;
    budget?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Validate start date is before end date
    if (
      startDate &&
      estimatedEndDate &&
      new Date(startDate) > new Date(estimatedEndDate)
    ) {
      newErrors.endDate = "End date must be after start date";
    }

    // Validate budget is a positive number
    const budgetNum = parseFloat(totalBudget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      newErrors.budget = "Budget must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    onSave({
      startDate: startDate || undefined,
      estimatedEndDate: estimatedEndDate || undefined,
      totalBudget: parseFloat(totalBudget),
      remarks: remarks || undefined,
      status,
    });
  };

  const statusColors = getStatusColor(status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Stage
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {stage.phaseName}
                  </p>
                </div>
              </div>
              <Badge
                className={`${statusColors.bg} ${statusColors.text} text-xs mt-2`}
              >
                {stage.phaseCategory} PHASE
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stage Description */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-700">{stage.phaseDescription}</p>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Stage Status *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(StageStatus).map((statusOption) => {
                const colors = getStatusColor(statusOption);
                const isSelected = status === statusOption;
                return (
                  <button
                    key={statusOption}
                    onClick={() => setStatus(statusOption)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `${colors.border} ${colors.bg} ring-2 ring-purple-500`
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {statusOption === StageStatus.COMPLETED && (
                        <CheckCircle2
                          className={`w-5 h-5 ${isSelected ? colors.text : "text-gray-400"}`}
                        />
                      )}
                      {statusOption === StageStatus.ONGOING && (
                        <Clock
                          className={`w-5 h-5 ${isSelected ? colors.text : "text-gray-400"}`}
                        />
                      )}
                      {statusOption === StageStatus.PENDING && (
                        <AlertCircle
                          className={`w-5 h-5 ${isSelected ? colors.text : "text-gray-400"}`}
                        />
                      )}
                      {statusOption === StageStatus.NOT_APPLICABLE && (
                        <Ban
                          className={`w-5 h-5 ${isSelected ? colors.text : "text-gray-400"}`}
                        />
                      )}
                      <span
                        className={`text-sm font-semibold ${isSelected ? colors.text : "text-gray-600"}`}
                      >
                        {statusOption.replace("_", " ")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setErrors((prev) => ({ ...prev, startDate: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.startDate
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
              />
              {errors.startDate && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.startDate}
                </p>
              )}
            </div>

            {/* Estimated End Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Estimated End Date
              </label>
              <input
                type="date"
                value={estimatedEndDate}
                onChange={(e) => {
                  setEstimatedEndDate(e.target.value);
                  setErrors((prev) => ({ ...prev, endDate: undefined }));
                }}
                min={startDate || undefined}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.endDate
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
              />
              {errors.endDate && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Budget Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Total Budget (₹)
            </label>
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => {
                setTotalBudget(e.target.value);
                setErrors((prev) => ({ ...prev, budget: undefined }));
              }}
              min="0"
              step="1000"
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.budget ? "border-red-300 bg-red-50" : "border-gray-200"
              } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
              placeholder="Enter budget amount" onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
            />
            {errors.budget && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.budget}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Current spent:{" "}
              <span className="font-semibold">
                {formatCurrency(stage.spentBudget)}
              </span>
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks / Notes
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
              placeholder="Add any notes or comments about this stage..."
            />
          </div>

          {/* Stage Info Summary */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-3">
              Stage Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-blue-600 text-xs">Total Days</p>
                <p className="font-semibold text-blue-900">
                  {stage.totalDays} days
                </p>
              </div>
              <div>
                <p className="text-blue-600 text-xs">Completed Days</p>
                <p className="font-semibold text-blue-900">
                  {stage.completedDays} days
                </p>
              </div>
              <div>
                <p className="text-blue-600 text-xs">Progress</p>
                <p className="font-semibold text-blue-900">{stage.progress}%</p>
              </div>
              <div>
                <p className="text-blue-600 text-xs">Day Plans</p>
                <p className="font-semibold text-blue-900">
                  {stage.dayPlans.length} created
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStageModal;
