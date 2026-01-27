import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  DollarSign,
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
} from "lucide-react";
import { Card, Button } from "../../components/ui";
import toast from "react-hot-toast";

interface FamilyMember {
  name: string;
  relationship: string;
  age?: string;
  occupation?: string;
}

interface ImportantDate {
  title: string;
  date: string;
  type: "birthday" | "anniversary" | "other";
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
  id: number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  location: string;
  projects: number;
  totalValue: number;
  status: "active" | "completed" | "inactive";
  rating: number;
  lastContact: string;
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
};

// Add Customer Modal Component
const AddCustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    customer: Omit<
      Customer,
      "id" | "initials" | "projects" | "totalValue" | "rating" | "lastContact"
    >,
  ) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    status: "active" as "active" | "completed" | "inactive",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone format";
    }
    if (!formData.location.trim()) newErrors.location = "Location is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      toast.success("Customer added successfully!");
      onClose();
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        location: "",
        status: "active",
      });
      setErrors({});
    } catch {
      toast.error("Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
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
          className="p-8 space-y-6 bg-gradient-to-b from-white to-gray-50"
        >
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Rajesh Sharma"
                className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 ${
                  errors.name
                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
              {errors.name && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="rajesh@example.com"
                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 ${
                  errors.email
                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
              {errors.email && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 ${
                  errors.phone
                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
              {errors.phone && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., HSR Layout, Bangalore"
                className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-400 ${
                  errors.location
                    ? "border-red-300 bg-red-50/50 focus:border-red-400"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
              {errors.location && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "active" | "completed" | "inactive",
                })
              }
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white hover:border-gray-300 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat pr-12"
            >
              <option value="active">✅ Active</option>
              <option value="completed">✔️ Completed</option>
              <option value="inactive">⏸️ Inactive</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 text-gray-700 font-medium hover:bg-white rounded-2xl transition-all disabled:opacity-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white font-semibold rounded-2xl hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adding...</span>
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
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
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
                {customer.totalValue}
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
                {customer.importantDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                      {date.type === "birthday" ? (
                        <Gift className="w-6 h-6 text-rose-500" />
                      ) : date.type === "anniversary" ? (
                        <Heart className="w-6 h-6 text-rose-500" />
                      ) : (
                        <Calendar className="w-6 h-6 text-rose-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {date.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(date.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
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
      await new Promise((resolve) => setTimeout(resolve, 800));
      onSave(formData);
      toast.success("Customer updated successfully!");
      onClose();
    } catch {
      toast.error("Failed to update customer");
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
        { title: "", date: "", type: "other" },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
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
                    }`}
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
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20"
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
                          | "inactive",
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="inactive">Inactive</option>
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
                    placeholder="e.g., Tech Corp"
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
                            placeholder="Member name"
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
                            placeholder="Age"
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
                            value={date.title}
                            onChange={(e) =>
                              updateImportantDate(
                                index,
                                "title",
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
                            value={date.type}
                            onChange={(e) =>
                              updateImportantDate(index, "type", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="birthday">Birthday</option>
                            <option value="anniversary">Anniversary</option>
                            <option value="other">Other</option>
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
                            placeholder="Referral name"
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
                            placeholder="+91 xxxxx xxxxx"
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
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddCustomer = async (
    customerData: Omit<
      Customer,
      "id" | "initials" | "projects" | "totalValue" | "rating" | "lastContact"
    >,
  ) => {
    // Generate initials from name
    const initials = customerData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Create new customer with default values
    const newCustomer: Customer = {
      id: customers.length + 1,
      ...customerData,
      initials,
      projects: 0,
      totalValue: 0,
      rating: 0,
      lastContact: "Just now",
    };

    setCustomers([...customers, newCustomer]);
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    setCustomers(
      customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)),
    );
    setSelectedCustomer(null);
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalValue, 0);
  const avgRating =
    customers.length > 0
      ? customers.reduce((sum, c) => sum + c.rating, 0) / customers.length
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer relationships
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
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
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{(totalRevenue / 10000000).toFixed(1)}Cr
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {avgRating.toFixed(1)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search customers..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const statusColor = statusColors[customer.status];
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
                    <p className="text-sm text-gray-600">{customer.location}</p>
                  </div>
                </div>
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
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
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

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${star <= Math.floor(customer.rating) ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-sm text-gray-600 ml-1">
                    {customer.rating}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {customer.lastContact}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCustomer}
      />

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
