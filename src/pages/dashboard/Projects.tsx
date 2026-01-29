import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Search,
  Grid3X3,
  List,
  LayoutGrid,
} from "lucide-react";
import { Card, Button, Badge, Progress } from "../../components/ui";
import { NewProjectModal } from "../../components/dashboard/NewProjectModal";
import { useProjectFilter } from "../../contexts/ProjectFilterContext";

interface ProjectFormData {
  name: string;
  client: string;
  location: string;
  budget: string;
  startDate: string;
  dueDate: string;
  stage: string;
  description: string;
  team: string[];
}

interface Project {
  id: string;
  name: string;
  client: string;
  stage: string;
  status: "on_track" | "at_risk" | "delayed";
  progress: number;
  dueDate: string;
  budget: string;
  team: string[];
  location?: string;
  description?: string;
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Modern 3BHK",
    client: "Sharma Family",
    stage: "Design",
    status: "on_track",
    progress: 65,
    dueDate: "Feb 15, 2026",
    budget: "₹28L",
    team: ["AR", "PK"],
  },
  {
    id: "2",
    name: "Luxury Villa",
    client: "Kumar Residence",
    stage: "Execution",
    status: "at_risk",
    progress: 40,
    dueDate: "Mar 1, 2026",
    budget: "₹55L",
    team: ["RS", "MG"],
  },
  {
    id: "3",
    name: "Contemporary 2BHK",
    client: "Patel Home",
    stage: "Material",
    status: "on_track",
    progress: 75,
    dueDate: "Jan 30, 2026",
    budget: "₹18L",
    team: ["AR"],
  },
  {
    id: "4",
    name: "Office Interior",
    client: "TechStart Inc",
    stage: "Requirements",
    status: "on_track",
    progress: 25,
    dueDate: "Feb 5, 2026",
    budget: "₹45L",
    team: ["PK", "MG"],
  },
  {
    id: "5",
    name: "Penthouse Makeover",
    client: "Gupta Family",
    stage: "Handover",
    status: "on_track",
    progress: 92,
    dueDate: "Jan 22, 2026",
    budget: "₹38L",
    team: ["AR", "RS"],
  },
];

const stageColors: Record<string, string> = {
  Requirements: "bg-gray-100 text-gray-700",
  Design: "bg-blue-100 text-blue-700",
  Material: "bg-purple-100 text-purple-700",
  Execution: "bg-orange-100 text-orange-700",
  Handover: "bg-emerald-100 text-emerald-700",
};

const statusColors = {
  on_track: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  at_risk: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  delayed: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const { selectedProject } = useProjectFilter();

  // Apply both project filter and search filter
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by selected project from navbar
    if (selectedProject) {
      filtered = filtered.filter((p) => p.id === selectedProject.id);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.client.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  }, [projects, selectedProject, searchQuery]);

  const handleCreateProject = (formData: ProjectFormData) => {
    const newProject: Project = {
      id: String(projects.length + 1),
      name: formData.name,
      client: formData.client,
      stage: formData.stage,
      status: "on_track",
      progress: 0,
      dueDate: new Date(formData.dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      budget: formData.budget,
      team: formData.team,
      location: formData.location,
      description: formData.description,
    };

    setProjects((prev) => [...prev, newProject]);
    setIsModalOpen(false);
  };

  const handleViewDetails = (project: Project) => {
    navigate(`/dashboard/projects/${project.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filter Indicator */}
      {selectedProject && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {selectedProject.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-orange-900">
                Viewing Filtered Projects
              </p>
              <p className="text-xs text-orange-700">
                {selectedProject.name} - {selectedProject.client}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage all interior design projects
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => navigate("/dashboard/projects/kanban")}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban View
          </Button>
          <div className="flex gap-1 bg-white border border-gray-300 rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-colors ${
                view === "grid"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-2 rounded-lg transition-colors ${
                view === "table"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button className="rounded-xl" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {projects.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {projects.filter((p) => p.stage !== "Handover").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹1.01Cr</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Array.from(new Set(projects.flatMap((p) => p.team))).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {view === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const statusColor = statusColors[project.status];
            return (
              <Card
                key={project.id}
                className="p-5 rounded-xl hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {project.client}
                    </p>
                  </div>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    className={`text-xs rounded-lg ${stageColors[project.stage]}`}
                  >
                    {project.stage}
                  </Badge>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs ${statusColor.bg} ${statusColor.text}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}
                    />
                    {project.status.replace("_", " ")}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due Date
                    </span>
                    <span className="font-medium">{project.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Budget
                    </span>
                    <span className="font-medium text-emerald-600">
                      {project.budget}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex -space-x-2">
                    {project.team.map((member, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                      >
                        {member}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => handleViewDetails(project)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProjects.map((project, index) => {
                  const statusColor = statusColors[project.status];
                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-gradient-to-r hover:from-orange-50/40 hover:to-transparent transition-all group cursor-pointer ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      }`}
                      onClick={() => handleViewDetails(project)}
                    >
                      {/* Project Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                            {project.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </div>
                          <p className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                            {project.name}
                          </p>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 font-medium">
                          {project.client}
                        </p>
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Badge
                            className={`text-xs px-2.5 py-1 rounded-md font-semibold ${stageColors[project.stage]}`}
                          >
                            {project.stage}
                          </Badge>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20">
                            <Progress
                              value={project.progress}
                              className="h-2"
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-900 min-w-[35px]">
                            {project.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}
                            />
                            <span className="capitalize">
                              {project.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap">
                            {project.dueDate}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                            {project.budget}
                          </span>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <div className="flex -space-x-1.5">
                            {project.team.slice(0, 3).map((member, idx) => (
                              <div
                                key={idx}
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
                                title={member}
                              >
                                {member}
                              </div>
                            ))}
                            {project.team.length > 3 && (
                              <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-semibold border-2 border-white shadow-sm">
                                +{project.team.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg hover:bg-orange-50 hover:text-orange-600 text-xs px-3 py-1.5 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(project);
                            }}
                          >
                            View
                          </Button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};
