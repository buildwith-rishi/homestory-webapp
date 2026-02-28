import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  RotateCcw,
  Trash2,
  User,
  Tag,
  Loader2,
  Shield,
} from 'lucide-react';
import { Button, Card } from '../../components/ui';
import {
  getAllTeamMembers,
  updateTeamMember,
  deleteTeamMember,
  type TeamMember,
  type UpdateTeamMemberPayload,
} from '../../services/teamApi';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEMBER_TYPE_META: Record<string, { bg: string; text: string; dot: string; label: string; border: string }> = {
  EMPLOYEE:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Employee',   border: 'border-blue-200' },
  CONTRACTOR: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Contractor', border: 'border-orange-200' },
  FREELANCER: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Freelancer', border: 'border-purple-200' },
  VENDOR:     { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Vendor',     border: 'border-yellow-200' },
  INTERN:     { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Intern',     border: 'border-green-200' },
};

const ROLE_OPTIONS = [
  'Lead Carpenter', 'Carpenter', 'Electrician', 'Plumber', 'Painter',
  'Mason', 'Welder', 'HVAC Technician', 'Tile Setter', 'Flooring Specialist',
  'General Contractor', 'Site Manager', 'Project Manager', 'Designer', 'Other',
];

const MEMBER_TYPE_OPTIONS = [
  { value: 'EMPLOYEE',   label: 'Employee' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'FREELANCER', label: 'Freelancer' },
  { value: 'VENDOR',     label: 'Vendor' },
  { value: 'INTERN',     label: 'Intern' },
];

const DEPARTMENT_OPTIONS = [
  'Design', 'Execution', 'Sales', 'Management', 'Operations', 'Finance', 'HR', 'Other',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-b-0">
    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  </div>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
    <span className="w-4 h-px bg-gray-300" />
    {title}
    <span className="flex-1 h-px bg-gray-100" />
  </h2>
);

// ─── Page Component ──────────────────────────────────────────────────────────

export const EngineerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // The list page passes the full member object via state to avoid a broken GET /api/team/:id
  const stateData = (location.state as { member?: TeamMember } | null)?.member ?? null;

  const [member, setMember] = useState<TeamMember | null>(stateData);
  const [isLoading, setIsLoading] = useState(!stateData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<UpdateTeamMemberPayload>({});

  // Fallback: if no state data, fetch list and find member by id
  const loadFromList = useCallback(async () => {
    if (!id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const all = await getAllTeamMembers();
      const found = all.find(m => String(m.id) === id);
      if (found) {
        setMember(found);
      } else {
        toast.error('Team member not found.');
        navigate('/dashboard/engineers', { replace: true });
      }
    } catch {
      toast.error('Failed to load team member.');
      navigate('/dashboard/engineers', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!stateData) {
      loadFromList();
    }
  }, [stateData, loadFromList]);

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEditing = () => {
    if (!member) return;
    setEditForm({
      name:       member.name,
      email:      member.email,
      phone:      member.phone,
      role:       member.role,
      department: member.department,
      memberType: member.memberType,
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
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!window.confirm(`Remove ${member.name} from the team? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteTeamMember(member.id);
      toast.success(`${member.name} has been removed.`);
      navigate('/dashboard/engineers', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 text-sm">Loading team member…</p>
      </div>
    );
  }

  if (!member) return null;

  const typeStyle = MEMBER_TYPE_META[member.memberType] ?? {
    bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', label: member.memberType, border: 'border-gray-200',
  };
  const isActive = member.isActive !== false;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* ── Back / Header bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/dashboard/engineers')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Engineers & Team
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={cancelEditing}
                className="rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 shadow-none text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Remove
              </button>
              <Button
                onClick={startEditing}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-8 text-white">
        {/* decorative shapes */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute top-1/2 right-24 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold shadow-xl border border-white/30 shrink-0">
            {isEditing && editForm.name
              ? getInitials(editForm.name)
              : getInitials(member.name)}
          </div>

          {/* Name & Role */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                value={editForm.name ?? ''}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-white/20 border border-white/40 rounded-xl px-4 py-2 text-2xl font-bold text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 mb-2"
                placeholder="Full name"
              />
            ) : (
              <h1 className="text-3xl font-bold truncate">{member.name}</h1>
            )}
            {isEditing ? (
              <select
                value={editForm.role ?? ''}
                onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                className="bg-white/20 border border-white/40 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/60 mt-1"
              >
                <option value="" disabled className="text-gray-800">Select role</option>
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r} className="text-gray-800">{r}</option>
                ))}
              </select>
            ) : (
              <p className="text-orange-100 text-lg mt-1">{member.role}</p>
            )}

            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20 text-white border border-white/30' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                {isActive
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Active</>
                  : <><XCircle className="w-3.5 h-3.5" /> Inactive</>
                }
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30`}>
                <span className={`w-2 h-2 rounded-full ${typeStyle.dot}`} />
                {typeStyle.label}
              </span>
              {member.department && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                  <Building2 className="w-3.5 h-3.5" />
                  {member.department}
                </span>
              )}
            </div>
          </div>

          {/* Quick actions (view-only mode) */}
          {!isEditing && (
            <div className="flex flex-col gap-2 shrink-0">
              <a
                href={`tel:${member.phone}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-orange-600 font-medium text-sm hover:bg-orange-50 transition-colors shadow-md"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 border border-white/40 text-white font-medium text-sm hover:bg-white/30 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Content Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (spans 2) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Contact Information */}
          <Card className="rounded-2xl p-6">
            <SectionTitle title="Contact Information" />
            <div>
              {/* Phone */}
              <div className="flex items-start gap-4 py-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Phone Number</p>
                  {isEditing ? (
                    <input
                      value={editForm.phone ?? ''}
                      onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="+91 98765 43210"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{member.phone || '—'}</span>
                      {member.phone && (
                        <a href={`tel:${member.phone}`} className="text-xs text-orange-600 font-medium hover:underline">
                          Call now →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email Address</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email ?? ''}
                      onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="name@example.com"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 truncate">{member.email || '—'}</span>
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="text-xs text-blue-600 font-medium hover:underline shrink-0">
                          Send email →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Role & Department */}
          <Card className="rounded-2xl p-6">
            <SectionTitle title="Role & Department" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Job Role */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Job Role</span>
                </div>
                {isEditing ? (
                  <select
                    value={editForm.role ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="" disabled>Select role</option>
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{member.role || '—'}</p>
                )}
              </div>

              {/* Department */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</span>
                </div>
                {isEditing ? (
                  <select
                    value={editForm.department ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="" disabled>Select department</option>
                    {DEPARTMENT_OPTIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{member.department || '—'}</p>
                )}
              </div>

              {/* Member Type */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 sm:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employment Type</span>
                </div>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {MEMBER_TYPE_OPTIONS.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setEditForm(p => ({ ...p, memberType: t.value }))}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          editForm.memberType === t.value
                            ? `${MEMBER_TYPE_META[t.value]?.bg ?? 'bg-gray-100'} ${MEMBER_TYPE_META[t.value]?.text ?? 'text-gray-700'} ${MEMBER_TYPE_META[t.value]?.border ?? 'border-gray-200'} border`
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                    <span className={`w-2 h-2 rounded-full ${typeStyle.dot}`} />
                    {typeStyle.label}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right column ──────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Account Info */}
          <Card className="rounded-2xl p-6">
            <SectionTitle title="Account Info" />
            <div>
              <InfoRow
                icon={<Calendar className="w-4 h-4 text-gray-500" />}
                label="Joined"
                value={formatDate(member.createdAt)}
              />
              <InfoRow
                icon={<Clock className="w-4 h-4 text-gray-500" />}
                label="Last Updated"
                value={formatDate(member.updatedAt)}
              />
              <InfoRow
                icon={<Shield className="w-4 h-4 text-gray-500" />}
                label="Status"
                value={
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {isActive
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> Active</>
                      : <><XCircle className="w-3.5 h-3.5" /> Inactive</>
                    }
                  </span>
                }
              />
              <InfoRow
                icon={<User className="w-4 h-4 text-gray-500" />}
                label="Member ID"
                value={
                  <span className="text-xs font-mono text-gray-500 break-all">{member.id}</span>
                }
              />
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-2xl p-6">
            <SectionTitle title="Quick Actions" />
            <div className="space-y-2">
              <a
                href={`tel:${member.phone}`}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-orange-600" />
                </div>
                <span>Call {member.name.split(' ')[0]}</span>
              </a>
              <a
                href={`mailto:${member.email}`}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <span>Email {member.name.split(' ')[0]}</span>
              </a>
              {!isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium text-red-500 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    {isDeleting
                      ? <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      : <Trash2 className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <span>Remove from Team</span>
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
