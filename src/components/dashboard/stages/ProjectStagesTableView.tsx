import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Users,
  Pause,
  Play,
  AlertCircle,
  Plus,
  MoreHorizontal,
  Edit3,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  CreditCard,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  ProjectStageWithDays,
  DayPlan,
  StageStatus,
  DayPlanStatus,
  DayTaskStatus,
  PaymentStatus,
} from "../../../types";
import { PaymentReminderModal, PaymentData } from "./PaymentReminderModal";

// Helper functions
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatFullDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value: number): string => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }
  return `₹${value}`;
};

interface ProjectStagesTableViewProps {
  stages: ProjectStageWithDays[];
  onEditStage: (stage: ProjectStageWithDays) => void;
  onPauseStage: (stage: ProjectStageWithDays) => void;
  onAddTask: (stage: ProjectStageWithDays) => void;
  onViewDayPlan: (dayPlan: DayPlan, stage: ProjectStageWithDays) => void;
  onPaymentCollected?: (paymentData: PaymentData) => void;
}

export const ProjectStagesTableView: React.FC<ProjectStagesTableViewProps> = ({
  stages,
  onEditStage,
  onPauseStage,
  onAddTask,
  onViewDayPlan,
  onPaymentCollected,
}) => {
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStageForPayment, setSelectedStageForPayment] = useState<ProjectStageWithDays | null>(null);

  // Filter stages
  const filteredStages = useMemo(() => {
    if (selectedFilter === "all") return stages;
    if (selectedFilter === "active") {
      return stages.filter(
        (s) => s.status === StageStatus.IN_PROGRESS || s.status === StageStatus.NOT_STARTED
      );
    }
    if (selectedFilter === "completed") {
      return stages.filter((s) => s.status === StageStatus.COMPLETED);
    }
    return stages;
  }, [stages, selectedFilter]);

  const toggleStageExpand = (stageId: string) => {
    setExpandedStages((prev) =>
      prev.includes(stageId) ? prev.filter((id) => id !== stageId) : [...prev, stageId]
    );
  };

  // Calculate totals
  const totals = useMemo(() => {
    return filteredStages.reduce(
      (acc, stage) => ({
        totalDays: acc.totalDays + stage.totalDays,
        completedDays: acc.completedDays + stage.completedDays,
        totalBudget: acc.totalBudget + stage.totalBudget,
        spentBudget: acc.spentBudget + stage.spentBudget,
      }),
      { totalDays: 0, completedDays: 0, totalBudget: 0, spentBudget: 0 }
    );
  }, [filteredStages]);

  const overallProgress = totals.totalDays > 0 
    ? Math.round((totals.completedDays / totals.totalDays) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Simplified Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { value: "all", label: "All Stages", count: stages.length },
            { value: "active", label: "Active", count: stages.filter(s => s.status === StageStatus.IN_PROGRESS || s.status === StageStatus.NOT_STARTED).length },
            { value: "completed", label: "Completed", count: stages.filter(s => s.status === StageStatus.COMPLETED).length },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === filter.value
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
              }`}
            >
              {filter.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                selectedFilter === filter.value
                  ? "bg-orange-400 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Simplified Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1">Overall Progress</p>
          <p className="text-2xl font-bold text-gray-900">{overallProgress}%</p>
          <p className="text-xs text-green-600 font-medium mt-1">71% Complete</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1">Days Completed</p>
          <p className="text-2xl font-bold text-gray-900">
            {totals.completedDays}<span className="text-base text-gray-400">/{totals.totalDays}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">20 of 28 days</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1">Budget Spent</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.spentBudget)}</p>
          <p className="text-xs text-gray-500 mt-1">of {formatCurrency(totals.totalBudget)} total</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalBudget)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {totals.totalBudget > 0 ? Math.round((totals.spentBudget / totals.totalBudget) * 100) : 0}% utilized
          </p>
        </div>
      </div>

      {/* Clean Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5">
            <div className="col-span-4">
              <span className="text-xs font-medium text-gray-500 uppercase">Stage</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Status</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Payment</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Timeline</span>
            </div>
            <div className="col-span-2 text-right">
              <span className="text-xs font-medium text-gray-500 uppercase">Budget</span>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {filteredStages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No stages found</p>
              <p className="text-gray-400 text-sm mt-1">Try changing the filter</p>
            </div>
          ) : (
            filteredStages.map((stage, index) => (
              <StageRow
                key={stage.id}
                stage={stage}
                index={index}
                isExpanded={expandedStages.includes(stage.id)}
                onToggleExpand={() => toggleStageExpand(stage.id)}
                onEdit={() => onEditStage(stage)}
                onPause={() => onPauseStage(stage)}
                onAddTask={() => onAddTask(stage)}
                onViewDayPlan={(dayPlan) => onViewDayPlan(dayPlan, stage)}
                onOpenPaymentModal={() => {
                  setSelectedStageForPayment(stage);
                  setPaymentModalOpen(true);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentReminderModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedStageForPayment(null);
        }}
        stage={selectedStageForPayment}
        onConfirmPayment={(paymentData) => {
          if (onPaymentCollected) {
            onPaymentCollected(paymentData);
          }
          setPaymentModalOpen(false);
          setSelectedStageForPayment(null);
        }}
      />
    </div>
  );
};

// Stage Row Component
interface StageRowProps {
  stage: ProjectStageWithDays;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onPause: () => void;
  onAddTask: () => void;
  onViewDayPlan: (dayPlan: DayPlan) => void;
  onOpenPaymentModal: () => void;
}

const StageRow: React.FC<StageRowProps> = ({
  stage,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onPause,
  onAddTask,
  onViewDayPlan,
  onOpenPaymentModal,
}) => {
  const isInProgress = stage.status === StageStatus.IN_PROGRESS;
  const isCompleted = stage.status === StageStatus.COMPLETED;
  const isNotStarted = stage.status === StageStatus.NOT_STARTED;

  const budgetPercentage = stage.totalBudget > 0 
    ? Math.round((stage.spentBudget / stage.totalBudget) * 100) 
    : 0;

  return (
    <>
      {/* Simplified Main Row */}
      <div className={`hover:bg-gray-50 transition-colors ${isInProgress ? "bg-orange-50/30" : ""}`}>
        <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-100 last:border-b-0">
          {/* Stage Info - Clean & Simple */}
          <div className="col-span-4">
            <div className="flex items-center gap-3">
              {/* Simple Stage Badge */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isInProgress
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onToggleExpand}
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <h4 className="font-semibold text-gray-900 truncate cursor-pointer hover:text-orange-600" onClick={onToggleExpand}>
                    {stage.phaseName}
                  </h4>
                </div>
                <p className="text-xs text-gray-500 truncate pl-6">
                  {stage.phaseDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Status - Simple Badge */}
          <div className="col-span-2 flex justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isCompleted
                ? "bg-green-100 text-green-700"
                : isInProgress
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
            </span>
          </div>

          {/* Payment Status - Clean */}
          <div className="col-span-2 flex justify-center">
            {stage.paymentRequired ? (
              <div className="text-center">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  stage.paymentStatus === PaymentStatus.PAID || stage.paymentStatus === PaymentStatus.COLLECTED
                    ? "bg-green-100 text-green-700"
                    : stage.paymentStatus === PaymentStatus.PARTIAL
                    ? "bg-orange-100 text-orange-700"
                    : stage.paymentStatus === PaymentStatus.OVERDUE
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {stage.paymentStatus === PaymentStatus.PAID || stage.paymentStatus === PaymentStatus.COLLECTED ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : stage.paymentStatus === PaymentStatus.OVERDUE ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <CreditCard className="w-3 h-3" />
                  )}
                  <span>
                    {stage.paymentStatus === PaymentStatus.PAID || stage.paymentStatus === PaymentStatus.COLLECTED
                      ? "Paid"
                      : stage.paymentStatus === PaymentStatus.OVERDUE
                      ? "Overdue"
                      : stage.paymentStatus === PaymentStatus.PARTIAL
                      ? "Partial"
                      : "Pending"}
                  </span>
                </div>
                {stage.paymentAmount && (
                  <div className="text-xs text-gray-600 font-medium mt-1">
                    {formatCurrency(stage.paymentAmount)}
                  </div>
                )}
                {(stage.paymentStatus === PaymentStatus.PENDING || 
                  stage.paymentStatus === PaymentStatus.PARTIAL ||
                  stage.paymentStatus === PaymentStatus.OVERDUE) && (
                  <button
                    onClick={onOpenPaymentModal}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1"
                  >
                    Collect Now
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>

          {/* Timeline - Simple */}
          <div className="col-span-2 text-center">
            {stage.startDate ? (
              <div className="space-y-1">
                <div className="text-xs text-gray-700 font-medium">
                  {formatDate(stage.startDate)} → {formatDate(stage.estimatedEndDate)}
                </div>
                {stage.actualEndDate && (
                  <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {formatDate(stage.actualEndDate)}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not scheduled</span>
            )}
          </div>

          {/* Budget - Clean Display */}
          <div className="col-span-2">
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  {formatCurrency(stage.spentBudget)} <span className="text-gray-400 font-normal">/</span> <span className="text-gray-500 font-normal">{formatCurrency(stage.totalBudget)}</span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        budgetPercentage > 90 ? "bg-red-500" : budgetPercentage > 70 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{budgetPercentage}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center">
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {isInProgress && (
                  <button
                    onClick={onPause}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-yellow-600 transition-colors"
                    title={stage.isPaused ? "Resume" : "Pause"}
                  >
                    {stage.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                )}
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Day Plan Expansion */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-100">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-orange-500" />
                <h5 className="text-sm font-semibold text-gray-900">Day-by-Day Plan</h5>
                <span className="text-xs text-gray-500">({stage.dayPlans.length} days)</span>
              </div>
              {(isInProgress || isNotStarted) && (
                <button
                  onClick={onAddTask}
                  className="px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add Day
                </button>
              )}
            </div>

            {stage.dayPlans.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No day plans yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Day Plan Header */}
                <div className="grid grid-cols-7 gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
                  <div>Day</div>
                  <div>Date</div>
                  <div className="text-center">Status</div>
                  <div className="text-center">Tasks</div>
                  <div className="text-center">Team</div>
                  <div className="text-right">Cost</div>
                  <div className="text-center">Action</div>
                </div>

                {/* Day Plan Rows */}
                <div className="divide-y divide-gray-100">
                  {stage.dayPlans.map((dayPlan) => {
                    const isToday = dayPlan.status === DayPlanStatus.IN_PROGRESS;
                    const isDayCompleted = dayPlan.status === DayPlanStatus.COMPLETED;
                    const completedTasks = dayPlan.tasks.filter(
                      (t) => t.status === DayTaskStatus.COMPLETED
                    ).length;

                    return (
                      <div
                        key={dayPlan.id}
                        className={`grid grid-cols-7 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors ${
                          isToday ? "bg-orange-50/50" : ""
                        }`}
                      >
                        {/* Day Number */}
                        <div>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isDayCompleted
                                ? "bg-green-500 text-white"
                                : isToday
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {isDayCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              dayPlan.dayNumber
                            )}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="text-sm text-gray-700">
                          {formatFullDate(dayPlan.date)}
                        </div>

                        {/* Status */}
                        <div className="flex justify-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              isDayCompleted
                                ? "bg-green-100 text-green-700"
                                : isToday
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {isDayCompleted ? "Done" : isToday ? "Today" : "Scheduled"}
                          </span>
                        </div>

                        {/* Tasks */}
                        <div className="text-center text-sm">
                          <span className="font-medium text-gray-900">{completedTasks}</span>
                          <span className="text-gray-400">/{dayPlan.tasks.length}</span>
                        </div>

                        {/* Team */}
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{dayPlan.totalWorkers}</span>
                        </div>

                        {/* Cost */}
                        <div className="text-right text-sm font-medium text-gray-900">
                          {formatCurrency(dayPlan.totalCost)}
                        </div>

                        {/* Action */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => onViewDayPlan(dayPlan)}
                            className="px-3 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectStagesTableView;
