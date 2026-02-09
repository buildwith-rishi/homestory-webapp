import React, { useState, useEffect, useCallback } from "react";
import {
  Settings2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sprout,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  ArrowLeft,
  Layers,
  Hash,
  Info,
} from "lucide-react";
import { Button, Card } from "../../ui";
import { StageTemplateModal } from "./StageTemplateModal";
import type { StageTemplate } from "../../../types";
import {
  getStageTemplates,
  deleteStageTemplate,
  reorderStageTemplates,
  seedStageTemplates,
  updateStageTemplate,
} from "../../../services/projectApi";

interface StageTemplatesPanelProps {
  onBack: () => void;
}

const formatEnumLabel = (value: string): string => {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .replace(/AND/g, "&")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const StageTemplatesPanel: React.FC<StageTemplatesPanelProps> = ({
  onBack,
}) => {
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<StageTemplate | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStageTemplates(showInactive);
      setTemplates(
        [...response.templates].sort((a, b) => a.orderIndex - b.orderIndex),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates",
      );
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (template: StageTemplate) => {
    const usageCount = template._count?.projectStages ?? 0;
    const msg =
      usageCount > 0
        ? `This template is used in ${usageCount} project(s). Are you sure you want to delete it?`
        : `Delete template "${template.name}"? This cannot be undone.`;

    if (!confirm(msg)) return;

    setActionLoading(template.id);
    try {
      await deleteStageTemplate(template.id);
      await fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (template: StageTemplate) => {
    setActionLoading(template.id);
    try {
      await updateStageTemplate(template.id, {
        isActive: !template.isActive,
      });
      await fetchTemplates();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to update template status",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleMove = async (
    template: StageTemplate,
    direction: "up" | "down",
  ) => {
    const sorted = [...templates].sort((a, b) => a.orderIndex - b.orderIndex);
    const idx = sorted.findIndex((t) => t.id === template.id);
    if (
      (direction === "up" && idx <= 0) ||
      (direction === "down" && idx >= sorted.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;

    // Build full orderings array with swapped values
    const orderings = sorted.map((t, i) => {
      if (i === idx)
        return { id: t.id, orderIndex: sorted[swapIdx].orderIndex };
      if (i === swapIdx)
        return { id: t.id, orderIndex: sorted[idx].orderIndex };
      return { id: t.id, orderIndex: t.orderIndex };
    });

    setActionLoading(template.id);
    try {
      await reorderStageTemplates({ orderings });
      await fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reorder templates");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSeed = async () => {
    if (
      !confirm(
        "This will seed default stage templates. Existing templates won't be affected. Continue?",
      )
    )
      return;

    setSeeding(true);
    try {
      await seedStageTemplates();
      await fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to seed templates");
    } finally {
      setSeeding(false);
    }
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditTemplate(null);
    fetchTemplates();
  };

  const handleEdit = (template: StageTemplate) => {
    setEditTemplate(template);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditTemplate(null);
    setShowModal(true);
  };

  const designTemplates = templates.filter((t) => t.phaseType === "DESIGN");
  const executionTemplates = templates.filter(
    (t) => t.phaseType === "EXECUTION",
  );

  if (loading && templates.length === 0) {
    return (
      <div className="space-y-4">
        <HeaderBar
          onBack={onBack}
          showInactive={showInactive}
          onToggleInactive={() => setShowInactive(!showInactive)}
        />
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
          <p className="text-sm font-medium">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error && templates.length === 0) {
    return (
      <div className="space-y-4">
        <HeaderBar
          onBack={onBack}
          showInactive={showInactive}
          onToggleInactive={() => setShowInactive(!showInactive)}
        />
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTemplates}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <HeaderBar
        onBack={onBack}
        showInactive={showInactive}
        onToggleInactive={() => setShowInactive(!showInactive)}
      />

      {/* Info Banner */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Info className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900 mb-1.5">
              How Templates Work
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Templates are <strong>reusable stage blueprints</strong> that you
              can use across all projects. When you go into any project →{" "}
              <strong>Stages tab → Add Stage → From Template</strong>, all
              active templates will appear as options. Creating or editing
              templates here <strong>doesn't affect existing projects</strong> —
              templates only apply when you explicitly add them to a project.
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-gray-50/80 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {templates.length} template{templates.length !== 1 ? "s" : ""}
          </span>
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTemplates}
            disabled={loading}
            className="text-gray-600 hover:bg-white border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={seeding}
            className="text-gray-700 hover:bg-white border-gray-300"
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Sprout className="w-4 h-4 mr-1.5" />
            )}
            Seed Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card className="p-8 bg-white/80 border-gray-200/50">
          <div className="flex flex-col items-center justify-center text-center">
            <Layers className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No Templates Found
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {showInactive
                ? "No stage templates exist yet."
                : "No active templates found. Try showing inactive templates."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSeed}
                disabled={seeding}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Sprout className="w-4 h-4 mr-1" />
                Seed Default Templates
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-1" />
                Create Custom
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-7">
          {/* Design Phase Templates */}
          {designTemplates.length > 0 && (
            <TemplateSection
              title="Design Phase"
              badgeColor="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm"
              templates={designTemplates}
              allTemplates={templates}
              actionLoading={actionLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onMove={handleMove}
            />
          )}

          {/* Execution Phase Templates */}
          {executionTemplates.length > 0 && (
            <TemplateSection
              title="Execution Phase"
              badgeColor="bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-sm"
              templates={executionTemplates}
              allTemplates={templates}
              actionLoading={actionLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onMove={handleMove}
            />
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <StageTemplateModal
          template={editTemplate}
          existingCount={templates.length}
          onClose={() => {
            setShowModal(false);
            setEditTemplate(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

/* ── Header Bar ── */
const HeaderBar: React.FC<{
  onBack: () => void;
  showInactive: boolean;
  onToggleInactive: () => void;
}> = ({ onBack, showInactive, onToggleInactive }) => (
  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        title="Back to Projects"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Settings2 className="w-5.5 h-5.5 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Stage Templates</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage reusable stage templates for your pipelines
        </p>
      </div>
    </div>
    <button
      onClick={onToggleInactive}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all shadow-sm hover:shadow-md ${
        showInactive
          ? "bg-gray-100 border-gray-300 text-gray-800"
          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {showInactive ? (
        <Eye className="w-4 h-4" />
      ) : (
        <EyeOff className="w-4 h-4" />
      )}
      {showInactive ? "Showing All" : "Active Only"}
    </button>
  </div>
);

/* ── Template Section (grouped by phase) ── */
const TemplateSection: React.FC<{
  title: string;
  badgeColor: string;
  templates: StageTemplate[];
  allTemplates: StageTemplate[];
  actionLoading: string | null;
  onEdit: (t: StageTemplate) => void;
  onDelete: (t: StageTemplate) => void;
  onToggleActive: (t: StageTemplate) => void;
  onMove: (t: StageTemplate, dir: "up" | "down") => void;
}> = ({
  title,
  badgeColor,
  templates,
  allTemplates,
  actionLoading,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
}) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <span
        className={`text-sm font-bold px-4 py-1.5 rounded-full ${badgeColor}`}
      >
        {title}
      </span>
      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
        {templates.length} template{templates.length !== 1 ? "s" : ""}
      </span>
    </div>
    <div className="space-y-3">
      {templates.map((template, idx) => (
        <TemplateRow
          key={template.id}
          template={template}
          isFirst={idx === 0}
          isLast={idx === templates.length - 1}
          isLoading={actionLoading === template.id}
          onEdit={() => onEdit(template)}
          onDelete={() => onDelete(template)}
          onToggleActive={() => onToggleActive(template)}
          onMoveUp={() => onMove(template, "up")}
          onMoveDown={() => onMove(template, "down")}
        />
      ))}
    </div>
  </div>
);

/* ── Template Row ── */
const TemplateRow: React.FC<{
  template: StageTemplate;
  isFirst: boolean;
  isLast: boolean;
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({
  template,
  isFirst,
  isLast,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}) => {
  const usageCount = template._count?.projectStages ?? 0;

  return (
    <Card
      className={`p-4 bg-white border-2 border-gray-200 shadow-md hover:shadow-xl hover:border-orange-300 transition-all duration-200 ${
        !template.isActive ? "opacity-60 bg-gray-50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Drag handle / Order */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            #{template.orderIndex}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-gray-900">
              {template.name}
            </h4>
            <span className="text-xs font-mono bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-2.5 py-1 rounded-md border border-gray-300">
              {template.code}
            </span>
            {template.isDefault && (
              <span className="text-[10px] bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-md font-bold shadow-sm">
                DEFAULT
              </span>
            )}
            {!template.isActive && (
              <span className="text-[10px] bg-gradient-to-r from-red-500 to-rose-600 text-white px-2 py-1 rounded-md font-bold shadow-sm">
                INACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            {template.description && (
              <p className="text-sm text-gray-600 truncate max-w-md">
                {template.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            {template.pipelineType && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                {formatEnumLabel(template.pipelineType)}
              </span>
            )}
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {usageCount} project{usageCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1">
          {isLoading ? (
            <div className="px-3">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="Move up"
              >
                <ChevronUp className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={onMoveDown}
                disabled={isLast}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="Move down"
              >
                <ChevronDown className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={onToggleActive}
                className={`p-2 rounded-lg transition-all shadow-sm hover:shadow-md ${
                  template.isActive
                    ? "text-green-600 hover:text-green-700 hover:bg-green-50 bg-green-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                title={
                  template.isActive
                    ? "Deactivate template"
                    : "Activate template"
                }
              >
                {template.isActive ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={onEdit}
                className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-blue-50/50 transition-all shadow-sm hover:shadow-md"
                title="Edit template"
              >
                <Pencil className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 bg-red-50/50 transition-all shadow-sm hover:shadow-md"
                title="Delete template"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
