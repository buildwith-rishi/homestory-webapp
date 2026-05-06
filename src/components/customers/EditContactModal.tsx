import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  X,
  User,
  Phone,
  Mail,
  AlertCircle,
  Save,
  Calendar,
  Gift,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ContactAPI, {
  type Contact,
  type ContactRequest,
  type ContactRoleOption,
  type ChannelOption,
  DEFAULT_CONTACT_ROLES,
  DEFAULT_PREFERRED_CHANNELS,
} from "../../services/contactApi";
import Spinner from "../ui/Spinner";

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onContactUpdated: (contact: Contact) => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  onContactUpdated,
}) => {
  const [formData, setFormData] = useState<Omit<ContactRequest, "leadId">>({
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    email: contact.email || "",
    role: contact.role,
    isPrimary: contact.isPrimary,
    preferredChannel: contact.preferredChannel || "WHATSAPP",
    dateOfBirth: contact.dateOfBirth || "",
    anniversaryDate: contact.anniversaryDate || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<ContactRoleOption[]>(DEFAULT_CONTACT_ROLES);
  const [channels, setChannels] = useState<ChannelOption[]>(
    DEFAULT_PREFERRED_CHANNELS
  );

  // Update form data when contact prop changes
  useEffect(() => {
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      email: contact.email || "",
      role: contact.role,
      isPrimary: contact.isPrimary,
      preferredChannel: contact.preferredChannel || "WHATSAPP",
      dateOfBirth: contact.dateOfBirth || "",
      anniversaryDate: contact.anniversaryDate || "",
    });
  }, [contact]);

  // Fetch roles and channels from API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [rolesData, channelsData] = await Promise.all([
          ContactAPI.getContactRoles(),
          ContactAPI.getPreferredChannels(),
        ]);
        if (rolesData?.length) setRoles(rolesData);
        if (channelsData?.length) setChannels(channelsData);
      } catch {
        console.log("Using default roles and channels");
      }
    };

    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Invalid phone number format";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<ContactRequest> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        role: formData.role,
        isPrimary: formData.isPrimary,
        preferredChannel: formData.preferredChannel,
        dateOfBirth: formData.dateOfBirth || undefined,
        anniversaryDate: formData.anniversaryDate || undefined,
      };

      const updatedContact = await ContactAPI.updateContact(contact.id, updates);
      toast.success("Contact updated successfully!");
      onContactUpdated(updatedContact);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update contact";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-blue-100">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Contact</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {contact.firstName} {contact.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 hover:bg-white/60 rounded-xl transition-all hover:scale-110 active:scale-95"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-5 bg-gradient-to-b from-white to-gray-50 max-h-[60vh] overflow-y-auto"
        >
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="John"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                  errors.firstName
                    ? "border-red-300 bg-red-50/50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
              {errors.firstName && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.firstName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Doe"
                className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                  errors.lastName
                    ? "border-red-300 bg-red-50/50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
              {errors.lastName && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.lastName}</span>
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
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                  errors.phone
                    ? "border-red-300 bg-red-50/50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
            </div>
            {errors.phone && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.phone}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email
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
                placeholder="john@example.com"
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 ${
                  errors.email
                    ? "border-red-300 bg-red-50/50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Role and Channel Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as ContactRequest["role"],
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:border-gray-300 transition-all cursor-pointer"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Preferred Channel
              </label>
              <select
                value={formData.preferredChannel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferredChannel: e.target
                      .value as ContactRequest["preferredChannel"],
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:border-gray-300 transition-all cursor-pointer"
              >
                {channels.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <Gift className="w-4 h-4 inline mr-1" />
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                Anniversary Date
              </label>
              <input
                type="date"
                value={formData.anniversaryDate}
                onChange={(e) =>
                  setFormData({ ...formData, anniversaryDate: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
              />
            </div>
          </div>

          {/* Primary Contact Toggle */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <label className="flex items-center gap-3 cursor-pointer w-full">
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) =>
                  setFormData({ ...formData, isPrimary: e.target.checked })
                }
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-semibold text-gray-900">
                  Set as Primary Contact
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Primary contacts are shown first and used for main
                  communication
                </p>
              </div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-3 text-gray-700 font-medium hover:bg-white rounded-2xl transition-all disabled:opacity-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white font-semibold rounded-2xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100"
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
    document.body
  );
};

export default EditContactModal;
