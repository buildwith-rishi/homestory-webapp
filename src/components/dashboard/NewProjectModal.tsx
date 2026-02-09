import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Search,
  FileText,
  Building2,
  Home,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  IndianRupee,
  Package,
  Layers,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button, Input } from "../ui";
import { CreateProjectRequest, PipelineType } from "../../types";
import type { Lead } from "../../types";
import { listLeads } from "../../services/leadApi";
import { useProjectOptions } from "../../hooks/useProjectOptions";

export interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: CreateProjectRequest) => void;
}

interface FormData {
  projectName: string;
  leadId: string;
  pipelineType: PipelineType | "";
  projectCategory: string;
  propertySubtype: string;
  propertySizeSqft: string;
  propertyBHK: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyPincode: string;
  propertyBuilding: string;
  propertyUnit: string;
  propertyLandmarks: string;
  scopeType: string;
  budgetTier: string;
  totalValue: string;
  designPackage: string;
  siteContactName: string;
  siteContactPhone: string;
  constructionStatus: string;
  tentativeHandoverDate: string;
  specialRequirements: string;
}

const INITIAL_FORM_DATA: FormData = {
  projectName: "",
  leadId: "",
  pipelineType: "",
  projectCategory: "",
  propertySubtype: "",
  propertySizeSqft: "",
  propertyBHK: "",
  propertyAddress: "",
  propertyCity: "",
  propertyState: "",
  propertyPincode: "",
  propertyBuilding: "",
  propertyUnit: "",
  propertyLandmarks: "",
  scopeType: "",
  budgetTier: "",
  totalValue: "",
  designPackage: "",
  siteContactName: "",
  siteContactPhone: "",
  constructionStatus: "",
  tentativeHandoverDate: "",
  specialRequirements: "",
};

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch project options from API
  const {
    options: projectOptions,
    isLoading: optionsLoading,
    getSubtypesForCategory,
  } = useProjectOptions();

  // Get category-dependent property subtypes
  const subtypeOptions = formData.projectCategory
    ? getSubtypesForCategory(formData.projectCategory)
    : [];

  // Lead search state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [leadSearch, setLeadSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const leadDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch leads on mount
  useEffect(() => {
    if (isOpen) {
      fetchLeads();
    }
    if (!isOpen) {
      setFormData({ ...INITIAL_FORM_DATA });
      setErrors({});
      setShowMore(false);
      setSelectedLead(null);
      setLeadSearch("");
      setSubmitting(false);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        leadDropdownRef.current &&
        !leadDropdownRef.current.contains(e.target as Node)
      ) {
        setShowLeadDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLeads = async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const result = await listLeads({ limit: 200 });
      setLeads(result.leads);
    } catch (err) {
      setLeadsError(
        err instanceof Error ? err.message : "Failed to load leads",
      );
    } finally {
      setLeadsLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const q = leadSearch.toLowerCase();
    if (!q) return true;
    return (
      lead.name?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.phone?.toLowerCase().includes(q)
    );
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.projectName.trim())
      newErrors.projectName = "Project name is required";
    if (!formData.leadId) newErrors.leadId = "Please select a lead";
    if (!formData.pipelineType)
      newErrors.pipelineType = "Please select a pipeline type";
    if (!formData.projectCategory)
      newErrors.projectCategory = "Please select a category";
    if (!formData.scopeType) newErrors.scopeType = "Please select a scope type";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const request: CreateProjectRequest = {
      leadId: formData.leadId,
      projectName: formData.projectName,
      pipelineType: formData.pipelineType as PipelineType,
      projectCategory: formData.projectCategory as ProjectCategory,
      scopeType: formData.scopeType as ScopeType,
    };

    if (formData.budgetTier)
      request.budgetTier = formData.budgetTier as BudgetTier;
    if (formData.propertySubtype)
      request.propertySubtype = formData.propertySubtype as PropertySubtype;
    if (formData.propertySizeSqft)
      request.propertySizeSqft = Number(formData.propertySizeSqft);
    if (formData.propertyBHK) request.propertyBHK = formData.propertyBHK;
    if (formData.propertyAddress)
      request.propertyAddress = formData.propertyAddress;
    if (formData.propertyCity) request.propertyCity = formData.propertyCity;
    if (formData.propertyState) request.propertyState = formData.propertyState;
    if (formData.propertyPincode)
      request.propertyPincode = formData.propertyPincode;
    if (formData.propertyBuilding)
      request.propertyBuilding = formData.propertyBuilding;
    if (formData.propertyUnit) request.propertyUnit = formData.propertyUnit;
    if (formData.propertyLandmarks)
      request.propertyLandmarks = formData.propertyLandmarks;
    if (formData.siteContactName)
      request.siteContactName = formData.siteContactName;
    if (formData.siteContactPhone)
      request.siteContactPhone = formData.siteContactPhone;
    if (formData.constructionStatus)
      request.constructionStatus = formData.constructionStatus;
    if (formData.tentativeHandoverDate)
      request.tentativeHandoverDate = formData.tentativeHandoverDate;
    if (formData.specialRequirements)
      request.specialRequirements = formData.specialRequirements;
    if (formData.totalValue) request.totalValue = Number(formData.totalValue);
    if (formData.designPackage) request.designPackage = formData.designPackage;

    try {
      await onSubmit(request);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const pillClass = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${
      active
        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-200"
        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
    }`;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(17, 24, 39, 0.5)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 9998,
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          pointerEvents: "none",
          overflow: "auto",
        }}
      >
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6 max-h-[92vh] flex flex-col transform transition-all border border-gray-100"
          style={{ pointerEvents: "auto" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 bg-gradient-to-br from-orange-50 via-white to-orange-50/30 rounded-t-3xl border-b border-orange-100">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Create New Project
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Fill in the required details to create a project
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-all p-2.5 hover:bg-white/80 rounded-xl hover:shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div
              className="overflow-y-auto flex-1 px-8 py-6 space-y-5"
              style={{ maxHeight: "calc(92vh - 180px)" }}
            >
              {/* Project Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Project Name <span className="text-red-400">*</span>
                  </div>
                </label>
                <Input
                  value={formData.projectName}
                  onChange={(e) => handleChange("projectName", e.target.value)}
                  placeholder="e.g., Modern 3BHK Interior"
                  className={`transition-all ${errors.projectName ? "border-red-500 ring-2 ring-red-100" : "focus:ring-2 focus:ring-orange-100"}`}
                />
                {errors.projectName && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.projectName}
                  </p>
                )}
              </div>

              {/* Lead Dropdown */}
              <div ref={leadDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" />
                    Select Lead <span className="text-red-400">*</span>
                  </div>
                </label>

                {leadsError ? (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{leadsError}</span>
                    <button
                      type="button"
                      onClick={fetchLeads}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={selectedLead ? selectedLead.name : leadSearch}
                        onChange={(e) => {
                          setLeadSearch(e.target.value);
                          if (selectedLead) {
                            setSelectedLead(null);
                            handleChange("leadId", "");
                          }
                          setShowLeadDropdown(true);
                        }}
                        onFocus={() => setShowLeadDropdown(true)}
                        placeholder={
                          leadsLoading
                            ? "Loading leads..."
                            : "Search by name, email, or phone..."
                        }
                        disabled={leadsLoading}
                        className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm transition-all outline-none ${
                          errors.leadId
                            ? "border-red-500 ring-2 ring-red-100"
                            : "border-gray-300 focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                        } ${leadsLoading ? "bg-gray-50 cursor-wait" : "bg-white"}`}
                      />
                      {leadsLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                      )}
                      {selectedLead && !leadsLoading && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLead(null);
                            handleChange("leadId", "");
                            setLeadSearch("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {showLeadDropdown && !leadsLoading && !selectedLead && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                        {filteredLeads.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No leads found
                          </div>
                        ) : (
                          filteredLeads.slice(0, 30).map((lead) => (
                            <button
                              key={lead.id}
                              type="button"
                              onClick={() => {
                                setSelectedLead(lead);
                                handleChange("leadId", lead.id);
                                setLeadSearch("");
                                setShowLeadDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <p className="text-sm font-semibold text-gray-900">
                                {lead.name}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                {lead.email && (
                                  <span className="text-xs text-gray-500">
                                    {lead.email}
                                  </span>
                                )}
                                {lead.phone && (
                                  <span className="text-xs text-gray-500">
                                    {lead.phone}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
                {errors.leadId && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.leadId}
                  </p>
                )}
              </div>

              {/* Pipeline Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    Pipeline Type <span className="text-red-400">*</span>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleChange("pipelineType", PipelineType.DESIGN_ONLY)
                    }
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.pipelineType === PipelineType.DESIGN_ONLY
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 hover:border-orange-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">{"\U0001F3A8"}</span>
                      {formData.pipelineType === PipelineType.DESIGN_ONLY && (
                        <CheckCircle2 className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Design Only
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Concept to final drawings
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "pipelineType",
                        PipelineType.DESIGN_AND_EXECUTION,
                      )
                    }
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.pipelineType ===
                      PipelineType.DESIGN_AND_EXECUTION
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 hover:border-orange-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">{"\U0001F3D7\uFE0F"}</span>
                      {formData.pipelineType ===
                        PipelineType.DESIGN_AND_EXECUTION && (
                        <CheckCircle2 className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Design + Execution
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      End-to-end project delivery
                    </p>
                  </button>
                </div>
                {errors.pipelineType && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.pipelineType}
                  </p>
                )}
              </div>

              {/* Project Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" />
                    Project Category <span className="text-red-400">*</span>
                  </div>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {optionsLoading ? (
                    <span className="text-xs text-gray-400">Loading...</span>
                  ) : projectOptions.categories.length > 0 ? (
                    projectOptions.categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          handleChange("projectCategory", cat.value);
                          // Reset property subtype when category changes
                          handleChange("propertySubtype", "");
                        }}
                        className={pillClass(
                          formData.projectCategory === cat.value,
                        )}
                      >
                        {cat.label}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">
                      No categories available
                    </span>
                  )}
                </div>
                {errors.projectCategory && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.projectCategory}
                  </p>
                )}
              </div>

              {/* Scope Type (required) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-500" />
                    Scope Type <span className="text-red-400">*</span>
                  </div>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {optionsLoading ? (
                    <span className="text-xs text-gray-400">Loading...</span>
                  ) : projectOptions.scopeTypes.length > 0 ? (
                    projectOptions.scopeTypes.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange("scopeType", opt.value)}
                        className={pillClass(formData.scopeType === opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">
                      No scope types available
                    </span>
                  )}
                </div>
                {errors.scopeType && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.scopeType}
                  </p>
                )}
              </div>

              {/* Quick Optional: City + Total Value */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      City
                    </div>
                  </label>
                  <Input
                    value={formData.propertyCity}
                    onChange={(e) =>
                      handleChange("propertyCity", e.target.value)
                    }
                    placeholder="e.g., Bangalore"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                      Total Value
                    </div>
                  </label>
                  <Input
                    type="number"
                    value={formData.totalValue}
                    onChange={(e) => handleChange("totalValue", e.target.value)}
                    placeholder="e.g., 2800000"
                  />
                </div>
              </div>

              {/* More Details (collapsible) */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMore(!showMore)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-600 transition-colors w-full"
                >
                  {showMore ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {showMore ? "Hide" : "Show"} Additional Details
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    (all optional)
                  </span>
                </button>

                {showMore && (
                  <div className="mt-4 space-y-5">
                    {/* Property Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-gray-400" />
                          Property Type
                        </div>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {!formData.projectCategory ? (
                          <span className="text-xs text-gray-400">
                            Select a category first
                          </span>
                        ) : subtypeOptions.length > 0 ? (
                          subtypeOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                handleChange(
                                  "propertySubtype",
                                  formData.propertySubtype === opt.value
                                    ? ""
                                    : opt.value,
                                )
                              }
                              className={pillClass(
                                formData.propertySubtype === opt.value,
                              )}
                            >
                              {opt.label}
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">
                            No subtypes for this category
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Size and BHK */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Size (sq.ft)
                        </label>
                        <Input
                          type="number"
                          value={formData.propertySizeSqft}
                          onChange={(e) =>
                            handleChange("propertySizeSqft", e.target.value)
                          }
                          placeholder="e.g., 1200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          BHK
                        </label>
                        <Input
                          value={formData.propertyBHK}
                          onChange={(e) =>
                            handleChange("propertyBHK", e.target.value)
                          }
                          placeholder="e.g., 3BHK"
                        />
                      </div>
                    </div>

                    {/* Budget Tier */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Budget Tier
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {optionsLoading ? (
                          <span className="text-xs text-gray-400">
                            Loading...
                          </span>
                        ) : projectOptions.budgetTiers.length > 0 ? (
                          projectOptions.budgetTiers.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                handleChange(
                                  "budgetTier",
                                  formData.budgetTier === opt.value
                                    ? ""
                                    : opt.value,
                                )
                              }
                              className={pillClass(
                                formData.budgetTier === opt.value,
                              )}
                            >
                              {opt.label}
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">
                            No budget tiers available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address Block */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        Property Address
                      </h4>
                      <Input
                        value={formData.propertyAddress}
                        onChange={(e) =>
                          handleChange("propertyAddress", e.target.value)
                        }
                        placeholder="Street address"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={formData.propertyBuilding}
                          onChange={(e) =>
                            handleChange("propertyBuilding", e.target.value)
                          }
                          placeholder="Building name"
                        />
                        <Input
                          value={formData.propertyUnit}
                          onChange={(e) =>
                            handleChange("propertyUnit", e.target.value)
                          }
                          placeholder="Unit / Flat No."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          value={formData.propertyState}
                          onChange={(e) =>
                            handleChange("propertyState", e.target.value)
                          }
                          placeholder="State"
                        />
                        <Input
                          value={formData.propertyPincode}
                          onChange={(e) =>
                            handleChange("propertyPincode", e.target.value)
                          }
                          placeholder="Pincode"
                        />
                        <Input
                          value={formData.propertyLandmarks}
                          onChange={(e) =>
                            handleChange("propertyLandmarks", e.target.value)
                          }
                          placeholder="Landmarks"
                        />
                      </div>
                    </div>

                    {/* Site Contact */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            Site Contact Name
                          </div>
                        </label>
                        <Input
                          value={formData.siteContactName}
                          onChange={(e) =>
                            handleChange("siteContactName", e.target.value)
                          }
                          placeholder="e.g., Ramesh Kumar"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Site Contact Phone
                        </label>
                        <Input
                          type="tel"
                          value={formData.siteContactPhone}
                          onChange={(e) =>
                            handleChange("siteContactPhone", e.target.value)
                          }
                          placeholder="e.g., +91 98765 43210"
                        />
                      </div>
                    </div>

                    {/* Design Package and Construction Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Design Package
                        </label>
                        <Input
                          value={formData.designPackage}
                          onChange={(e) =>
                            handleChange("designPackage", e.target.value)
                          }
                          placeholder="e.g., Premium Interior"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Construction Status
                        </label>
                        <select
                          value={formData.constructionStatus}
                          onChange={(e) =>
                            handleChange("constructionStatus", e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all"
                        >
                          <option value="">Select status</option>
                          <option value="Not Started">Not Started</option>
                          <option value="Under Construction">
                            Under Construction
                          </option>
                          <option value="Ready to Move">Ready to Move</option>
                          <option value="Renovation">Renovation</option>
                        </select>
                      </div>
                    </div>

                    {/* Handover Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Tentative Handover Date
                        </label>
                        <Input
                          type="date"
                          value={formData.tentativeHandoverDate}
                          onChange={(e) =>
                            handleChange(
                              "tentativeHandoverDate",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Special Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Special Requirements
                      </label>
                      <textarea
                        value={formData.specialRequirements}
                        onChange={(e) =>
                          handleChange("specialRequirements", e.target.value)
                        }
                        placeholder="Any special requirements or notes..."
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none text-sm transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-200 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="px-7 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="px-7 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
