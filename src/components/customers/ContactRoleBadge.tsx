import React from "react";
import type { ContactRole, PreferredChannel } from "../../services/contactApi";

interface ContactRoleBadgeProps {
  role: ContactRole;
  className?: string;
}

const roleStyles: Record<
  ContactRole,
  { bg: string; text: string; label: string }
> = {
  HOMEOWNER: { bg: "bg-purple-100", text: "text-purple-700", label: "Homeowner" },
  SPOUSE: { bg: "bg-pink-100", text: "text-pink-700", label: "Spouse" },
  FAMILY_MEMBER: { bg: "bg-blue-100", text: "text-blue-700", label: "Family" },
  TENANT: { bg: "bg-teal-100", text: "text-teal-700", label: "Tenant" },
  ARCHITECT: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Architect" },
  PROJECT_MANAGER: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    label: "Project Manager",
  },
  CONTRACTOR: { bg: "bg-amber-100", text: "text-amber-700", label: "Contractor" },
  OTHER: { bg: "bg-gray-100", text: "text-gray-700", label: "Other" },
};

export const ContactRoleBadge: React.FC<ContactRoleBadgeProps> = ({
  role,
  className = "",
}) => {
  const style = roleStyles[role] || roleStyles.OTHER;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${style.bg} ${style.text} ${className}`}
    >
      {style.label}
    </span>
  );
};

interface ChannelBadgeProps {
  channel: PreferredChannel;
  className?: string;
}

const channelStyles: Record<
  PreferredChannel,
  { bg: string; text: string; label: string; icon: string }
> = {
  WHATSAPP: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "WhatsApp",
    icon: "💬",
  },
  PHONE: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Phone",
    icon: "📞",
  },
  EMAIL: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    label: "Email",
    icon: "✉️",
  },
  SMS: {
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    label: "SMS",
    icon: "📱",
  },
  IN_PERSON: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    label: "In Person",
    icon: "🤝",
  },
};

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({
  channel,
  className = "",
}) => {
  const style = channelStyles[channel] || channelStyles.PHONE;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${style.bg} ${style.text} ${className}`}
    >
      <span>{style.icon}</span>
      {style.label}
    </span>
  );
};

interface PrimaryBadgeProps {
  className?: string;
}

export const PrimaryBadge: React.FC<PrimaryBadgeProps> = ({ className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 ${className}`}
    >
      <span>⭐</span>
      Primary
    </span>
  );
};
