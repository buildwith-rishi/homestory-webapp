import React from "react";
import { Phone, Mail, Edit2, Trash2, Calendar, Gift } from "lucide-react";
import type { Contact } from "../../services/contactApi";
import { ContactRoleBadge, ChannelBadge, PrimaryBadge } from "./ContactRoleBadge";

interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  isEditable?: boolean;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  isEditable = false,
}) => {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase();

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {initials || "?"}
          </div>
          {/* Name and Role */}
          <div>
            <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
              {fullName || "Unknown"}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <ContactRoleBadge role={contact.role} />
              {contact.isPrimary && <PrimaryBadge />}
            </div>
          </div>
        </div>

        {/* Actions */}
        {isEditable && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(contact);
                }}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Edit contact"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(contact.id);
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{contact.phone}</span>
        </div>
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
      </div>

      {/* Footer with channel and dates */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {contact.preferredChannel && (
            <ChannelBadge channel={contact.preferredChannel} />
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {contact.dateOfBirth && (
            <div className="flex items-center gap-1" title="Birthday">
              <Gift className="w-3.5 h-3.5" />
              <span>{formatDate(contact.dateOfBirth)}</span>
            </div>
          )}
          {contact.anniversaryDate && (
            <div className="flex items-center gap-1" title="Anniversary">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(contact.anniversaryDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactCard;
