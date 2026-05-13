import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit3,
  Save,
  RotateCcw,
  Trash2,
  User,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "../ui";
import {
  updateTeamMember,
  deleteTeamMember,
  type TeamMember,
  type UpdateTeamMemberPayload,
} from "../../services/teamApi";
import toast from "react-hot-toast";
import { VendorKycFileField } from "./VendorKycFileField";
import { VendorKycDocLink } from "./VendorKycDocLink";
import type { VendorKycSlot } from "../../services/vendorKycAttachments";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onUpdated: (updated: TeamMember) => void;
  onDeleted: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  "Lead Carpenter",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Painter",
  "Mason",
  "Welder",
  "HVAC Technician",
  "Tile Setter",
  "Flooring Specialist",
  "General Contractor",
  "Site Manager",
  "Project Manager",
  "Designer",
  "Other",
];

const DEPARTMENT_OPTIONS = [
  "Design",
  "Execution",
  "Sales",
  "Management",
  "Operations",
  "Finance",
  "HR",
  "Other",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TeamMemberProfileDrawer: React.FC<Props> = ({
  isOpen,
  member: memberProp,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  // Local copy so edits/saves can update the displayed data without a re-fetch
  const [member, setMember] = useState<TeamMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<UpdateTeamMemberPayload>({});

  // Sync local state when the prop changes (new member selected)
  useEffect(() => {
    if (isOpen && memberProp) {
      setMember(memberProp);
      setIsEditing(false);
      setEditForm({});
    }
  }, [isOpen, memberProp]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const startEditing = () => {
    if (!member) return;
    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      department: member.department,
      memberType: member.memberType,
      isActive: member.isActive !== false,
      aadhaarUrl: member.aadhaarUrl ?? "",
      panUrl: member.panUrl ?? "",
      gstCertificateUrl: member.gstCertificateUrl ?? "",
      msmeCertificateUrl: member.msmeCertificateUrl ?? "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!member) return;
    setIsSaving(true);
    try {
      const updated = await updateTeamMember(member.id, editForm);
      setMember(updated);
      setIsEditing(false);
      setEditForm({});
      toast.success("Profile updated successfully");
      onUpdated(updated);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!window.confirm(`Remove ${member.name} from the team?`)) return;
    setIsDeleting(true);
    try {
      await deleteTeamMember(member.id);
      toast.success(`${member.name} has been removed.`);
      onDeleted(member.id);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-[440px] z-[9001] flex flex-col bg-white shadow-2xl"
          >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Team Member Profile
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Content ────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {member ? (
                <div className="p-6 space-y-6">
                  {/* ── Hero Card ───────────────────────────────────────── */}
                  <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white relative overflow-hidden">
                    {/* decorative circles */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

                    <div className="relative flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg">
                        {isEditing && editForm.name
                          ? editForm.name
                              .split(" ")
                              .map((n) => n[0] ?? "")
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : initials(member.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            value={editForm.name ?? ""}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 text-white placeholder-white/60 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-white/60 mb-1"
                            placeholder="Full name"
                          />
                        ) : (
                          <h2 className="text-xl font-bold truncate">
                            {member.name}
                          </h2>
                        )}
                        {isEditing ? (
                          <select
                            value={editForm.role ?? ""}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                role: e.target.value,
                              }))
                            }
                            className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                          >
                            <option value="" disabled className="text-gray-800">
                              Select role
                            </option>
                            {ROLE_OPTIONS.map((r) => (
                              <option
                                key={r}
                                value={r}
                                className="text-gray-800"
                              >
                                {r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-orange-100 text-sm mt-0.5">
                            {member.role}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status pill */}
                    <div className="relative mt-4 flex items-center gap-2">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((p) => ({
                              ...p,
                              isActive: !(
                                p.isActive ?? member.isActive !== false
                              ),
                            }))
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
                            (editForm.isActive ?? member.isActive !== false)
                              ? "bg-white/20 text-white border-white/30 hover:bg-white/30"
                              : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                          }`}
                        >
                          {(editForm.isActive ?? member.isActive !== false) ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${member.isActive === false ? "bg-red-100 text-red-700" : "bg-white/20 text-white"}`}
                        >
                          {member.isActive === false ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Contact Info ────────────────────────────────────── */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      {/* Phone */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                          {isEditing ? (
                            <input
                              value={editForm.phone ?? ""}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  phone: e.target.value,
                                }))
                              }
                              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                              placeholder="+91 98765 43210"
                            />
                          ) : (
                            <a
                              href={`tel:${member.phone}`}
                              className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors"
                            >
                              {member.phone || "—"}
                            </a>
                          )}
                        </div>
                        {!isEditing && member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="text-xs text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Call
                          </a>
                        )}
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Email</p>
                          {isEditing ? (
                            <input
                              type="email"
                              value={editForm.email ?? ""}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  email: e.target.value,
                                }))
                              }
                              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              placeholder="name@example.com"
                            />
                          ) : (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-sm font-medium text-gray-900 truncate block group-hover:text-blue-600 transition-colors"
                            >
                              {member.email || "—"}
                            </a>
                          )}
                        </div>
                        {!isEditing && member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── Role & Department ───────────────────────────────── */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Role & Department
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Department */}
                      <div className="p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Department
                          </span>
                        </div>
                        {isEditing ? (
                          <select
                            value={editForm.department ?? ""}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                department: e.target.value,
                              }))
                            }
                            className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          >
                            <option value="" disabled>
                              Select
                            </option>
                            {DEPARTMENT_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900">
                            {member.department || "—"}
                          </p>
                        )}
                      </div>

                      {/* Full Role (read-only in view, editable in edit) */}
                      <div className="col-span-2 p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Job Role
                          </span>
                        </div>
                        {isEditing ? (
                          <select
                            value={editForm.role ?? ""}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                role: e.target.value,
                              }))
                            }
                            className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          >
                            <option value="" disabled>
                              Select role
                            </option>
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900">
                            {member.role || "—"}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── KYC / Compliance Documents ──────────────────────── */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      KYC &amp; Compliance Documents
                    </h3>
                    <div className="space-y-3">
                      {([
                        {
                          key: "aadhaarUrl" as const,
                          label: "Aadhaar",
                          slot: "aadhaar" satisfies VendorKycSlot,
                        },
                        {
                          key: "panUrl" as const,
                          label: "PAN",
                          slot: "pan" satisfies VendorKycSlot,
                        },
                        {
                          key: "gstCertificateUrl" as const,
                          label: "GST Certificate",
                          slot: "gst" satisfies VendorKycSlot,
                        },
                        {
                          key: "msmeCertificateUrl" as const,
                          label: "MSME Certificate",
                          slot: "msme" satisfies VendorKycSlot,
                        },
                      ]).map(({ key, label, slot }) => (
                        <div
                          key={key}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                        >
                          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <VendorKycFileField
                                label={label}
                                kycSlot={slot}
                                teamMemberId={member.id}
                                linkedUserId={member.userId}
                                value={(editForm[key] as string) ?? ""}
                                onChange={(next) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    [key]: next || null,
                                  }))
                                }
                              />
                            ) : (
                              <>
                                <p className="text-xs text-gray-500 mb-0.5">
                                  {label}
                                </p>
                                {member[key] ? (
                                  <VendorKycDocLink stored={member[key]!} />
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    Not provided
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* ── Account Timestamps ──────────────────────────────── */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Account Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Joined</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(member.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Last Updated</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(member.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2 text-gray-500">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Member ID</span>
                        </div>
                        <span className="text-xs font-mono text-gray-500 truncate max-w-[160px]">
                          {member.id}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* ── Quick Actions ───────────────────────────────────── */}
                  {!isEditing && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={`tel:${member.phone}`}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          Call Now
                        </a>
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Mail className="w-4 h-4" />
                          Send Email
                        </a>
                      </div>
                    </section>
                  )}
                </div>
              ) : null}
            </div>

            {/* ── Footer Actions ──────────────────────────────────────────── */}
            {member && (
              <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
                {isEditing ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={cancelEditing}
                      className="flex-1 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 shadow-none"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Remove
                    </button>
                    <Button
                      onClick={startEditing}
                      className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(drawerContent, document.body);
};
