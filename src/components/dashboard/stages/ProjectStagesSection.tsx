import React, { useState, useMemo } from "react";
import {
  Plus,
  Table2,
  LayoutGrid,
  Loader2,
  AlertCircle,
  RefreshCw,
  Layers,
  Calendar,
} from "lucide-react";
import { Button, Card } from "../../ui";
import { useProjectStore } from "../../../stores/projectStore";
import { ProjectStagesTableView } from "./ProjectStagesTableView";
import { AddStageModal } from "./AddStageModal";
import { StageMatrixView } from "./StageMatrixView";
import type { Project, ProjectStageData } from "../../../types";

interface ProjectStagesSectionProps {
  project: Project;
}

const formatEnumLabel = (value: string): string => {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .replace(/AND/g, "&")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Stage codes that belong to Architecture (EXECUTION) phase regardless of API data
const ARCHITECTURE_STAGE_CODES = ["COSTING"];

export const ProjectStagesSection: React.FC<ProjectStagesSectionProps> = ({
  project,
}) => {
  const {
    projectStages,
    currentStageCode,
    isLoading,
    error,
    fetchProjectStages,
    deleteProjectStage,
  } = useProjectStore();

  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [phaseTab, setPhaseTab] = useState<"all" | "DESIGN" | "EXECUTION">(
    "all",
  );
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [matrixStage, setMatrixStage] = useState<ProjectStageData | null>(null);

  const phaseFilteredStages = useMemo(() => {
    // Remap COSTING (and any other architecture-only stages) to EXECUTION phase
    const remapped = projectStages.map((s) =>
      ARCHITECTURE_STAGE_CODES.includes(s.stageCode)
        ? { ...s, phaseType: "EXECUTION" }
        : s,
    );
    const sorted = [...remapped].sort((a, b) => a.orderIndex - b.orderIndex);
    if (phaseTab !== "all") {
      return sorted.filter((s) => s.phaseType === phaseTab);
    }
    return sorted;
  }, [projectStages, phaseTab]);

  const filteredStages = useMemo(() => {
    if (filter === "active") {
      return phaseFilteredStages.filter(
        (s) => s.status === "ONGOING" || s.status === "PENDING",
      );
    }
    if (filter === "completed") {
      return phaseFilteredStages.filter((s) => s.status === "COMPLETED");
    }
    return phaseFilteredStages;
  }, [phaseFilteredStages, filter]);

  const stats = useMemo(() => {
    const base = phaseFilteredStages;
    const total = base.length;
    const completed = base.filter((s) => s.status === "COMPLETED").length;
    const active = base.filter((s) => s.status === "ONGOING").length;
    const notStarted = base.filter((s) => s.status === "PENDING").length;
    const notApplicable = base.filter(
      (s) => s.status === "NOT_APPLICABLE",
    ).length;
    const applicableTotal = total - notApplicable;
    const progress =
      applicableTotal > 0 ? Math.round((completed / applicableTotal) * 100) : 0;
    return { total, completed, active, notStarted, notApplicable, progress };
  }, [phaseFilteredStages]);

  const handleDeleteStage = async (stageCode: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this stage? This cannot be undone.",
      )
    )
      return;
    try {
      await deleteProjectStage(project.id, stageCode);
    } catch {
      // Error handled in store
    }
  };

  const handleRefresh = () => {
    fetchProjectStages(project.id);
  };

  const handleStageAdded = () => {
    setShowAddStageModal(false);
    fetchProjectStages(project.id);
  };

  if (isLoading && projectStages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
        <p className="text-sm font-medium">Loading stages...</p>
      </div>
    );
  }

  if (error && projectStages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Show Day Plan Matrix for a selected stage
  if (matrixStage) {
    return (
      <StageMatrixView
        projectId={project.id}
        projectName={project.projectName}
        stage={matrixStage}
        onBack={() => setMatrixStage(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Project Stages</h2>
            <p className="text-xs text-gray-500">
              {formatEnumLabel(project.pipelineType || "")} Pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-gray-500"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "table"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Table2 className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "card"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setShowAddStageModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Stage
          </Button>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(
          [
            { key: "all" as const, label: "All" },
            { key: "DESIGN" as const, label: "Interiors" },
            { key: "EXECUTION" as const, label: "Architecture" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPhaseTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              phaseTab === tab.key
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: "all" as const, label: "All Stages", count: stats.total },
          {
            key: "active" as const,
            label: "Active",
            count: stats.active + stats.notStarted,
          },
          {
            key: "completed" as const,
            label: "Completed",
            count: stats.completed,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === tab.key
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key
                  ? "bg-white/25 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 bg-white/80 border-gray-200/50">
          <p className="text-xs text-gray-500 font-medium">Overall Progress</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {stats.progress}%
          </p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </Card>
        <Card className="p-3 bg-white/80 border-gray-200/50">
          <p className="text-xs text-gray-500 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.completed}
            <span className="text-sm text-gray-400 font-normal">
              /{stats.total}
            </span>
          </p>
        </Card>
        <Card className="p-3 bg-white/80 border-gray-200/50">
          <p className="text-xs text-gray-500 font-medium">Ongoing</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.active}
          </p>
        </Card>
        <Card className="p-3 bg-white/80 border-gray-200/50">
          <p className="text-xs text-gray-500 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {stats.notStarted}
          </p>
        </Card>
      </div>

      {/* Content */}
      {filteredStages.length === 0 ? (
        <Card className="p-8 bg-white/80 border-gray-200/50">
          <div className="flex flex-col items-center justify-center text-center">
            <Layers className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No Stages Found
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {filter !== "all"
                ? "No stages match this filter."
                : "No stages have been added to this project yet."}
            </p>
            {filter === "all" && (
              <Button
                size="sm"
                onClick={() => setShowAddStageModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Stage
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === "table" ? (
        <ProjectStagesTableView
          stages={filteredStages}
          currentStageCode={currentStageCode}
          projectId={project.id}
          onDelete={handleDeleteStage}
          onOpenMatrix={(stage) => setMatrixStage(stage)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredStages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              isCurrent={stage.stageCode === currentStageCode}
              onDelete={() => handleDeleteStage(stage.stageCode)}
              onOpenMatrix={() => setMatrixStage(stage)}
            />
          ))}
        </div>
      )}

      {showAddStageModal && (
        <AddStageModal
          projectId={project.id}
          onClose={() => setShowAddStageModal(false)}
          onSuccess={handleStageAdded}
          existingStagesCount={projectStages.length}
        />
      )}
    </div>
  );
};

/* ── Status config ── */
const statusConfig: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  COMPLETED: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Completed",
  },
  ONGOING: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Ongoing",
  },
  PENDING: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: "Pending",
  },
  NOT_APPLICABLE: {
    bg: "bg-gray-50",
    text: "text-gray-400",
    dot: "bg-gray-300",
    label: "N/A",
  },
};

/* ── Stage Card ── */
const StageCard: React.FC<{
  stage: ProjectStageData;
  isCurrent: boolean;
  onDelete: () => void;
  onOpenMatrix: () => void;
}> = ({ stage, isCurrent, onDelete, onOpenMatrix }) => {
  const cfg = statusConfig[stage.status] || statusConfig.PENDING;

  const fmtDate = (d?: string | null) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card
      className={`p-4 bg-white/80 border-gray-200/50 shadow-sm hover:shadow-md transition-shadow ${isCurrent ? "ring-2 ring-orange-400/60" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isCurrent && (
              <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-semibold uppercase">
                Current
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <h4 className="text-sm font-bold text-gray-900">{stage.stageName}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatEnumLabel(stage.phaseType)} &middot; Order #
            {stage.orderIndex}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Remove stage"
        >
          &times;
        </button>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Start: {fmtDate(stage.startDate)}</span>
        <span>End: {fmtDate(stage.endDate || stage.tentativeEndDate)}</span>
      </div>
      {stage.remarks && (
        <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">
          {stage.remarks}
        </p>
      )}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={onOpenMatrix}
          className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
        >
          <Calendar className="w-3 h-3" />
          Day Plan
        </button>
      </div>
    </Card>
  );
};
