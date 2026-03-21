import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { Button, Input, Toggle } from "../ui";
import {
  CreateProjectRequest,
  PipelineType,
  ProjectCategory,
  ScopeType,
} from "../../types";
import type { Customer } from "../../types/customer";
import { listCustomers } from "../../services/customerApi";
import { listProjects } from "../../services/projectApi";
import { getAllTeamMembers, type TeamMember } from "../../services/teamApi";
import toast from "react-hot-toast";

export interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: CreateProjectRequest) => void;
}

interface FormData {
  projectName: string;
  accountId: string;
  budgetValue: string;
  billingAddress: string;
  propertyAddress: string;
  siteContactName: string;
  siteContactPhone: string;
  tentativeHandoverDate: string;
  designTeamIds: string[];
  executionTeamIds: string[];
  specialRequirements: string;
  remarks: string;
}

const INITIAL_FORM_DATA: FormData = {
  projectName: "",
  accountId: "",
  budgetValue: "",
  billingAddress: "",
  propertyAddress: "",
  siteContactName: "",
  siteContactPhone: "",
  tentativeHandoverDate: "",
  designTeamIds: [],
  executionTeamIds: [],
  specialRequirements: "",
  remarks: "",
};

interface TeamSelectorProps {
  label: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  members: TeamMember[];
  loading: boolean;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  label,
  selectedIds,
  onChange,
  members,
  loading,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedMembers = useMemo(
    () => members.filter((member) => selectedIds.includes(member.id)),
    [members, selectedIds],
  );

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;

    return members.filter((member) => {
      return (
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
      );
    });
  }, [members, search]);

  const toggleMember = (memberId: string) => {
    if (selectedIds.includes(memberId)) {
      onChange(selectedIds.filter((id) => id !== memberId));
      return;
    }
    onChange([...selectedIds, memberId]);
  };

  const removeMember = (memberId: string) => {
    onChange(selectedIds.filter((id) => id !== memberId));
  };

  return (
    <div ref={wrapperRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-500" />
          {label}
          <span className="text-xs text-gray-400 font-medium">(Optional)</span>
        </div>
      </label>

      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5">
          {selectedMembers.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-lg font-medium"
            >
              {member.name}
              <button
                type="button"
                onClick={() => removeMember(member.id)}
                className="hover:text-orange-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
      >
        <span className="text-gray-500">
          {loading
            ? "Loading internal team members..."
            : "Select internal team members"}
        </span>
        <Users className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <div className="mt-1 border border-gray-200 rounded-xl shadow-lg bg-white overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or role"
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No internal team members found
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-50 transition-colors ${
                      isSelected ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {member.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.role}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  const [submitting, setSubmitting] = useState(false);
  const [autoPopulate, setAutoPopulate] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [internalTeamMembers, setInternalTeamMembers] = useState<TeamMember[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchTeamMembers();
    }

    if (!isOpen) {
      setFormData({ ...INITIAL_FORM_DATA });
      setErrors({});
      setSubmitting(false);
      setAutoPopulate(true);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setShowCustomerDropdown(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    setCustomersError(null);

    try {
      const result = await listCustomers({ limit: 200, includeContacts: true });
      setCustomers(result.customers);
    } catch (error) {
      setCustomersError(
        error instanceof Error ? error.message : "Failed to load customers",
      );
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    setTeamMembersLoading(true);
    try {
      const members = await getAllTeamMembers();
      const toUpper = (value: unknown) =>
        typeof value === "string" ? value.trim().toUpperCase() : "";

      const internalOnly = members
        .filter((member) => {
          const memberType = toUpper(member.memberType);
          const status = toUpper(member.status);
          const role = toUpper(member.role);

          const isExplicitlyExternal =
            memberType === "EXTERNAL" || role.includes("VENDOR");
          const isInternalByType = ["INTERNAL", "EMPLOYEE", "TEAM", "STAFF"].includes(memberType);
          const isActiveMember =
            member.isBanned !== true &&
            member.isDeactivated !== true &&
            member.isActive !== false &&
            status !== "BANNED" &&
            status !== "DEACTIVATED" &&
            status !== "INACTIVE";

          if (!isActiveMember || !member.id || !member.name?.trim()) {
            return false;
          }

          // Prefer explicit internal types, but fall back to active members when type is missing.
          if (!memberType) {
            return !isExplicitlyExternal;
          }

          return isInternalByType && !isExplicitlyExternal;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setInternalTeamMembers(internalOnly);
    } catch {
      setInternalTeamMembers([]);
    } finally {
      setTeamMembersLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => {
      const primaryContact =
        customer.contacts?.find((contact) => contact.isPrimary) ??
        customer.contacts?.[0];

      return (
        customer.name?.toLowerCase().includes(query) ||
        primaryContact?.email?.toLowerCase().includes(query) ||
        primaryContact?.phone?.toLowerCase().includes(query) ||
        (customer.billingCity ?? "").toLowerCase().includes(query)
      );
    });
  }, [customerSearch, customers]);

  const populateFromCustomer = (
    customer: Customer,
    shouldPopulate: boolean = autoPopulate,
  ) => {
    if (!shouldPopulate) return;

    const primaryContact =
      customer.contacts?.find((contact) => contact.isPrimary) ??
      customer.contacts?.[0];

    const updates: Partial<FormData> = {};

    if (customer.billingAddress) updates.propertyAddress = customer.billingAddress;
    if (customer.billingAddress) updates.billingAddress = customer.billingAddress;

    if (primaryContact) {
      const fullName = [primaryContact.firstName, primaryContact.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (fullName) updates.siteContactName = fullName;
      if (primaryContact.phone) updates.siteContactPhone = primaryContact.phone;
    }

    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.projectName.trim()) {
      nextErrors.projectName = "Project name is required";
    }
    if (!formData.accountId) {
      nextErrors.accountId = "Customer is required";
    }
    if (!formData.budgetValue || Number(formData.budgetValue) <= 0) {
      nextErrors.budgetValue = "Budget value is required";
    }
    if (!formData.billingAddress.trim()) {
      nextErrors.billingAddress = "Billing address is required";
    }
    if (!formData.propertyAddress.trim()) {
      nextErrors.propertyAddress = "Property address is required";
    }
    if (!formData.siteContactName.trim()) {
      nextErrors.siteContactName = "Site contact name is required";
    }
    if (!formData.siteContactPhone.trim()) {
      nextErrors.siteContactPhone = "Site contact phone is required";
    }
    if (!formData.tentativeHandoverDate) {
      nextErrors.tentativeHandoverDate = "Tentative handover date is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const mapMemberIdsToNames = (memberIds: string[]) => {
    return Array.from(new Set(memberIds))
      .map((id) => internalTeamMembers.find((member) => member.id === id)?.name)
      .filter((name): name is string => Boolean(name?.trim()));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    const request: CreateProjectRequest = {
      projectName: formData.projectName.trim(),
      accountId: formData.accountId,
      pipelineType: PipelineType.DESIGN_AND_EXECUTION,
      projectCategory: ProjectCategory.RESIDENTIAL,
      scopeType: ScopeType.INTERIORS,
      totalValue: Number(formData.budgetValue),
      billingAddress: formData.billingAddress.trim(),
      propertyAddress: formData.propertyAddress.trim(),
      siteContactName: formData.siteContactName.trim(),
      siteContactPhone: formData.siteContactPhone.trim(),
      tentativeHandoverDate: new Date(formData.tentativeHandoverDate).toISOString(),
      design3DStatus: "NOT_STARTED",
      status: "YET_TO_START",
    };

    const designTeam = mapMemberIdsToNames(formData.designTeamIds);
    const executionTeam = mapMemberIdsToNames(formData.executionTeamIds);

    if (designTeam.length > 0) request.designTeam = designTeam;
    if (executionTeam.length > 0) request.executionTeam = executionTeam;
    if (formData.designTeamIds.length > 0) {
      request.assignedDesignerId = formData.designTeamIds[0];
    }
    if (formData.executionTeamIds.length > 0) {
      request.assignedPMId = formData.executionTeamIds[0];
    }
    if (formData.specialRequirements.trim()) {
      request.specialRequirements = formData.specialRequirements.trim();
    }
    if (formData.remarks.trim()) {
      request.remarks = formData.remarks.trim();
    }

    try {
      const normalizedNewName = request.projectName.trim().toLowerCase();
      const existingProjects = await listProjects({
        accountId: request.accountId,
        limit: 1000,
      });

      const duplicateExists = (existingProjects.projects || []).some((project) => {
        const existingName = (project.projectName || project.name || "")
          .trim()
          .toLowerCase();

        return (
          existingName === normalizedNewName &&
          (project.accountId || "") === (request.accountId || "")
        );
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

  const modalContent = (
    <>
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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6 max-h-[92vh] flex flex-col border border-gray-100"
          style={{ pointerEvents: "auto" }}
        >
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

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div
              className="overflow-y-auto flex-1 px-8 py-6 space-y-5"
              style={{ maxHeight: "calc(92vh - 180px)" }}
            >
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
                  className={errors.projectName ? "border-red-500 ring-2 ring-red-100" : ""}
                />
                {errors.projectName && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.projectName}
                  </p>
                )}
              </div>

              <div ref={customerDropdownRef}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-500" />
                      Select Customer <span className="text-red-400">*</span>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Auto-fill details</span>
                    <Toggle
                      checked={autoPopulate}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAutoPopulate(checked);
                        if (checked && selectedCustomer) {
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
                        value={selectedCustomer ? selectedCustomer.name : customerSearch}
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

                    {showCustomerDropdown && !customersLoading && !selectedCustomer && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                        {filteredCustomers.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No customers found
                          </div>
                        ) : (
                          filteredCustomers.slice(0, 30).map((customer) => {
                            const primaryContact =
                              customer.contacts?.find((contact) => contact.isPrimary) ??
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
                                    <span className="text-xs text-gray-500">{primaryContact.email}</span>
                                  )}
                                  {primaryContact?.phone && (
                                    <span className="text-xs text-gray-500">{primaryContact.phone}</span>
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
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.accountId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-orange-500" />
                    Budget Value <span className="text-red-400">*</span>
                  </div>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.budgetValue}
                  onChange={(e) => handleChange("budgetValue", e.target.value)}
                  placeholder="e.g., 4500000"
                  className={errors.budgetValue ? "border-red-500 ring-2 ring-red-100" : ""}
                />
                {errors.budgetValue && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.budgetValue}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Billing Address <span className="text-red-400">*</span>
                  </div>
                </label>
                <textarea
                  value={formData.billingAddress}
                  onChange={(e) => handleChange("billingAddress", e.target.value)}
                  rows={2}
                  placeholder="Enter billing address"
                  className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 resize-none text-sm transition-all ${
                    errors.billingAddress
                      ? "border-red-500 ring-red-100"
                      : "border-gray-300 focus:ring-orange-100 focus:border-orange-400"
                  }`}
                />
                {errors.billingAddress && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.billingAddress}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Property Address <span className="text-red-400">*</span>
                  </div>
                </label>
                <textarea
                  value={formData.propertyAddress}
                  onChange={(e) => handleChange("propertyAddress", e.target.value)}
                  rows={2}
                  placeholder="Enter property address"
                  className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 resize-none text-sm transition-all ${
                    errors.propertyAddress
                      ? "border-red-500 ring-red-100"
                      : "border-gray-300 focus:ring-orange-100 focus:border-orange-400"
                  }`}
                />
                {errors.propertyAddress && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.propertyAddress}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-500" />
                      Site Contact Name <span className="text-red-400">*</span>
                    </div>
                  </label>
                  <Input
                    value={formData.siteContactName}
                    onChange={(e) => handleChange("siteContactName", e.target.value)}
                    placeholder="e.g., Site Supervisor"
                    className={errors.siteContactName ? "border-red-500 ring-2 ring-red-100" : ""}
                  />
                  {errors.siteContactName && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors.siteContactName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Site Contact Phone <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.siteContactPhone}
                    onChange={(e) => handleChange("siteContactPhone", e.target.value)}
                    placeholder="e.g., +919876543210"
                    className={errors.siteContactPhone ? "border-red-500 ring-2 ring-red-100" : ""}
                  />
                  {errors.siteContactPhone && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors.siteContactPhone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Tentative Handover Date <span className="text-red-400">*</span>
                  </div>
                </label>
                <Input
                  type="date"
                  value={formData.tentativeHandoverDate}
                  onChange={(e) => handleChange("tentativeHandoverDate", e.target.value)}
                  className={errors.tentativeHandoverDate ? "border-red-500 ring-2 ring-red-100" : ""}
                />
                {errors.tentativeHandoverDate && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.tentativeHandoverDate}
                  </p>
                )}
              </div>

              <TeamSelector
                label="Assigned Design Team"
                selectedIds={formData.designTeamIds}
                onChange={(ids) => handleChange("designTeamIds", ids)}
                members={internalTeamMembers}
                loading={teamMembersLoading}
              />

              <TeamSelector
                label="Assigned Execution Team"
                selectedIds={formData.executionTeamIds}
                onChange={(ids) => handleChange("executionTeamIds", ids)}
                members={internalTeamMembers}
                loading={teamMembersLoading}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Requirement
                </label>
                <textarea
                  value={formData.specialRequirements}
                  onChange={(e) => handleChange("specialRequirements", e.target.value)}
                  rows={3}
                  placeholder="Any special requirements..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  rows={3}
                  placeholder="Internal remarks..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none text-sm transition-all"
                />
              </div>
            </div>

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
