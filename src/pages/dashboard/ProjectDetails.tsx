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
  TrendingUp,
  Target,
  Flag,
  MessageSquare,
  Play,
  Pause,
  StopCircle,
  XCircle,
  Ban,
  Image,
  Gift,
  ClipboardList,
  Plus,
  Filter,
  CheckSquare,
} from "lucide-react";
import { Button, Progress, Badge, Card } from "../../components/ui";
import { ProjectStagesSection } from "../../components/dashboard/stages";
import { TestimonialsTab } from "../../components/dashboard/testimonials";
import { ProjectReferencesTab } from "../../components/dashboard/references";
import { HandoverTab } from "../../components/dashboard/handover";
import { ActivitiesTab } from "../../components/dashboard/activities";
import toast from "react-hot-toast";
import { useProjectStore } from "../../stores/projectStore";
import { useProjectOptions } from "../../hooks/useProjectOptions";
import {
  Project,
  ProjectPayment,
  PaymentStatus,
  ProjectTaskStatus,
  UpdateProjectRequest,
  PauseProjectRequest,
  Task,
  TaskStatus,
} from "../../types";
import {
  createActivity,
  getActivitiesByEntity,
} from "../../services/activitiesApi";
import type { Activity } from "../../types";

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

// Format enum values to human-readable labels
const formatEnumLabel = (value: string | undefined | null): string => {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .replace(/AND/g, "&")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Stage label mapping for new API stage codes
const getStageLabel = (code: string): string => {
  const map: Record<string, string> = {
    ENQUIRY: "Enquiry",
    DESIGN_SIGNUP: "Design Signup",
    DESIGN: "Design",
    FIRST_PRESENTATION: "First Presentation",
    FINAL_DESIGN: "Final Design",
    COSTING: "Costing",
    EXECUTION: "Execution",
    HANDOVER: "Handover",
    TESTIMONIAL: "Testimonial",
  };
  return (
    map[code] ||
    code
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

// Calculate progress based on current stage code
const calculateProgress = (project: Project): number => {
  const stageProgress: Record<string, number> = {
    ENQUIRY: 10,
    DESIGN_SIGNUP: 20,
    DESIGN: 35,
    FIRST_PRESENTATION: 45,
    FINAL_DESIGN: 55,
    COSTING: 65,
    EXECUTION: 80,
    HANDOVER: 95,
    TESTIMONIAL: 100,
  };
  const code = project.currentStageCode || (project.currentStage as string);
  if (code) {
    return stageProgress[code] || 0;
  }
  return 0;
};

// Get status display — handles API uppercase values
const getStatusDisplay = (
  project: Project,
): { label: string; className: string } => {
  const status = (project.status || "").toUpperCase();
  if (status === "COMPLETED") {
    return {
      label: "COMPLETED",
      className: "bg-green-100 text-green-700 border-green-200",
    };
  }
  if (status === "PAUSED" || status === "ON_HOLD") {
    return {
      label: status === "PAUSED" ? "PAUSED" : "ON HOLD",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
  }
  if (status === "CANCELLED") {
    return {
      label: "CANCELLED",
      className: "bg-red-100 text-red-700 border-red-200",
    };
  }
  if (status === "YET_TO_START") {
    return {
      label: "YET TO START",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    };
  }
  if (status === "ONGOING") {
    return {
      label: "ONGOING",
      className: "bg-blue-100 text-blue-700 border-blue-200",
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
    tasksLoading,
    tasksError,
    pauseStatus,
    fetchProjectById,
    fetchProjectStages,
    fetchProjectPayments,
    fetchProjectTasks,
    updateProjectPayment,
    updateProject,
    deleteProject,
    clearError,
    startProject,
    pauseProject,
    resumeProject,
    completeProject,
    cancelProject,
    fetchPauseStatus,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  } = useProjectStore();

  // Project options from API
  const {
    options: projectOptions,
    getLabelForValue,
    getSubtypesForCategory,
  } = useProjectOptions();

  // Local state
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "stages"
    | "payments"
    | "tasks"
    | "milestones"
    | "references"
    | "testimonials"
    | "handover"
    | "activities"
  >("overview");

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

  // Edit project modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    projectName: "",
    propertyAddress: "",
    propertyCity: "",
    totalValue: "",
    moodBoardShared: false,
    pipelineType: "",
    projectCategory: "",
    scopeType: "",
    budgetTier: "",
    propertySubtype: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Pause modal state
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseForm, setPauseForm] = useState({ pauseDays: 7, reason: "" });
  const [isPausingProject, setIsPausingProject] = useState(false);

  // Status action confirmation
  const [showStatusConfirm, setShowStatusConfirm] = useState<
    "start" | "resume" | "complete" | "cancel" | null
  >(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Activity state
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [taskLoading, setTaskLoading] = useState<string | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState<
    string | null
  >(null);

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    taskType: "OTHER" as string,
    dueDate: "",
    priority: "MEDIUM" as string,
    status: "TODO" as string,
    notes: "",
  });

  // Fetch recent activities for the project
  const fetchRecentActivities = async (projectId: string) => {
    try {
      setActivitiesLoading(true);
      const response = await getActivitiesByEntity("PROJECT", projectId);

      // Normalise API shapes: some endpoints return an array, others wrap it
      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : Array.isArray((response as any)?.activities)
            ? (response as any).activities
            : [];

      // Sort by creation date and take the latest 10 so pause/resume history is always shown
      const sorted = list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setRecentActivities(sorted.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch project data on mount
  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
      fetchProjectStages(projectId);
      fetchProjectPayments(projectId);
      fetchProjectTasks(projectId);
      fetchRecentActivities(projectId);
    }
  }, [
    projectId,
    fetchProjectById,
    fetchProjectStages,
    fetchProjectPayments,
    fetchProjectTasks,
  ]);

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

  // Handle edit project
  const handleOpenEdit = () => {
    if (!currentProject) return;
    setEditForm({
      projectName: currentProject.projectName || "",
      propertyAddress: currentProject.propertyAddress || "",
      propertyCity: currentProject.propertyCity || "",
      totalValue: String(currentProject.totalValue || ""),
      moodBoardShared: currentProject.moodBoardShared || false,
      pipelineType: currentProject.pipelineType || "",
      projectCategory: currentProject.projectCategory || "",
      scopeType: currentProject.scopeType || "",
      budgetTier: currentProject.budgetTier || "",
      propertySubtype: currentProject.propertySubtype || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!projectId) return;
    setIsSavingEdit(true);
    try {
      const updates: UpdateProjectRequest = {
        projectName: editForm.projectName || undefined,
        propertyAddress: editForm.propertyAddress || undefined,
        propertyCity: editForm.propertyCity || undefined,
        totalValue: editForm.totalValue
          ? parseFloat(editForm.totalValue)
          : undefined,
        moodBoardShared: editForm.moodBoardShared,
        pipelineType: editForm.pipelineType || undefined,
        projectCategory: editForm.projectCategory || undefined,
        scopeType: editForm.scopeType || undefined,
        budgetTier: editForm.budgetTier || undefined,
        propertySubtype: editForm.propertySubtype || undefined,
      };
      await updateProject(projectId, updates);
      toast.success("Project updated successfully!");
      setShowEditModal(false);
      fetchProjectById(projectId);
    } catch {
      toast.error("Failed to update project");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Status management handlers
  const handleStatusAction = async (
    action: "start" | "resume" | "complete" | "cancel",
  ) => {
    if (!projectId) return;
    setIsChangingStatus(true);
    try {
      const previousStatus = currentProject?.status || "UNKNOWN";
      let newStatus = "";
      let successMessage = "";

      switch (action) {
        case "start":
          await startProject(projectId);
          newStatus = "ONGOING";
          successMessage = "Project started successfully!";
          break;
        case "resume":
          await resumeProject(projectId);
          newStatus = "ONGOING";
          successMessage = "Project resumed successfully!";
          break;
        case "complete":
          await completeProject(projectId);
          newStatus = "COMPLETED";
          successMessage = "Project marked as completed!";
          break;
        case "cancel":
          await cancelProject(projectId);
          newStatus = "CANCELLED";
          successMessage = "Project cancelled!";
          break;
      }

      // Log activity for audit trail
      try {
        const descriptions: Record<string, string> = {
          start: `Project started — status changed to Ongoing`,
          resume: `Project resumed from Paused — status changed back to Ongoing`,
          complete: `Project marked as Completed`,
          cancel: `Project has been Cancelled`,
        };
        await createActivity({
          entityType: "PROJECT",
          entityId: projectId,
          type: "STATUS_CHANGE",
          description:
            descriptions[action] ||
            `Project status changed from ${previousStatus} to ${newStatus}`,
          metadata: {
            statusChange: {
              from: previousStatus,
              to: newStatus,
            },
            action,
          },
        });
        console.log(`✅ Status change activity logged: ${action}`);
      } catch (activityError) {
        console.error(
          "⚠️ Failed to log status change activity:",
          activityError,
        );
        // Don't fail the entire operation if activity logging fails
      }

      toast.success(successMessage);
      setShowStatusConfirm(null);
      fetchProjectById(projectId);
      // Refresh activities to show the new status change log
      if (projectId) fetchRecentActivities(projectId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : `Failed to ${action} project`;
      toast.error(msg);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handlePauseProject = async () => {
    if (!projectId) return;
    if (!pauseForm.reason.trim()) {
      toast.error("Please provide a reason for pausing");
      return;
    }
    if (pauseForm.pauseDays < 1) {
      toast.error("Pause days must be at least 1");
      return;
    }
    setIsPausingProject(true);
    try {
      // Calculate expectedResumeDate from pauseDays (midnight UTC to match backend expectation)
      const resumeDate = new Date();
      resumeDate.setUTCDate(resumeDate.getUTCDate() + pauseForm.pauseDays);
      resumeDate.setUTCHours(0, 0, 0, 0);
      const expectedResumeDate = resumeDate.toISOString();

      console.log("🟢 Pausing project:", projectId);
      console.log("🟢 Form data:", pauseForm);
      console.log("🟢 Expected resume date:", expectedResumeDate);
      console.log("🟢 Request payload:", {
        reason: pauseForm.reason.trim(),
        pauseDays: pauseForm.pauseDays,
        expectedResumeDate,
      });

      await pauseProject(projectId, {
        reason: pauseForm.reason.trim(),
        pauseDays: pauseForm.pauseDays,
        expectedResumeDate,
      });

      // Log activity for audit trail
      try {
        await createActivity({
          entityType: "PROJECT",
          entityId: projectId,
          type: "STATUS_CHANGE",
          description: `Project paused for ${pauseForm.pauseDays} days. Reason: ${pauseForm.reason.trim()}. Expected resume: ${new Date(expectedResumeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
          metadata: {
            statusChange: {
              from: "ONGOING",
              to: "PAUSED",
            },
            pauseDays: pauseForm.pauseDays,
            reason: pauseForm.reason.trim(),
            expectedResumeDate,
          },
        });
        console.log("✅ Pause activity logged successfully");
      } catch (activityError) {
        console.error("⚠️ Failed to log pause activity:", activityError);
        // Don't fail the entire operation if activity logging fails
      }

      toast.success(`Project paused for ${pauseForm.pauseDays} days`);
      setShowPauseModal(false);
      setPauseForm({ pauseDays: 7, reason: "" });
      fetchProjectById(projectId);
      // Refresh activities to show the new pause log
      if (projectId) fetchRecentActivities(projectId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to pause project";
      toast.error(msg);
      console.error("❌ Error in handlePauseProject:", err);
    } finally {
      setIsPausingProject(false);
    }
  };

  // Fetch pause status when project is paused
  useEffect(() => {
    if (projectId && currentProject?.status?.toUpperCase() === "PAUSED") {
      fetchPauseStatus(projectId).catch(() => {});
    }
  }, [projectId, currentProject?.status, fetchPauseStatus]);

  // Get available status actions based on the current status
  const getStatusActions = () => {
    const status = (currentProject?.status || "").toUpperCase();
    const actions: Array<{
      action: "start" | "resume" | "complete" | "cancel" | "pause";
      label: string;
      icon: React.ReactNode;
      className: string;
      confirmTitle: string;
      confirmMessage: string;
    }> = [];

    if (status === "YET_TO_START") {
      actions.push({
        action: "start",
        label: "Start Project",
        icon: <Play className="w-4 h-4 mr-1.5" />,
        className: "bg-green-500 hover:bg-green-600 text-white",
        confirmTitle: "Start Project?",
        confirmMessage:
          'This will change the project status from "Yet to Start" to "Ongoing".',
      });
      actions.push({
        action: "cancel",
        label: "Cancel",
        icon: <Ban className="w-4 h-4 mr-1.5" />,
        className:
          "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300",
        confirmTitle: "Cancel Project?",
        confirmMessage:
          "Are you sure you want to cancel this project? This action may not be reversible.",
      });
    }

    if (status === "ONGOING" || status === "ACTIVE") {
      actions.push({
        action: "pause",
        label: "Pause",
        icon: <Pause className="w-4 h-4 mr-1.5" />,
        className:
          "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300",
        confirmTitle: "",
        confirmMessage: "",
      });
      actions.push({
        action: "complete",
        label: "Complete",
        icon: <StopCircle className="w-4 h-4 mr-1.5" />,
        className:
          "bg-green-100 hover:bg-green-200 text-green-700 border border-green-300",
        confirmTitle: "Complete Project?",
        confirmMessage:
          "Are you sure you want to mark this project as completed?",
      });
      actions.push({
        action: "cancel",
        label: "Cancel",
        icon: <Ban className="w-4 h-4 mr-1.5" />,
        className:
          "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300",
        confirmTitle: "Cancel Project?",
        confirmMessage:
          "Are you sure you want to cancel this project? This action may not be reversible.",
      });
    }

    if (status === "PAUSED") {
      actions.push({
        action: "resume",
        label: "Resume",
        icon: <Play className="w-4 h-4 mr-1.5" />,
        className: "bg-blue-500 hover:bg-blue-600 text-white",
        confirmTitle: "Resume Project?",
        confirmMessage:
          'This will resume the project and change its status back to "Ongoing".',
      });
      actions.push({
        action: "cancel",
        label: "Cancel",
        icon: <Ban className="w-4 h-4 mr-1.5" />,
        className:
          "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300",
        confirmTitle: "Cancel Project?",
        confirmMessage:
          "Are you sure you want to cancel this project? This action may not be reversible.",
      });
    }

    return actions;
  };

  // Task management handlers
  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      taskType: "OTHER",
      dueDate: "",
      priority: "MEDIUM",
      status: "TODO",
      notes: "",
    });
    setEditingTask(null);
  };

  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title || "",
        taskType: task.taskType || "OTHER",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        priority: task.priority || "MEDIUM",
        status: task.status || "TODO",
        notes: task.notes || "",
      });
    } else {
      resetTaskForm();
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (!projectId || !taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSavingTask(true);
    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask.id, {
          title: taskForm.title.trim(),
          taskType: taskForm.taskType,
          dueDate: taskForm.dueDate || undefined,
          priority: taskForm.priority,
          status: taskForm.status,
          notes: taskForm.notes || undefined,
        });
        toast.success("Task updated successfully!");
      } else {
        // Create new task
        await createTask({
          title: taskForm.title.trim(),
          taskType: taskForm.taskType,
          projectId: projectId,
          dueDate: taskForm.dueDate || new Date().toISOString().split("T")[0],
          priority: taskForm.priority,
          status: taskForm.status,
          notes: taskForm.notes || undefined,
        });
        toast.success("Task created successfully!");
      }
      setShowTaskModal(false);
      resetTaskForm();
      fetchProjectTasks(projectId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save task";
      toast.error(msg);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;

    setTaskLoading(taskId);
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully!");
      setShowDeleteTaskConfirm(null);
      fetchProjectTasks(projectId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete task";
      toast.error(msg);
    } finally {
      setTaskLoading(null);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    if (!projectId) return;

    setTaskLoading(task.id);
    try {
      if (task.completed || task.status === TaskStatus.COMPLETED) {
        // Mark as incomplete by updating status to TODO
        await updateTask(task.id, {
          status: TaskStatus.TODO,
          completed: false,
        });
        toast.success("Task marked as incomplete");
      } else {
        // Mark as complete
        await completeTask(task.id);
        toast.success("Task marked as complete!");
      }
      fetchProjectTasks(projectId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update task";
      toast.error(msg);
    } finally {
      setTaskLoading(null);
    }
  };

  // Filter tasks based on selected filter
  const tasksArray = Array.isArray(projectTasks) ? projectTasks : [];
  const filteredTasks = tasksArray.filter((task) => {
    if (taskFilter === "all") return true;
    if (taskFilter === "todo")
      return task.status === TaskStatus.TODO || task.status === "TODO";
    if (taskFilter === "in_progress")
      return (
        task.status === TaskStatus.IN_PROGRESS || task.status === "IN_PROGRESS"
      );
    if (taskFilter === "completed")
      return (
        task.status === TaskStatus.COMPLETED ||
        task.status === "COMPLETED" ||
        task.completed
      );
    return true;
  });

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-700",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-orange-100 text-orange-700",
      URGENT: "bg-red-100 text-red-700",
    };
    return styles[priority] || styles.MEDIUM;
  };

  // Get task type label
  const getTaskTypeLabel = (taskType: string) => {
    const labels: Record<string, string> = {
      CALL: "Call",
      MEETING: "Meeting",
      PRESENTATION: "Presentation",
      SURVEY: "Survey",
      INTERVIEW: "Interview",
      SITE_VISIT: "Site Visit",
      FOLLOW_UP: "Follow Up",
      DOCUMENT_UPLOAD: "Document Upload",
      APPROVAL_PENDING: "Approval Pending",
      DESIGN_REVIEW: "Design Review",
      PAYMENT_COLLECTION: "Payment Collection",
      HANDOVER: "Handover",
      OTHER: "Other",
    };
    return labels[taskType] || taskType;
  };

  // Calculate payment totals
  const calculatePaymentTotals = () => {
    let totalPaid = 0;
    let totalPending = 0;
    const totalAmount = parseFloat(String(currentProject?.totalValue)) || 0;

    projectPayments.forEach((payment) => {
      const expected = parseFloat(String(payment.expectedAmount)) || 0;
      if (
        payment.status === "COLLECTED" ||
        payment.status === PaymentStatus.COLLECTED
      ) {
        totalPaid += parseFloat(String(payment.actualAmount)) || expected;
      } else {
        totalPending += expected;
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
      <div className="relative bg-gradient-to-br from-orange-100/60 via-orange-50/80 to-amber-50/60 border-b border-orange-200/60 px-4 py-4 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto relative z-10">
          <button
            onClick={() => navigate("/dashboard/projects")}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back to Projects</span>
          </button>

          <div className="flex items-start justify-between mb-4">
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

            <div className="flex flex-wrap gap-2">
              {/* Status Action Buttons */}
              {getStatusActions().map((statusAction) => (
                <button
                  key={statusAction.action}
                  onClick={() => {
                    if (statusAction.action === "pause") {
                      setShowPauseModal(true);
                    } else {
                      setShowStatusConfirm(statusAction.action);
                    }
                  }}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${statusAction.className}`}
                >
                  {statusAction.icon}
                  {statusAction.label}
                </button>
              ))}

              <Button
                variant="secondary"
                className="bg-white hover:bg-orange-50 border-2 border-gray-400 hover:border-orange-500 text-gray-700 hover:text-orange-600 shadow-md"
                onClick={handleOpenEdit}
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
            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-4 border border-orange-100/50 shadow-sm">
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

            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-4 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                CURRENT STAGE
              </p>
              <p className="text-xl font-bold text-gray-900">
                {project.currentStageCode
                  ? getStageLabel(project.currentStageCode)
                  : "N/A"}
              </p>
            </div>

            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-4 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                TOTAL VALUE
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(parseFloat(String(project.totalValue)) || 0)}
              </p>
            </div>

            <div className="relative bg-white/80 backdrop-blur rounded-2xl p-4 border border-orange-100/50 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                CATEGORY
              </p>
              <p className="text-xl font-bold text-gray-900">
                {formatEnumLabel(project.projectCategory)}
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

      {/* Pause Info Banner */}
      {project.status?.toUpperCase() === "PAUSED" && (
        <div className="bg-yellow-50 border border-yellow-200 mx-4 mt-2 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <Pause className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-yellow-800 mb-1">
                Project is Paused
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {project.pauseReason && (
                  <div>
                    <span className="text-yellow-600 font-medium">Reason:</span>{" "}
                    <span className="text-yellow-900">
                      {project.pauseReason}
                    </span>
                  </div>
                )}
                {project.pausedAt && (
                  <div>
                    <span className="text-yellow-600 font-medium">Paused:</span>{" "}
                    <span className="text-yellow-900">
                      {formatDate(project.pausedAt)}
                    </span>
                  </div>
                )}
                {project.pausedUntil && (
                  <div>
                    <span className="text-yellow-600 font-medium">Until:</span>{" "}
                    <span className="text-yellow-900">
                      {formatDate(project.pausedUntil)}
                    </span>
                  </div>
                )}
                {pauseStatus?.daysRemaining != null &&
                  pauseStatus.daysRemaining > 0 && (
                    <div>
                      <span className="text-yellow-600 font-medium">
                        Days Left:
                      </span>{" "}
                      <span className="text-yellow-900 font-bold">
                        {pauseStatus.daysRemaining}
                      </span>
                    </div>
                  )}
                {pauseStatus?.isExpired && (
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      <AlertCircle className="w-3 h-3" />
                      Pause Expired{" "}
                      {pauseStatus.daysOverdue
                        ? `(${pauseStatus.daysOverdue} days overdue)`
                        : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowStatusConfirm("resume")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {[
              { id: "overview", label: "Overview", icon: FileText },
              { id: "stages", label: "Stages", icon: CheckCircle2 },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "milestones", label: "Milestones", icon: Flag },
              { id: "tasks", label: "Tasks", icon: Package },
              { id: "references", label: "References", icon: Image },
              {
                id: "testimonials",
                label: "Testimonials",
                icon: MessageSquare,
              },
              { id: "handover", label: "Handover", icon: Gift },
              { id: "activities", label: "Activities", icon: ClipboardList },
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
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Project Information */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Project Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Pipeline Type"
                    value={getLabelForValue(
                      "pipelineTypes",
                      project.pipelineType,
                    )}
                  />
                  <InfoItem
                    label="Category"
                    value={getLabelForValue(
                      "categories",
                      project.projectCategory,
                    )}
                  />
                  <InfoItem
                    label="Scope Type"
                    value={getLabelForValue("scopeTypes", project.scopeType)}
                  />
                  <InfoItem
                    label="Budget Tier"
                    value={getLabelForValue("budgetTiers", project.budgetTier)}
                  />
                  <InfoItem
                    label="Property Type"
                    value={
                      project.propertySubtype
                        ? (() => {
                            // Try to find label from category-specific subtypes
                            const subtypes = getSubtypesForCategory(
                              project.projectCategory,
                            );
                            const found = subtypes.find(
                              (s) => s.value === project.propertySubtype,
                            );
                            return (
                              found?.label ||
                              formatEnumLabel(project.propertySubtype)
                            );
                          })()
                        : "N/A"
                    }
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
                    label="Design Package"
                    value={project.designPackage || "N/A"}
                  />
                  <InfoItem
                    label="Construction Status"
                    value={project.constructionStatus || "N/A"}
                  />
                  <InfoItem
                    label="Moodboard Shared"
                    value={project.moodBoardShared ? "Yes" : "No"}
                  />
                </div>
              </Card>

              {/* Client/Lead Information */}
              {project.lead && (
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
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
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
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
            <div className="space-y-4">
              {/* Property Address */}
              {(project.propertyAddress ||
                project.propertyCity ||
                project.propertySizeSqft ||
                project.propertyBHK) && (
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <Home className="w-3.5 h-3.5 text-white" />
                    </div>
                    Property Details
                  </h3>
                  {project.propertyAddress && (
                    <p className="text-sm text-gray-700 pl-9">
                      {project.propertyAddress}
                    </p>
                  )}
                  {project.propertyCity && (
                    <p className="text-sm text-gray-500 pl-9">
                      {project.propertyCity}
                    </p>
                  )}
                  {(project.propertySizeSqft || project.propertyBHK) && (
                    <div className="flex gap-4 pl-9 mt-2">
                      {project.propertySizeSqft && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          {project.propertySizeSqft} sq.ft
                        </span>
                      )}
                      {project.propertyBHK && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {project.propertyBHK} BHK
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              )}

              {/* Payment Summary */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
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
                      {formatCurrency(
                        parseFloat(String(project.totalValue)) || 0,
                      )}
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

              {/* Recent Activity */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <ClipboardList className="w-3.5 h-3.5 text-white" />
                  </div>
                  Recent Activity
                </h3>

                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                      Loading...
                    </span>
                  </div>
                ) : recentActivities.length > 0 ? (
                  <div className="space-y-2 relative">
                    {/* Timeline line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />

                    {recentActivities.map((activity, index) => {
                      // Determine specific icon/color for pause/resume actions
                      const isPause =
                        activity.type === "STATUS_CHANGE" &&
                        activity.metadata?.statusChange?.to === "PAUSED";
                      const isResume =
                        activity.type === "STATUS_CHANGE" &&
                        activity.metadata?.action === "resume";

                      const config = isPause
                        ? {
                            icon: Pause,
                            color: "text-yellow-600",
                            bgColor: "bg-yellow-50",
                            borderColor: "border-yellow-300",
                            dotColor: "bg-yellow-500",
                          }
                        : isResume
                          ? {
                              icon: Play,
                              color: "text-green-600",
                              bgColor: "bg-green-50",
                              borderColor: "border-green-300",
                              dotColor: "bg-green-500",
                            }
                          : {
                              NOTE: {
                                icon: FileText,
                                color: "text-blue-600",
                                bgColor: "bg-blue-50",
                                borderColor: "border-blue-200",
                                dotColor: "bg-blue-500",
                              },
                              CALL: {
                                icon: Phone,
                                color: "text-green-600",
                                bgColor: "bg-green-50",
                                borderColor: "border-green-200",
                                dotColor: "bg-green-500",
                              },
                              MEETING: {
                                icon: Users,
                                color: "text-purple-600",
                                bgColor: "bg-purple-50",
                                borderColor: "border-purple-200",
                                dotColor: "bg-purple-500",
                              },
                              EMAIL: {
                                icon: Mail,
                                color: "text-orange-600",
                                bgColor: "bg-orange-50",
                                borderColor: "border-orange-200",
                                dotColor: "bg-orange-500",
                              },
                              WHATSAPP: {
                                icon: MessageSquare,
                                color: "text-emerald-600",
                                bgColor: "bg-emerald-50",
                                borderColor: "border-emerald-200",
                                dotColor: "bg-emerald-500",
                              },
                              SITE_VISIT: {
                                icon: MapPin,
                                color: "text-red-600",
                                bgColor: "bg-red-50",
                                borderColor: "border-red-200",
                                dotColor: "bg-red-500",
                              },
                              STAGE_CHANGE: {
                                icon: TrendingUp,
                                color: "text-indigo-600",
                                bgColor: "bg-indigo-50",
                                borderColor: "border-indigo-200",
                                dotColor: "bg-indigo-500",
                              },
                              STATUS_CHANGE: {
                                icon: RefreshCw,
                                color: "text-amber-600",
                                bgColor: "bg-amber-50",
                                borderColor: "border-amber-200",
                                dotColor: "bg-amber-500",
                              },
                              PAYMENT: {
                                icon: CreditCard,
                                color: "text-teal-600",
                                bgColor: "bg-teal-50",
                                borderColor: "border-teal-200",
                                dotColor: "bg-teal-500",
                              },
                              DOCUMENT_UPLOAD: {
                                icon: Upload,
                                color: "text-cyan-600",
                                bgColor: "bg-cyan-50",
                                borderColor: "border-cyan-200",
                                dotColor: "bg-cyan-500",
                              },
                              TASK_COMPLETED: {
                                icon: CheckCircle2,
                                color: "text-lime-600",
                                bgColor: "bg-lime-50",
                                borderColor: "border-lime-200",
                                dotColor: "bg-lime-500",
                              },
                            }[activity.type] || {
                              icon: ClipboardList,
                              color: "text-gray-600",
                              bgColor: "bg-gray-50",
                              borderColor: "border-gray-200",
                              dotColor: "bg-gray-500",
                            };

                      const ActivityIcon = config.icon;

                      // Activity label
                      const activityLabel = isPause
                        ? "Project Paused"
                        : isResume
                          ? "Project Resumed"
                          : (activity.type || "ACTIVITY").replace("_", " ");

                      // Format full date and time
                      const activityTime = new Date(activity.createdAt);
                      const formattedDate = activityTime.toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      );
                      const formattedTime = activityTime.toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        },
                      );

                      // Show relative time for recent items
                      const now = new Date();
                      const diffMs = now.getTime() - activityTime.getTime();
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const timeAgo =
                        diffMins < 1
                          ? "Just now"
                          : diffMins < 60
                            ? `${diffMins}m ago`
                            : diffHours < 24
                              ? `${diffHours}h ago`
                              : "";

                      return (
                        <div
                          key={activity.id}
                          className="relative flex gap-3 pb-2"
                        >
                          {/* Timeline dot */}
                          <div
                            className={`relative z-10 w-8 h-8 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center flex-shrink-0`}
                          >
                            <ActivityIcon
                              className={`w-3.5 h-3.5 ${config.color}`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-xs font-semibold text-gray-900">
                                {activityLabel}
                              </p>
                              {timeAgo && (
                                <span className="text-[10px] text-gray-500 flex-shrink-0">
                                  {timeAgo}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed mb-1.5">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formattedDate} at {formattedTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* View All Link */}
                    <button
                      onClick={() => setActiveTab("activities")}
                      className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      View all activities →
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No activities yet</p>
                  </div>
                )}
              </Card>

              {/* Quick Actions */}
              <Card className="p-4 bg-gradient-to-br from-white via-orange-50/20 to-white border-orange-100/50 shadow-sm">
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
        {activeTab === "stages" && <ProjectStagesSection project={project} />}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {/* Payment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
                <p className="text-sm text-gray-600 mb-2 font-semibold">
                  Total Value
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(String(project.totalValue)) || 0)}
                </p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-200/50 shadow-sm">
                <p className="text-sm text-green-700 mb-2 font-semibold">
                  Collected
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(paymentTotals.totalPaid)}
                </p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50/50 border-orange-200/50 shadow-sm">
                <p className="text-sm text-orange-700 mb-2 font-semibold">
                  Pending
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(paymentTotals.totalPending)}
                </p>
              </Card>
            </div>

            {/* Payment List */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                            {payment.phaseType} Payment {payment.paymentStage} (
                            {payment.percentage}%)
                          </p>
                          <p className="text-sm text-gray-600">
                            Expected:{" "}
                            {formatCurrency(
                              parseFloat(String(payment.expectedAmount)) || 0,
                            )}
                            {payment.collectedAt &&
                              ` • Collected: ${formatDate(payment.collectedAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(
                              parseFloat(String(payment.expectedAmount)) || 0,
                            )}
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
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
            {/* Header with Add Button and Filter */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                Project Tasks
                {!tasksLoading && !tasksError && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredTasks.length}{" "}
                    {taskFilter !== "all" ? `of ${tasksArray.length}` : ""})
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                {/* Refresh Button */}
                {tasksError && (
                  <Button
                    onClick={() => projectId && fetchProjectTasks(projectId)}
                    variant="secondary"
                    className="text-sm px-3 py-1.5"
                    disabled={tasksLoading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-1.5 ${tasksLoading ? "animate-spin" : ""}`}
                    />
                    Retry
                  </Button>
                )}
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    disabled={tasksLoading}
                  >
                    <option value="all">All Tasks</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                {/* Add Task Button */}
                <Button
                  onClick={() => handleOpenTaskModal()}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5"
                  disabled={tasksLoading}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Task
                </Button>
              </div>
            </div>

            {/* Loading Skeleton State */}
            {tasksLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 animate-pulse"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-6 h-6 rounded bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded" />
                      <div className="h-8 w-8 bg-gray-200 rounded" />
                      <div className="h-8 w-8 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!tasksLoading && tasksError && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Failed to Load Tasks
                </h3>
                <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                  {tasksError}
                </p>
                <Button
                  onClick={() => projectId && fetchProjectTasks(projectId)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!tasksLoading && !tasksError && filteredTasks.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {taskFilter !== "all"
                    ? `No ${taskFilter.replace("_", " ")} tasks found.`
                    : "No tasks found for this project."}
                </p>
                {taskFilter === "all" && (
                  <Button
                    onClick={() => handleOpenTaskModal()}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create First Task
                  </Button>
                )}
              </div>
            )}

            {/* Task List */}
            {!tasksLoading && !tasksError && filteredTasks.length > 0 && (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const isCompleted =
                    task.completed ||
                    task.status === TaskStatus.COMPLETED ||
                    task.status === "COMPLETED";
                  const isLoadingTask = taskLoading === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? "bg-green-50/50 border-green-100"
                          : "bg-gray-50 border-gray-100 hover:shadow-md"
                      } ${isLoadingTask ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Completion Checkbox */}
                        <button
                          onClick={() => handleCompleteTask(task)}
                          disabled={isLoadingTask}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : "border-2 border-gray-300 hover:border-blue-500"
                          } ${isLoadingTask ? "cursor-wait" : "cursor-pointer"}`}
                        >
                          {isLoadingTask ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isCompleted ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : null}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`font-bold ${isCompleted ? "text-gray-500 line-through" : "text-gray-900"}`}
                            >
                              {task.title}
                            </p>
                            {/* Task Type Badge */}
                            <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                              {getTaskTypeLabel(task.taskType)}
                            </span>
                            {/* Priority Badge */}
                            <Badge
                              className={`text-xs font-semibold ${getPriorityBadge(task.priority)}`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          {task.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {task.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {formatDate(task.dueDate)}
                              </span>
                            )}
                            {task.assignedToId && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        <Badge
                          className={`text-xs font-semibold ${
                            isCompleted
                              ? "bg-green-100 text-green-700"
                              : task.status === TaskStatus.IN_PROGRESS ||
                                  task.status === "IN_PROGRESS"
                                ? "bg-orange-100 text-orange-700"
                                : task.status === TaskStatus.BLOCKED ||
                                    task.status === "BLOCKED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {(task.status || "TODO").replace(/_/g, " ")}
                        </Badge>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenTaskModal(task)}
                          disabled={isLoadingTask}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setShowDeleteTaskConfirm(task.id)}
                          disabled={isLoadingTask}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Milestones Tab */}
        {activeTab === "milestones" && (
          <div className="space-y-4">
            <Card className="p-5 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Flag className="w-4 h-4 text-white" />
                  </div>
                  Project Milestones
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Overall Progress:</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="relative">
                {/* Vertical Progress Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-gray-100"></div>
                <div
                  className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-orange-500 to-orange-600 transition-all duration-1000 ease-out"
                  style={{ height: `${progress}%` }}
                ></div>

                {/* Milestone Items */}
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      title: "Project Initiation",
                      description:
                        "Initial requirements gathering and site visit",
                      stage: "ENQUIRY",
                      progress: 20,
                      status:
                        progress >= 20
                          ? "completed"
                          : progress >= 10
                            ? "in-progress"
                            : "pending",
                      icon: Home,
                      color: "blue",
                      tasks: [
                        "Site visit completed",
                        "Client requirements documented",
                        "Budget discussion",
                      ],
                    },
                    {
                      id: 2,
                      title: "Design & Planning",
                      description: "Creating design proposals and floor plans",
                      stage: "DESIGN",
                      progress: 50,
                      status:
                        progress >= 50
                          ? "completed"
                          : progress >= 35
                            ? "in-progress"
                            : "pending",
                      icon: FileText,
                      color: "purple",
                      tasks: [
                        "3D designs created",
                        "Material selection",
                        "Client approval pending",
                      ],
                    },
                    {
                      id: 3,
                      title: "Execution Phase",
                      description: "On-site construction and implementation",
                      stage: "EXECUTION",
                      progress: 80,
                      status:
                        progress >= 80
                          ? "completed"
                          : progress >= 55
                            ? "in-progress"
                            : "pending",
                      icon: Target,
                      color: "orange",
                      tasks: [
                        "Foundation work",
                        "Electrical & Plumbing",
                        "Interior finishing",
                      ],
                    },
                    {
                      id: 4,
                      title: "Final Handover",
                      description: "Quality check and project completion",
                      stage: "HANDOVER",
                      progress: 100,
                      status:
                        progress >= 100
                          ? "completed"
                          : progress >= 95
                            ? "in-progress"
                            : "pending",
                      icon: CheckCircle2,
                      color: "green",
                      tasks: [
                        "Final inspection",
                        "Documentation",
                        "Key handover",
                      ],
                    },
                  ].map((milestone, index) => {
                    const isCompleted = milestone.status === "completed";
                    const isInProgress = milestone.status === "in-progress";
                    const isPending = milestone.status === "pending";

                    const colorClasses = {
                      blue: {
                        bg: "bg-blue-100",
                        text: "text-blue-600",
                        border: "border-blue-200",
                        gradient: "from-blue-500 to-blue-600",
                      },
                      purple: {
                        bg: "bg-purple-100",
                        text: "text-purple-600",
                        border: "border-purple-200",
                        gradient: "from-purple-500 to-purple-600",
                      },
                      orange: {
                        bg: "bg-orange-100",
                        text: "text-orange-600",
                        border: "border-orange-200",
                        gradient: "from-orange-500 to-orange-600",
                      },
                      green: {
                        bg: "bg-green-100",
                        text: "text-green-600",
                        border: "border-green-200",
                        gradient: "from-green-500 to-green-600",
                      },
                    };

                    const colors =
                      colorClasses[
                        milestone.color as keyof typeof colorClasses
                      ];

                    return (
                      <div
                        key={milestone.id}
                        className="relative flex gap-4 pl-2"
                      >
                        {/* Milestone Dot */}
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                              isCompleted
                                ? `bg-gradient-to-br ${colors.gradient} shadow-lg shadow-${milestone.color}-500/30`
                                : isInProgress
                                  ? `${colors.bg} border-2 ${colors.border} animate-pulse`
                                  : "bg-gray-100 border-2 border-gray-200"
                            }`}
                          >
                            <milestone.icon
                              className={`w-6 h-6 ${
                                isCompleted
                                  ? "text-white"
                                  : isInProgress
                                    ? colors.text
                                    : "text-gray-400"
                              }`}
                            />
                          </div>
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Milestone Content */}
                        <div
                          className={`flex-1 pb-6 ${index === 3 ? "pb-0" : ""}`}
                        >
                          <div
                            className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                              isCompleted
                                ? "bg-white border-gray-200 shadow-sm"
                                : isInProgress
                                  ? `bg-gradient-to-br from-${milestone.color}-50 to-white border-${milestone.color}-200 shadow-md`
                                  : "bg-gray-50/50 border-gray-200 opacity-60"
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3
                                  className={`text-lg font-bold mb-1 ${
                                    isCompleted
                                      ? "text-gray-900"
                                      : isInProgress
                                        ? colors.text
                                        : "text-gray-500"
                                  }`}
                                >
                                  {milestone.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {milestone.description}
                                </p>
                              </div>
                              <Badge
                                className={`text-xs font-semibold ${
                                  isCompleted
                                    ? "bg-green-100 text-green-700"
                                    : isInProgress
                                      ? `${colors.bg} ${colors.text}`
                                      : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {isCompleted
                                  ? "Completed"
                                  : isInProgress
                                    ? "In Progress"
                                    : "Pending"}
                              </Badge>
                            </div>

                            {/* Progress Bar */}
                            {(isCompleted || isInProgress) && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-600">
                                    Progress
                                  </span>
                                  <span className="text-xs font-bold text-orange-600">
                                    {milestone.progress}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-1000 ease-out rounded-full`}
                                    style={{
                                      width: `${isCompleted ? 100 : milestone.status === "in-progress" ? 60 : 0}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* Tasks Checklist */}
                            {(isCompleted || isInProgress) && (
                              <div className="space-y-2">
                                {milestone.tasks.map((task, taskIndex) => (
                                  <div
                                    key={taskIndex}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                        isCompleted ||
                                        (isInProgress && taskIndex < 2)
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    >
                                      {(isCompleted ||
                                        (isInProgress && taskIndex < 2)) && (
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                    <span
                                      className={
                                        isCompleted ||
                                        (isInProgress && taskIndex < 2)
                                          ? "text-gray-900 font-medium"
                                          : "text-gray-500"
                                      }
                                    >
                                      {task}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Stage Info */}
                            {isInProgress && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Clock className="w-3 h-3" />
                                  <span>Expected completion in 2-3 weeks</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Milestone Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      [1, 2, 3, 4].filter(
                        (_, i) => progress >= [20, 50, 75, 100][i],
                      ).length
                    }
                  </p>
                  <p className="text-xs text-gray-600 font-medium">Completed</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {progress >= 50 && progress < 100 ? 1 : 0}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    In Progress
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {4 -
                      [1, 2, 3, 4].filter(
                        (_, i) => progress >= [20, 50, 75, 100][i],
                      ).length}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">Pending</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* References Tab */}
        {activeTab === "references" && project && (
          <ProjectReferencesTab projectId={project.id} />
        )}

        {/* Testimonials Tab */}
        {activeTab === "testimonials" && project && (
          <TestimonialsTab
            projectId={project.id}
            projectName={project.projectName || project.name}
            clientName={project.lead?.name || "Client"}
          />
        )}

        {/* Handover & Goodwill Tab */}
        {activeTab === "handover" && project && (
          <HandoverTab projectId={project.id} />
        )}

        {/* Activities Tab */}
        {activeTab === "activities" && project && (
          <ActivitiesTab projectId={project.id} />
        )}
      </div>

      {/* Payment Update Modal */}
      {showPaymentModal && editingPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Update Payment: {editingPayment.phaseType} Stage{" "}
                  {editingPayment.paymentStage}
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

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Edit Project
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={editForm.projectName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, projectName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Pipeline Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pipeline Type
                  </label>
                  <select
                    value={editForm.pipelineType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, pipelineType: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  >
                    <option value="">Select Pipeline Type</option>
                    {projectOptions.pipelineTypes.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={editForm.projectCategory}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        projectCategory: e.target.value,
                        propertySubtype: "", // Reset when category changes
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  >
                    <option value="">Select Category</option>
                    {projectOptions.categories.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scope Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scope Type
                  </label>
                  <select
                    value={editForm.scopeType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, scopeType: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  >
                    <option value="">Select Scope Type</option>
                    {projectOptions.scopeTypes.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget Tier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Tier
                  </label>
                  <select
                    value={editForm.budgetTier}
                    onChange={(e) =>
                      setEditForm({ ...editForm, budgetTier: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  >
                    <option value="">Select Budget Tier</option>
                    {projectOptions.budgetTiers.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Property Subtype (category-dependent) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <select
                    value={editForm.propertySubtype}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        propertySubtype: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    disabled={!editForm.projectCategory}
                  >
                    <option value="">
                      {editForm.projectCategory
                        ? "Select Property Type"
                        : "Select a category first"}
                    </option>
                    {editForm.projectCategory &&
                      getSubtypesForCategory(editForm.projectCategory).map(
                        (opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ),
                      )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Address
                    </label>
                    <input
                      type="text"
                      value={editForm.propertyAddress}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          propertyAddress: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property City
                    </label>
                    <input
                      type="text"
                      value={editForm.propertyCity}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          propertyCity: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Value (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.totalValue}
                    onChange={(e) =>
                      setEditForm({ ...editForm, totalValue: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="moodBoardShared"
                    checked={editForm.moodBoardShared}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        moodBoardShared: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <label
                    htmlFor="moodBoardShared"
                    className="text-sm font-medium text-gray-700"
                  >
                    Moodboard Shared
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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

      {/* Pause Project Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Pause className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Pause Project
                  </h3>
                </div>
                <button
                  onClick={() => setShowPauseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pause Duration (days){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={pauseForm.pauseDays}
                    onChange={(e) =>
                      setPauseForm({
                        ...pauseForm,
                        pauseDays: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Number of days to pause"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The project will be automatically flagged as expired after
                    this period.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={pauseForm.reason}
                    onChange={(e) =>
                      setPauseForm({ ...pauseForm, reason: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                    placeholder="Why is this project being paused?"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowPauseModal(false)}
                  disabled={isPausingProject}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={handlePauseProject}
                  disabled={isPausingProject}
                >
                  {isPausingProject ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Pause className="w-4 h-4 mr-2" />
                  )}
                  Pause Project
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              {(() => {
                const actions = getStatusActions();
                const action = actions.find(
                  (a) => a.action === showStatusConfirm,
                );
                if (!action) return null;

                const iconBg =
                  showStatusConfirm === "cancel"
                    ? "bg-red-100"
                    : showStatusConfirm === "complete"
                      ? "bg-green-100"
                      : "bg-blue-100";
                const iconColor =
                  showStatusConfirm === "cancel"
                    ? "text-red-600"
                    : showStatusConfirm === "complete"
                      ? "text-green-600"
                      : "text-blue-600";
                const btnClass =
                  showStatusConfirm === "cancel"
                    ? "bg-red-500 hover:bg-red-600"
                    : showStatusConfirm === "complete"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-blue-500 hover:bg-blue-600";

                return (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <div
                        className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center`}
                      >
                        <span className={`${iconColor}`}>{action.icon}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                      {action.confirmTitle}
                    </h3>
                    <p className="text-gray-600 text-center mb-6">
                      {action.confirmMessage}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setShowStatusConfirm(null)}
                        disabled={isChangingStatus}
                      >
                        Cancel
                      </Button>
                      <Button
                        className={`flex-1 ${btnClass} text-white`}
                        onClick={() => handleStatusAction(showStatusConfirm)}
                        disabled={isChangingStatus}
                      >
                        {isChangingStatus ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          action.icon
                        )}
                        {action.label}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingTask ? "Edit Task" : "Create New Task"}
                </h3>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    resetTaskForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task title..."
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Type
                  </label>
                  <select
                    value={taskForm.taskType}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, taskType: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CALL">Call</option>
                    <option value="MEETING">Meeting</option>
                    <option value="PRESENTATION">Presentation</option>
                    <option value="SURVEY">Survey</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="SITE_VISIT">Site Visit</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="DOCUMENT_UPLOAD">Document Upload</option>
                    <option value="APPROVAL_PENDING">Approval Pending</option>
                    <option value="DESIGN_REVIEW">Design Review</option>
                    <option value="PAYMENT_COLLECTION">
                      Payment Collection
                    </option>
                    <option value="HANDOVER">Handover</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Priority and Status Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, priority: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={taskForm.status}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, status: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={taskForm.notes}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Additional notes or description..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowTaskModal(false);
                    resetTaskForm();
                  }}
                  disabled={isSavingTask}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleSaveTask}
                  disabled={isSavingTask || !taskForm.title.trim()}
                >
                  {isSavingTask ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingTask ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {showDeleteTaskConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Task?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteTaskConfirm(null)}
                  disabled={taskLoading === showDeleteTaskConfirm}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => handleDeleteTask(showDeleteTaskConfirm)}
                  disabled={taskLoading === showDeleteTaskConfirm}
                >
                  {taskLoading === showDeleteTaskConfirm ? (
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
