import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Save,
  User,
  Flag,
  Package,
  MapPin,
  Target,
  Type,
  Phone,
  Mail,
  Calendar,
  CalendarClock,
  X,
  Check,
  Tag,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface LeadCardFieldOption {
  value: string;
  label: string;
}

export interface NewLeadCardData {
  title: string;
  email?: string;
  source?: string;
  assignee?: string;
  priority?: "high" | "medium" | "low";
  product?: string;
  region?: string;
  leadStage?: string;
  leadStatusUpdate?: string;
  contactNumber?: string;
  inquiryDate?: string;
  nextFollowUp?: string;
}

export interface AddLeadCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewLeadCardData) => void;
  theme?: "light" | "dark";
  /** Assignee options */
  assignees?: LeadCardFieldOption[];
  /** Product/project type options */
  products?: LeadCardFieldOption[];
  /** Region/location options */
  regions?: LeadCardFieldOption[];
  /** Lead stage options */
  leadStages?: LeadCardFieldOption[];
  /** Priority options override */
  priorityOptions?: LeadCardFieldOption[];
  /** Lead source options */
  leadSources?: LeadCardFieldOption[];
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_ASSIGNEES: LeadCardFieldOption[] = [
  { value: "sales-lead", label: "Sales Lead" },
  { value: "design-consultant", label: "Design Consultant" },
  { value: "project-manager", label: "Project Manager" },
  { value: "operations-team", label: "Operations Team" },
];

const DEFAULT_PRODUCTS: LeadCardFieldOption[] = [
  { value: "modular-kitchen", label: "Modular Kitchen" },
  { value: "full-home", label: "Full Home Interiors" },
  { value: "wardrobes", label: "Wardrobes" },
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "office", label: "Office Interiors" },
];

const DEFAULT_REGIONS: LeadCardFieldOption[] = [
  { value: "koramangala", label: "Koramangala" },
  { value: "indiranagar", label: "Indiranagar" },
  { value: "hsr-layout", label: "HSR Layout" },
  { value: "whitefield", label: "Whitefield" },
  { value: "jayanagar", label: "Jayanagar" },
  { value: "sarjapur", label: "Sarjapur Road" },
  { value: "electronic-city", label: "Electronic City" },
];

const DEFAULT_LEAD_STAGES: LeadCardFieldOption[] = [
  { value: "inquiry", label: "Inquiry" },
  { value: "contacted", label: "Contacted" },
  { value: "meeting_scheduled", label: "Meeting Scheduled" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const DEFAULT_PRIORITIES: LeadCardFieldOption[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const DEFAULT_LEAD_SOURCES: LeadCardFieldOption[] = [
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
];

// ============================================================================
// FIELD ITEM COMPONENT
// ============================================================================

interface FieldItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  displayValue?: string;
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  theme?: "light" | "dark";
}

const FieldItem: React.FC<FieldItemProps> = ({
  icon,
  label,
  value,
  displayValue,
  isActive,
  onToggle,
  children,
  theme = "light",
}) => {
  const isLight = theme === "light";
  const hasValue = value !== undefined && value !== "";

  return (
    <div className="relative">
      {/* Clickable Row */}
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-full flex items-center gap-2.5 px-3 py-2 text-left
          rounded-lg transition-all duration-150
          ${
            isActive
              ? isLight
                ? "bg-violet-50 text-violet-700"
                : "bg-violet-900/30 text-violet-300"
              : hasValue
                ? isLight
                  ? "bg-emerald-50/60 text-gray-700 hover:bg-emerald-50"
                  : "bg-emerald-900/20 text-gray-300 hover:bg-emerald-900/30"
                : isLight
                  ? "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }
        `}
      >
        <span
          className={`flex-shrink-0 ${
            isActive
              ? "text-violet-500"
              : hasValue
                ? "text-emerald-500"
                : isLight
                  ? "text-gray-400"
                  : "text-gray-500"
          }`}
        >
          {icon}
        </span>
        <span className="text-[13px] font-medium flex-1 truncate">
          {hasValue ? displayValue || value : label}
        </span>
        {hasValue && !isActive && (
          <Check size={13} className="text-emerald-500 flex-shrink-0" />
        )}
      </button>

      {/* Expandable Content */}
      {isActive && (
        <div
          className={`
            mt-1 mx-1 mb-1 p-2 rounded-lg border
            animate-in slide-in-from-top-1 duration-150
            ${
              isLight
                ? "bg-white border-violet-200 shadow-sm"
                : "bg-gray-850 border-violet-700/50 shadow-lg"
            }
          `}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INLINE SELECT COMPONENT
// ============================================================================

interface InlineSelectProps {
  options: LeadCardFieldOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onDone: () => void;
  theme?: "light" | "dark";
}

const InlineSelect: React.FC<InlineSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  onDone,
  theme = "light",
}) => {
  const isLight = theme === "light";

  return (
    <div className="space-y-1.5">
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value) {
            setTimeout(onDone, 100);
          }
        }}
        autoFocus
        className={`
          w-full px-2.5 py-1.5 border rounded-md text-[13px]
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400
          ${
            isLight
              ? "border-gray-200 bg-white text-gray-800"
              : "border-gray-600 bg-gray-800 text-gray-200"
          }
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================================================
// INLINE TEXT INPUT COMPONENT
// ============================================================================

interface InlineTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "tel" | "date";
  onDone: () => void;
  theme?: "light" | "dark";
}

const InlineTextInput: React.FC<InlineTextInputProps> = ({
  value,
  onChange,
  placeholder = "Enter value...",
  type = "text",
  onDone,
  theme = "light",
}) => {
  const isLight = theme === "light";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onDone();
          }
        }}
        className={`
          flex-1 px-2.5 py-1.5 border rounded-md text-[13px]
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400
          ${
            isLight
              ? "border-gray-200 bg-white text-gray-800 placeholder:text-gray-400"
              : "border-gray-600 bg-gray-800 text-gray-200 placeholder:text-gray-500"
          }
        `}
      />
      <button
        type="button"
        onClick={onDone}
        className={`
          p-1.5 rounded-md transition-colors
          ${
            isLight
              ? "text-violet-600 hover:bg-violet-50"
              : "text-violet-400 hover:bg-violet-900/30"
          }
        `}
      >
        <Check size={14} />
      </button>
    </div>
  );
};

// ============================================================================
// ADD LEAD CARD FORM COMPONENT
// ============================================================================

export const AddLeadCardForm: React.FC<AddLeadCardFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  theme = "light",
  assignees,
  products,
  regions,
  leadStages,
  priorityOptions,
  leadSources,
}) => {
  // -------------------------------------------------------------------------
  // Form State
  // -------------------------------------------------------------------------
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("WEBSITE");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [product, setProduct] = useState("");
  const [region, setRegion] = useState("");
  const [leadStage, setLeadStage] = useState("");
  const [leadStatusUpdate, setLeadStatusUpdate] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [inquiryDate, setInquiryDate] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Options
  // -------------------------------------------------------------------------
  const assigneeOptions =
    assignees && assignees.length > 0 ? assignees : DEFAULT_ASSIGNEES;
  const productOptions =
    products && products.length > 0 ? products : DEFAULT_PRODUCTS;
  const regionOptions =
    regions && regions.length > 0 ? regions : DEFAULT_REGIONS;
  const stageOptions =
    leadStages && leadStages.length > 0 ? leadStages : DEFAULT_LEAD_STAGES;
  const priorityOpts =
    priorityOptions && priorityOptions.length > 0
      ? priorityOptions
      : DEFAULT_PRIORITIES;
  const sourceOptions =
    leadSources && leadSources.length > 0 ? leadSources : DEFAULT_LEAD_SOURCES;

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------
  const isLight = theme === "light";
  const isFormValid = title.trim() !== "";

  // -------------------------------------------------------------------------
  // Reset Form
  // -------------------------------------------------------------------------
  const resetForm = useCallback(() => {
    setTitle("");
    setEmail("");
    setSource("WEBSITE");
    setAssignee("");
    setPriority("");
    setProduct("");
    setRegion("");
    setLeadStage("");
    setLeadStatusUpdate("");
    setContactNumber("");
    setInquiryDate("");
    setNextFollowUp("");
    setActiveField(null);
  }, []);

  // -------------------------------------------------------------------------
  // Handle Submit
  // -------------------------------------------------------------------------
  const handleSubmit = useCallback(() => {
    if (!isFormValid) return;

    const data: NewLeadCardData = {
      title: title.trim(),
      email: email.trim() || undefined,
      source: source || "WEBSITE",
    };

    if (assignee) data.assignee = assignee;
    if (priority) data.priority = priority as "high" | "medium" | "low";
    if (product) data.product = product;
    if (region) data.region = region;
    if (leadStage) data.leadStage = leadStage;
    if (leadStatusUpdate) data.leadStatusUpdate = leadStatusUpdate;
    if (contactNumber) data.contactNumber = contactNumber;
    if (inquiryDate) data.inquiryDate = inquiryDate;
    if (nextFollowUp) data.nextFollowUp = nextFollowUp;

    onSubmit(data);
    resetForm();
  }, [
    isFormValid,
    title,
    email,
    source,
    assignee,
    priority,
    product,
    region,
    leadStage,
    leadStatusUpdate,
    contactNumber,
    inquiryDate,
    nextFollowUp,
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
      if (e.key === "Escape") {
        e.preventDefault();
        if (activeField) {
          setActiveField(null);
        } else {
          handleCancel();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
    },
    [handleCancel, handleSubmit, activeField],
  );

  // -------------------------------------------------------------------------
  // Focus Management
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Toggle field expansion
  // -------------------------------------------------------------------------
  const toggleField = useCallback((fieldName: string) => {
    setActiveField((prev) => (prev === fieldName ? null : fieldName));
  }, []);

  // -------------------------------------------------------------------------
  // Get display value for a field
  // -------------------------------------------------------------------------
  const getDisplayValue = useCallback(
    (
      _fieldName: string,
      value: string,
      options?: LeadCardFieldOption[],
    ): string => {
      if (!value) return "";
      if (options) {
        const opt = options.find((o) => o.value === value);
        return opt ? opt.label : value;
      }
      return value;
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (!isOpen) return null;

  return (
    <div
      ref={formRef}
      onKeyDown={handleKeyDown}
      className={`
        rounded-xl border overflow-hidden
        transition-all duration-200 ease-out
        ${
          isLight
            ? "bg-white border-gray-200 shadow-md"
            : "bg-gray-800 border-gray-700 shadow-xl"
        }
      `}
    >
      {/* ================================================================= */}
      {/* TITLE ROW — Task Name + Save Button */}
      {/* ================================================================= */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2.5 border-b
          ${isLight ? "border-gray-100" : "border-gray-700/50"}
        `}
      >
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task Name..."
          className={`
            flex-1 text-sm font-medium bg-transparent border-none outline-none
            placeholder:font-normal
            ${
              isLight
                ? "text-gray-900 placeholder:text-gray-400"
                : "text-gray-100 placeholder:text-gray-500"
            }
          `}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            transition-all duration-150 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1
            ${
              isFormValid
                ? "bg-violet-500 hover:bg-violet-600 text-white shadow-sm"
                : isLight
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }
          `}
          aria-label="Save card"
        >
          <Save size={12} />
          Save
        </button>
      </div>

      {/* ================================================================= */}
      {/* FIELD LIST */}
      {/* ================================================================= */}
      <div
        className={`
          py-1 max-h-[320px] overflow-y-auto
          ${isLight ? "divide-gray-50" : "divide-gray-800"}
        `}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: isLight
            ? "#E5E7EB transparent"
            : "#4B5563 transparent",
        }}
      >
        {/* Assignee */}
        <FieldItem
          icon={<User size={15} />}
          label="Add assignee"
          value={assignee}
          displayValue={getDisplayValue("assignee", assignee, assigneeOptions)}
          isActive={activeField === "assignee"}
          onToggle={() => toggleField("assignee")}
          theme={theme}
        >
          <InlineSelect
            options={assigneeOptions}
            value={assignee}
            onChange={setAssignee}
            placeholder="Select assignee..."
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Priority */}
        <FieldItem
          icon={<Flag size={15} />}
          label="Add priority"
          value={priority}
          displayValue={getDisplayValue("priority", priority, priorityOpts)}
          isActive={activeField === "priority"}
          onToggle={() => toggleField("priority")}
          theme={theme}
        >
          <InlineSelect
            options={priorityOpts}
            value={priority}
            onChange={(val) => setPriority(val)}
            placeholder="Select priority..."
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Product */}
        <FieldItem
          icon={<Package size={15} />}
          label="Add Product"
          value={product}
          displayValue={getDisplayValue("product", product, productOptions)}
          isActive={activeField === "product"}
          onToggle={() => toggleField("product")}
          theme={theme}
        >
          <InlineSelect
            options={productOptions}
            value={product}
            onChange={setProduct}
            placeholder="Select product..."
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Region */}
        <FieldItem
          icon={<MapPin size={15} />}
          label="Add Region"
          value={region}
          displayValue={getDisplayValue("region", region, regionOptions)}
          isActive={activeField === "region"}
          onToggle={() => toggleField("region")}
          theme={theme}
        >
          <InlineSelect
            options={regionOptions}
            value={region}
            onChange={setRegion}
            placeholder="Select region..."
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Lead Stage */}
        <FieldItem
          icon={<Target size={15} />}
          label="Add Lead Stage"
          value={leadStage}
          displayValue={getDisplayValue("leadStage", leadStage, stageOptions)}
          isActive={activeField === "leadStage"}
          onToggle={() => toggleField("leadStage")}
          theme={theme}
        >
          <InlineSelect
            options={stageOptions}
            value={leadStage}
            onChange={setLeadStage}
            placeholder="Select lead stage..."
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Lead Status Update */}
        <FieldItem
          icon={<Type size={15} />}
          label="Add Lead Status Update"
          value={leadStatusUpdate}
          isActive={activeField === "leadStatusUpdate"}
          onToggle={() => toggleField("leadStatusUpdate")}
          theme={theme}
        >
          <InlineTextInput
            value={leadStatusUpdate}
            onChange={setLeadStatusUpdate}
            placeholder="Enter status update..."
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Email */}
        <FieldItem
          icon={<Mail size={15} />}
          label="Add Email"
          value={email}
          isActive={activeField === "email"}
          onToggle={() => toggleField("email")}
          theme={theme}
        >
          <InlineTextInput
            value={email}
            onChange={setEmail}
            placeholder="email@example.com"
            type="text"
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Source */}
        <FieldItem
          icon={<Tag size={15} />}
          label="Add Source"
          value={source}
          isActive={activeField === "source"}
          onToggle={() => toggleField("source")}
          theme={theme}
        >
          <InlineSelect
            options={sourceOptions}
            value={source}
            onChange={setSource}
            placeholder="Select lead source..."
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Contact Number */}
        <FieldItem
          icon={<Phone size={15} />}
          label="Add Contact Number"
          value={contactNumber}
          isActive={activeField === "contactNumber"}
          onToggle={() => toggleField("contactNumber")}
          theme={theme}
        >
          <InlineTextInput
            value={contactNumber}
            onChange={setContactNumber}
            placeholder="+91 XXXXX XXXXX"
            type="tel"
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Inquiry Date */}
        <FieldItem
          icon={<Calendar size={15} />}
          label="Add Inquiry Date"
          value={inquiryDate}
          displayValue={
            inquiryDate
              ? new Date(inquiryDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : ""
          }
          isActive={activeField === "inquiryDate"}
          onToggle={() => toggleField("inquiryDate")}
          theme={theme}
        >
          <InlineTextInput
            value={inquiryDate}
            onChange={setInquiryDate}
            type="date"
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>

        {/* Next Follow-up */}
        <FieldItem
          icon={<CalendarClock size={15} />}
          label="Add Next Follow-up"
          value={nextFollowUp}
          displayValue={
            nextFollowUp
              ? new Date(nextFollowUp).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : ""
          }
          isActive={activeField === "nextFollowUp"}
          onToggle={() => toggleField("nextFollowUp")}
          theme={theme}
        >
          <InlineTextInput
            value={nextFollowUp}
            onChange={setNextFollowUp}
            type="date"
            onDone={() => setActiveField(null)}
            theme={theme}
          />
        </FieldItem>
      </div>

      {/* ================================================================= */}
      {/* FOOTER — Cancel hint */}
      {/* ================================================================= */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 border-t
          ${isLight ? "border-gray-100" : "border-gray-700/50"}
        `}
      >
        <button
          type="button"
          onClick={handleCancel}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-md text-xs
            transition-colors duration-150
            ${
              isLight
                ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
            }
          `}
        >
          <X size={12} />
          Cancel
        </button>
        <span
          className={`text-[10px] ${isLight ? "text-gray-400" : "text-gray-500"}`}
        >
          ⌘+Enter to save
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// ADD LEAD CARD FORM WITH BUTTON
// ============================================================================

export interface AddLeadCardFormWithButtonProps extends Omit<
  AddLeadCardFormProps,
  "isOpen" | "onClose"
> {
  buttonLabel?: string;
  buttonClassName?: string;
}

export const AddLeadCardFormWithButton: React.FC<
  AddLeadCardFormWithButtonProps
> = ({
  onSubmit,
  theme = "light",
  assignees,
  products,
  regions,
  leadStages,
  priorityOptions,
  buttonLabel = "Add a card",
  buttonClassName = "",
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const isLight = theme === "light";

  const handleSubmit = (data: NewLeadCardData) => {
    onSubmit(data);
    setIsFormOpen(false);
  };

  const buttonClasses = isLight
    ? "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-200";

  if (isFormOpen) {
    return (
      <AddLeadCardForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        theme={theme}
        assignees={assignees}
        products={products}
        regions={regions}
        leadStages={leadStages}
        priorityOptions={priorityOptions}
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
        focus:outline-none focus:ring-2 focus:ring-violet-500
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

export default AddLeadCardForm;
