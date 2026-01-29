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
  DollarSign,
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
  LayoutGrid,
  Home,
  Palette,
  Target,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import toast from "react-hot-toast";
import LeadAPI, {
  Lead,
  LeadActivity,
  LeadSource,
  LeadStatus,
} from "../../services/leadApi";
import AccountAPI from "../../services/accountApi";

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
    { id: "1", name: "Website" },
    { id: "2", name: "Referral" },
    { id: "3", name: "Instagram" },
    { id: "4", name: "Facebook" },
    { id: "5", name: "LinkedIn" },
    { id: "6", name: "Google Ads" },
    { id: "7", name: "Walk-in" },
    { id: "8", name: "Phone Call" },
    { id: "9", name: "Email Campaign" },
    { id: "10", name: "Trade Show" },
    { id: "11", name: "Partner" },
    { id: "12", name: "Other" },
  ];

  const availableSources = sources.length > 0 ? sources : defaultSources;

  const [formData, setFormData] = useState<Omit<Lead, "id">>({
    name: "",
    email: "",
    phone: "",
    source: availableSources[0]?.name || "Website",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || availableSources[0]?.name || "Website",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        source: availableSources[0]?.name || "Website",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                    <option key={source.id} value={source.name}>
                      {source.name}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
  const [otpPhone, setOtpPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

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

  // Convert Lead to Account
  const handleConvertToAccount = async () => {
    if (!selectedLead?.id) return;

    const accountName = selectedLead.name || "Unknown Account";

    try {
      const result = await AccountAPI.convertLeadToAccount(
        selectedLead.id,
        accountName,
      );

      // Remove lead from list
      setLeads(leads.filter((l) => l.id !== selectedLead.id));
      setSelectedLead(null);
      setShowConvertModal(false);

      toast.success(`Lead converted to account "${result.name}" successfully!`);

      // Navigate to accounts page to see the new account
      setTimeout(() => {
        window.location.href = "/dashboard/accounts";
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to convert lead to account";
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
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => navigate("/dashboard/leads/kanban")}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban View
          </Button>
          <Button className="rounded-xl" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.isArray(statuses) &&
          statuses.map((status) => (
            <Card
              key={status.id}
              className={`p-4 rounded-xl text-center cursor-pointer transition-all hover:shadow-md ${
                selectedStage === status.name
                  ? "ring-2 ring-orange-500 shadow-md"
                  : ""
              }`}
              onClick={() =>
                setSelectedStage(
                  selectedStage === status.name ? "all" : status.name,
                )
              }
            >
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {leadCounts[status.name] || 0}
              </div>
              <div className="text-sm font-medium text-gray-600">
                {status.name}
              </div>
            </Card>
          ))}
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
          <Card
            key={lead.id}
            className="p-0 rounded-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden border-2 border-transparent hover:border-orange-200"
            onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                    {(lead.name || "Unknown")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="text-white">
                    <h3 className="font-bold text-lg mb-1">
                      {lead.name || "Unknown"}
                    </h3>
                    <Badge className="bg-white/25 text-white border-white/30 text-xs rounded-lg backdrop-blur-sm">
                      {lead.status || "New"}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLeadToEdit(lead);
                    setShowEditModal(true);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <MoreVertical className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Lead Score Indicator */}
              {lead.score && (
                <div className="mt-4 relative z-10">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-white/90 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Lead Quality
                    </span>
                    <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                      {lead.score}/100
                    </span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${lead.score}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Body Content */}
            <div className="p-5 space-y-4">
              {/* Contact Information */}
              <div className="space-y-2.5">
                {lead.phone && (
                  <div className="flex items-center gap-3 text-sm group/item hover:text-orange-600 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover/item:bg-orange-100 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-700">
                      {lead.phone}
                    </span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-3 text-sm group/item hover:text-orange-600 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover/item:bg-blue-100 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-700 truncate">
                      {lead.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Property Details */}
              {(lead.propertyType || lead.bhkConfig || lead.carpetArea) && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3.5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Home className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Property Details
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {lead.propertyType && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Type</span>
                        <span className="font-semibold text-gray-900">
                          {lead.propertyType}
                        </span>
                      </div>
                    )}
                    {lead.bhkConfig && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Config</span>
                        <span className="font-semibold text-gray-900">
                          {lead.bhkConfig}
                        </span>
                      </div>
                    )}
                    {lead.carpetArea && (
                      <div className="flex flex-col col-span-2">
                        <span className="text-xs text-gray-500">Area</span>
                        <span className="font-semibold text-gray-900">
                          {lead.carpetArea} sq.ft
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {(lead.location || lead.city) && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {lead.location}
                    </p>
                    {lead.city && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {lead.city}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Budget & Timeline Row */}
              <div className="grid grid-cols-2 gap-3">
                {(lead.budget || lead.budgetRange) && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-gray-600">Budget</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      {lead.budgetRange || lead.budget}
                    </p>
                  </div>
                )}
                {lead.timeline && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-xs text-gray-600">Timeline</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      {lead.timeline}
                    </p>
                  </div>
                )}
              </div>

              {/* Design Style Tags */}
              {lead.designStyle && lead.designStyle.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Palette className="w-3.5 h-3.5 text-pink-600" />
                    <span className="text-xs font-semibold text-gray-700">
                      Design Style
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.designStyle.slice(0, 3).map((style, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 text-xs font-medium rounded-full border border-pink-200"
                      >
                        {style}
                      </span>
                    ))}
                    {lead.designStyle.length > 3 && (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        +{lead.designStyle.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Priority & Source Footer */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lead.priority && (
                    <Badge
                      className={`text-xs rounded-lg ${
                        lead.priority === "high"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : lead.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}
                    >
                      {lead.priority === "high"
                        ? "🔥 Hot"
                        : lead.priority === "medium"
                          ? "⚡ Warm"
                          : "❄️ Cold"}
                    </Badge>
                  )}
                  {lead.source && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {lead.source}
                    </span>
                  )}
                </div>
                {lead.lastContact && (
                  <span className="text-xs text-gray-400">
                    {new Date(lead.lastContact).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Hover Effect Indicator */}
            <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No leads found
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Try adjusting your search"
              : "Start by adding your first lead"}
          </p>
        </div>
      )}

      {/* Lead Details Sidebar */}
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
                    title="Convert to Account"
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
                    {selectedLead.source}
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

      {/* Convert to Account Modal */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Convert Lead to Account</h2>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Lead Information:</p>
                <p className="font-semibold text-gray-900">
                  {selectedLead.name || "Unknown"}
                </p>
                <p className="text-sm text-gray-600">{selectedLead.email}</p>
                <p className="text-sm text-gray-600">{selectedLead.phone}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">
                      New Account will be created
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Account Name: {selectedLead.name || "Unknown Account"}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      The lead will be permanently removed from the leads list
                      and converted into an account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowConvertModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvertToAccount}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Convert to Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
