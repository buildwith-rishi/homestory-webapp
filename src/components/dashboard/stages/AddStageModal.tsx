import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Plus, Loader2, Layers } from "lucide-react";
import { Button, Card } from "../../ui";
import { useProjectStore } from "../../../stores/projectStore";
import type { StageTemplate } from "../../../types";
import toast from "react-hot-toast";

interface Props {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  existingStagesCount: number;
}

export const AddStageModal: React.FC<Props> = ({
  projectId,
  onClose,
  onSuccess,
  existingStagesCount,
}) => {
  const { fetchAvailableStages, availableStages, addProjectStage, isLoading } =
    useProjectStore();

  const [mode, setMode] = useState<"template" | "custom">("template");
  const [selectedTemplate, setSelectedTemplate] =
    useState<StageTemplate | null>(null);
  const [customForm, setCustomForm] = useState({
    stageCode: "",
    stageName: "",
    phaseType: "DESIGN",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableStages(projectId);
  }, [projectId, fetchAvailableStages]);

  const handleAddFromTemplate = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    try {
      await addProjectStage(projectId, {
        stageTemplateId: selectedTemplate.id,
        orderIndex: existingStagesCount + 1,
      });
      toast.success(`Stage "${selectedTemplate.name}" added`);
      onSuccess();
    } catch {
      toast.error("Failed to add stage");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustom = async () => {
    if (!customForm.stageCode.trim() || !customForm.stageName.trim()) {
      toast.error("Stage code and name are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await addProjectStage(projectId, {
        stageCode: customForm.stageCode.toUpperCase().replace(/\s+/g, "_"),
        stageName: customForm.stageName,
        phaseType: customForm.phaseType,
        orderIndex: existingStagesCount + 1,
      });
      toast.success(`Stage "${customForm.stageName}" added`);
      onSuccess();
    } catch {
      toast.error("Failed to add stage");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatEnumLabel = (value: string): string => {
    if (!value) return "";
    return value
      .replace(/_/g, " ")
      .replace(/AND/g, "&")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Plus className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add Stage</h2>
              <p className="text-xs text-gray-500">
                Add a new stage to the project pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode("template")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "template"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              From Template
            </button>
            <button
              onClick={() => setMode("custom")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "custom"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Custom Stage
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {mode === "template" ? (
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                  <p className="text-sm text-gray-500">
                    Loading available stages...
                  </p>
                </div>
              ) : availableStages.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    No templates available
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    Templates are created from the{" "}
                    <strong>Projects page → Templates button</strong>. Once
                    created, they'll appear here for quick stage addition.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    For now, try creating a custom stage below.
                  </p>
                </div>
              ) : (
                availableStages.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTemplate?.id === tmpl.id
                        ? "border-orange-400 bg-orange-50 ring-1 ring-orange-300"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {tmpl.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {tmpl.code} &middot; {formatEnumLabel(tmpl.phaseType)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          tmpl.phaseType === "DESIGN"
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-teal-50 text-teal-600"
                        }`}
                      >
                        {formatEnumLabel(tmpl.phaseType)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage Code *
                </label>
                <input
                  type="text"
                  value={customForm.stageCode}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, stageCode: e.target.value })
                  }
                  placeholder="e.g. CUSTOM_REVIEW"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Uppercase with underscores (auto-formatted)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage Name *
                </label>
                <input
                  type="text"
                  value={customForm.stageName}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, stageName: e.target.value })
                  }
                  placeholder="e.g. Custom Review Phase"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase Type *
                </label>
                <div className="flex gap-2">
                  {["DESIGN", "EXECUTION"].map((pt) => (
                    <button
                      key={pt}
                      onClick={() =>
                        setCustomForm({ ...customForm, phaseType: pt })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        customForm.phaseType === pt
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {formatEnumLabel(pt)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={
              mode === "template" ? handleAddFromTemplate : handleAddCustom
            }
            disabled={
              isSubmitting || (mode === "template" && !selectedTemplate)
            }
            className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Add Stage
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};
