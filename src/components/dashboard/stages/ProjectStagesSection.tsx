import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Pause,
  Play,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Hammer,
  Target,
  TrendingUp,
  Eye,
  Plus,
  MoreVertical,
  Layers,
  Edit,
  Table,
  LayoutGrid,
} from "lucide-react";
import { Button, Badge, Card, Progress } from "../../ui";
import toast from "react-hot-toast";
import {
  Project,
  PipelineType,
  ProjectStageWithDays,
  DayPlan,
  DayTask,
  StagePhase,
  StageStatus,
  DayPlanStatus,
  DayTaskStatus,
  WorkerCategory,
  Worker,
  UpdateDayTaskRequest,
  CompleteDaySummary,
  AssignTaskRequest,
} from "../../../types";
import { DayPlanModal } from "./DayPlanModal";
import { AddTaskModal } from "./AddTaskModal";
import { EditStageModal } from "./EditStageModal";
import { ProjectStagesTableView } from "./ProjectStagesTableView";
import { PaymentData } from "./PaymentReminderModal";
import { PaymentStatus } from "../../../types";

// Mock workers data
const mockWorkers: Worker[] = [
  {
    id: "w1",
    name: "Rajesh Kumar",
    category: WorkerCategory.PAINTER,
    phone: "+91 98765 43210",
    dailyRate: 800,
    isAvailable: true,
    skills: ["Interior Painting", "Exterior Painting", "Texture Work"],
    rating: 4.5,
    createdAt: "2025-01-01",
  },
  {
    id: "w2",
    name: "Suresh Sharma",
    category: WorkerCategory.CARPENTER,
    phone: "+91 98765 43211",
    dailyRate: 1000,
    isAvailable: true,
    skills: ["Modular Kitchen", "Wardrobes", "Custom Furniture"],
    rating: 4.8,
    createdAt: "2025-01-01",
  },
  {
    id: "w3",
    name: "Mohan Singh",
    category: WorkerCategory.PLUMBER,
    phone: "+91 98765 43212",
    dailyRate: 900,
    isAvailable: true,
    skills: ["Pipe Fitting", "Bathroom Fixtures", "Drainage"],
    rating: 4.3,
    createdAt: "2025-01-01",
  },
  {
    id: "w4",
    name: "Amit Patel",
    category: WorkerCategory.ELECTRICIAN,
    phone: "+91 98765 43213",
    dailyRate: 950,
    isAvailable: true,
    skills: ["Wiring", "Panel Work", "Light Fixtures"],
    rating: 4.6,
    createdAt: "2025-01-01",
  },
  {
    id: "w5",
    name: "Vikram Yadav",
    category: WorkerCategory.TILER,
    phone: "+91 98765 43214",
    dailyRate: 850,
    isAvailable: true,
    skills: ["Floor Tiles", "Wall Tiles", "Marble Work"],
    rating: 4.4,
    createdAt: "2025-01-01",
  },
  {
    id: "w6",
    name: "Deepak Verma",
    category: WorkerCategory.MASON,
    phone: "+91 98765 43215",
    dailyRate: 750,
    isAvailable: true,
    skills: ["Brick Work", "Plastering", "Civil Work"],
    rating: 4.2,
    createdAt: "2025-01-01",
  },
];

// Generate mock stages data based on pipeline type
const generateMockStages = (
  projectId: string,
  pipelineType: PipelineType
): ProjectStageWithDays[] => {
  const baseStages: Partial<ProjectStageWithDays>[] = [
    {
      id: "stage-1",
      projectId,
      phase: StagePhase.CONCEPT_DESIGN,
      phaseName: "Concept Design",
      phaseDescription: "Initial design concepts, mood boards, and layout planning",
      phaseCategory: "DESIGN",
      status: StageStatus.COMPLETED,
      progress: 100,
      startDate: "2026-01-05",
      estimatedEndDate: "2026-01-12",
      actualEndDate: "2026-01-11",
      totalDays: 7,
      completedDays: 7,
      dayPlans: [],
      totalBudget: 50000,
      spentBudget: 48000,
      isPaused: false,
      createdAt: "2026-01-05",
      updatedAt: "2026-01-11",
    },
    {
      id: "stage-2",
      projectId,
      phase: StagePhase.DESIGN_DEVELOPMENT,
      phaseName: "Design Development",
      phaseDescription: "Detailed drawings, 3D renders, and design refinement",
      phaseCategory: "DESIGN",
      status: StageStatus.COMPLETED,
      progress: 100,
      startDate: "2026-01-12",
      estimatedEndDate: "2026-01-20",
      actualEndDate: "2026-01-19",
      totalDays: 8,
      completedDays: 8,
      dayPlans: [],
      totalBudget: 75000,
      spentBudget: 72000,
      isPaused: false,
      createdAt: "2026-01-12",
      updatedAt: "2026-01-19",
    },
    {
      id: "stage-3",
      projectId,
      phase: StagePhase.MATERIAL_SELECTION,
      phaseName: "Material Selection",
      phaseDescription: "Finalize materials, vendors, and procurement planning",
      phaseCategory: "DESIGN",
      status: StageStatus.IN_PROGRESS,
      progress: 60,
      startDate: "2026-01-20",
      estimatedEndDate: "2026-01-28",
      totalDays: 8,
      completedDays: 5,
      dayPlans: generateMockDayPlans("stage-3", projectId, 8, 5),
      totalBudget: 40000,
      spentBudget: 25000,
      isPaused: false,
      createdAt: "2026-01-20",
      updatedAt: "2026-01-25",
    },
    {
      id: "stage-4",
      projectId,
      phase: StagePhase.FINAL_DESIGN_APPROVAL,
      phaseName: "Final Design Approval",
      phaseDescription: "Client sign-off on final designs and specifications",
      phaseCategory: "DESIGN",
      status: StageStatus.NOT_STARTED,
      progress: 0,
      estimatedEndDate: "2026-02-05",
      totalDays: 5,
      completedDays: 0,
      dayPlans: [],
      totalBudget: 20000,
      spentBudget: 0,
      isPaused: false,
      createdAt: "2026-01-20",
      updatedAt: "2026-01-20",
    },
  ];

  if (pipelineType === PipelineType.DESIGN_AND_EXECUTION) {
    const executionStages: Partial<ProjectStageWithDays>[] = [
      {
        id: "stage-5",
        projectId,
        phase: StagePhase.SITE_PREPARATION,
        phaseName: "Site Preparation",
        phaseDescription: "Demolition, clearing, and site setup",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 5,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 100000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
      {
        id: "stage-6",
        projectId,
        phase: StagePhase.CIVIL_WORK,
        phaseName: "Civil Work",
        phaseDescription: "Structural modifications, masonry, and basic construction",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 15,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 350000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
      {
        id: "stage-7",
        projectId,
        phase: StagePhase.ELECTRICAL_PLUMBING,
        phaseName: "Electrical & Plumbing",
        phaseDescription: "Wiring, conduit, plumbing lines, and fixtures",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 10,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 250000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
      {
        id: "stage-8",
        projectId,
        phase: StagePhase.CARPENTRY_WORK,
        phaseName: "Carpentry Work",
        phaseDescription: "Modular furniture, wardrobes, and woodwork",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 20,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 500000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
      {
        id: "stage-9",
        projectId,
        phase: StagePhase.FLOORING,
        phaseName: "Flooring",
        phaseDescription: "Tile laying, marble work, and floor finishing",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 8,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 200000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
      {
        id: "stage-10",
        projectId,
        phase: StagePhase.PAINTING,
        phaseName: "Painting",
        phaseDescription: "Wall preparation, primer, and paint application",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 7,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 150000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
      {
        id: "stage-11",
        projectId,
        phase: StagePhase.FINISHING,
        phaseName: "Finishing",
        phaseDescription: "Final touches, accessories, and cleaning",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 5,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 100000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
      {
        id: "stage-12",
        projectId,
        phase: StagePhase.FINAL_INSPECTION,
        phaseName: "Final Inspection",
        phaseDescription: "Quality check and punch list completion",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 3,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 30000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
      {
        id: "stage-13",
        projectId,
        phase: StagePhase.HANDOVER,
        phaseName: "Handover",
        phaseDescription: "Final walkthrough and key handover",
        phaseCategory: "EXECUTION",
        status: StageStatus.NOT_STARTED,
        progress: 0,
        totalDays: 2,
        completedDays: 0,
        dayPlans: [],
        totalBudget: 20000,
        spentBudget: 0,
        isPaused: false,
        createdAt: "2026-01-20",
        updatedAt: "2026-01-20",
      },
    ];
    return [...baseStages, ...executionStages].map((stage, index) => ({
      ...stage,
      paymentRequired: (stage.totalBudget || 0) > 0,
      paymentAmount: stage.totalBudget || 0,
      paymentStatus: 
        stage.status === StageStatus.COMPLETED 
          ? PaymentStatus.PAID
          : stage.status === StageStatus.IN_PROGRESS
          ? PaymentStatus.PARTIAL
          : PaymentStatus.PENDING,
      paymentDueDate: stage.estimatedEndDate,
      paymentCollectedDate: stage.status === StageStatus.COMPLETED ? stage.actualEndDate : undefined,
      invoiceNumber: stage.status === StageStatus.COMPLETED ? `INV-2026-${String(index + 1).padStart(3, '0')}` : undefined,
    })) as ProjectStageWithDays[];
  }

  return baseStages.map((stage, index) => ({
    ...stage,
    paymentRequired: (stage.totalBudget || 0) > 0,
    paymentAmount: stage.totalBudget || 0,
    paymentStatus: 
      stage.status === StageStatus.COMPLETED 
        ? PaymentStatus.PAID
        : stage.status === StageStatus.IN_PROGRESS
        ? PaymentStatus.PARTIAL
        : PaymentStatus.PENDING,
    paymentDueDate: stage.estimatedEndDate,
    paymentCollectedDate: stage.status === StageStatus.COMPLETED ? stage.actualEndDate : undefined,
    invoiceNumber: stage.status === StageStatus.COMPLETED ? `INV-2026-${String(index + 1).padStart(3, '0')}` : undefined,
  })) as ProjectStageWithDays[];
};

// Generate mock day plans for a stage
function generateMockDayPlans(
  stageId: string,
  projectId: string,
  totalDays: number,
  completedDays: number
): DayPlan[] {
  const dayPlans: DayPlan[] = [];
  const baseDate = new Date("2026-01-20");

  for (let i = 1; i <= totalDays; i++) {
    const dayDate = new Date(baseDate);
    dayDate.setDate(baseDate.getDate() + i - 1);

    const isCompleted = i <= completedDays;
    const isToday = i === completedDays + 1;

    const tasks: DayTask[] = [];
    
    if (i <= completedDays + 2) {
      // Generate tasks for completed and current days
      const taskTemplates = [
        { title: "Material procurement review", category: WorkerCategory.SUPERVISOR },
        { title: "Vendor coordination", category: WorkerCategory.OTHER },
        { title: "Sample collection", category: WorkerCategory.HELPER },
        { title: "Quality check", category: WorkerCategory.SUPERVISOR },
      ];

      taskTemplates.forEach((template, idx) => {
        tasks.push({
          id: `task-${stageId}-${i}-${idx}`,
          dayPlanId: `day-${stageId}-${i}`,
          title: template.title,
          description: `Day ${i} - ${template.title}`,
          category: template.category,
          status: isCompleted ? DayTaskStatus.COMPLETED : isToday && idx < 2 ? DayTaskStatus.IN_PROGRESS : DayTaskStatus.NOT_STARTED,
          assignedWorkers: [mockWorkers[idx % mockWorkers.length]],
          estimatedHours: 4,
          actualHours: isCompleted ? 3.5 : undefined,
          isPaused: false,
          createdAt: dayDate.toISOString(),
          updatedAt: dayDate.toISOString(),
        });
      });
    }

    dayPlans.push({
      id: `day-${stageId}-${i}`,
      projectId,
      stageId,
      dayNumber: i,
      date: dayDate.toISOString().split("T")[0],
      status: isCompleted
        ? DayPlanStatus.COMPLETED
        : isToday
        ? DayPlanStatus.IN_PROGRESS
        : DayPlanStatus.SCHEDULED,
      tasks,
      totalWorkers: tasks.length,
      totalCost: tasks.length * 800,
      supervisorId: "w1",
      isPaused: false,
      completedTasks: isCompleted ? tasks.map((t) => t.id) : [],
      pendingTasks: isCompleted ? [] : tasks.map((t) => t.id),
      blockedTasks: [],
      createdAt: dayDate.toISOString(),
      updatedAt: dayDate.toISOString(),
    });
  }

  return dayPlans;
}

// Helper functions
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value: number): string => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
};

const getStatusColor = (status: StageStatus | DayPlanStatus | DayTaskStatus) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    COMPLETED: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    IN_PROGRESS: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    NOT_STARTED: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
    SCHEDULED: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    PAUSED: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
    ON_HOLD: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
    BLOCKED: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    CANCELLED: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
    PARTIALLY_COMPLETED: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    HOLIDAY: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
    SKIPPED: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
  };
  return colors[status] || colors.NOT_STARTED;
};

interface ProjectStagesSectionProps {
  project: Project;
}

export const ProjectStagesSection: React.FC<ProjectStagesSectionProps> = ({
  project,
}) => {
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [selectedDayPlan, setSelectedDayPlan] = useState<DayPlan | null>(null);
  const [selectedStage, setSelectedStage] = useState<ProjectStageWithDays | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [stageToEdit, setStageToEdit] = useState<ProjectStageWithDays | null>(null);
  const [activePhase, setActivePhase] = useState<"DESIGN" | "EXECUTION">("DESIGN");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // Generate mock stages based on project pipeline type - use state to allow updates
  const [stages, setStages] = useState<ProjectStageWithDays[]>(() =>
    generateMockStages(project.id, project.pipelineType)
  );

  const designStages = stages.filter((s) => s.phaseCategory === "DESIGN");
  const executionStages = stages.filter((s) => s.phaseCategory === "EXECUTION");

  const isDesignAndExecution = project.pipelineType === PipelineType.DESIGN_AND_EXECUTION;

  // Calculate overall progress
  const designProgress = useMemo(() => {
    const total = designStages.length;
    const completed = designStages.filter((s) => s.status === StageStatus.COMPLETED).length;
    const inProgress = designStages.find((s) => s.status === StageStatus.IN_PROGRESS);
    return Math.round(((completed + (inProgress ? inProgress.progress / 100 : 0)) / total) * 100);
  }, [designStages]);

  const executionProgress = useMemo(() => {
    if (!executionStages.length) return 0;
    const total = executionStages.length;
    const completed = executionStages.filter((s) => s.status === StageStatus.COMPLETED).length;
    const inProgress = executionStages.find((s) => s.status === StageStatus.IN_PROGRESS);
    return Math.round(((completed + (inProgress ? inProgress.progress / 100 : 0)) / total) * 100);
  }, [executionStages]);

  const toggleStageExpand = (stageId: string) => {
    setExpandedStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handlePauseStage = (stage: ProjectStageWithDays) => {
    // TODO: Implement pause/resume logic
    console.log("Pause/Resume Stage:", stage);
  };

  const handleEditStage = (stage: ProjectStageWithDays) => {
    setStageToEdit(stage);
  };

  const handleSaveStageEdit = (updates: {
    startDate?: string;
    estimatedEndDate?: string;
    totalBudget?: number;
    remarks?: string;
    status?: StageStatus;
  }) => {
    if (!stageToEdit) return;

    setStages((prevStages) =>
      prevStages.map((stage) =>
        stage.id === stageToEdit.id
          ? {
              ...stage,
              startDate: updates.startDate || stage.startDate,
              estimatedEndDate: updates.estimatedEndDate || stage.estimatedEndDate,
              totalBudget: updates.totalBudget !== undefined ? updates.totalBudget : stage.totalBudget,
              remarks: updates.remarks || stage.remarks,
              status: updates.status || stage.status,
            }
          : stage
      )
    );

    toast.success("Stage updated successfully!");
    setStageToEdit(null);
  };

  const handlePaymentCollected = (paymentData: PaymentData) => {
    setStages((prevStages) =>
      prevStages.map((stage) =>
        stage.id === paymentData.stageId
          ? {
              ...stage,
              paymentStatus: paymentData.paymentStatus,
              paymentCollectedDate: paymentData.paymentDate,
              invoiceNumber: paymentData.invoiceNumber,
              invoiceUrl: paymentData.invoiceUrl,
              paymentNotes: paymentData.paymentNotes,
            }
          : stage
      )
    );

    toast.success("Payment recorded successfully!");
  };

  const handleViewDayPlan = (dayPlan: DayPlan, stage: ProjectStageWithDays) => {
    setSelectedDayPlan(dayPlan);
    setSelectedStage(stage);
  };

  const handleAddTask = (stage: ProjectStageWithDays) => {
    setSelectedStage(stage);
    setShowAddTaskModal(true);
  };

  const currentStages = activePhase === "DESIGN" ? designStages : executionStages;

  // Calculate totals
  const totalBudget = stages.reduce((sum, s) => sum + s.totalBudget, 0);
  const spentBudget = stages.reduce((sum, s) => sum + s.spentBudget, 0);
  const totalDays = stages.reduce((sum, s) => sum + s.totalDays, 0);
  const completedDays = stages.reduce((sum, s) => sum + s.completedDays, 0);

  // Calculate estimated completion
  const estimatedCompletion = useMemo(() => {
    const lastStage = stages[stages.length - 1];
    if (lastStage?.estimatedEndDate) {
      return formatDate(lastStage.estimatedEndDate);
    }
    // Calculate based on remaining days
    const remainingDays = totalDays - completedDays;
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + remainingDays);
    return formatDate(completionDate.toISOString());
  }, [stages, totalDays, completedDays]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Overall Progress</p>
              <p className="text-2xl font-bold text-orange-600">
                {isDesignAndExecution
                  ? Math.round((designProgress + executionProgress) / 2)
                  : designProgress}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Days Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {completedDays}/{totalDays}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Budget Spent</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(spentBudget)}
              </p>
              <p className="text-xs text-gray-500">of {formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Est. Completion</p>
              <p className="text-lg font-bold text-purple-600">{estimatedCompletion}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Phase Tabs (only for Design & Execution) */}
      {isDesignAndExecution && (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActivePhase("DESIGN")}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              activePhase === "DESIGN"
                ? "bg-white text-orange-600 shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Design Phase
              <Badge className={`${designProgress === 100 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"} text-xs`}>
                {designProgress}%
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setActivePhase("EXECUTION")}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              activePhase === "EXECUTION"
                ? "bg-white text-orange-600 shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              Execution Phase
              <Badge className={`${executionProgress === 100 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"} text-xs`}>
                {executionProgress}%
              </Badge>
            </div>
          </button>
        </div>
      )}

      {/* Stages List */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            {activePhase === "DESIGN" ? "Design Stages" : "Execution Stages"}
          </h2>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-white shadow-sm text-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  viewMode === "card"
                    ? "bg-white shadow-sm text-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
                Cards
              </button>
            </div>
          </div>
        </div>

        {currentStages.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No stages available for this phase.</p>
          </div>
        ) : viewMode === "table" ? (
          /* Clean Table View */
          <ProjectStagesTableView
            stages={currentStages}
            onEditStage={handleEditStage}
            onPauseStage={handlePauseStage}
            onAddTask={handleAddTask}
            onViewDayPlan={(dayPlan, stage) => handleViewDayPlan(dayPlan, stage)}
            onPaymentCollected={handlePaymentCollected}
          />
        ) : (
          /* Card View (Original) */
          <div className="space-y-4">
            {currentStages.map((stage, index) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={index}
                isExpanded={expandedStages.includes(stage.id)}
                onToggleExpand={() => toggleStageExpand(stage.id)}
                onPause={() => handlePauseStage(stage)}
                onEdit={() => handleEditStage(stage)}
                onViewDayPlan={(dayPlan) => handleViewDayPlan(dayPlan, stage)}
                onAddTask={() => handleAddTask(stage)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Day Plan Modal */}
      {selectedDayPlan && selectedStage && (
        <DayPlanModal
          dayPlan={selectedDayPlan}
          stage={selectedStage}
          workers={mockWorkers}
          onClose={() => {
            setSelectedDayPlan(null);
            setSelectedStage(null);
          }}
          onUpdateTask={(taskId: string, updates: UpdateDayTaskRequest) => {
            // Update task in the stages state
            setStages((prevStages) => {
              return prevStages.map((stage) => {
                if (stage.id !== selectedStage.id) return stage;

                return {
                  ...stage,
                  dayPlans: stage.dayPlans.map((dayPlan) => {
                    if (dayPlan.id !== selectedDayPlan.id) return dayPlan;

                    return {
                      ...dayPlan,
                      tasks: dayPlan.tasks.map((task) => {
                        if (task.id !== taskId) return task;
                        return {
                          ...task,
                          ...updates,
                          updatedAt: new Date().toISOString(),
                        };
                      }),
                      updatedAt: new Date().toISOString(),
                    };
                  }),
                  updatedAt: new Date().toISOString(),
                };
              });
            });

            // Update the selected day plan to reflect changes in the modal
            setSelectedDayPlan((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                tasks: prev.tasks.map((task) => {
                  if (task.id !== taskId) return task;
                  return {
                    ...task,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                  };
                }),
                updatedAt: new Date().toISOString(),
              };
            });

            toast.success("Task updated successfully!");
          }}
          onPauseTask={(taskId: string) => {
            // Pause task
            setStages((prevStages) => {
              return prevStages.map((stage) => {
                if (stage.id !== selectedStage.id) return stage;

                return {
                  ...stage,
                  dayPlans: stage.dayPlans.map((dayPlan) => {
                    if (dayPlan.id !== selectedDayPlan.id) return dayPlan;

                    return {
                      ...dayPlan,
                      tasks: dayPlan.tasks.map((task) => {
                        if (task.id !== taskId) return task;
                        return {
                          ...task,
                          status: DayTaskStatus.PAUSED,
                          isPaused: true,
                          pausedAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                      }),
                      updatedAt: new Date().toISOString(),
                    };
                  }),
                  updatedAt: new Date().toISOString(),
                };
              });
            });

            // Update the selected day plan
            setSelectedDayPlan((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                tasks: prev.tasks.map((task) => {
                  if (task.id !== taskId) return task;
                  return {
                    ...task,
                    status: DayTaskStatus.PAUSED,
                    isPaused: true,
                    pausedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                }),
                updatedAt: new Date().toISOString(),
              };
            });

            toast.success("Task paused");
          }}
          onResumeTask={(taskId: string) => {
            // Resume task
            setStages((prevStages) => {
              return prevStages.map((stage) => {
                if (stage.id !== selectedStage.id) return stage;

                return {
                  ...stage,
                  dayPlans: stage.dayPlans.map((dayPlan) => {
                    if (dayPlan.id !== selectedDayPlan.id) return dayPlan;

                    return {
                      ...dayPlan,
                      tasks: dayPlan.tasks.map((task) => {
                        if (task.id !== taskId) return task;
                        return {
                          ...task,
                          status: DayTaskStatus.IN_PROGRESS,
                          isPaused: false,
                          resumedAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                      }),
                      updatedAt: new Date().toISOString(),
                    };
                  }),
                  updatedAt: new Date().toISOString(),
                };
              });
            });

            // Update the selected day plan
            setSelectedDayPlan((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                tasks: prev.tasks.map((task) => {
                  if (task.id !== taskId) return task;
                  return {
                    ...task,
                    status: DayTaskStatus.IN_PROGRESS,
                    isPaused: false,
                    resumedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                }),
                updatedAt: new Date().toISOString(),
              };
            });

            toast.success("Task resumed");
          }}
          onCompleteDay={(summary: CompleteDaySummary) => {
            // Mark day as complete
            setStages((prevStages) => {
              return prevStages.map((stage) => {
                if (stage.id !== selectedStage.id) return stage;

                return {
                  ...stage,
                  dayPlans: stage.dayPlans.map((dayPlan) => {
                    if (dayPlan.id !== summary.dayPlanId) return dayPlan;

                    return {
                      ...dayPlan,
                      status: DayPlanStatus.COMPLETED,
                      completionSummary: summary.completionSummary,
                      completedTasks: summary.completedTasks,
                      pendingTasks: summary.pendingTasks,
                      endTime: summary.endTime,
                      updatedAt: new Date().toISOString(),
                    };
                  }),
                  completedDays: stage.completedDays + 1,
                  progress: Math.round(
                    ((stage.completedDays + 1) / stage.totalDays) * 100
                  ),
                  updatedAt: new Date().toISOString(),
                };
              });
            });

            toast.success("Day marked as complete!");
            setSelectedDayPlan(null);
            setSelectedStage(null);
          }}
        />
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && selectedStage && (
        <AddTaskModal
          stage={selectedStage}
          workers={mockWorkers}
          onClose={() => {
            setShowAddTaskModal(false);
            setSelectedStage(null);
          }}
          onAddTask={(task: AssignTaskRequest) => {
            // Add the task to the appropriate day plan
            setStages((prevStages) => {
              return prevStages.map((stage) => {
                if (stage.id !== selectedStage.id) return stage;

                // Find or create day plan for the selected date
                let updatedDayPlans = [...stage.dayPlans];
                let dayPlanIndex = updatedDayPlans.findIndex(
                  (dp) => dp.id === task.dayPlanId
                );

                if (dayPlanIndex === -1) {
                  // Create new day plan if it doesn't exist
                  const dayNumber = updatedDayPlans.length + 1;
                  const newDayPlan: DayPlan = {
                    id: task.dayPlanId,
                    projectId: stage.projectId,
                    stageId: stage.id,
                    dayNumber,
                    date: task.dayPlanId.replace("new-day-", ""),
                    status: DayPlanStatus.SCHEDULED,
                    tasks: [],
                    totalWorkers: 0,
                    totalCost: 0,
                    isPaused: false,
                    completedTasks: [],
                    pendingTasks: [],
                    blockedTasks: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  updatedDayPlans.push(newDayPlan);
                  dayPlanIndex = updatedDayPlans.length - 1;
                }

                // Get assigned workers
                const assignedWorkers = mockWorkers.filter((w) =>
                  task.workerIds.includes(w.id)
                );

                // Create new task
                const newTask: DayTask = {
                  id: `task-${Date.now()}`,
                  dayPlanId: task.dayPlanId,
                  title: task.taskTitle,
                  description: task.taskDescription,
                  category: task.category,
                  status: DayTaskStatus.NOT_STARTED,
                  assignedWorkers,
                  estimatedHours: task.estimatedHours,
                  startTime: task.startTime,
                  isPaused: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                // Update the day plan with the new task
                const updatedDayPlan = {
                  ...updatedDayPlans[dayPlanIndex],
                  tasks: [...updatedDayPlans[dayPlanIndex].tasks, newTask],
                  totalWorkers:
                    updatedDayPlans[dayPlanIndex].totalWorkers +
                    assignedWorkers.length,
                  totalCost:
                    updatedDayPlans[dayPlanIndex].totalCost +
                    assignedWorkers.reduce((sum, w) => sum + w.dailyRate, 0),
                  pendingTasks: [
                    ...updatedDayPlans[dayPlanIndex].pendingTasks,
                    newTask.id,
                  ],
                  updatedAt: new Date().toISOString(),
                };

                updatedDayPlans[dayPlanIndex] = updatedDayPlan;

                // Return updated stage
                return {
                  ...stage,
                  dayPlans: updatedDayPlans,
                  updatedAt: new Date().toISOString(),
                };
              });
            });

            // Show success message
            toast.success(`Task "${task.taskTitle}" added successfully!`);

            // Close modal and update selected stage
            setShowAddTaskModal(false);
            
            // Update the selected stage to reflect changes if viewing day plan
            setSelectedStage((prev) => {
              if (!prev) return null;
              const updatedStage = stages.find((s) => s.id === prev.id);
              return updatedStage || prev;
            });
          }}
        />
      )}

      {/* Edit Stage Modal */}
      {stageToEdit && (
        <EditStageModal
          stage={stageToEdit}
          onClose={() => setStageToEdit(null)}
          onSave={handleSaveStageEdit}
        />
      )}
    </div>
  );
};

// Stage Card Component
interface StageCardProps {
  stage: ProjectStageWithDays;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPause: () => void;
  onEdit: () => void;
  onViewDayPlan: (dayPlan: DayPlan) => void;
  onAddTask: () => void;
}

const StageCard: React.FC<StageCardProps> = ({
  stage,
  index,
  isExpanded,
  onToggleExpand,
  onPause,
  onEdit,
  onViewDayPlan,
  onAddTask,
}) => {
  const statusColors = getStatusColor(stage.status);
  const isInProgress = stage.status === StageStatus.IN_PROGRESS;
  const isCompleted = stage.status === StageStatus.COMPLETED;

  return (
    <div
      className={`border-2 rounded-xl overflow-hidden transition-all ${
        isInProgress
          ? "border-orange-200 bg-gradient-to-br from-orange-50/50 to-white"
          : isCompleted
          ? "border-green-200 bg-gradient-to-br from-green-50/30 to-white"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Stage Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4">
          {/* Stage Number */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
              isCompleted
                ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                : isInProgress
                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
          </div>

          {/* Stage Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900">{stage.phaseName}</h3>
              <Badge className={`${statusColors.bg} ${statusColors.text} text-xs`}>
                {stage.status.replace("_", " ")}
              </Badge>
              {stage.isPaused && (
                <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                  <Pause className="w-3 h-3 mr-1" />
                  Paused
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{stage.phaseDescription}</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Progress</p>
              <p className={`text-lg font-bold ${isCompleted ? "text-green-600" : isInProgress ? "text-orange-600" : "text-gray-600"}`}>
                {stage.progress}%
              </p>
            </div>
            <div className="w-24">
              <Progress value={stage.progress} className="h-2" />
            </div>
          </div>

          {/* Days Progress */}
          <div className="text-right px-4 border-l border-gray-200">
            <p className="text-sm text-gray-500">Days</p>
            <p className="text-lg font-bold text-gray-900">
              {stage.completedDays}/{stage.totalDays}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 rounded-lg hover:bg-purple-100 text-purple-600 transition-colors"
              title="Edit Stage"
            >
              <Edit className="w-4 h-4" />
            </button>
            {isInProgress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPause();
                }}
                className="p-2 rounded-lg hover:bg-yellow-100 text-yellow-600 transition-colors"
                title={stage.isPaused ? "Resume Stage" : "Pause Stage"}
              >
                {stage.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Timeline Bar */}
        {stage.startDate && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Start: {formatDate(stage.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Est. End: {formatDate(stage.estimatedEndDate)}
            </span>
            {stage.actualEndDate && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Completed: {formatDate(stage.actualEndDate)}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              Budget: {formatCurrency(stage.spentBudget)} / {formatCurrency(stage.totalBudget)}
            </span>
          </div>
        )}
      </div>

      {/* Expanded Content - Day Plans */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50/50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Day-wise Plan
              </h4>
              {(isInProgress || stage.status === StageStatus.NOT_STARTED) && (
                <Button size="sm" onClick={onAddTask}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Day Plan
                </Button>
              )}
            </div>

            {stage.dayPlans.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No day plans created yet</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={onAddTask}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Day Plan
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {stage.dayPlans.map((dayPlan) => (
                  <DayPlanCard
                    key={dayPlan.id}
                    dayPlan={dayPlan}
                    onClick={() => onViewDayPlan(dayPlan)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Day Plan Card Component
interface DayPlanCardProps {
  dayPlan: DayPlan;
  onClick: () => void;
}

const DayPlanCard: React.FC<DayPlanCardProps> = ({ dayPlan, onClick }) => {
  const statusColors = getStatusColor(dayPlan.status);
  const isToday = dayPlan.status === DayPlanStatus.IN_PROGRESS;
  const isCompleted = dayPlan.status === DayPlanStatus.COMPLETED;
  const completedTasks = dayPlan.tasks.filter(
    (t) => t.status === DayTaskStatus.COMPLETED
  ).length;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
        isToday
          ? "border-orange-300 bg-gradient-to-br from-orange-50 to-white"
          : isCompleted
          ? "border-green-200 bg-gradient-to-br from-green-50/50 to-white"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
              isCompleted
                ? "bg-green-500 text-white"
                : isToday
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {dayPlan.dayNumber}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Day {dayPlan.dayNumber}</p>
            <p className="text-xs text-gray-500">{formatDate(dayPlan.date)}</p>
          </div>
        </div>
        <Badge className={`${statusColors.bg} ${statusColors.text} text-xs`}>
          {dayPlan.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Tasks Summary */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tasks</span>
          <span className="font-semibold text-gray-900">
            {completedTasks}/{dayPlan.tasks.length}
          </span>
        </div>
        {dayPlan.tasks.length > 0 && (
          <Progress
            value={(completedTasks / dayPlan.tasks.length) * 100}
            className="h-1.5 mt-2"
          />
        )}
      </div>

      {/* Workers & Cost */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {dayPlan.totalWorkers} workers
        </span>
        <span>{formatCurrency(dayPlan.totalCost)}</span>
      </div>

      {/* View Button */}
      <Button
        variant="secondary"
        size="sm"
        className="w-full mt-3 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Eye className="w-3 h-3 mr-1" />
        View Details
      </Button>
    </div>
  );
};

export default ProjectStagesSection;
