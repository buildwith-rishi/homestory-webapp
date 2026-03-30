import React, { memo } from "react";
import { useInView } from "react-intersection-observer";
import {
  Phone,
  Mail,
  MoreVertical,
  Building2,
  Users,
  ArrowRight,
  Check,
  Trash2,
} from "lucide-react";
import { Lead } from "../../services/leadApi";
import { getSourceLabel } from "../../utils/leadHelpers";

interface LeadCardProps {
  lead: Lead;
  selectedLeadIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onNavigate: (path: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onOpenBdrDropdown: (leadId: string, e: React.MouseEvent) => void;
  registerBdrButtonRef: (leadId: string, el: HTMLButtonElement | null) => void;
}

function formatEnumValue(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const LeadCardSkeleton = () => (
   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-[320px] animate-pulse flex flex-col justify-between">
    <div>
        <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200"></div>
            <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="h-16 bg-gray-100 rounded-xl"></div>
            <div className="h-16 bg-gray-100 rounded-xl"></div>
        </div>
        <div className="h-24 bg-gray-100 rounded-xl mb-4"></div>
    </div>
    <div className="h-8 bg-gray-100 rounded mt-auto"></div>
  </div>
);

const LeadCardBase: React.FC<LeadCardProps> = ({
  lead,
  selectedLeadIds,
  onToggleSelection,
  onNavigate,
  onEdit,
  onDelete,
  onOpenBdrDropdown,
  registerBdrButtonRef,
}) => {
  const secondaryEmails = (lead.secondaryEmails || [])
    .map((email) => (email || "").trim())
    .filter(Boolean);
  const secondaryPhones = (lead.secondaryPhones || [])
    .map((phone) => (phone || "").trim())
    .filter(Boolean);

  return (
    <div
      className={`group h-full flex flex-col bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 cursor-pointer overflow-hidden relative ${
        lead.id && selectedLeadIds.has(lead.id)
          ? "border-orange-400 ring-2 ring-orange-200"
          : "border-gray-100"
      }`}
      onClick={() => onNavigate(`/dashboard/leads/${lead.id}`)}
    >
      {/* Checkbox */}
      <div
        className={`absolute top-3 left-3 z-10 transition-opacity ${
          selectedLeadIds.size > 0
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (lead.id) onToggleSelection(lead.id);
        }}
      >
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
            lead.id && selectedLeadIds.has(lead.id)
              ? "bg-orange-500 border-orange-500"
              : "border-gray-300 bg-white hover:border-orange-400"
          }`}
        >
          {lead.id && selectedLeadIds.has(lead.id) && (
            <Check className="w-3 h-3 text-white" />
          )}
        </div>
      </div>

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
      <div className="p-5 h-full flex flex-col">
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
              {lead.leadNumber && (
                <p className="text-xs text-gray-500 mt-0.5">{lead.leadNumber}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    (lead.status || "").toUpperCase() === "QUALIFIED"
                      ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                      : (lead.status || "").toUpperCase() === "CONTACTED" ||
                          (lead.status || "").toUpperCase() === "WORKING"
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                        : (lead.status || "").toUpperCase() === "PROPOSAL"
                          ? "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
                          : (lead.status || "").toUpperCase() === "NEGOTIATION"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                            : (lead.status || "").toUpperCase() === "WON"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                              : (lead.status || "").toUpperCase() === "LOST" ||
                                  (lead.status || "").toUpperCase() === "DISQUALIFIED" ||
                                  (lead.status || "").toUpperCase() === "UNQUALIFIED"
                                ? "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                : "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20"
                  }`}
                >
                  {formatEnumValue(lead.status || "New")}
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
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lead);
                }}
                className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-xl transition-colors"
                title="Delete Lead"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="Edit Lead"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
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
            {secondaryPhones.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                {secondaryPhones[0]}
                {secondaryPhones.length > 1
                  ? ` +${secondaryPhones.length - 1} more`
                  : ""}
              </p>
            )}
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
            {secondaryEmails.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                {secondaryEmails[0]}
                {secondaryEmails.length > 1
                  ? ` +${secondaryEmails.length - 1} more`
                  : ""}
              </p>
            )}
          </div>
        </div>

        {/* Property & Budget Info */}
        {(lead.projectCategory ||
          lead.projectType ||
          lead.propertyType ||
          lead.propertySubtype ||
          lead.propertyBHK ||
          lead.budgetTier ||
          lead.location) && (
          <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/50 rounded-xl p-3.5 mb-4 border border-orange-100/50">
            <div className="flex items-center gap-2 mb-2.5">
              <Building2 className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-semibold text-orange-900/80 uppercase tracking-wide">
                Project Interest
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(lead.projectCategory ||
                lead.projectType ||
                lead.propertyType ||
                lead.propertySubtype) && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Property</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatEnumValue(
                      lead.projectCategory ||
                        lead.projectType ||
                        lead.propertyType ||
                        lead.propertySubtype,
                    )}
                    {lead.propertyBHK && ` • ${lead.propertyBHK}`}
                  </p>
                </div>
              )}
              {lead.budgetTier && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {lead.budgetTier}
                  </p>
                </div>
              )}
              {lead.location && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-0.5">Location</p>
                  <p className="text-sm font-medium text-gray-700">
                    {lead.location}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Source Badge */}
            {lead.source && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600">
                  {getSourceLabel(lead.source)}
                </span>
              </div>
            )}
            {/* Assign BDR Button */}
            <button
              ref={(el) => {
                if (lead.id) registerBdrButtonRef(lead.id, el);
              }}
              onClick={(e) => {
                if (lead.id) onOpenBdrDropdown(lead.id, e);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                lead.assignedTo
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-blue-200"
                  : "bg-orange-50 text-orange-700 hover:bg-orange-100 ring-1 ring-orange-200"
              }`}
            >
              <Users className="w-3 h-3" />
              {lead.assignedTo ? lead.assignedTo.name : "Assign BDR"}
              <Users className="w-3 h-3" />
            </button>
          </div>
          {/* Date & Arrow */}
          <div className="flex items-center gap-2">
            {lead.createdAt && (
              <span className="text-xs text-gray-400">
                {new Date(lead.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
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
  );
};

const LeadCard = memo(LeadCardBase);

export const LazyLeadCard = (props: LeadCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  });

  return (
    <div ref={ref} className="h-full">
      {inView ? <LeadCard {...props} /> : <LeadCardSkeleton />}
    </div>
  );
};
