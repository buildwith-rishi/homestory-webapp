import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Star,
  Search,
  Plus,
  Phone,
  Mail,
  X,
  AlertCircle,
  User,
  Edit2,
  Save,
  Camera,
  Calendar,
  Heart,
  Award,
  MessageCircle,
  MapPin,
  Briefcase,
  UserPlus,
  Gift,
  Trash2,
  FileText,
  Clock,
  Contact2,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Card, Button, SectionLoader, Spinner } from "../../components/ui";
import toast from "react-hot-toast";
import ContactAPI, { type Contact } from "../../services/contactApi";
import CustomerAPI, {
  Customer as APICustomer,
} from "../../services/customerApi";
import { listProjects } from "../../services/projectApi";
import { ContactRoleBadge, PrimaryBadge } from "../../components/customers";

interface FamilyMember {
  name: string;
  relationship: string;
  age?: string;
  occupation?: string;
}

interface ImportantDate {
  dateType: string;
  date: string;
  isRecurring?: boolean;
  notes?: string;
}

interface Referral {
  name: string;
  phone: string;
  status: "contacted" | "converted" | "pending";
  date: string;
}

interface Note {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface Customer {
  id: string | number;
  customerNumber?: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  secondaryEmails?: string[];
  secondaryPhones?: string[];
  location: string;
  projects: number;
  totalValue: number;
  status: "active" | "completed" | "inactive" | "churned";
  rating: number;
  lastContact: string;
  type?: string; // HOUSEHOLD, COMPANY, etc.
  // Extended fields
  photoUrl?: string;
  alternatePhone?: string;
  address?: string;
  familyMembers?: FamilyMember[];
  importantDates?: ImportantDate[];
  referrals?: Referral[];
  clientRanking?: "niche" | "regular" | "one-time" | "vip";
  communicationPreference?: "email" | "phone" | "whatsapp" | "in-person";
  notes?: Note[];
  occupation?: string;
  companyName?: string;
  propertyType?: string;
  projectType?: string;
  area?: string;
  city?: string;
  projectStage?: string;
  startTimeline?: string;
  budgetComfort?: string;
  projectScope?: string;
  floorPlan?: string;
  messageNotes?: string;
  requirements?: string;
  createdAt?: string;
  updatedAt?: string;
}

const mockCustomers: Customer[] = [
  {
    id: 1,
    name: "Rajesh Sharma",
    initials: "RS",
    email: "rajesh@email.com",
    phone: "+91 98765 43210",
    location: "HSR Layout",
    projects: 2,
    totalValue: 3800000,
    status: "active",
    rating: 5,
    lastContact: "2 days ago",
  },
  {
    id: 2,
    name: "Priya Kumar",
    initials: "PK",
    email: "priya@email.com",
    phone: "+91 98765 43211",
    location: "Whitefield",
    projects: 1,
    totalValue: 4200000,
    status: "active",
    rating: 4.8,
    lastContact: "1 week ago",
  },
  {
    id: 3,
    name: "Amit Patel",
    initials: "AP",
    email: "amit@email.com",
    phone: "+91 98765 43212",
    location: "Indiranagar",
    projects: 3,
    totalValue: 6500000,
    status: "completed",
    rating: 4.9,
    lastContact: "3 days ago",
  },
  {
    id: 4,
    name: "Sneha Reddy",
    initials: "SR",
    email: "sneha@email.com",
    phone: "+91 98765 43213",
    location: "Koramangala",
    projects: 1,
    totalValue: 2900000,
    status: "active",
    rating: 4.7,
    lastContact: "5 days ago",
  },
];

const statusColors = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  completed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  inactive: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" },
  churned: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const toCurrencyNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const customerPropertyTypeOptions = [
  { value: "HOME", label: "Home" },
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MIXED_USE", label: "Mixed Use" },
  { value: "OTHERS", label: "Others" },
];

const customerProjectTypeOptions = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "VILLA", label: "Villa" },
  { value: "ROW_HOUSE", label: "Row House" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "STUDIO", label: "Studio" },
  { value: "OFFICE", label: "Office" },
  { value: "RETAIL", label: "Retail" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "OTHER", label: "Other" },
];

const customerProjectStageOptions = [
  { value: "NOT_SURE", label: "Not Sure" },
  { value: "NEW_HOME_PENDING", label: "New Home - Pending Possession" },
  { value: "NEW_HOME_RECEIVED", label: "New Home - Received" },
  { value: "RENOVATION", label: "Renovation" },
  { value: "COMMERCIAL_FITOUT", label: "Commercial Fitout" },
];

const customerStartTimelineOptions = [
  { value: "NOT_SURE", label: "Not Sure" },
  { value: "IMMEDIATELY", label: "Immediately" },
  { value: "ONE_TO_THREE_MONTHS", label: "1-3 Months" },
  { value: "THREE_TO_SIX_MONTHS", label: "3-6 Months" },
  { value: "SIX_PLUS_MONTHS", label: "6+ Months" },
];

const customerBudgetComfortOptions = [
  { value: "NOT_SURE", label: "Not Sure" },
  { value: "VALUE", label: "Value" },
  { value: "BALANCED", label: "Balanced" },
  { value: "PREMIUM", label: "Premium" },
  { value: "NEED_GUIDANCE", label: "Need Guidance" },
];

const customerProjectScopeOptions = [
  { value: "NOT_SURE", label: "Not Sure" },
  { value: "TURNKEY", label: "Turnkey" },
  { value: "DESIGN_ONLY", label: "Design Only" },
  { value: "KITCHEN_WARDROBES", label: "Kitchen & Wardrobes" },
  { value: "INTERIOR_DESIGN_ONLY", label: "Interior Design Only" },
  {
    value: "INTERIOR_DESIGN_AND_BUILD",
    label: "Interior Design & Build",
  },
  {
    value: "ARCHITECTURE_DESIGN_ONLY",
    label: "Architecture Design Only",
  },
  { value: "RENOVATION", label: "Renovation" },
  { value: "SPECIFIC_SPACE", label: "Specific Space" },
  { value: "OTHERS", label: "Others" },
];

// Add Customer Modal Component
const AddCustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: any) => Promise<void>;
  customerTypes: { value: string; label: string }[];
  isCreating: boolean;
}> = ({ isOpen, onClose, onSave, customerTypes, isCreating }) => {
  const navigate = useNavigate();
  const defaultCustomerType = customerTypes[0]?.value || "RESIDENTIAL";
  const [formData, setFormData] = useState({
    name: "",
    type: defaultCustomerType as string,
    email: "",
    phone: "",
    secondaryEmail: "",
    secondaryPhone: "",
    companyName: "",
    propertyType: "",
    projectType: "",
    area: "",
    city: "",
    projectStage: "",
    startTimeline: "",
    budgetComfort: "",
    projectScope: "",
    floorPlan: "",
    messageNotes: "",
    requirements: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{
    found: boolean;
    lead?: any;
    account?: any;
  } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [acknowledgeDuplicate, setAcknowledgeDuplicate] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone format";
    }

    if (
      formData.secondaryEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.secondaryEmail)
    ) {
      newErrors.secondaryEmail = "Invalid secondary email format";
    }

    if (
      formData.secondaryPhone.trim() &&
      !/^\+?[\d\s-]{10,}$/.test(formData.secondaryPhone)
    ) {
      newErrors.secondaryPhone = "Invalid secondary phone format";
    }

    if (!formData.propertyType) newErrors.propertyType = "Property type is required";
    if (!formData.projectType) newErrors.projectType = "Project type is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.startTimeline)
      newErrors.startTimeline = "Start timeline is required";
    if (!formData.budgetComfort)
      newErrors.budgetComfort = "Budget comfort is required";
    if (!formData.projectScope)
      newErrors.projectScope = "Project scope is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Debounced duplicate check
  const checkForDuplicates = React.useCallback(
    async (email: string, phone: string) => {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Only check if we have email or phone
      if (!email && !phone) {
        setDuplicateCheckResult(null);
        setShowDuplicateWarning(false);
        return;
      }

      // Debounce the API call
      debounceTimerRef.current = setTimeout(async () => {
        setIsCheckingDuplicate(true);
        try {
          const searchParams: { email?: string; phone?: string } = {};
          if (email) searchParams.email = email;
          if (phone) searchParams.phone = phone;

          const result =
            await CustomerAPI.searchCustomerByContact(searchParams);

          setDuplicateCheckResult(result);
          setShowDuplicateWarning(result.found);
          setAcknowledgeDuplicate(false); // Reset acknowledge flag
        } catch (error) {
          console.error("Error checking for duplicates:", error);
          setDuplicateCheckResult(null);
          setShowDuplicateWarning(false);
        } finally {
          setIsCheckingDuplicate(false);
        }
      }, 600); // 600ms debounce
    },
    [],
  );

  // Effect to trigger duplicate check when email or phone changes
  React.useEffect(() => {
    if (isOpen) {
      checkForDuplicates(formData.email, formData.phone);
    }
  }, [formData.email, formData.phone, isOpen, checkForDuplicates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // If duplicate found and not acknowledged, don't allow submission
    if (showDuplicateWarning && !acknowledgeDuplicate) {
      toast.error("Please acknowledge the duplicate customer warning");
      return;
    }

    try {
      const customerData = {
        name: formData.name.trim(),
        type: formData.type,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        secondaryEmails: formData.secondaryEmail.trim()
          ? [formData.secondaryEmail.trim()]
          : [],
        secondaryPhones: formData.secondaryPhone.trim()
          ? [formData.secondaryPhone.trim()]
          : [],
        uiIntake: {
          companyName: formData.companyName.trim() || undefined,
          propertyType: formData.propertyType || undefined,
          projectType: formData.projectType || undefined,
          area: formData.area.trim() || undefined,
          city: formData.city.trim() || undefined,
          projectStage: formData.projectStage || undefined,
          startTimeline: formData.startTimeline || undefined,
          budgetComfort: formData.budgetComfort || undefined,
          projectScope: formData.projectScope || undefined,
          floorPlan: formData.floorPlan.trim() || undefined,
          messageNotes: formData.messageNotes.trim() || undefined,
          requirements: formData.requirements.trim() || undefined,
        },
      };

      await onSave(customerData);

      // Reset form on success
      setFormData({
        name: "",
        type: defaultCustomerType,
        email: "",
        phone: "",
        secondaryEmail: "",
        secondaryPhone: "",
        companyName: "",
        propertyType: "",
        projectType: "",
        area: "",
        city: "",
        projectStage: "",
        startTimeline: "",
        budgetComfort: "",
        projectScope: "",
        floorPlan: "",
        messageNotes: "",
        requirements: "",
      });
      setErrors({});
      setDuplicateCheckResult(null);
      setShowDuplicateWarning(false);
      setAcknowledgeDuplicate(false);
    } catch (error) {
      // Error is already handled in onSave
      console.error("Form submission error:", error);
    }
  };

  const handleViewExistingCustomer = () => {
    if (duplicateCheckResult?.account) {
      // Navigate to existing customer
      navigate(`/dashboard/customers/${duplicateCheckResult.account.id}`);
      onClose();
    }
  };

  const handleCreateAnyway = () => {
    setAcknowledgeDuplicate(true);
    toast.success("You can now proceed to create the customer");
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        type: defaultCustomerType,
        email: "",
        phone: "",
        secondaryEmail: "",
        secondaryPhone: "",
        companyName: "",
        propertyType: "",
        projectType: "",
        area: "",
        city: "",
        projectStage: "",
        startTimeline: "",
        budgetComfort: "",
        projectScope: "",
        floorPlan: "",
        messageNotes: "",
        requirements: "",
      });
      setErrors({});
      setDuplicateCheckResult(null);
      setShowDuplicateWarning(false);
      setAcknowledgeDuplicate(false);

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    }
  }, [isOpen, defaultCustomerType]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 via-orange-50 to-amber-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/30 ring-4 ring-orange-100">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Add New Customer
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Fill in the customer details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/60 rounded-xl transition-all hover:scale-110 active:scale-95"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 bg-gradient-to-b from-white to-gray-50 overflow-y-auto flex-1"
        >
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Rajesh Sharma or ABC Company"
                disabled={isCreating}
                className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.name
                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
              />
              {errors.name && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Company Name <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              placeholder="e.g., Acme Interiors Pvt Ltd"
              disabled={isCreating}
              className="w-full px-4 py-3.5 border-2 border-gray-200 bg-white hover:border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="customer@example.com"
                disabled={isCreating}
                className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.email
                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
              {isCheckingDuplicate && formData.email && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Spinner size="xs" color="brand" />
                </div>
              )}
              {errors.email && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Used to check for duplicate customers
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                disabled={isCreating}
                className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.phone
                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`} onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
              />
              {isCheckingDuplicate && formData.phone && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                </div>
              )}
              {errors.phone && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Used to check for duplicate customers
            </p>
          </div>

          {/* Secondary Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Secondary Email <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <input
              type="email"
              value={formData.secondaryEmail}
              onChange={(e) =>
                setFormData({ ...formData, secondaryEmail: e.target.value })
              }
              placeholder="alternate@example.com"
              disabled={isCreating}
              className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.secondaryEmail
                  ? "border-red-300 bg-red-50/50 focus:border-red-400"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            />
            {errors.secondaryEmail && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.secondaryEmail}</span>
              </div>
            )}
          </div>

          {/* Secondary Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Secondary Phone <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <input
              type="tel"
              value={formData.secondaryPhone}
              onChange={(e) =>
                setFormData({ ...formData, secondaryPhone: e.target.value })
              }
              placeholder="+91 90000 00000"
              disabled={isCreating}
              className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.secondaryPhone
                  ? "border-red-300 bg-red-50/50 focus:border-red-400"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`} onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
            />
            {errors.secondaryPhone && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.secondaryPhone}</span>
              </div>
            )}
          </div>

          {/* Intake fields */}
          <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Project Intake Details
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Add discovery details for qualified lead creation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) =>
                    setFormData({ ...formData, propertyType: e.target.value })
                  }
                  disabled={isCreating}
                  className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.propertyType
                      ? "border-red-300 bg-red-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <option value="">Select property type</option>
                  {customerPropertyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.propertyType && (
                  <p className="text-xs text-red-600 mt-1">{errors.propertyType}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) =>
                    setFormData({ ...formData, projectType: e.target.value })
                  }
                  disabled={isCreating}
                  className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.projectType
                      ? "border-red-300 bg-red-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <option value="">Select project type</option>
                  {customerProjectTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.projectType && (
                  <p className="text-xs text-red-600 mt-1">{errors.projectType}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Area
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                  placeholder="e.g., 2400 sq ft"
                  disabled={isCreating}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 bg-white hover:border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="e.g., Bengaluru"
                  disabled={isCreating}
                  className={`w-full px-4 py-3.5 border-2 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.city
                      ? "border-red-300 bg-red-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                />
                {errors.city && (
                  <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Project Stage
                </label>
                <select
                  value={formData.projectStage}
                  onChange={(e) =>
                    setFormData({ ...formData, projectStage: e.target.value })
                  }
                  disabled={isCreating}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white hover:border-gray-300 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select project stage</option>
                  {customerProjectStageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Start Timeline <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.startTimeline}
                  onChange={(e) =>
                    setFormData({ ...formData, startTimeline: e.target.value })
                  }
                  disabled={isCreating}
                  className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.startTimeline
                      ? "border-red-300 bg-red-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <option value="">Select timeline</option>
                  {customerStartTimelineOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.startTimeline && (
                  <p className="text-xs text-red-600 mt-1">{errors.startTimeline}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Budget Comfort <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.budgetComfort}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetComfort: e.target.value })
                  }
                  disabled={isCreating}
                  className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.budgetComfort
                      ? "border-red-300 bg-red-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <option value="">Select budget comfort</option>
                  {customerBudgetComfortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.budgetComfort && (
                  <p className="text-xs text-red-600 mt-1">{errors.budgetComfort}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Project Scope <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.projectScope}
                  onChange={(e) =>
                    setFormData({ ...formData, projectScope: e.target.value })
                  }
                  disabled={isCreating}
                  className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.projectScope
                      ? "border-red-300 bg-red-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <option value="">Select project scope</option>
                  {customerProjectScopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.projectScope && (
                  <p className="text-xs text-red-600 mt-1">{errors.projectScope}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Floor Plan
                </label>
                <input
                  type="text"
                  value={formData.floorPlan}
                  onChange={(e) =>
                    setFormData({ ...formData, floorPlan: e.target.value })
                  }
                  placeholder="Paste floor plan URL or reference"
                  disabled={isCreating}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 bg-white hover:border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Message / Notes
                </label>
                <textarea
                  value={formData.messageNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, messageNotes: e.target.value })
                  }
                  rows={3}
                  placeholder="Client message or context"
                  disabled={isCreating}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 bg-white hover:border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Requirements
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
                  }
                  rows={3}
                  placeholder="Project requirements and must-haves"
                  disabled={isCreating}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 bg-white hover:border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>
            </div>
          </div>

          {/* Duplicate Warning */}
          {showDuplicateWarning && duplicateCheckResult?.found && (
            <div className="space-y-3 animate-fade-in">
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 mb-1">
                      Duplicate Customer Found!
                    </h4>
                    <p className="text-sm text-amber-800 mb-3">
                      A customer with this {formData.email ? "email" : "phone"}{" "}
                      already exists in the system
                    </p>

                    {/* Existing Customer Details */}
                    <div className="bg-white rounded-xl p-4 border border-amber-200 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">
                          {duplicateCheckResult.lead?.name ||
                            duplicateCheckResult.account?.name ||
                            "Unknown"}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            duplicateCheckResult.lead?.status === "CONVERTED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {duplicateCheckResult.lead?.status ||
                            duplicateCheckResult.account?.status ||
                            "Unknown"}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {duplicateCheckResult.lead?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span>{duplicateCheckResult.lead.email}</span>
                          </div>
                        )}
                        {duplicateCheckResult.lead?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{duplicateCheckResult.lead.phone}</span>
                          </div>
                        )}
                        {duplicateCheckResult.account && (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              Customer Type: {duplicateCheckResult.account.type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleViewExistingCustomer}
                        disabled={!duplicateCheckResult.account}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      >
                        <User className="w-4 h-4" />
                        <span>View Existing Customer</span>
                      </button>

                      {!acknowledgeDuplicate && (
                        <button
                          type="button"
                          onClick={handleCreateAnyway}
                          className="flex items-center gap-2 px-4 py-2.5 border-2 border-amber-600 text-amber-700 hover:bg-amber-50 rounded-xl transition-all font-semibold text-sm hover:scale-105 active:scale-95"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>Create Anyway</span>
                        </button>
                      )}

                      {acknowledgeDuplicate && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-sm font-semibold text-emerald-700">
                            Acknowledged
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-3 text-gray-700 font-medium hover:bg-white rounded-2xl transition-all disabled:opacity-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isCreating || (showDuplicateWarning && !acknowledgeDuplicate)
            }
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white font-semibold rounded-2xl hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100"
            title={
              showDuplicateWarning && !acknowledgeDuplicate
                ? "Please acknowledge the duplicate warning first"
                : ""
            }
          >
            {isCreating ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Creating Customer...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Add Customer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// View Customer Modal Component
const ViewCustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  customer: Customer;
}> = ({ isOpen, onClose, onEdit, customer }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Fetch contacts when modal opens
  const fetchContacts = useCallback(async () => {
    if (!customer?.id) return;

    setLoadingContacts(true);
    try {
      const response = await ContactAPI.listContacts({
        leadId: customer.id.toString(),
      });
      setContacts(response.contacts || []);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, [customer?.id]);

  useEffect(() => {
    if (isOpen && customer?.id) {
      fetchContacts();
    }
  }, [isOpen, customer?.id, fetchContacts]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {customer.photoUrl ? (
                <img
                  src={customer.photoUrl}
                  alt={customer.name}
                  className="w-16 h-16 rounded-full border-4 border-white/30 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {customer.initials}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <p className="text-orange-100 text-sm mt-1">
                  Complete Customer Profile
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all duration-200 font-medium"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Email
                  </p>
                  <p className="text-gray-900 font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Phone
                  </p>
                  <p className="text-gray-900 font-medium">{customer.phone}</p>
                </div>
              </div>
              {(customer.secondaryEmails || []).map((secondaryEmail, index) => (
                <div className="flex items-start gap-3" key={`secondary-email-${index}`}>
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Secondary Email {index + 1}
                    </p>
                    <p className="text-gray-900 font-medium">{secondaryEmail}</p>
                  </div>
                </div>
              ))}
              {(customer.secondaryPhones || []).map((secondaryPhone, index) => (
                <div className="flex items-start gap-3" key={`secondary-phone-${index}`}>
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Secondary Phone {index + 1}
                    </p>
                    <p className="text-gray-900 font-medium">{secondaryPhone}</p>
                  </div>
                </div>
              ))}
              {customer.alternatePhone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Alternate Phone
                    </p>
                    <p className="text-gray-900 font-medium">
                      {customer.alternatePhone}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Location
                  </p>
                  <p className="text-gray-900 font-medium">
                    {customer.location}
                  </p>
                </div>
              </div>
              {customer.address && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Full Address
                    </p>
                    <p className="text-gray-900 font-medium">
                      {customer.address}
                    </p>
                  </div>
                </div>
              )}
              {customer.occupation && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Occupation
                    </p>
                    <p className="text-gray-900 font-medium">
                      {customer.occupation}
                    </p>
                  </div>
                </div>
              )}
              {customer.companyName && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Company
                    </p>
                    <p className="text-gray-900 font-medium">
                      {customer.companyName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contacts Section */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Contact2 className="w-5 h-5 text-purple-500" />
              Contacts
              {contacts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-purple-200 text-purple-700 text-xs font-semibold rounded-full">
                  {contacts.length}
                </span>
              )}
            </h3>
            {loadingContacts ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" color="brand" />
                <span className="ml-2 text-sm text-gray-500">
                  Loading contacts...
                </span>
              </div>
            ) : contacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-white rounded-xl p-4 border border-purple-100 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <ContactRoleBadge role={contact.role} />
                          {contact.isPrimary && <PrimaryBadge />}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No contacts added yet. View full details to add contacts.
              </p>
            )}
          </div>

          {/* Business Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200">
              <p className="text-sm text-blue-600 font-semibold mb-1">
                Projects
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {customer.projects}
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-200">
              <p className="text-sm text-emerald-600 font-semibold mb-1">
                Total Value
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                ₹{(customer.totalValue / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-200">
              <p className="text-sm text-amber-600 font-semibold mb-1">
                Rating
              </p>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < customer.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Project Intake Details */}
          {(customer.propertyType ||
            customer.projectType ||
            customer.area ||
            customer.city ||
            customer.projectStage ||
            customer.startTimeline ||
            customer.budgetComfort ||
            customer.projectScope ||
            customer.floorPlan ||
            customer.messageNotes ||
            customer.requirements) && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-100/40 rounded-2xl p-6 border border-amber-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Project Intake Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.propertyType && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Property Type
                    </p>
                    <p className="text-gray-900 font-medium">{customer.propertyType}</p>
                  </div>
                )}
                {customer.projectType && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Project Type
                    </p>
                    <p className="text-gray-900 font-medium">{customer.projectType}</p>
                  </div>
                )}
                {customer.area && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Area</p>
                    <p className="text-gray-900 font-medium">{customer.area}</p>
                  </div>
                )}
                {customer.city && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">City</p>
                    <p className="text-gray-900 font-medium">{customer.city}</p>
                  </div>
                )}
                {customer.projectStage && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Project Stage
                    </p>
                    <p className="text-gray-900 font-medium">{customer.projectStage}</p>
                  </div>
                )}
                {customer.startTimeline && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Start Timeline
                    </p>
                    <p className="text-gray-900 font-medium">{customer.startTimeline}</p>
                  </div>
                )}
                {customer.budgetComfort && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Budget Comfort
                    </p>
                    <p className="text-gray-900 font-medium">{customer.budgetComfort}</p>
                  </div>
                )}
                {customer.projectScope && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Project Scope
                    </p>
                    <p className="text-gray-900 font-medium">{customer.projectScope}</p>
                  </div>
                )}
                {customer.floorPlan && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Floor Plan
                    </p>
                    <p className="text-gray-900 font-medium break-all">{customer.floorPlan}</p>
                  </div>
                )}
                {customer.messageNotes && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Message / Notes
                    </p>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">
                      {customer.messageNotes}
                    </p>
                  </div>
                )}
                {customer.requirements && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Requirements
                    </p>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">
                      {customer.requirements}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Ranking & Communication */}
          {(customer.clientRanking || customer.communicationPreference) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.clientRanking && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-purple-500" />
                    <p className="text-sm text-purple-600 font-semibold">
                      Client Ranking
                    </p>
                  </div>
                  <p className="text-lg font-bold text-purple-900 capitalize">
                    {customer.clientRanking}
                  </p>
                </div>
              )}
              {customer.communicationPreference && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-indigo-500" />
                    <p className="text-sm text-indigo-600 font-semibold">
                      Preferred Contact
                    </p>
                  </div>
                  <p className="text-lg font-bold text-indigo-900 capitalize">
                    {customer.communicationPreference}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Family Members */}
          {customer.familyMembers && customer.familyMembers.length > 0 && (
            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-6 border border-pink-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-pink-500" />
                Family Members
              </h3>
              <div className="space-y-3">
                {customer.familyMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {member.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.relationship}
                      </p>
                    </div>
                    <div className="text-right">
                      {member.age && (
                        <p className="text-sm text-gray-600">
                          {member.age} years
                        </p>
                      )}
                      {member.occupation && (
                        <p className="text-xs text-gray-500">
                          {member.occupation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Dates */}
          {customer.importantDates && customer.importantDates.length > 0 && (
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-2xl p-6 border border-rose-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-500" />
                Important Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customer.importantDates.map((date, index) => {
                  const dateType = date.dateType?.toUpperCase() || "OTHER";
                  const label = date.dateType
                    ? date.dateType.charAt(0).toUpperCase() +
                      date.dateType.slice(1).toLowerCase().replace("_", " ")
                    : "Date";

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl"
                    >
                      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                        {dateType === "BIRTHDAY" ? (
                          <Gift className="w-6 h-6 text-rose-500" />
                        ) : dateType === "ANNIVERSARY" ? (
                          <Heart className="w-6 h-6 text-rose-500" />
                        ) : (
                          <Calendar className="w-6 h-6 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{label}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(date.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        {date.notes && (
                          <p
                            className="text-xs text-gray-500 truncate max-w-[150px]"
                            title={date.notes}
                          >
                            {date.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Referrals */}
          {customer.referrals && customer.referrals.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl p-6 border border-teal-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-500" />
                Referrals
              </h3>
              <div className="space-y-3">
                {customer.referrals.map((referral, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {referral.name}
                      </p>
                      <p className="text-sm text-gray-500">{referral.phone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          referral.status === "converted"
                            ? "bg-emerald-100 text-emerald-700"
                            : referral.status === "contacted"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {referral.status}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(referral.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && customer.notes.length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                Notes ({customer.notes.length})
              </h3>
              <div className="space-y-3">
                {customer.notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white rounded-xl p-4 border border-slate-200"
                  >
                    <p className="text-gray-700 mb-3">{note.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{note.createdBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(note.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Contact */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-200">
            <span>Last contact:</span>
            <span className="font-medium text-gray-700">
              {customer.lastContact}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Edit Customer Modal Component
const EditCustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer: Customer;
}> = ({ isOpen, onClose, onSave, customer }) => {
  const [activeTab, setActiveTab] = useState<
    | "basic"
    | "family"
    | "dates"
    | "referrals"
    | "ranking"
    | "communication"
    | "photo"
    | "notes"
  >("basic");
  const [formData, setFormData] = useState<Customer>(customer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  const parseCsvValues = (value: string): string[] =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

  // Update form data when customer prop changes
  React.useEffect(() => {
    setFormData(customer);
  }, [customer]);

  const tabs = [
    { id: "basic" as const, label: "Basic Info", icon: User },
    { id: "family" as const, label: "Family", icon: UserPlus },
    { id: "dates" as const, label: "Important Dates", icon: Calendar },
    { id: "referrals" as const, label: "Referrals", icon: Gift },
    { id: "ranking" as const, label: "Ranking", icon: Award },
    {
      id: "communication" as const,
      label: "Contact Pref",
      icon: MessageCircle,
    },
    { id: "photo" as const, label: "Photo", icon: Camera },
    { id: "notes" as const, label: "Notes", icon: FileText },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setActiveTab("basic");
      toast.error("Please fix errors in basic information");
      return;
    }
    setIsSubmitting(true);
    try {
      // Call the parent's update handler (which calls the API)
      await onSave(formData);
      // Success - modal will be closed by parent component
      onClose();
    } catch (error: any) {
      // Error is already handled by parent with toast, just keep modal open
      console.error("Failed to update customer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFamilyMember = () => {
    setFormData({
      ...formData,
      familyMembers: [
        ...(formData.familyMembers || []),
        { name: "", relationship: "", age: undefined, occupation: "" },
      ],
    });
  };

  const removeFamilyMember = (index: number) => {
    setFormData({
      ...formData,
      familyMembers: formData.familyMembers?.filter((_, i) => i !== index),
    });
  };

  const updateFamilyMember = (
    index: number,
    field: keyof FamilyMember,
    value: string | number | undefined,
  ) => {
    const updated = [...(formData.familyMembers || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, familyMembers: updated });
  };

  const addImportantDate = () => {
    setFormData({
      ...formData,
      importantDates: [
        ...(formData.importantDates || []),
        { dateType: "OTHER", date: "", notes: "" },
      ],
    });
  };

  const removeImportantDate = (index: number) => {
    setFormData({
      ...formData,
      importantDates: formData.importantDates?.filter((_, i) => i !== index),
    });
  };

  const updateImportantDate = (
    index: number,
    field: keyof ImportantDate,
    value: string,
  ) => {
    const updated = [...(formData.importantDates || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, importantDates: updated });
  };

  const addReferral = () => {
    setFormData({
      ...formData,
      referrals: [
        ...(formData.referrals || []),
        {
          name: "",
          phone: "",
          status: "pending",
          date: new Date().toISOString().split("T")[0],
        },
      ],
    });
  };

  const removeReferral = (index: number) => {
    setFormData({
      ...formData,
      referrals: formData.referrals?.filter((_, i) => i !== index),
    });
  };

  const updateReferral = (
    index: number,
    field: keyof Referral,
    value: string,
  ) => {
    const updated = [...(formData.referrals || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, referrals: updated });
  };

  const addNote = () => {
    if (!newNoteContent.trim()) {
      toast.error("Note content cannot be empty");
      return;
    }
    const newNote: Note = {
      id: Date.now(),
      content: newNoteContent,
      createdBy: "Admin User", // Replace with actual user from auth context
      createdAt: new Date().toISOString(),
    };
    setFormData({
      ...formData,
      notes: [...(formData.notes || []), newNote],
    });
    setNewNoteContent("");
    toast.success("Note added successfully");
  };

  const removeNote = (noteId: number) => {
    setFormData({
      ...formData,
      notes: formData.notes?.filter((note) => note.id !== noteId),
    });
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Edit Customer</h2>
              <p className="text-orange-100 text-sm mt-1">{formData.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[88px] z-10 bg-white border-b border-gray-200 px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-orange-500 text-orange-600 bg-orange-50/50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${
                      errors.name ? "border-red-300" : "border-gray-200"
                    }`} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${
                      errors.email ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${
                      errors.phone ? "border-red-300" : "border-gray-200"
                    }`} onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Secondary Emails
                  </label>
                  <textarea
                    value={(formData.secondaryEmails || []).join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondaryEmails: parseCsvValues(e.target.value),
                      })
                    }
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 resize-none"
                    placeholder="wife@gmail.com, office@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Secondary Phones
                  </label>
                  <textarea
                    value={(formData.secondaryPhones || []).join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondaryPhones: parseCsvValues(e.target.value),
                      })
                    }
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 resize-none"
                    placeholder="+919123456789, +919000000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.alternatePhone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alternatePhone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20" onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${
                      errors.location ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.location && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | "active"
                          | "completed"
                          | "inactive"
                          | "churned",
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="inactive">Inactive</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Address
                </label>
                <textarea
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                  placeholder="Complete address with pincode..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={formData.occupation || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, occupation: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                    placeholder="e.g., Tech Corp" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Family Tab */}
          {activeTab === "family" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Family Members
                </h3>
                <button
                  onClick={addFamilyMember}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              </div>

              {!formData.familyMembers ||
              formData.familyMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No family members added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.familyMembers.map((member, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-2xl p-5 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">
                          Member {index + 1}
                        </h4>
                        <button
                          onClick={() => removeFamilyMember(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) =>
                              updateFamilyMember(index, "name", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Member name" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Relationship
                          </label>
                          <input
                            type="text"
                            value={member.relationship}
                            onChange={(e) =>
                              updateFamilyMember(
                                index,
                                "relationship",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Spouse, Child"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            value={member.age || ""}
                            onChange={(e) =>
                              updateFamilyMember(
                                index,
                                "age",
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Age" onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Occupation
                          </label>
                          <input
                            type="text"
                            value={member.occupation || ""}
                            onChange={(e) =>
                              updateFamilyMember(
                                index,
                                "occupation",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Occupation"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Important Dates Tab */}
          {activeTab === "dates" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Important Dates
                </h3>
                <button
                  onClick={addImportantDate}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Date</span>
                </button>
              </div>

              {!formData.importantDates ||
              formData.importantDates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No important dates added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.importantDates.map((date, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-2xl p-5 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">
                          Date {index + 1}
                        </h4>
                        <button
                          onClick={() => removeImportantDate(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={date.dateType}
                            onChange={(e) =>
                              updateImportantDate(
                                index,
                                "dateType",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Birthday"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={date.date}
                            onChange={(e) =>
                              updateImportantDate(index, "date", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={date.dateType}
                            onChange={(e) =>
                              updateImportantDate(index, "dateType", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="BIRTHDAY">Birthday</option>
                            <option value="ANNIVERSARY">Anniversary</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === "referrals" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Referrals</h3>
                <button
                  onClick={addReferral}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Referral</span>
                </button>
              </div>

              {!formData.referrals || formData.referrals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No referrals added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.referrals.map((referral, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-2xl p-5 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">
                          Referral {index + 1}
                        </h4>
                        <button
                          onClick={() => removeReferral(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={referral.name}
                            onChange={(e) =>
                              updateReferral(index, "name", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Referral name" onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={referral.phone}
                            onChange={(e) =>
                              updateReferral(index, "phone", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="+91 xxxxx xxxxx" onKeyPress={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={referral.status}
                            onChange={(e) =>
                              updateReferral(index, "status", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={referral.date}
                            onChange={(e) =>
                              updateReferral(index, "date", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ranking Tab */}
          {activeTab === "ranking" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Client Ranking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["niche", "regular", "one-time", "vip"] as const).map(
                  (rank) => (
                    <button
                      key={rank}
                      onClick={() =>
                        setFormData({ ...formData, clientRanking: rank })
                      }
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        formData.clientRanking === rank
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            rank === "vip"
                              ? "bg-gradient-to-br from-purple-500 to-purple-600"
                              : rank === "niche"
                                ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                : rank === "regular"
                                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                  : "bg-gradient-to-br from-gray-500 to-gray-600"
                          }`}
                        >
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900 capitalize">
                            {rank}
                          </p>
                          <p className="text-sm text-gray-500">
                            {rank === "vip"
                              ? "High-value clients"
                              : rank === "niche"
                                ? "Specialized projects"
                                : rank === "regular"
                                  ? "Standard clients"
                                  : "Single project"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Communication Preference Tab */}
          {activeTab === "communication" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Communication Preference
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: "email" as const, label: "Email", icon: Mail },
                  { value: "phone" as const, label: "Phone Call", icon: Phone },
                  {
                    value: "whatsapp" as const,
                    label: "WhatsApp",
                    icon: MessageCircle,
                  },
                  {
                    value: "in-person" as const,
                    label: "In Person",
                    icon: User,
                  },
                ].map((pref) => {
                  const Icon = pref.icon;
                  return (
                    <button
                      key={pref.value}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          communicationPreference: pref.value,
                        })
                      }
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        formData.communicationPreference === pref.value
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900">
                            {pref.label}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photo Tab */}
          {activeTab === "photo" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Customer Photo
              </h3>
              <div className="flex flex-col items-center gap-6">
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt={formData.name}
                    className="w-40 h-40 rounded-2xl object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="w-full max-w-md">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={formData.photoUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, photoUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                    placeholder="https://example.com/photo.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter a URL to the customer's photo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Notes</h3>
              </div>

              {/* Add Note Section */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add New Note
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Write a note about this customer..."
                />
                <button
                  onClick={addNote}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Note</span>
                </button>
              </div>

              {/* Existing Notes */}
              {!formData.notes || formData.notes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No notes added yet</p>
                  <p className="text-sm mt-1">Add your first note above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-600">
                    Previous Notes ({formData.notes.length})
                  </p>
                  {formData.notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-gray-800 flex-1">{note.content}</p>
                        <button
                          onClick={() => removeNote(note.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-3"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span className="font-medium">{note.createdBy}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(note.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-5 rounded-b-3xl flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);
  const [customerTypes, setCustomerTypes] = useState<
    { value: string; label: string }[]
  >([]);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Filter states
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  // Ref for debounce timer
  const searchDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const inFlightCustomersRequestRef = React.useRef<Promise<void> | null>(null);
  const inFlightCustomersRequestKeyRef = React.useRef<string | null>(null);
  const contactsCacheRef = React.useRef<{
    loaded: boolean;
    byLeadId: Map<string, Contact[]>;
    byAccountId: Map<string, Contact[]>;
  }>({
    loaded: false,
    byLeadId: new Map(),
    byAccountId: new Map(),
  });
  const projectsAggCacheRef = React.useRef<{
    loaded: boolean;
    byAccountId: Map<string, { projectCount: number; totalValue: number }>;
  }>({
    loaded: false,
    byAccountId: new Map(),
  });

  // Fetch customer types once on mount.
  useEffect(() => {
    fetchCustomerTypes();
  }, []);

  const fetchCustomerTypes = async () => {
    try {
      const types = await CustomerAPI.getCustomerTypes();
      setCustomerTypes(types);
    } catch (error) {
      console.error("Error fetching customer types:", error);
      // Use default types if API fails
      setCustomerTypes([
        { value: "RESIDENTIAL", label: "Residential" },
        { value: "COMMERCIAL", label: "Commercial" },
      ]);
    }
  };

  const fetchCustomers = useCallback(async (searchTerm?: string) => {
    const normalizedSearch = searchTerm?.trim() || "";
    const requestKey = normalizedSearch.toLowerCase() || "__all__";

    if (
      inFlightCustomersRequestRef.current &&
      inFlightCustomersRequestKeyRef.current === requestKey
    ) {
      await inFlightCustomersRequestRef.current;
      return;
    }

    const isInitialLoad = normalizedSearch.length === 0;

    const loadPromise = (async () => {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsSearching(true);
      }

      try {
        const params = normalizedSearch
          ? { search: normalizedSearch, includeContacts: true, limit: 1000 }
          : { includeContacts: true, limit: 1000 };
        const response = await CustomerAPI.listCustomers(params);

        // Load support datasets only once per page session.
        if (!contactsCacheRef.current.loaded) {
          try {
            const contactsData = await ContactAPI.listContacts({ limit: 1000 });
            const allContacts = contactsData.contacts || [];
            const byLeadId = new Map<string, Contact[]>();
            const byAccountId = new Map<string, Contact[]>();

            allContacts.forEach((contact) => {
              const contactWithKeys = contact as Contact & {
                leadId?: string;
                accountId?: string;
              };

              if (contactWithKeys.leadId) {
                const existing = byLeadId.get(contactWithKeys.leadId) || [];
                existing.push(contact);
                byLeadId.set(contactWithKeys.leadId, existing);
              }

              if (contactWithKeys.accountId) {
                const existing = byAccountId.get(contactWithKeys.accountId) || [];
                existing.push(contact);
                byAccountId.set(contactWithKeys.accountId, existing);
              }
            });

            contactsCacheRef.current = {
              loaded: true,
              byLeadId,
              byAccountId,
            };
          } catch (err) {
            console.warn("Could not fetch contacts separately:", err);
          }
        }

        if (!projectsAggCacheRef.current.loaded) {
          try {
            const projectsResponse = await listProjects({ limit: 5000 });
            const byAccountId = new Map<
              string,
              { projectCount: number; totalValue: number }
            >();

            (projectsResponse.projects || []).forEach((project) => {
              const accountId = project.accountId || project.account?.id;
              if (!accountId) return;

              const existing = byAccountId.get(accountId) || {
                projectCount: 0,
                totalValue: 0,
              };

              existing.projectCount += 1;
              existing.totalValue += toCurrencyNumber(project.totalValue);

              byAccountId.set(accountId, existing);
            });

            projectsAggCacheRef.current = {
              loaded: true,
              byAccountId,
            };
          } catch (err) {
            console.warn("Could not fetch project totals separately:", err);
          }
        }

        const contactsByLeadId = contactsCacheRef.current.byLeadId;
        const contactsByAccountId = contactsCacheRef.current.byAccountId;
        const projectAggByAccountId = projectsAggCacheRef.current.byAccountId;

        // Map API customers to UI Customer format
        const activeCustomersOnly = (response.customers || []).filter(
          (apiCustomer: APICustomer & {
            isActive?: boolean;
            isDeleted?: boolean;
            deletedAt?: string | null;
          }) => {
            const status = (apiCustomer.status || "").toLowerCase();
            // Deactivated / soft-deleted customers should not be shown in the dashboard list.
            if (apiCustomer.isActive === false) return false;
            if (apiCustomer.isDeleted === true) return false;
            if (apiCustomer.deletedAt) return false;
            if (
              status === "inactive" ||
              status === "deactivated" ||
              status === "deleted"
            )
              return false;
            return true;
          },
        );

        const mappedCustomers: Customer[] = activeCustomersOnly.map(
          (apiCustomer) => {
            const initials = apiCustomer.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

          // Extract contact info from available sources
          // 1. contacts included in list response (if backend supports includeContacts)
          // 2. contacts fetched separately, matched by convertedFromLeadId
          // 3. contacts fetched separately, matched by accountId (customer id)
          // 4. convertedFromLead data (lead had email/phone before conversion)
          const embeddedContacts = apiCustomer.contacts || [];
          const leadId = apiCustomer.convertedFromLeadId;
          const contactsFromLead = leadId
            ? contactsByLeadId.get(leadId) || []
            : [];
          const contactsFromAccount =
            contactsByAccountId.get(apiCustomer.id) || [];
          const contacts =
            embeddedContacts.length > 0
              ? embeddedContacts
              : contactsFromLead.length > 0
                ? contactsFromLead
                : contactsFromAccount;
          const primaryContact =
            contacts.find((c: any) => c.isPrimary) || contacts[0];
          const leadInfo = apiCustomer.convertedFromLead;
          const projectAgg = projectAggByAccountId.get(apiCustomer.id);
          const embeddedProjectValue = (apiCustomer.projects || []).reduce(
            (sum: number, project: any) =>
              sum + toCurrencyNumber(project?.totalValue),
            0,
          );
          const intake =
            ((apiCustomer as any).uiIntake as Record<string, unknown> | undefined) ||
            {};

            // Get email from contacts first, then fall back to lead info
            let customerEmail = "No email";
            if (apiCustomer.email) {
              customerEmail = apiCustomer.email;
            } else if (primaryContact?.email) {
              customerEmail = primaryContact.email;
            } else {
              const contactWithEmail = contacts.find((c: any) => c.email);
              if (contactWithEmail?.email) {
                customerEmail = contactWithEmail.email;
              } else if (leadInfo?.email) {
                customerEmail = leadInfo.email;
              }
            }

            // Get phone from contacts first, then fall back to lead info
            let customerPhone = "No phone";
            if (apiCustomer.phone) {
              customerPhone = apiCustomer.phone;
            } else if (primaryContact?.phone) {
              customerPhone = primaryContact.phone;
            } else {
              const contactWithPhone = contacts.find((c: any) => c.phone);
              if (contactWithPhone?.phone) {
                customerPhone = contactWithPhone.phone;
              } else if (leadInfo?.phone) {
                customerPhone = leadInfo.phone;
              }
            }

            return {
              id: apiCustomer.id, // Keep UUID as string
              customerNumber: apiCustomer.customerNumber || undefined,
              name: apiCustomer.name,
              initials,
              email: customerEmail,
              phone: customerPhone,
              secondaryEmails: apiCustomer.secondaryEmails || [],
              secondaryPhones: apiCustomer.secondaryPhones || [],
              location:
                apiCustomer.billingCity ||
                apiCustomer.shippingCity ||
                apiCustomer.billingAddress ||
                apiCustomer.shippingAddress ||
                "N/A",
              projects:
                projectAgg?.projectCount ||
                apiCustomer._count?.projects ||
                apiCustomer.projects?.length ||
                0,
              totalValue: projectAgg?.totalValue || embeddedProjectValue,
              status:
                (apiCustomer.status?.toLowerCase() as
                  | "active"
                  | "completed"
                  | "inactive"
                  | "churned") || "active",
              rating: 0,
              lastContact: apiCustomer.updatedAt
                ? new Date(apiCustomer.updatedAt).toLocaleDateString()
                : "N/A",
              type: apiCustomer.type,
              photoUrl: undefined,
              alternatePhone: undefined,
              address:
                apiCustomer.billingAddress ||
                apiCustomer.shippingAddress ||
                undefined,
              familyMembers: [],
              importantDates: [],
              referrals: [],
              clientRanking: undefined,
              communicationPreference: undefined,
              notes: [],
              occupation: undefined,
              companyName:
                (apiCustomer as any).companyName ||
                (typeof intake.companyName === "string"
                  ? intake.companyName
                  : undefined),
              propertyType:
                (apiCustomer as any).propertyType ||
                (typeof intake.propertyType === "string"
                  ? intake.propertyType
                  : undefined),
              projectType:
                (apiCustomer as any).projectType ||
                (typeof intake.projectType === "string"
                  ? intake.projectType
                  : undefined),
              area:
                (apiCustomer as any).area ||
                (typeof intake.area === "string" ? intake.area : undefined),
              city:
                (apiCustomer as any).city ||
                (typeof intake.city === "string" ? intake.city : undefined),
              projectStage:
                (apiCustomer as any).projectStage ||
                (typeof intake.projectStage === "string"
                  ? intake.projectStage
                  : undefined),
              startTimeline:
                (apiCustomer as any).startTimeline ||
                (typeof intake.startTimeline === "string"
                  ? intake.startTimeline
                  : undefined),
              budgetComfort:
                (apiCustomer as any).budgetComfort ||
                (typeof intake.budgetComfort === "string"
                  ? intake.budgetComfort
                  : undefined),
              projectScope:
                (apiCustomer as any).projectScope ||
                (typeof intake.projectScope === "string"
                  ? intake.projectScope
                  : undefined),
              floorPlan:
                (apiCustomer as any).floorPlan ||
                (typeof intake.floorPlan === "string"
                  ? intake.floorPlan
                  : undefined),
              messageNotes:
                (apiCustomer as any).messageNotes ||
                (typeof intake.messageNotes === "string"
                  ? intake.messageNotes
                  : undefined),
              requirements:
                (apiCustomer as any).requirements ||
                (typeof intake.requirements === "string"
                  ? intake.requirements
                  : undefined),
              createdAt: apiCustomer.createdAt,
              updatedAt: apiCustomer.updatedAt,
            };
          },
        );

        setCustomers(mappedCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
        // Fall back to mock data if API fails
        setCustomers(mockCustomers);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        } else {
          setIsSearching(false);
        }
      }
    })();

    inFlightCustomersRequestRef.current = loadPromise;
    inFlightCustomersRequestKeyRef.current = requestKey;

    try {
      await loadPromise;
    } finally {
      if (inFlightCustomersRequestRef.current === loadPromise) {
        inFlightCustomersRequestRef.current = null;
        inFlightCustomersRequestKeyRef.current = null;
      }
    }
  }, []);

  // Debounced search function
  const debouncedSearch = React.useCallback((searchTerm: string) => {
    // Clear any existing timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    // Set new timer
    searchDebounceTimerRef.current = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 500); // 500ms debounce
  }, [fetchCustomers]);

  // Effect to handle search query changes
  React.useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery.trim());
    } else {
      // If search is cleared, fetch all customers immediately
      fetchCustomers();
    }

    // Cleanup on unmount
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, [searchQuery, debouncedSearch, fetchCustomers]);

  const handleAddCustomer = async (customerData: any) => {
    setIsCreatingCustomer(true);
    try {
      const intake = customerData.uiIntake || {};
      const mergedNotes = [intake.messageNotes, intake.requirements]
        .filter((entry: unknown) => typeof entry === "string" && entry.trim())
        .join("\n\n");

      const createPayload = {
        name: customerData.name,
        type: customerData.type,
        email: customerData.email,
        phone: customerData.phone,
        secondaryEmails: customerData.secondaryEmails,
        secondaryPhones: customerData.secondaryPhones,
        companyName: intake.companyName,
        propertyType: intake.propertyType,
        projectType: intake.projectType,
        area: intake.area,
        city: intake.city,
        projectStage: intake.projectStage,
        startTimeline: intake.startTimeline,
        budgetComfort: intake.budgetComfort,
        projectScope: intake.projectScope,
        floorPlan: intake.floorPlan,
        messageNotes: intake.messageNotes,
        requirements: intake.requirements,
        notes: mergedNotes || undefined,
        uiIntake: intake,
      };

      // Call the backend API to create customer
      const response = await CustomerAPI.createCustomer(createPayload as any);

      console.log("Customer created successfully:", response);

      // Show success toast
      toast.success(`Customer "${customerData.name}" created successfully!`);

      // Close the modal
      setShowAddModal(false);

      // Refresh the customer list to show the new customer
      await fetchCustomers();
    } catch (error: any) {
      console.error("Error creating customer:", error);

      // Show error toast with specific error message
      const errorMessage = error?.message || "Failed to create customer";
      toast.error(errorMessage);

      // Don't close the modal on error so user can retry
      throw error;
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    if (isUpdatingCustomer) return; // Prevent concurrent updates

    setIsUpdatingCustomer(true);

    // Store previous state for rollback
    const previousCustomers = [...customers];

    // Optimistic update - update UI immediately
    setCustomers(
      customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)),
    );

    try {
      // Call backend API to persist changes
      const customerToUpdate: Partial<APICustomer> = {
        name: updatedCustomer.name?.trim(),
        type: updatedCustomer.type || undefined,
        status: (updatedCustomer.status || "active").toUpperCase(),
        email:
          updatedCustomer.email && updatedCustomer.email !== "No email"
            ? updatedCustomer.email.trim()
            : undefined,
        phone:
          updatedCustomer.phone && updatedCustomer.phone !== "No phone"
            ? updatedCustomer.phone.trim()
            : undefined,
        secondaryEmails: (updatedCustomer.secondaryEmails || [])
          .map((email) => email.trim())
          .filter(Boolean),
        secondaryPhones: (updatedCustomer.secondaryPhones || [])
          .map((phone) => phone.trim())
          .filter(Boolean),
      };

      await CustomerAPI.updateCustomer(
        String(updatedCustomer.id),
        customerToUpdate as any,
      );

      // Success! Show success message
      toast.success("Customer updated successfully!");
      // Modal will be closed by the caller
    } catch (error: any) {
      console.error("Failed to update customer:", error);

      // Rollback optimistic update on error
      setCustomers(previousCustomers);

      // Show error message
      const errorMessage = error?.message || "Failed to update customer";
      toast.error(errorMessage);

      // Re-throw error so modal knows to stay open
      throw error;
    } finally {
      setIsUpdatingCustomer(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerId || isDeletingCustomer) return;

    const customerToDelete = customers.find((c) => c.id === deleteCustomerId);
    if (!customerToDelete) return;

    setIsDeletingCustomer(true);

    try {
      // Call API to delete customer
      await CustomerAPI.deleteCustomer(String(deleteCustomerId));

      // Remove customer from local state on success
      setCustomers(customers.filter((c) => c.id !== deleteCustomerId));

      // Show success toast
      toast.success(
        `Customer "${customerToDelete.name}" deleted successfully!`,
      );

      // Close confirmation dialog
      setDeleteCustomerId(null);
    } catch (error: any) {
      console.error("Failed to delete customer:", error);

      // Show error toast with specific message
      const errorMessage = error?.message || "Failed to delete customer";
      toast.error(errorMessage);

      // Don't close dialog on error so user can retry or cancel
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;

  // Filter customers based on active filters
  const filteredCustomers = customers.filter((customer) => {
    // Type filter — case-insensitive comparison
    if (
      activeTypeFilter !== "all" &&
      (customer.type || "").toUpperCase() !== activeTypeFilter.toUpperCase()
    ) {
      return false;
    }

    // Status filter
    if (
      activeStatusFilter !== "all" &&
      customer.status !== activeStatusFilter
    ) {
      return false;
    }

    return true;
  });

  const getCustomerSortTime = (customer: Customer): number => {
    const sourceDate = customer.createdAt || customer.updatedAt;
    if (!sourceDate) return 0;
    const time = new Date(sourceDate).getTime();
    return Number.isFinite(time) ? time : 0;
  };

  const sortedFilteredCustomers = [...filteredCustomers].sort((a, b) => {
    const aTime = getCustomerSortTime(a);
    const bTime = getCustomerSortTime(b);

    if (aTime === bTime) {
      return a.name.localeCompare(b.name);
    }

    return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => fetchCustomers()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="rounded-xl" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalCustomers}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activeCustomers}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        {/* Type Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Customer Type
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTypeFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTypeFilter === "all"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setActiveTypeFilter("RESIDENTIAL")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTypeFilter === "RESIDENTIAL"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Briefcase className="w-4 h-4 inline-block mr-1" />
              Residential
            </button>
            <button
              onClick={() => setActiveTypeFilter("COMMERCIAL")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTypeFilter === "COMMERCIAL"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Briefcase className="w-4 h-4 inline-block mr-1" />
              Commercial
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveStatusFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeStatusFilter === "all"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setActiveStatusFilter("active")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeStatusFilter === "active"
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline-block mr-1" />
              Active
            </button>
            <button
              onClick={() => setActiveStatusFilter("inactive")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeStatusFilter === "inactive"
                  ? "bg-gray-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-1" />
              Inactive
            </button>
            <button
              onClick={() => setActiveStatusFilter("completed")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeStatusFilter === "completed"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 inline-block mr-1" />
              Completed
            </button>
            <button
              onClick={() => setActiveStatusFilter("churned")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeStatusFilter === "churned"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              <AlertCircle className="w-4 h-4 inline-block mr-1" />
              Churned
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(activeTypeFilter !== "all" || activeStatusFilter !== "all") && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-bold text-gray-900">
                  {filteredCustomers.length}
                </span>{" "}
                of {customers.length} customers
              </p>
              <button
                onClick={() => {
                  setActiveTypeFilter("all");
                  setActiveStatusFilter("all");
                }}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers by name..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Spinner size="xs" color="brand" />
            </div>
          )}
        </div>

        <select
          value={sortOrder}
          onChange={(e) =>
            setSortOrder(e.target.value as "latest" | "oldest")
          }
          className="md:w-64 px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          aria-label="Sort customers by creation date"
        >
          <option value="latest">Latest to Oldest</option>
          <option value="oldest">Oldest to Latest</option>
        </select>
      </div>

      {loading ? (
        <SectionLoader message="Loading customers..." />
      ) : sortedFilteredCustomers.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">No customers found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search"
                : activeTypeFilter !== "all" || activeStatusFilter !== "all"
                  ? "No customers match the selected filters"
                  : "Get started by adding your first customer"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFilteredCustomers.map((customer) => {
            const statusColor =
              statusColors[customer.status as keyof typeof statusColors] ||
              statusColors[customer.status?.toLowerCase() as keyof typeof statusColors] ||
              statusColors.inactive;
            return (
              <Card
                key={customer.id}
                className="p-5 rounded-xl hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => {
                  navigate(`/dashboard/customers/${customer.id}`);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                      {customer.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {customer.name}
                      </h3>
                      {customer.customerNumber && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Customer No: {customer.customerNumber}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {customer.location}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteCustomerId(customer.id.toString());
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusColor.bg} ${statusColor.text} mb-4`}
                >
                  <div className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
                  <span className="text-xs font-medium">{customer.status}</span>
                </div>

                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">
                      {customer.email || "No email"}
                    </span>
                  </div>
                  {(customer.secondaryEmails || []).length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">
                        Secondary: {(customer.secondaryEmails || []).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{customer.phone || "No phone"}</span>
                  </div>
                  {(customer.secondaryPhones || []).length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">
                        Secondary: {(customer.secondaryPhones || []).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Projects</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      {customer.projects}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Value</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      ₹{(customer.totalValue / 100000).toFixed(1)}L
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {customer.lastContact}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCustomer}
        customerTypes={customerTypes}
        isCreating={isCreatingCustomer}
      />

      {/* Delete Confirmation Modal */}
      {deleteCustomerId &&
        (() => {
          const customerToDelete = customers.find(
            (c) => c.id === deleteCustomerId,
          );
          if (!customerToDelete) return null;

          return ReactDOM.createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => !isDeletingCustomer && setDeleteCustomerId(null)}
              />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 via-red-50 to-orange-50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 ring-4 ring-red-100">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Delete Customer?
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  {!isDeletingCustomer && (
                    <button
                      onClick={() => setDeleteCustomerId(null)}
                      className="p-2.5 hover:bg-white/60 rounded-xl transition-all hover:scale-110 active:scale-95"
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 bg-gradient-to-b from-white to-gray-50">
                  <p className="text-gray-700 leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-gray-900">
                      {customerToDelete.name}
                    </span>
                    ? This will permanently remove the customer and all
                    associated data.
                  </p>
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ Warning: This action cannot be undone
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => setDeleteCustomerId(null)}
                    disabled={isDeletingCustomer}
                    className="px-6 py-3 text-gray-700 font-medium hover:bg-white rounded-2xl transition-all disabled:opacity-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCustomer}
                    disabled={isDeletingCustomer}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white font-semibold rounded-2xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100"
                  >
                    {isDeletingCustomer ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        <span>Delete Customer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          );
        })()}

      {/* View Customer Modal */}
      {selectedCustomer && (
        <ViewCustomerModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCustomer(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
          customer={selectedCustomer}
        />
      )}

      {/* Edit Customer Modal */}
      {selectedCustomer && (
        <EditCustomerModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          onSave={handleUpdateCustomer}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
};
