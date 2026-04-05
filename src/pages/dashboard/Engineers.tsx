import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Briefcase,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import { AddEngineerModal } from "../../components/dashboard/AddEngineerModal";
import {
  getAllTeamMembers,
  deleteTeamMember,
  type TeamMember,
} from "../../services/teamApi";
import toast from "react-hot-toast";

interface Engineer {
  id: string;
  name: string;
  role: string;
  initials: string;
  phone: string;
  email: string;
  department: string;
  memberType: string;
}

/** Converts any role string to consistent Title Case display name.
 * e.g. "DESIGN_HEAD" → "Design Head", "Project Manager" → "Project Manager" */
function formatRoleName(role: string): string {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const EXCLUDED_VENDOR_ROLE_FILTERS = new Set([
  "Project Manager",
  "Lead Project Manager",
]);

function toEngineer(m: TeamMember): Engineer {
  return {
    id: String(m.id),
    name: m.name,
    role: m.role,
    initials: m.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    phone: m.phone,
    email: m.email,
    department: m.department,
    memberType: m.memberType,
  };
}

export const EngineersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rawMembers, setRawMembers] = useState<TeamMember[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const members = await getAllTeamMembers();
      setRawMembers(members);
      setEngineers(members.map(toEngineer));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load team members.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Normalize role names before deduplication so "PROJECT_MANAGER" and "Project Manager" merge into one.
  const uniqueRoles = [
    "all",
    ...Array.from(new Set(engineers.map((e) => formatRoleName(e.role))))
      .filter((role) => role !== "Site Manager")
      .filter((role) => !EXCLUDED_VENDOR_ROLE_FILTERS.has(role))
      .sort(),
  ];

  const filteredEngineers = engineers.filter((engineer) => {
    const matchesSearch =
      (engineer.name?.toLowerCase() ?? "").includes(
        searchQuery.toLowerCase(),
      ) ||
      (engineer.role?.toLowerCase() ?? "").includes(
        searchQuery.toLowerCase(),
      ) ||
      (engineer.department?.toLowerCase() ?? "").includes(
        searchQuery.toLowerCase(),
      );
    const matchesRole =
      filterRole === "all" || formatRoleName(engineer.role) === filterRole;
    return matchesSearch && matchesRole;
  });

  const openProfile = (engineer: Engineer) => {
    const raw = rawMembers.find((m) => String(m.id) === engineer.id);
    navigate(`/dashboard/engineers/${engineer.id}`, { state: { member: raw } });
  };

  const handleDeleteEngineer = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the team?`)) return;
    setDeletingId(id);
    try {
      await deleteTeamMember(id);
      toast.success(`${name} has been removed.`);
      setRawMembers((prev) => prev.filter((m) => String(m.id) !== id));
      setEngineers((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove team member.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">
            Manage your vendor team and assignments
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-xl">
          <Plus className="w-4 h-4" />
          Add Team Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {engineers.length}
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
              <p className="text-sm text-gray-600">Roles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Set(engineers.map((e) => e.role)).size}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, role or department..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
            />
          </div>
        </div>

        {/* Role filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
            Role:
          </span>
          {uniqueRoles.map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterRole === role
                  ? "bg-blue-600 text-white border border-blue-600"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              {role === "all" ? "All Roles" : role}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-gray-600 text-sm">Loading team members...</p>
        </div>
      ) : (
        <>
          {/* Engineers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEngineers.map((engineer) => {
              return (
                <Card
                  key={engineer.id}
                  className="p-5 rounded-xl hover:shadow-lg transition-all group cursor-pointer"
                  onClick={() => openProfile(engineer)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-lg font-bold">
                        {engineer.initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors flex items-center gap-1">
                          {engineer.name}
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatRoleName(engineer.role)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEngineer(engineer.id, engineer.name);
                      }}
                      disabled={deletingId === engineer.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      {deletingId === engineer.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Department badge */}
                  {engineer.department && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="text-xs bg-gray-100 text-gray-700 rounded-lg">
                        {engineer.department}
                      </Badge>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <a
                      href={`tel:${engineer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                    <a
                      href={`mailto:${engineer.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openProfile(engineer);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredEngineers.length === 0 && (
            <Card className="p-12 rounded-xl text-center">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {engineers.length === 0
                  ? "No team members yet"
                  : "No members found"}
              </h3>
              <p className="text-gray-600 mb-4">
                {engineers.length === 0
                  ? "Add your first team member to get started"
                  : "Try adjusting your filters"}
              </p>
              {engineers.length === 0 && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Team Member
                </Button>
              )}
            </Card>
          )}
        </>
      )}

      {/* Add Team Member Modal */}
      <AddEngineerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={fetchTeamMembers}
      />
    </div>
  );
};
