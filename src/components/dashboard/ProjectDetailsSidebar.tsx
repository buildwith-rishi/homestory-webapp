import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Calendar,
  Users,
  Phone,
  Clock,
  CheckCircle2,
  FileText,
  CreditCard,
  TrendingUp,
  Package,
  ClipboardCheck,
  MessageSquare,
  Download,
  Edit3,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, Progress } from "../ui";

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

interface ProjectDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

// Mock detailed data - in production, this would come from API
const getProjectDetails = (project: Project) => {
  return {
    ...project,
    clientPhone: "+91 98765 43210",
    clientEmail: "sharma.family@example.com",
    startDate: "2025-12-01",
    projectType: "Residential",
    squareFeet: "1200",
    floors: "2",
    rooms: "3",
    priority: "High",

    // Financial Details
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

    // Milestones
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
      {
        id: 6,
        title: "Material Selection",
        status: "pending",
        date: "2026-02-10",
      },
    ],

    // Documents
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

    // Activity Log
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
      {
        id: 4,
        user: "MG",
        action: "Marked 'Site Measurement' as complete",
        time: "5 days ago",
      },
    ],

    // Team members with roles
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

export const ProjectDetailsSidebar: React.FC<ProjectDetailsSidebarProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "milestones" | "documents" | "activity"
  >("overview");

  if (!project) return null;

  const details = getProjectDetails(project);

  const sidebarContent = (
    <>
      {/* Backdrop - covers entire viewport using portal */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(17, 24, 39, 0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 9998,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Sidebar - Clean & Narrow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "560px",
          zIndex: 9999,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-out",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header - Full Coverage */}
        <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 pt-4 pb-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white truncate">
                  {project.name}
                </h2>
                <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/25 text-white">
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-orange-50 text-sm">{project.client}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors -mr-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Compact Stats Row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-[10px] text-orange-50 uppercase tracking-wide mb-0.5">
                Progress
              </p>
              <p className="text-xl font-bold text-white">
                {project.progress}%
              </p>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-[10px] text-orange-50 uppercase tracking-wide mb-0.5">
                Budget
              </p>
              <p className="text-xl font-bold text-white">{project.budget}</p>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-[10px] text-orange-50 uppercase tracking-wide mb-0.5">
                Due
              </p>
              <p className="text-sm font-bold text-white">{project.dueDate}</p>
            </div>
          </div>
        </div>

        {/* Slim Tabs */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex">
            {[
              { key: "overview", label: "Overview", icon: FileText },
              { key: "payments", label: "Payments", icon: CreditCard },
              { key: "milestones", label: "Milestones", icon: CheckCircle2 },
              { key: "documents", label: "Documents", icon: Package },
              { key: "activity", label: "Activity", icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-all ${
                    activeTab === tab.key
                      ? "text-orange-600 border-orange-500 bg-white"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 bg-gray-50">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Project Information */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  Project Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Stage
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {project.stage}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Priority
                    </p>
                    <p className="text-sm font-semibold text-orange-600">
                      {details.priority}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Start Date
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(details.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Square Feet
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {details.squareFeet} sq.ft
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Floors
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {details.floors}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                      Rooms
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {details.rooms} BHK
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Client
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    {project.client.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {project.client}
                    </p>
                    <p className="text-xs text-gray-500">
                      {details.clientEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone className="w-3 h-3" />
                  {details.clientPhone}
                </div>
              </div>

              {/* Team */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Team
                </h3>
                <div className="space-y-2">
                  {details.teamDetails.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                          {member.id}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Progress
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Overall</span>
                  <span className="text-sm font-bold text-orange-600">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-2" />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-lg font-bold text-gray-900">
                      12<span className="text-sm text-gray-400">/18</span>
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase">Tasks</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-lg font-bold text-gray-900">24</p>
                    <p className="text-[10px] text-gray-500 uppercase">
                      Days Left
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      Paid
                    </span>
                  </div>
                  <p className="text-xl font-bold text-green-700">
                    {details.totalPaid}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-orange-700 font-medium">
                      Pending
                    </span>
                  </div>
                  <p className="text-xl font-bold text-orange-700">
                    {details.totalPending}
                  </p>
                </div>
              </div>

              {/* Payment List */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-500" />
                  Payment Timeline
                </h3>
                <div className="space-y-2">
                  {details.payments.map((payment, index: number) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          payment.status === "paid"
                            ? "bg-green-500 text-white"
                            : payment.status === "pending"
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {payment.milestone}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {payment.amount}
                        </p>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            payment.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Milestones Tab */}
          {activeTab === "milestones" && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-orange-500" />
                  Project Milestones
                </h3>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-3">
                    {details.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="relative flex gap-3 pl-1"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                            milestone.status === "completed"
                              ? "bg-green-500 text-white"
                              : milestone.status === "in_progress"
                                ? "bg-orange-500 text-white"
                                : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {milestone.status === "completed" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : milestone.status === "in_progress" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-900">
                              {milestone.title}
                            </p>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                milestone.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : milestone.status === "in_progress"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {milestone.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(milestone.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    Documents
                  </h3>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                </div>
                <div className="space-y-2">
                  {details.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[10px] text-gray-500">{doc.size}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-white rounded transition-colors">
                          <Download className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button className="p-1.5 hover:bg-white rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  Activity Log
                </h3>
                <div className="space-y-2">
                  {details.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="w-7 h-7 rounded bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {activity.user}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-5 py-4 flex items-center justify-between bg-white">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="px-4 py-2 rounded-lg text-xs font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500 text-white border-2 border-red-500 hover:bg-red-600 hover:border-red-600"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
          <Button
            onClick={onClose}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );

  // Use React Portal to render sidebar at the root level (body)
  // This ensures it appears above all other content including fixed headers
  return ReactDOM.createPortal(sidebarContent, document.body);
};
