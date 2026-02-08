import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Search,
  MoreVertical,
  MapPin,
  Clock,
  User,
  TrendingUp,
  X,
  Edit,
  Trash2,
  Activity,
  Send,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Building2,
  Layers,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import toast from "react-hot-toast";
import LeadAPI, {
  Lead,
  LeadActivity,
  LeadSource,
  LeadStatus,
} from "../../services/leadApi";
import CustomerAPI from "../../services/customerApi";
import { getSourceLabel } from "../../utils/leadHelpers";
import {
  getActivityLog,
  clearActivityLog,
  type KanbanActivityEntry,
} from "../../stores/kanbanActivityLog";

const stageColors: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 border-gray-200",
  Qualified: "bg-blue-100 text-blue-700 border-blue-200",
  Meeting: "bg-purple-100 text-purple-700 border-purple-200",
  Proposal: "bg-orange-100 text-orange-700 border-orange-200",
  Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// Add/Edit Lead Modal Component
const LeadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSave: (lead: Omit<Lead, "id">) => Promise<void>;
  sources: LeadSource[];
}> = ({ isOpen, onClose, lead, onSave, sources }) => {
  // Default sources if API doesn't return any
  const defaultSources = [
    { value: "WEBSITE", label: "Website" },
    { value: "REFERRAL", label: "Referral" },
    { value: "INSTAGRAM", label: "Instagram" },
    { value: "FACEBOOK", label: "Facebook" },
    { value: "LINKEDIN", label: "LinkedIn" },
    { value: "GOOGLE_ADS", label: "Google Ads" },
    { value: "WALK_IN", label: "Walk-in" },
    { value: "PHONE", label: "Phone Call" },
    { value: "EMAIL_CAMPAIGN", label: "Email Campaign" },
    { value: "TRADE_SHOW", label: "Trade Show" },
    { value: "PARTNER", label: "Partner" },
    { value: "OTHER", label: "Other" },
  ];

  const availableSources = sources.length > 0 ? sources : defaultSources;

  const [formData, setFormData] = useState<Omit<Lead, "id">>({
    name: "",
    email: "",
    phone: "",
    source: availableSources[0]?.value || "WEBSITE",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || availableSources[0]?.value || "WEBSITE",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        source: availableSources[0]?.value || "WEBSITE",
      });
    }
    setErrors({});
  }, [lead, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone))
      newErrors.phone = "Invalid phone format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    console.log("Submitting lead data:", formData);

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
      toast.success(
        lead ? "Lead updated successfully!" : "Lead created successfully!",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save lead";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {lead ? "Edit Lead" : "Add New Lead"}
              </h2>
              <p className="text-sm text-gray-600">
                {lead ? "Update lead information" : "Fill in the lead details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          {/* Info Banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-orange-900 mb-1">
                  Quick Lead Entry
                </h4>
                <p className="text-xs text-orange-700">
                  Enter the basic contact information to create a new lead. You
                  can add more details later.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Rahul Sharma"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                    errors.name
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="rahul@example.com"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                    errors.email
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                    errors.phone
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.phone}
                </p>
              )}
              <p className="mt-1.5 text-xs text-gray-500">
                Include country code for international numbers
              </p>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lead Source <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white appearance-none cursor-pointer hover:border-gray-300 transition-all"
                >
                  {availableSources.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                How did this lead find you?
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/25 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {lead ? "Update Lead" : "Create Lead"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Phone Input Modal for OTP
const PhoneInputModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!/^\+?[\d\s-]{10,}$/.test(phone)) {
      setError("Please enter a valid phone number");
      return;
    }
    onSubmit(phone);
    setPhone("");
    setError("");
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Send OTP</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Enter phone number to send OTP verification code
          </p>

          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="+91 98765 43210"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2 ${
              error ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />

          {error && (
            <p className="text-sm text-red-600 mb-4 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/25"
            >
              <Send className="w-4 h-4" />
              Send OTP
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// OTP Verification Modal
const OTPModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onVerify: (otp: string) => Promise<void>;
}> = ({ isOpen, onClose, phone, onVerify }) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otp);
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid OTP";
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Verify OTP</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Enter the OTP sent to <span className="font-semibold">{phone}</span>
          </p>

          <input
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
          />

          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Verify OTP
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertAccountType, setConvertAccountType] =
    useState<string>("HOUSEHOLD");
  const [accountTypes, setAccountTypes] = useState<
    { value: string; label: string; description?: string }[]
  >([]);
  const [otpPhone, setOtpPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [kanbanLog, setKanbanLog] = useState<KanbanActivityEntry[]>([]);

  // Load kanban activity log
  useEffect(() => {
    setKanbanLog(getActivityLog());
    const interval = setInterval(() => {
      setKanbanLog(getActivityLog());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchData();
    fetchCustomerTypes();
  }, []);

  const fetchCustomerTypes = async () => {
    try {
      const types = await CustomerAPI.getCustomerTypes();
      setAccountTypes(types);
      if (types.length > 0) {
        setConvertAccountType(types[0].value);
      }
    } catch (error) {
      console.error("Error fetching customer types:", error);
      // Fallback to default types
      setAccountTypes([
        {
          value: "HOUSEHOLD",
          label: "Household",
          description: "Individual or family residential customer",
        },
        {
          value: "COMPANY",
          label: "Company",
          description: "Business or commercial customer",
        },
      ]);
      setConvertAccountType("HOUSEHOLD");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsData, sourcesData, statusesData] = await Promise.all([
        LeadAPI.listLeads(),
        LeadAPI.getLeadSources(),
        LeadAPI.getLeadStatuses(),
      ]);

      console.log("API Response:", { leadsData, sourcesData, statusesData });

      setLeads(leadsData.leads || []);
      setSources(Array.isArray(sourcesData) ? sourcesData : []);
      setStatuses(Array.isArray(statusesData) ? statusesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);

      // More helpful error message
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load leads data";
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        toast.error(
          "Cannot connect to API. Please check your API URL configuration.",
        );
      } else {
        toast.error(errorMessage);
      }

      // Set empty arrays on error to prevent crashes
      setLeads([]);
      setSources([]);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const handleSendOTP = async (phone: string) => {
    try {
      await LeadAPI.sendOTP(phone);
      setOtpPhone(phone);
      setShowOTPModal(true);
      toast.success("OTP sent successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(errorMessage);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otp: string) => {
    const response = await LeadAPI.verifyOTP(otpPhone, otp);
    if (response.success && response.lead) {
      setSelectedLead(response.lead);
      toast.success("OTP verified successfully!");
    }
  };

  // Create Lead
  const handleCreateLead = async (leadData: Omit<Lead, "id">) => {
    try {
      const newLead = await LeadAPI.createLead(leadData);

      console.log("Lead created - API response:", newLead);
      console.log("Original form data:", leadData);

      // Ensure the lead has required fields from form data
      const leadWithData = {
        ...leadData,
        ...newLead,
        name: newLead.name || leadData.name,
        email: newLead.email || leadData.email,
        phone: newLead.phone || leadData.phone,
        source: newLead.source || leadData.source,
        status: newLead.status || leadData.status || "NEW",
      };

      console.log("Lead with merged data:", leadWithData);

      setLeads([leadWithData, ...leads]);
      setShowAddModal(false);
      toast.success("Lead created successfully!");

      // Optionally refresh the entire list to get latest data from server
      fetchData();
    } catch (error) {
      console.error("Error creating lead:", error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  // Update Lead
  const handleUpdateLead = async (leadData: Omit<Lead, "id">) => {
    if (!leadToEdit?.id) return;

    const updatedLead = await LeadAPI.updateLead(leadToEdit.id, leadData);
    setLeads(leads.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    setShowEditModal(false);
    setLeadToEdit(null);

    if (selectedLead?.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      await LeadAPI.deleteLead(id);
      setLeads(leads.filter((l) => l.id !== id));
      if (selectedLead?.id === id) {
        setSelectedLead(null);
      }
      toast.success("Lead deleted successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete lead";
      toast.error(errorMessage);
    }
  };

  // Convert Lead to Customer
  const handleConvertToCustomer = async () => {
    if (!selectedLead?.id) return;

    const customerName = selectedLead.name || "Unknown Customer";

    // Validate customer type
    if (
      !convertAccountType ||
      !["HOUSEHOLD", "COMPANY"].includes(convertAccountType)
    ) {
      toast.error("Please select a valid customer type");
      return;
    }

    try {
      const result = await CustomerAPI.convertLeadToCustomer(
        selectedLead.id,
        customerName,
      );

      // Remove lead from list
      setLeads(leads.filter((l) => l.id !== selectedLead.id));
      setSelectedLead(null);
      setShowConvertModal(false);

      toast.success(
        `Lead converted to customer "${result.name}" successfully!`,
      );

      // Navigate to customers page to see the new customer
      setTimeout(() => {
        window.location.href = "/dashboard/customers";
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to convert lead to customer";
      toast.error(errorMessage);
    }
  };

  // Fetch activities when lead is selected
  useEffect(() => {
    if (selectedLead?.id) {
      fetchActivities(selectedLead.id);
    }
  }, [selectedLead]);

  const fetchActivities = async (leadId: string) => {
    try {
      const data = await LeadAPI.getLeadActivities(leadId);
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (lead.name?.toLowerCase() || "").includes(searchLower) ||
      (lead.email?.toLowerCase() || "").includes(searchLower) ||
      (lead.phone?.toLowerCase() || "").includes(searchLower);
    const matchesStage =
      selectedStage === "all" || lead.status === selectedStage;
    return matchesSearch && matchesStage;
  });

  // Calculate lead counts by status
  const leadCounts = Array.isArray(statuses)
    ? statuses.reduce(
        (acc, status) => {
          acc[status.name] = leads.filter(
            (l) => l.status === status.name,
          ).length;
          return acc;
        },
        {} as Record<string, number>,
      )
    : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads & CRM</h1>
          <p className="text-gray-600 mt-1">
            Manage your sales pipeline effectively
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="rounded-xl" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search leads by name, email, or phone..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
          >
            {/* Accent Line */}
            <div
              className={`h-1 w-full ${
                lead.priority === "high"
                  ? "bg-gradient-to-r from-red-500 to-orange-500"
                  : lead.priority === "medium"
                    ? "bg-gradient-to-r from-amber-400 to-yellow-400"
                    : "bg-gradient-to-r from-orange-400 to-orange-500"
              }`}
            ></div>

            {/* Card Content */}
            <div className="p-5">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-orange-200/50">
                      {(lead.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    {/* Online Indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  {/* Name & Status */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base group-hover:text-orange-600 transition-colors">
                      {lead.name || "Unknown Lead"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          lead.status === "Qualified"
                            ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                            : lead.status === "Contacted"
                              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                              : lead.status === "Proposal"
                                ? "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
                                : lead.status === "Negotiation"
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                  : lead.status === "Won"
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                    : lead.status === "Lost"
                                      ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                      : "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20"
                        }`}
                      >
                        {lead.status || "New"}
                      </span>
                      {lead.priority === "high" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                          Hot Lead
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLeadToEdit(lead);
                    setShowEditModal(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Contact Info Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Phone */}
                <div className="bg-gray-50 rounded-xl p-3 group/item hover:bg-orange-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <span className="text-xs text-gray-500">Phone</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.phone || "Not provided"}
                  </p>
                </div>
                {/* Email */}
                <div className="bg-gray-50 rounded-xl p-3 group/item hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="text-xs text-gray-500">Email</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.email || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Property & Budget Info */}
              {(lead.propertyType ||
                lead.budget ||
                lead.budgetRange ||
                lead.location) && (
                <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/50 rounded-xl p-3.5 mb-4 border border-orange-100/50">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-900/80 uppercase tracking-wide">
                      Project Interest
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {lead.propertyType && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Property</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.propertyType}
                          {lead.bhkConfig && ` • ${lead.bhkConfig}`}
                        </p>
                      </div>
                    )}
                    {(lead.budget || lead.budgetRange) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.budgetRange || lead.budget}
                        </p>
                      </div>
                    )}
                    {lead.location && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-0.5">Location</p>
                        <p className="text-sm font-medium text-gray-700">
                          {lead.location}
                          {lead.city && `, ${lead.city}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lead Score */}
              {lead.score !== undefined && lead.score > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">
                        Lead Score
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        lead.score >= 70
                          ? "text-green-600"
                          : lead.score >= 40
                            ? "text-amber-600"
                            : "text-red-500"
                      }`}
                    >
                      {lead.score}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        lead.score >= 70
                          ? "bg-gradient-to-r from-green-400 to-emerald-500"
                          : lead.score >= 40
                            ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                            : "bg-gradient-to-r from-red-400 to-orange-400"
                      }`}
                      style={{ width: `${lead.score}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Source Badge */}
                  {lead.source && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">
                        {getSourceLabel(lead.source)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Date & Arrow */}
                <div className="flex items-center gap-2">
                  {lead.createdAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-orange-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No leads found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Get started by adding your first lead"}
          </p>
          <Button onClick={() => setShowAddModal(true)} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Lead
          </Button>
        </div>
      )}

      {/* Lead Details Sidebar */}

      {/* Kanban Activity Log */}
      {kanbanLog.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Layers className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Kanban Activity Log
                </h2>
                <p className="text-xs text-gray-500">
                  Cards added from the Kanban board
                </p>
              </div>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                {kanbanLog.length}
              </span>
            </div>
            <button
              onClick={() => {
                clearActivityLog();
                setKanbanLog([]);
              }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {kanbanLog.map((entry) => {
              const time = new Date(entry.timestamp);
              const now = new Date();
              const diffMs = now.getTime() - time.getTime();
              const diffMin = Math.floor(diffMs / 60000);
              const diffHr = Math.floor(diffMin / 60);
              const diffDay = Math.floor(diffHr / 24);
              const relativeTime =
                diffMin < 1
                  ? "Just now"
                  : diffMin < 60
                    ? `${diffMin}m ago`
                    : diffHr < 24
                      ? `${diffHr}h ago`
                      : diffDay === 1
                        ? "Yesterday"
                        : diffDay < 7
                          ? `${diffDay}d ago`
                          : time.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-orange-50/50 hover:border-orange-100 transition-all"
                >
                  <div
                    className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                      entry.action === "card_moved"
                        ? "bg-blue-100"
                        : "bg-orange-100"
                    }`}
                  >
                    {entry.action === "card_moved" ? (
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Plus className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{entry.cardTitle}</span>
                      {entry.action === "card_moved" ? (
                        <>
                          {" "}
                          moved from{" "}
                          <span className="font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {entry.fromColumn}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {entry.columnName}
                          </span>
                        </>
                      ) : (
                        <>
                          {" "}
                          added to{" "}
                          <span className="font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            {entry.columnName}
                          </span>
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {relativeTime}
                      </span>
                      {entry.priority && (
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            entry.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : entry.priority === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {entry.priority}
                        </span>
                      )}
                      {entry.assignedTo && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                          <User className="w-3 h-3" />
                          {entry.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedLead &&
        ReactDOM.createPortal(
          <>
            <div
              onClick={() => setSelectedLead(null)}
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
                right: 0,
                bottom: 0,
                width: "100%",
                maxWidth: "500px",
                zIndex: 9999,
                backgroundColor: "white",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                overflow: "auto",
              }}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold">Lead Details</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConvertModal(true);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Convert to Customer"
                  >
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLeadToEdit(selectedLead);
                      setShowEditModal(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedLead.id) handleDeleteLead(selectedLead.id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Lead Header */}
                <div className="text-center pb-6 border-b">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                    {(selectedLead.name || "Unknown")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {selectedLead.name || "Unknown"}
                  </h3>
                  <Badge
                    className={`rounded-lg ${stageColors[selectedLead.status || "New"]}`}
                  >
                    {selectedLead.status || "New"}
                  </Badge>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    {selectedLead.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-medium">{selectedLead.phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium">{selectedLead.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                {(selectedLead.propertyType ||
                  selectedLead.location ||
                  selectedLead.budget) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Property Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedLead.propertyType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">
                            {selectedLead.propertyType}
                          </span>
                        </div>
                      )}
                      {selectedLead.location && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">
                            {selectedLead.location}
                          </span>
                        </div>
                      )}
                      {selectedLead.budget && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-medium">
                            {selectedLead.budget}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lead Source */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Lead Source
                  </h4>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {getSourceLabel(selectedLead.source)}
                  </Badge>
                </div>

                {/* Notes */}
                {selectedLead.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Notes
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedLead.notes}
                    </p>
                  </div>
                )}

                {/* Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activities
                  </h4>
                  {activities.length > 0 ? (
                    <div className="space-y-2">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.type}
                            </p>
                            <p className="text-sm text-gray-600">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No activities yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* Modals */}
      <LeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateLead}
        sources={sources}
      />

      <LeadModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setLeadToEdit(null);
        }}
        lead={leadToEdit}
        onSave={handleUpdateLead}
        sources={sources}
      />

      <PhoneInputModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSubmit={handleSendOTP}
      />

      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        phone={otpPhone}
        onVerify={handleVerifyOTP}
      />

      {/* Convert to Customer Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Convert Lead to Customer
                </h2>
                <p className="text-sm text-gray-600">
                  Transform this lead into a customer
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Lead Information */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Current Lead Information
                </p>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {selectedLead.name || "Unknown"}
                  </p>
                  {selectedLead.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedLead.email}
                    </p>
                  )}
                  {selectedLead.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedLead.phone}
                    </p>
                  )}
                  {selectedLead.source && (
                    <p className="text-sm text-gray-600">
                      Source: {getSourceLabel(selectedLead.source)}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Type Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Customer Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={convertAccountType}
                  onChange={(e) => setConvertAccountType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {accountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {accountTypes.find((t) => t.value === convertAccountType)
                  ?.description && (
                  <p className="text-xs text-gray-500 mt-1 ml-1">
                    {
                      accountTypes.find((t) => t.value === convertAccountType)
                        ?.description
                    }
                  </p>
                )}
              </div>

              {/* Customer Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">
                      New Customer Preview
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-800">
                        <span className="font-medium">Name:</span>{" "}
                        {selectedLead.name || "Unknown Customer"}
                      </p>
                      <p className="text-blue-800">
                        <span className="font-medium">Type:</span>{" "}
                        {accountTypes.find(
                          (t) => t.value === convertAccountType,
                        )?.label || convertAccountType}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          The lead will be removed from the leads list and
                          converted into a customer with all contact information
                          preserved.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertAccountType(accountTypes[0]?.value || "HOUSEHOLD");
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvertToCustomer}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25"
              >
                <Check className="w-4 h-4 mr-2" />
                Convert to Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
