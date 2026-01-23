import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
  CreditCard,
  Package,
  MessageSquare,
  Download,
  Edit3,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, Progress, Badge, Card } from "../../components/ui";

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

// Mock data - in production, this would come from API or state management
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
    location: "HSR Layout, Bangalore",
    description: "Modern interior design for a 3BHK apartment",
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
    location: "Whitefield, Bangalore",
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
    location: "Indiranagar, Bangalore",
  },
];

// Mock detailed data
const getProjectDetails = (project: Project) => {
  return {
    ...project,
    clientPhone: "+91 98765 43210",
    clientEmail: "sharma.family@example.com",
    startDate: "2025-12-01",
    projectType: "Residential",
    squareFeet: "1200",
    floors: "2",
    rooms: "3 BHK",
    priority: "High",

    payments: [
      {
        id: 1,
        milestone: "Initial Deposit",
        amount: "₹8L",
        status: "paid",
        date: "2025-12-01",
      },
      {
        id: 2,
        milestone: "Design Phase",
        amount: "₹7L",
        status: "paid",
        date: "2025-12-15",
      },
      {
        id: 3,
        milestone: "Material Purchase",
        amount: "₹8L",
        status: "pending",
        date: "2026-02-01",
      },
      {
        id: 4,
        milestone: "Execution Phase",
        amount: "₹5L",
        status: "upcoming",
        date: "2026-03-01",
      },
    ],
    totalPaid: "₹15L",
    totalPending: "₹13L",

    milestones: [
      {
        id: 1,
        title: "Initial Consultation",
        status: "completed",
        date: "2025-12-01",
      },
      {
        id: 2,
        title: "Site Measurement",
        status: "completed",
        date: "2025-12-05",
      },
      {
        id: 3,
        title: "Concept Development",
        status: "completed",
        date: "2025-12-15",
      },
      {
        id: 4,
        title: "3D Visualization",
        status: "in_progress",
        date: "2026-01-20",
      },
      {
        id: 5,
        title: "Final Design Approval",
        status: "pending",
        date: "2026-02-01",
      },
    ],

    documents: [
      {
        id: 1,
        name: "Floor Plan.pdf",
        type: "PDF",
        size: "2.4 MB",
        uploadedBy: "AR",
      },
      {
        id: 2,
        name: "3D Renders.zip",
        type: "ZIP",
        size: "45 MB",
        uploadedBy: "PK",
      },
      {
        id: 3,
        name: "Contract.pdf",
        type: "PDF",
        size: "1.2 MB",
        uploadedBy: "RS",
      },
    ],

    activities: [
      {
        id: 1,
        user: "AR",
        action: "Updated project progress to 65%",
        time: "2 hours ago",
      },
      { id: 2, user: "PK", action: "Uploaded 3D renders", time: "1 day ago" },
      {
        id: 3,
        user: "RS",
        action: "Added payment milestone",
        time: "2 days ago",
      },
    ],

    teamDetails: [
      {
        id: "AR",
        name: "Arjun Reddy",
        role: "Lead Designer",
        phone: "+91 98765 11111",
      },
      {
        id: "PK",
        name: "Priya Kumar",
        role: "3D Visualizer",
        phone: "+91 98765 22222",
      },
    ],
  };
};

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "milestones" | "documents" | "activity"
  >("overview");

  // Find project by ID
  const project = mockProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The project you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/dashboard/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const details = getProjectDetails(project);

  const statusColors = {
    on_track: "bg-green-100 text-green-700 border-green-200",
    at_risk: "bg-yellow-100 text-yellow-700 border-yellow-200",
    delayed: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-white to-orange-50/20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-orange-100/60 via-orange-50/80 to-amber-50/60 border-b border-orange-200/60 px-6 py-6 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto relative z-10">
          <button
            onClick={() => navigate("/dashboard/projects")}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back to Projects</span>
          </button>

          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-orange-600 bg-clip-text text-transparent">
                  {project.name}
                </h1>
                <Badge
                  className={`${statusColors[project.status]} border text-sm px-3 py-1 font-semibold backdrop-blur-sm`}
                >
                  {project.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-gray-600 text-lg font-medium">
                {project.client}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 shadow-md hover:shadow-lg transition-all"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="secondary"
                className="bg-white hover:bg-red-50 border-2 border-red-400 hover:border-red-500 text-red-600 hover:text-red-700 shadow-md hover:shadow-lg transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-xl rounded-2xl p-5 border border-orange-100/50 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  PROGRESS
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress
                      value={project.progress}
                      className="h-2.5 bg-gradient-to-r from-gray-100 to-orange-50"
                    />
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    {project.progress}%
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-xl rounded-2xl p-5 border border-orange-100/50 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  BUDGET
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {project.budget}
                </p>
              </div>
            </div>

            <div className="relative group overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-xl rounded-2xl p-5 border border-orange-100/50 shadow-sm hover:shadow-lg transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  DUE DATE
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {project.dueDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visible background pattern */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-300/40 to-amber-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200/40 to-amber-100/20 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: "overview", label: "Overview", icon: FileText },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "milestones", label: "Milestones", icon: CheckCircle2 },
              { id: "documents", label: "Documents", icon: Package },
              { id: "activity", label: "Activity", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "overview"
                      | "payments"
                      | "milestones"
                      | "documents"
                      | "activity",
                  )
                }
                className={`relative flex items-center gap-2 py-4 transition-all group ${
                  activeTab === tab.id
                    ? "text-orange-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Information */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Project Information
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-orange-50/20 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
                      Stage
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {project.stage}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-orange-50/20 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
                      Priority
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {details.priority}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-orange-50/20 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
                      Start Date
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {new Date(details.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-orange-50/20 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
                      Square Feet
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {details.squareFeet} sq.ft
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-orange-50/20 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
                      Floors
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {details.floors}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-orange-50/20 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
                      Rooms
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {details.rooms}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Client Information */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Client
                </h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-xl font-bold text-white">
                      {project.client
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900">
                      {project.client}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {details.clientEmail}
                    </p>
                    <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-lg w-fit border border-gray-100">
                      <Phone className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {details.clientPhone}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Team */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Team
                </h2>
                <div className="space-y-3">
                  {details.teamDetails.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 via-white to-orange-50/20 rounded-xl border border-gray-100 hover:shadow-md transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md">
                        {member.id}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      <a
                        href={`tel:${member.phone}`}
                        className="w-10 h-10 rounded-lg bg-white border border-orange-200 flex items-center justify-center text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Quick Info */}
            <div className="space-y-6">
              {/* Location */}
              {project.location && (
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>
                    Location
                  </h3>
                  <p className="text-sm text-gray-700 font-medium pl-9">
                    {project.location}
                  </p>
                </Card>
              )}

              {/* Description */}
              {project.description && (
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">
                    Description
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {project.description}
                  </p>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="p-6 bg-gradient-to-br from-white via-orange-50/20 to-white backdrop-blur-sm border-orange-100/50 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-start bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 transition-all shadow-sm"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 transition-all shadow-sm"
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 transition-all shadow-sm"
                    size="sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
                <p className="text-sm text-gray-600 mb-2 font-semibold">
                  Total Budget
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {project.budget}
                </p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50/50 backdrop-blur-sm border-green-200/50 shadow-sm hover:shadow-md transition-all">
                <p className="text-sm text-green-700 mb-2 font-semibold">
                  Total Paid
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {details.totalPaid}
                </p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50/50 backdrop-blur-sm border-orange-200/50 shadow-sm hover:shadow-md transition-all">
                <p className="text-sm text-orange-700 mb-2 font-semibold">
                  Pending
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {details.totalPending}
                </p>
              </Card>
            </div>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                Payment Milestones
              </h2>
              <div className="space-y-3">
                {details.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                          payment.status === "paid"
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                            : payment.status === "pending"
                              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                              : "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                        }`}
                      >
                        {payment.status === "paid" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {payment.milestone}
                        </p>
                        <p className="text-sm text-gray-600">{payment.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {payment.amount}
                      </p>
                      <Badge
                        className={`${
                          payment.status === "paid"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : payment.status === "pending"
                              ? "bg-orange-100 text-orange-700 border-orange-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                        } text-xs font-semibold`}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === "milestones" && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              Project Milestones
            </h2>
            <div className="space-y-4">
              {details.milestones.map((milestone, index) => (
                <div key={milestone.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                        milestone.status === "completed"
                          ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                          : milestone.status === "in_progress"
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                            : "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                      }`}
                    >
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : milestone.status === "in_progress" ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    {index < details.milestones.length - 1 && (
                      <div
                        className={`w-1 h-16 my-1 rounded-full ${
                          milestone.status === "completed"
                            ? "bg-gradient-to-b from-green-400 to-gray-200"
                            : "bg-gray-200"
                        }`}
                      ></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="p-4 bg-gradient-to-br from-gray-50 via-white to-orange-50/20 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                      <p className="font-bold text-gray-900 text-base">
                        {milestone.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 mb-2">
                        {milestone.date}
                      </p>
                      <Badge
                        className={`${
                          milestone.status === "completed"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : milestone.status === "in_progress"
                              ? "bg-orange-100 text-orange-700 border-orange-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                        } text-xs font-semibold`}
                      >
                        {milestone.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                Documents
              </h2>
              <Button className="bg-white hover:bg-orange-50 border-2 border-orange-500 hover:border-orange-600 text-orange-600 hover:text-orange-700 shadow-md hover:shadow-lg transition-all">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
            <div className="space-y-3">
              {details.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 rounded-xl border border-gray-100 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-600">
                        {doc.size} • Uploaded by {doc.uploadedBy}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              Activity Log
            </h2>
            <div className="space-y-4">
              {details.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 group hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-transparent -mx-4 px-4 py-2 rounded-xl transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700 font-bold flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:from-orange-200 group-hover:to-orange-300 transition-all">
                    {activity.user}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
