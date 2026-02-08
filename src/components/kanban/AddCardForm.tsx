import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Calendar,
  User,
  Flag,
  ChevronDown,
  FileText,
  Type,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface AddCardFormSelectOption {
  value: string;
  label: string;
}

export interface AddCardFormSelectConfig {
  label: string;
  placeholder: string;
  options: AddCardFormSelectOption[];
  required?: boolean;
}

export interface AddCardFormAssignee {
  id: string;
  name: string;
}

export interface NewCardData {
  selectedId?: string; // Lead or Project ID
  title: string;
  description: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  priority?: "high" | "medium" | "low";
}

export interface AddCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewCardData) => void;
  theme?: "light" | "dark";
  /** Configuration for the lead/project select dropdown */
  selectConfig?: AddCardFormSelectConfig;
  /** Optional list of assignees */
  assignees?: AddCardFormAssignee[];
  /** Custom class name for the form container */
  className?: string;
}

// ============================================================================
// PRIORITY OPTIONS
// ============================================================================

const PRIORITY_OPTIONS: Array<{
  value: "high" | "medium" | "low";
  label: string;
  color: string;
  bgColor: string;
}> = [
  {
    value: "high",
    label: "High",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    value: "low",
    label: "Low",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
];

// ============================================================================
// DEFAULT ASSIGNEES
// ============================================================================

const DEFAULT_ASSIGNEES: AddCardFormAssignee[] = [
  { id: "unassigned", name: "Unassigned" },
  { id: "sales-lead", name: "Sales Lead" },
  { id: "project-manager", name: "Project Manager" },
  { id: "design-team", name: "Design Team" },
  { id: "operations-team", name: "Operations Team" },
];

// ============================================================================
// ADD CARD FORM COMPONENT
// ============================================================================

export const AddCardForm: React.FC<AddCardFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  theme = "light",
  selectConfig,
  assignees,
  className = "",
}) => {
  // -------------------------------------------------------------------------
  // Form State
  // -------------------------------------------------------------------------
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low" | "">("");
  const [assignedTo, setAssignedTo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLSelectElement>(null);

  // -------------------------------------------------------------------------
  // Derived Values
  // -------------------------------------------------------------------------
  const isLight = theme === "light";
  const assigneeOptions =
    assignees && assignees.length > 0 ? assignees : DEFAULT_ASSIGNEES;

  // Check if form is valid (at least title or selected item required)
  const isFormValid = title.trim() !== "" || selectedId !== "";

  // -------------------------------------------------------------------------
  // Reset Form
  // -------------------------------------------------------------------------
  const resetForm = useCallback(() => {
    setSelectedId("");
    setTitle("");
    setDescription("");
    setPriority("");
    setAssignedTo("");
    setStartDate("");
    setEndDate("");
  }, []);

  // -------------------------------------------------------------------------
  // Handle Submit
  // -------------------------------------------------------------------------
  const handleSubmit = useCallback(() => {
    if (!isFormValid) return;

    const data: NewCardData = {
      title: title.trim(),
      description: description.trim(),
    };

    if (selectedId) {
      data.selectedId = selectedId;
    }

    if (assignedTo && assignedTo !== "unassigned") {
      data.assignedTo = assignedTo;
    }

    if (startDate) {
      data.startDate = startDate;
    }

    if (endDate) {
      data.endDate = endDate;
    }

    if (priority) {
      data.priority = priority as "high" | "medium" | "low";
    }

    onSubmit(data);
    resetForm();
  }, [
    isFormValid,
    title,
    description,
    selectedId,
    assignedTo,
    startDate,
    endDate,
    priority,
    onSubmit,
    resetForm,
  ]);

  // -------------------------------------------------------------------------
  // Handle Cancel
  // -------------------------------------------------------------------------
  const handleCancel = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // -------------------------------------------------------------------------
  // Keyboard Navigation
  // -------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape to cancel
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
        return;
      }

      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
    },
    [handleCancel, handleSubmit],
  );

  // -------------------------------------------------------------------------
  // Focus Management
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      // Focus on the first available input
      const timer = setTimeout(() => {
        if (selectConfig && firstInputRef.current) {
          firstInputRef.current.focus();
        } else if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectConfig]);

  // -------------------------------------------------------------------------
  // Theme Classes
  // -------------------------------------------------------------------------
  const containerClasses = isLight
    ? "bg-gray-50/95 border-gray-200"
    : "bg-gray-800/95 border-gray-700";

  const labelClasses = isLight ? "text-gray-600" : "text-gray-400";

  const inputClasses = isLight
    ? "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-orange-500 focus:border-orange-500"
    : "border-gray-600 bg-gray-900 text-gray-200 placeholder:text-gray-500 focus:ring-orange-500 focus:border-orange-500";

  const buttonPrimaryClasses = isFormValid
    ? "bg-orange-500 hover:bg-orange-600 text-white"
    : "bg-orange-300 text-white cursor-not-allowed";

  const buttonSecondaryClasses = isLight
    ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    : "text-gray-400 hover:bg-gray-700 hover:text-gray-200";

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={formRef}
      className={`
        rounded-xl border overflow-hidden backdrop-blur-sm
        transition-all duration-200 ease-out
        ${containerClasses}
        ${className}
      `}
      onKeyDown={handleKeyDown}
    >
      <div className="p-3 space-y-3">
        {/* Select Lead/Project (if config provided) */}
        {selectConfig && (
          <div className="space-y-1.5">
            <label
              className={`flex items-center gap-1.5 text-xs font-medium ${labelClasses}`}
            >
              <ChevronDown size={12} className="text-blue-500" />
              {selectConfig.label}
              {selectConfig.required && <span className="text-red-500">*</span>}
            </label>
            {selectConfig.options.length === 0 ? (
              <p
                className={`text-xs rounded-lg px-3 py-2 border border-dashed ${isLight ? "bg-gray-100 text-gray-400 border-gray-300" : "bg-gray-900 text-gray-500 border-gray-600"}`}
              >
                No options available
              </p>
            ) : (
              <select
                ref={firstInputRef}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClasses}`}
              >
                <option value="">{selectConfig.placeholder}</option>
                {selectConfig.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Title (Required) */}
        <div className="space-y-1.5">
          <label
            className={`flex items-center gap-1.5 text-xs font-medium ${labelClasses}`}
          >
            <Type size={12} className="text-purple-500" />
            Title
            <span className="text-red-500">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter card title..."
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClasses}`}
          />
        </div>

        {/* Description (Text Field - User Requested) */}
        <div className="space-y-1.5">
          <label
            className={`flex items-center gap-1.5 text-xs font-medium ${labelClasses}`}
          >
            <FileText size={12} className="text-teal-500" />
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description or notes..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 leading-relaxed ${inputClasses}`}
          />
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label
            className={`flex items-center gap-1.5 text-xs font-medium ${labelClasses}`}
          >
            <Flag size={12} className="text-orange-500" />
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "" | "high" | "medium" | "low")
            }
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClasses}`}
          >
            <option value="">No priority</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assign To */}
        <div className="space-y-1.5">
          <label
            className={`flex items-center gap-1.5 text-xs font-medium ${labelClasses}`}
          >
            <User size={12} className="text-indigo-500" />
            Assign to
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClasses}`}
          >
            <option value="">Select assignee...</option>
            {assigneeOptions.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label
              className={`flex items-center gap-1.5 text-xs font-medium ${labelClasses}`}
            >
              <Calendar size={12} className="text-green-500" />
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClasses}`}
            />
          </div>
          <div className="space-y-1.5">
            <label
              className={`flex items-center gap-1.5 text-xs font-medium ${labelClasses}`}
            >
              <Calendar size={12} className="text-rose-500" />
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClasses}`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
                active:scale-95
                ${buttonPrimaryClasses}
              `}
              aria-label="Add card"
            >
              <Plus size={14} />
              Add Card
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={`
                p-1.5 rounded-lg transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-gray-400
                active:scale-90
                ${buttonSecondaryClasses}
              `}
              title="Cancel"
              aria-label="Cancel"
            >
              <X size={16} />
            </button>
          </div>
          <p
            className={`text-[10px] ${isLight ? "text-gray-400" : "text-gray-500"}`}
          >
            ⌘+Enter to add
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ADD CARD BUTTON + FORM COMBO COMPONENT
// ============================================================================

export interface AddCardFormWithButtonProps extends Omit<
  AddCardFormProps,
  "isOpen" | "onClose"
> {
  /** Custom button label */
  buttonLabel?: string;
  /** Custom class name for the button */
  buttonClassName?: string;
}

/**
 * A self-contained component that includes both the "Add a card" button
 * and the expandable form. Useful for standalone usage within columns.
 */
export const AddCardFormWithButton: React.FC<AddCardFormWithButtonProps> = ({
  onSubmit,
  theme = "light",
  selectConfig,
  assignees,
  className,
  buttonLabel = "Add a card",
  buttonClassName = "",
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const isLight = theme === "light";

  const handleSubmit = (data: NewCardData) => {
    onSubmit(data);
    setIsFormOpen(false);
  };

  const buttonClasses = isLight
    ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-200";

  if (isFormOpen) {
    return (
      <AddCardForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        theme={theme}
        selectConfig={selectConfig}
        assignees={assignees}
        className={className}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsFormOpen(true)}
      className={`
        w-full flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium
        rounded-lg transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-orange-500
        active:scale-[0.98]
        ${buttonClasses}
        ${buttonClassName}
      `}
      aria-label={buttonLabel}
    >
      <Plus size={16} />
      {buttonLabel}
    </button>
  );
};

export default AddCardForm;
