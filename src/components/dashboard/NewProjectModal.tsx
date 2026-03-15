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
import { Button, Input, Toggle } from "../ui";
import {
  CreateProjectRequest,
  PipelineType,
  ProjectCategory,
  ScopeType,
  BudgetTier,
  PropertySubtype,
} from "../../types";
import type { Customer } from "../../types/customer";
import { listCustomers } from "../../services/customerApi";
import { listProjects } from "../../services/projectApi";
import { getAllTeamMembers } from "../../services/teamApi";
import type { TeamMember } from "../../services/teamApi";
import { useProjectOptions } from "../../hooks/useProjectOptions";
import toast from "react-hot-toast";

export interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: CreateProjectRequest) => void;
}

interface FormData {
  projectName: string;
  accountId: string;
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
  designTeam: string;
  executionTeam: string;
  assignedPMId: string;
  remarks: string;
}

const INITIAL_FORM_DATA: FormData = {
  projectName: "",
  accountId: "",
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
  designTeam: "",
  executionTeam: "",
  assignedPMId: "",
  remarks: "",
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
  const [autoPopulate, setAutoPopulate] = useState(true);

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

  // Customer search state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // PM (Project Manager) state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [pmSearch, setPmSearch] = useState("");
  const [selectedPM, setSelectedPM] = useState<TeamMember | null>(null);
  const [showPMDropdown, setShowPMDropdown] = useState(false);
  const pmDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch customers and team members on mount
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchTeamMembers();
    }
    if (!isOpen) {
      setFormData({ ...INITIAL_FORM_DATA });
      setErrors({});
      setShowMore(false);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setSelectedPM(null);
      setPmSearch("");
      setSubmitting(false);
    }
  }, [isOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        pmDropdownRef.current &&
        !pmDropdownRef.current.contains(e.target as Node)
      ) {
        setShowPMDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTeamMembers = async () => {
    setTeamMembersLoading(true);
    try {
      const members = await getAllTeamMembers();
      // Filter to project managers; fall back to all active members if none found
      const pms = members.filter((m) => {
        const r = (m.role ?? "").toLowerCase();
        return (
          r.includes("project_manager") ||
          r.includes("project manager") ||
          r === "pm"
        );
      });
      setTeamMembers(
        pms.length > 0 ? pms : members.filter((m) => m.isActive !== false),
      );
    } catch {
      // silently ignore – PM assignment stays optional
    } finally {
      setTeamMembersLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const result = await listCustomers({ limit: 200, includeContacts: true });
      setCustomers(result.customers);
    } catch (err) {
      setCustomersError(
        err instanceof Error ? err.message : "Failed to load customers",
      );
    } finally {
      setCustomersLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const q = customerSearch.toLowerCase();
    if (!q) return true;
    const primaryContact =
      customer.contacts?.find((c) => c.isPrimary) ?? customer.contacts?.[0];
    return (
      customer.name?.toLowerCase().includes(q) ||
      primaryContact?.email?.toLowerCase().includes(q) ||
      primaryContact?.phone?.toLowerCase().includes(q) ||
      (customer.billingCity ?? "").toLowerCase().includes(q)
    );
  });

  const populateFromCustomer = (
    customer: Customer,
    shouldPopulate: boolean = autoPopulate,
  ) => {
    if (!shouldPopulate) return;

    const primaryContact =
      customer.contacts?.find((c) => c.isPrimary) ?? customer.contacts?.[0];

    const updates: Partial<FormData> = {};

    if (customer.billingAddress)
      updates.propertyAddress = customer.billingAddress;
    if (customer.billingCity) updates.propertyCity = customer.billingCity;
    if (customer.billingState) updates.propertyState = customer.billingState;
    if (customer.billingPincode)
      updates.propertyPincode = customer.billingPincode;

    if (primaryContact) {
      const parts = [primaryContact.firstName, primaryContact.lastName].filter(
        Boolean,
      );
      if (parts.length > 0) updates.siteContactName = parts.join(" ");
      if (primaryContact.phone) updates.siteContactPhone = primaryContact.phone;
    }

    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

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
    if (!formData.accountId) newErrors.accountId = "Please select a customer";
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
      accountId: formData.accountId,
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
      request.tentativeHandoverDate = new Date(
        formData.tentativeHandoverDate,
      ).toISOString();
    if (formData.specialRequirements)
      request.specialRequirements = formData.specialRequirements;
    if (formData.totalValue) request.totalValue = Number(formData.totalValue);
    if (formData.designPackage) request.designPackage = formData.designPackage;
    if (formData.designTeam.trim()) {
      request.designTeam = formData.designTeam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (formData.executionTeam.trim()) {
      request.executionTeam = formData.executionTeam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (formData.remarks) request.remarks = formData.remarks;
    if (formData.assignedPMId) request.assignedPMId = formData.assignedPMId;

    try {
      const normalizedNewName = request.projectName.trim().toLowerCase();
      const normalizedSelectedCustomerName =
        (selectedCustomer?.name || "").trim().toLowerCase();

      // Server-side duplicate check before create:
      // same project name + same customer should be blocked.
      const existingProjects = await listProjects({ limit: 1000 });
      const duplicateExists = (existingProjects.projects || []).some((p) => {
        const existingName = (p.projectName || p.name || "").trim().toLowerCase();
        if (existingName !== normalizedNewName) return false;

        // Primary match by customer/account ID
        if (request.accountId && p.accountId && p.accountId === request.accountId) {
          return true;
        }

        // Fallback match by displayed customer name if accountId is missing in old records
        const existingCustomerName =
          (p.account?.name || p.lead?.name || "").trim().toLowerCase();
        if (normalizedSelectedCustomerName && existingCustomerName) {
          return existingCustomerName === normalizedSelectedCustomerName;
        }

        return false;
      });

      if (duplicateExists) {
        const message =
          "Project name and customer already exist. Try a different project name.";
        setErrors((prev) => ({ ...prev, projectName: message }));
        toast.error(message);
        return;
      }

      await onSubmit(request);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create project";

      if (
        /already exists|duplicate|unique/i.test(errorMessage) &&
        /project|name/i.test(errorMessage)
      ) {
        const message =
          "Project name and customer already exist. Try a different project name.";
        setErrors((prev) => ({ ...prev, projectName: message }));
        toast.error(message);
        return;
      }

      toast.error(errorMessage);
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

              {/* Customer Dropdown */}
              <div ref={customerDropdownRef}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-500" />
                      Select Customer <span className="text-red-400">*</span>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Auto-fill details
                    </span>
                    <Toggle
                      checked={autoPopulate}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setAutoPopulate(isChecked);
                        if (isChecked && selectedCustomer) {
                          populateFromCustomer(selectedCustomer, true);
                        }
                      }}
                      className="scale-75 origin-right"
                    />
                  </div>
                </div>

                {customersError ? (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{customersError}</span>
                    <button
                      type="button"
                      onClick={fetchCustomers}
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
                        value={
                          selectedCustomer
                            ? selectedCustomer.name
                            : customerSearch
                        }
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          if (selectedCustomer) {
                            setSelectedCustomer(null);
                            handleChange("accountId", "");
                          }
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder={
                          customersLoading
                            ? "Loading customers..."
                            : "Search by name, email, or phone..."
                        }
                        disabled={customersLoading}
                        className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm transition-all outline-none ${
                          errors.accountId
                            ? "border-red-500 ring-2 ring-red-100"
                            : "border-gray-300 focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                        } ${customersLoading ? "bg-gray-50 cursor-wait" : "bg-white"}`}
                      />
                      {customersLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                      )}
                      {selectedCustomer && !customersLoading && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            handleChange("accountId", "");
                            setCustomerSearch("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {showCustomerDropdown &&
                      !customersLoading &&
                      !selectedCustomer && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                          {filteredCustomers.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No customers found
                            </div>
                          ) : (
                            filteredCustomers.slice(0, 30).map((customer) => {
                              const primaryContact =
                                customer.contacts?.find((c) => c.isPrimary) ??
                                customer.contacts?.[0];
                              return (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    handleChange("accountId", customer.id);
                                    populateFromCustomer(customer);
                                    setCustomerSearch("");
                                    setShowCustomerDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
                                >
                                  <p className="text-sm font-semibold text-gray-900">
                                    {customer.name}
                                  </p>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    {primaryContact?.email && (
                                      <span className="text-xs text-gray-500">
                                        {primaryContact.email}
                                      </span>
                                    )}
                                    {primaryContact?.phone && (
                                      <span className="text-xs text-gray-500">
                                        {primaryContact.phone}
                                      </span>
                                    )}
                                    {customer.billingCity && (
                                      <span className="text-xs text-gray-400">
                                        {customer.billingCity}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                  </div>
                )}
                {errors.accountId && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.accountId}
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
                      <span className="text-2xl">🎨</span>
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
                      <span className="text-2xl">🏗️</span>
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

              {/* Assigned Project Manager */}
              <div ref={pmDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" />
                    Assigned Project Manager
                    <span className="text-xs font-normal text-gray-400">
                      (optional)
                    </span>
                  </div>
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={selectedPM ? selectedPM.name : pmSearch}
                      onChange={(e) => {
                        setPmSearch(e.target.value);
                        if (selectedPM) {
                          setSelectedPM(null);
                          handleChange("assignedPMId", "");
                        }
                        setShowPMDropdown(true);
                      }}
                      onFocus={() => setShowPMDropdown(true)}
                      placeholder={
                        teamMembersLoading
                          ? "Loading team members..."
                          : "Search project manager..."
                      }
                      disabled={teamMembersLoading}
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm transition-all outline-none border-gray-300 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 ${
                        teamMembersLoading
                          ? "bg-gray-50 cursor-wait"
                          : "bg-white"
                      }`}
                    />
                    {teamMembersLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    {selectedPM && !teamMembersLoading && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPM(null);
                          handleChange("assignedPMId", "");
                          setPmSearch("");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showPMDropdown && !teamMembersLoading && !selectedPM && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {(() => {
                        const filtered = teamMembers.filter((m) => {
                          const q = pmSearch.toLowerCase();
                          return (
                            !q ||
                            m.name.toLowerCase().includes(q) ||
                            (m.email ?? "").toLowerCase().includes(q) ||
                            (m.role ?? "").toLowerCase().includes(q)
                          );
                        });
                        return filtered.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No project managers found
                          </div>
                        ) : (
                          filtered.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                setSelectedPM(member);
                                handleChange(
                                  "assignedPMId",
                                  member.userId ?? member.id,
                                );
                                setPmSearch("");
                                setShowPMDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <p className="text-sm font-semibold text-gray-900">
                                {member.name}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                {member.role && (
                                  <span className="text-xs text-orange-500 font-medium">
                                    {member.role.replace(/_/g, " ")}
                                  </span>
                                )}
                                {member.email && (
                                  <span className="text-xs text-gray-500">
                                    {member.email}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))
                        );
                      })()}
                    </div>
                  )}
                </div>
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
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="UNDER_CONSTRUCTION">
                            Under Construction
                          </option>
                          <option value="READY_TO_MOVE">Ready to Move</option>
                          <option value="RENOVATION">Renovation</option>
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

                    {/* Design & Execution Teams */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Design Team
                        </label>
                        <Input
                          value={formData.designTeam}
                          onChange={(e) =>
                            handleChange("designTeam", e.target.value)
                          }
                          placeholder="e.g., Sathish, Thrisha"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Comma-separated names
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Execution Team
                        </label>
                        <Input
                          value={formData.executionTeam}
                          onChange={(e) =>
                            handleChange("executionTeam", e.target.value)
                          }
                          placeholder="e.g., Dilip, Santhosh"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Comma-separated names
                        </p>
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

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Remarks
                      </label>
                      <textarea
                        value={formData.remarks}
                        onChange={(e) =>
                          handleChange("remarks", e.target.value)
                        }
                        placeholder="Internal remarks or notes for this project..."
                        rows={2}
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
