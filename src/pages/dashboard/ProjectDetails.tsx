import React, { useState, useEffect } from "react";
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
  Edit3,
  Trash2,
  Upload,
  X,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Home,
  DollarSign,
  Mail,
} from "lucide-react";
import { Button, Progress, Badge, Card } from "../../components/ui";
import toast from "react-hot-toast";
import { useProjectStore } from "../../stores/projectStore";
import {
  Project,
  ProjectStageData,
  ProjectPayment,
  ProjectStageCode,
  StageStatus,
  PaymentStatus,
  ProjectTaskStatus,
} from "../../types";

// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
};

// Helper function to format date
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Stage name mapping
const getStageDisplayName = (stageCode: ProjectStageCode): string => {
  const stageMap: Record<ProjectStageCode, string> = {
    [ProjectStageCode.LEAD]: "Lead",
    [ProjectStageCode.SITE_VISIT]: "Site Visit",
    [ProjectStageCode.PROPOSAL]: "Proposal",
    [ProjectStageCode.DESIGN]: "Design",
    [ProjectStageCode.EXECUTION]: "Execution",
    [ProjectStageCode.HANDOVER]: "Handover",
    [ProjectStageCode.WARRANTY]: "Warranty",
  };
  return stageMap[stageCode] || stageCode;
};

// Calculate progress based on current stage
const calculateProgress = (project: Project): number => {
  const stageProgress: Record<ProjectStageCode, number> = {
    [ProjectStageCode.LEAD]: 10,
    [ProjectStageCode.SITE_VISIT]: 20,
    [ProjectStageCode.PROPOSAL]: 35,
    [ProjectStageCode.DESIGN]: 50,
    [ProjectStageCode.EXECUTION]: 75,
    [ProjectStageCode.HANDOVER]: 95,
    [ProjectStageCode.WARRANTY]: 100,
  };
  if (project.currentStage) {
    return stageProgress[project.currentStage] || 0;
  }
  return 0;
};

// Get status display
const getStatusDisplay = (
  project: Project,
): { label: string; className: string } => {
  if (project.status === "completed") {
    return {
      label: "COMPLETED",
      className: "bg-green-100 text-green-700 border-green-200",
    };
  }
  if (project.status === "on_hold") {
    return {
      label: "ON HOLD",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
  }
  return {
    label: "ACTIVE",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  };
};

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Store
  const {
    currentProject,
    projectStages,
    projectPayments,
    projectTasks,
    isLoading,
    error,
    fetchProjectById,
    fetchProjectStages,
    fetchProjectPayments,
    fetchProjectTasks,
    updateProjectStage,
    updateProjectPayment,
    deleteProject,
    clearError,
  } = useProjectStore();

  // Local state
  const [activeTab, setActiveTab] = useState<
    "overview" | "stages" | "payments" | "tasks"
  >("overview");

  // Stage update modal
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectStageData | null>(
    null,
  );
  const [stageForm, setStageForm] = useState({
    status: "" as StageStatus,
    endDate: "",
    remarks: "",
  });

  // Payment update modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ProjectPayment | null>(
    null,
  );
  const [paymentForm, setPaymentForm] = useState({
    status: "" as PaymentStatus,
    actualAmount: "",
    invoiceNumber: "",
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch project data on mount
  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
      fetchProjectStages(projectId);
      fetchProjectPayments(projectId);
      fetchProjectTasks(projectId);
    }
  }, [
    projectId,
    fetchProjectById,
    fetchProjectStages,
    fetchProjectPayments,
    fetchProjectTasks,
  ]);

  // Handle stage update
  const handleEditStage = (stage: ProjectStageData) => {
    setEditingStage(stage);
    setStageForm({
      status: stage.status,
      endDate: stage.endDate || "",
      remarks: stage.remarks || "",
    });
    setShowStageModal(true);
  };

  const handleSaveStage = async () => {
    if (!projectId || !editingStage) return;

    try {
      await updateProjectStage(projectId, editingStage.stageCode, {
        status: stageForm.status,
        endDate: stageForm.endDate || undefined,
        remarks: stageForm.remarks || undefined,
      });
      toast.success("Stage updated successfully!");
      setShowStageModal(false);
      setEditingStage(null);
      // Refresh stages
      fetchProjectStages(projectId);
    } catch {
      toast.error("Failed to update stage");
    }
  };

  // Handle payment update
  const handleEditPayment = (payment: ProjectPayment) => {
    setEditingPayment(payment);
    setPaymentForm({
      status: payment.status,
      actualAmount: payment.actualAmount?.toString() || "",
      invoiceNumber: payment.invoiceNumber || "",
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    if (!projectId || !editingPayment) return;

    try {
      await updateProjectPayment(projectId, editingPayment.id, {
        status: paymentForm.status,
        actualAmount: paymentForm.actualAmount
          ? parseFloat(paymentForm.actualAmount)
          : undefined,
        invoiceNumber: paymentForm.invoiceNumber || undefined,
      });
      toast.success("Payment updated successfully!");
      setShowPaymentModal(false);
      setEditingPayment(null);
      // Refresh payments
      fetchProjectPayments(projectId);
    } catch {
      toast.error("Failed to update payment");
    }
  };

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!projectId) return;

    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      toast.success("Project deleted successfully!");
      navigate("/dashboard/projects");
    } catch {
      toast.error("Failed to delete project");
      setIsDeleting(false);
    }
  };

  // Calculate payment totals
  const calculatePaymentTotals = () => {
    let totalPaid = 0;
    let totalPending = 0;
    let totalAmount = 0;

    projectPayments.forEach((payment) => {
      totalAmount += payment.amount;
      if (payment.status === PaymentStatus.COLLECTED) {
        totalPaid += payment.actualAmount || payment.amount;
      } else {
        totalPending += payment.amount;
      }
    });

    return { totalPaid, totalPending, totalAmount };
  };

  // Loading state
  if (isLoading && !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Project
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                clearError();
                if (projectId) fetchProjectById(projectId);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/dashboard/projects")}
            >
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The project you are looking for does not exist.
          </p>
          <Button onClick={() => navigate("/dashboard/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const project = currentProject;
  const projectName = project.projectName || project.name || "Untitled Project";
  const statusDisplay = getStatusDisplay(project);
  const progress = calculateProgress(project);
  const paymentTotals = calculatePaymentTotals();

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
                  {projectName}
                </h1>
                <Badge
                  className={`${statusDisplay.className} border text-sm px-3 py-1 font-semibold`}
                >
                  {statusDisplay.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                {project.lead?.name && (
                  <span className="text-lg font-medium">
                    {project.lead.name}
                  </span>
                )}
                {project.propertyCity && (
                  <span className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    {project.propertyCity}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 shadow-md"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="secondary"
                className="bg-white hover:bg-red-50 border-2 border-red-400 hover:border-red-500 text-red-600 hover:text-red-700 shadow-md"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-5 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                PROGRESS
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={progress} className="h-2.5" />
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {progress}%
                </p>
              </div>
            </div>

            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-5 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                CURRENT STAGE
              </p>
              <p className="text-xl font-bold text-gray-900">
                {project.currentStage
                  ? getStageDisplayName(project.currentStage)
                  : "N/A"}
              </p>
            </div>

            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-5 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                TOTAL VALUE
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(project.totalValue || 0)}
              </p>
            </div>

            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-5 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                CATEGORY
              </p>
              <p className="text-xl font-bold text-gray-900">
                {project.projectCategory || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Background pattern */}
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
              { id: "stages", label: "Stages", icon: CheckCircle2 },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "tasks", label: "Tasks", icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Information */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Project Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Pipeline Type"
                    value={project.pipelineType || "N/A"}
                  />
                  <InfoItem
                    label="Category"
                    value={project.projectCategory || "N/A"}
                  />
                  <InfoItem
                    label="Scope Type"
                    value={project.scopeType || "N/A"}
                  />
                  <InfoItem
                    label="Budget Tier"
                    value={project.budgetTier || "N/A"}
                  />
                  <InfoItem
                    label="Property Type"
                    value={project.propertySubtype || "N/A"}
                  />
                  <InfoItem
                    label="Property Size"
                    value={
                      project.propertySizeSqft
                        ? `${project.propertySizeSqft} sq.ft`
                        : "N/A"
                    }
                  />
                  <InfoItem label="BHK" value={project.propertyBHK || "N/A"} />
                  <InfoItem
                    label="Moodboard Shared"
                    value={project.moodBoardShared ? "Yes" : "No"}
                  />
                </div>
              </Card>

              {/* Client/Lead Information */}
              {project.lead && (
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    Client Information
                  </h2>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {project.lead.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-lg font-bold text-gray-900">
                        {project.lead.name}
                      </p>
                      {project.lead.email && (
                        <a
                          href={`mailto:${project.lead.email}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600"
                        >
                          <Mail className="w-4 h-4" />
                          {project.lead.email}
                        </a>
                      )}
                      {project.lead.phone && (
                        <a
                          href={`tel:${project.lead.phone}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600"
                        >
                          <Phone className="w-4 h-4" />
                          {project.lead.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Team */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Team
                </h2>
                <div className="space-y-3">
                  {project.assignedDesigner && (
                    <TeamMember
                      name={project.assignedDesigner.name || "Unknown"}
                      role="Lead Designer"
                      email={project.assignedDesigner.email}
                    />
                  )}
                  {project.assignedPM && (
                    <TeamMember
                      name={project.assignedPM.name || "Unknown"}
                      role="Project Manager"
                      email={project.assignedPM.email}
                    />
                  )}
                  {!project.assignedDesigner && !project.assignedPM && (
                    <p className="text-gray-500 text-sm">
                      No team members assigned yet.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Property Address */}
              {project.propertyAddress && (
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <Home className="w-3.5 h-3.5 text-white" />
                    </div>
                    Property Address
                  </h3>
                  <p className="text-sm text-gray-700 pl-9">
                    {project.propertyAddress}
                  </p>
                  {project.propertyCity && (
                    <p className="text-sm text-gray-500 pl-9">
                      {project.propertyCity}
                    </p>
                  )}
                </Card>
              )}

              {/* Payment Summary */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-white" />
                  </div>
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-600">Total Value</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(project.totalValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-50">
                    <span className="text-sm text-green-700">Collected</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(paymentTotals.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-orange-50">
                    <span className="text-sm text-orange-700">Pending</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(paymentTotals.totalPending)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6 bg-gradient-to-br from-white via-orange-50/20 to-white border-orange-100/50 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-start bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 shadow-sm"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 shadow-sm"
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

        {/* Stages Tab */}
        {activeTab === "stages" && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              Project Stages
            </h2>

            {projectStages.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No stages found for this project.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projectStages.map((stage, index) => (
                  <div key={stage.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                          stage.status === StageStatus.COMPLETED
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                            : stage.status === StageStatus.IN_PROGRESS
                              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                              : "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                        }`}
                      >
                        {stage.status === StageStatus.COMPLETED ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      {index < projectStages.length - 1 && (
                        <div
                          className={`w-1 h-16 my-1 rounded-full ${
                            stage.status === StageStatus.COMPLETED
                              ? "bg-gradient-to-b from-green-400 to-green-200"
                              : "bg-gradient-to-b from-gray-300 to-gray-200"
                          }`}
                        ></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div
                        className={`p-4 rounded-xl border ${
                          stage.status === StageStatus.COMPLETED
                            ? "bg-green-50/50 border-green-100"
                            : stage.status === StageStatus.IN_PROGRESS
                              ? "bg-orange-50/50 border-orange-100"
                              : "bg-gray-50/50 border-gray-100"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-base">
                              {getStageDisplayName(stage.stageCode)}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              {stage.startDate && (
                                <span>
                                  Start: {formatDate(stage.startDate)}
                                </span>
                              )}
                              {stage.endDate && (
                                <span>End: {formatDate(stage.endDate)}</span>
                              )}
                            </div>
                            {stage.remarks && (
                              <p className="text-sm text-gray-500 mt-2">
                                {stage.remarks}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`text-xs font-semibold ${
                                stage.status === StageStatus.COMPLETED
                                  ? "bg-green-100 text-green-700"
                                  : stage.status === StageStatus.IN_PROGRESS
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {stage.status.replace("_", " ")}
                            </Badge>
                            <button
                              onClick={() => handleEditStage(stage)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Update stage"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Payment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <p className="text-sm text-gray-600 mb-2 font-semibold">
                  Total Value
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(project.totalValue || 0)}
                </p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-200/50 shadow-sm">
                <p className="text-sm text-green-700 mb-2 font-semibold">
                  Collected
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(paymentTotals.totalPaid)}
                </p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50/50 border-orange-200/50 shadow-sm">
                <p className="text-sm text-orange-700 mb-2 font-semibold">
                  Pending
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(paymentTotals.totalPending)}
                </p>
              </Card>
            </div>

            {/* Payment List */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                Payment Milestones
              </h2>

              {projectPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No payments found for this project.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                            payment.status === PaymentStatus.COLLECTED
                              ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                              : payment.status === PaymentStatus.PENDING
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                                : "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                          }`}
                        >
                          {payment.status === PaymentStatus.COLLECTED ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {payment.milestone}
                          </p>
                          <p className="text-sm text-gray-600">
                            Due: {formatDate(payment.dueDate)}
                            {payment.collectedDate &&
                              ` • Collected: ${formatDate(payment.collectedDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </p>
                          <Badge
                            className={`text-xs font-semibold ${
                              payment.status === PaymentStatus.COLLECTED
                                ? "bg-green-100 text-green-700"
                                : payment.status === PaymentStatus.PENDING
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {payment.status}
                          </Badge>
                        </div>
                        <button
                          onClick={() => handleEditPayment(payment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Update payment"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              Project Tasks
            </h2>

            {projectTasks.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No tasks found for this project.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          task.status === ProjectTaskStatus.DONE
                            ? "bg-green-100 text-green-600"
                            : task.status === ProjectTaskStatus.IN_PROGRESS
                              ? "bg-orange-100 text-orange-600"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {task.status === ProjectTaskStatus.DONE ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-600">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {task.dueDate && (
                            <span>Due: {formatDate(task.dueDate)}</span>
                          )}
                          {task.assignedTo && (
                            <span>
                              Assigned:{" "}
                              {typeof task.assignedTo === "string"
                                ? task.assignedTo
                                : task.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`text-xs font-semibold ${
                        task.status === ProjectTaskStatus.DONE
                          ? "bg-green-100 text-green-700"
                          : task.status === ProjectTaskStatus.IN_PROGRESS
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Stage Update Modal */}
      {showStageModal && editingStage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Update Stage: {getStageDisplayName(editingStage.stageCode)}
                </h3>
                <button
                  onClick={() => setShowStageModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={stageForm.status}
                    onChange={(e) =>
                      setStageForm({
                        ...stageForm,
                        status: e.target.value as StageStatus,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value={StageStatus.NOT_STARTED}>Not Started</option>
                    <option value={StageStatus.IN_PROGRESS}>In Progress</option>
                    <option value={StageStatus.COMPLETED}>Completed</option>
                    <option value={StageStatus.SKIPPED}>Skipped</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={stageForm.endDate}
                    onChange={(e) =>
                      setStageForm({ ...stageForm, endDate: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={stageForm.remarks}
                    onChange={(e) =>
                      setStageForm({ ...stageForm, remarks: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Add remarks..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowStageModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleSaveStage}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Stage
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Update Modal */}
      {showPaymentModal && editingPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Update Payment: {editingPayment.milestone}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={paymentForm.status}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        status: e.target.value as PaymentStatus,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value={PaymentStatus.PENDING}>Pending</option>
                    <option value={PaymentStatus.INVOICED}>Invoiced</option>
                    <option value={PaymentStatus.COLLECTED}>Collected</option>
                    <option value={PaymentStatus.OVERDUE}>Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Amount
                  </label>
                  <input
                    type="number"
                    value={paymentForm.actualAmount}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        actualAmount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter actual amount collected"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={paymentForm.invoiceNumber}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        invoiceNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter invoice number"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleSavePayment}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Project?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete &quot;{projectName}&quot;? This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for info items
const InfoItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-orange-50/20 border border-gray-100">
    <p className="text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
      {label}
    </p>
    <p className="text-base font-bold text-gray-900">{value}</p>
  </div>
);

// Helper component for team members
const TeamMember: React.FC<{ name: string; role: string; email?: string }> = ({
  name,
  role,
  email,
}) => (
  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 via-white to-orange-50/20 rounded-xl border border-gray-100">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md">
      {name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)}
    </div>
    <div className="flex-1">
      <p className="font-bold text-gray-900">{name}</p>
      <p className="text-sm text-gray-600">{role}</p>
    </div>
    {email && (
      <a
        href={`mailto:${email}`}
        className="w-10 h-10 rounded-lg bg-white border border-orange-200 flex items-center justify-center text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all"
      >
        <Mail className="w-4 h-4" />
      </a>
    )}
  </div>
);
