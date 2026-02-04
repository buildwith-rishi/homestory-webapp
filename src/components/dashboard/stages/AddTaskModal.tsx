import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Paintbrush,
  Wrench,
  Hammer,
  Zap,
  LayoutGrid,
  Briefcase,
} from "lucide-react";
import { Button, Badge } from "../../ui";
import {
  ProjectStageWithDays,
  Worker,
  WorkerCategory,
  AssignTaskRequest,
} from "../../../types";

// Helper functions
const getWorkerCategoryIcon = (category: WorkerCategory) => {
  const icons: Record<WorkerCategory, React.ReactNode> = {
    [WorkerCategory.PAINTER]: <Paintbrush className="w-4 h-4" />,
    [WorkerCategory.CARPENTER]: <Hammer className="w-4 h-4" />,
    [WorkerCategory.PLUMBER]: <Wrench className="w-4 h-4" />,
    [WorkerCategory.ELECTRICIAN]: <Zap className="w-4 h-4" />,
    [WorkerCategory.MASON]: <LayoutGrid className="w-4 h-4" />,
    [WorkerCategory.TILER]: <LayoutGrid className="w-4 h-4" />,
    [WorkerCategory.FABRICATOR]: <Briefcase className="w-4 h-4" />,
    [WorkerCategory.HVAC_TECHNICIAN]: <Wrench className="w-4 h-4" />,
    [WorkerCategory.FLOORING_SPECIALIST]: <LayoutGrid className="w-4 h-4" />,
    [WorkerCategory.GLASS_WORKER]: <LayoutGrid className="w-4 h-4" />,
    [WorkerCategory.CIVIL_WORKER]: <Hammer className="w-4 h-4" />,
    [WorkerCategory.SUPERVISOR]: <Users className="w-4 h-4" />,
    [WorkerCategory.HELPER]: <Users className="w-4 h-4" />,
    [WorkerCategory.OTHER]: <Briefcase className="w-4 h-4" />,
  };
  return icons[category];
};

const getWorkerCategoryColor = (category: WorkerCategory) => {
  const colors: Record<WorkerCategory, { bg: string; text: string; border: string }> = {
    [WorkerCategory.PAINTER]: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
    [WorkerCategory.CARPENTER]: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    [WorkerCategory.PLUMBER]: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    [WorkerCategory.ELECTRICIAN]: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
    [WorkerCategory.MASON]: { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-200" },
    [WorkerCategory.TILER]: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
    [WorkerCategory.FABRICATOR]: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
    [WorkerCategory.HVAC_TECHNICIAN]: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
    [WorkerCategory.FLOORING_SPECIALIST]: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    [WorkerCategory.GLASS_WORKER]: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
    [WorkerCategory.CIVIL_WORKER]: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    [WorkerCategory.SUPERVISOR]: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
    [WorkerCategory.HELPER]: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
    [WorkerCategory.OTHER]: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  };
  return colors[category];
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

// Common task templates for quick selection
const taskTemplates: { title: string; category: WorkerCategory; hours: number }[] = [
  { title: "Wall Painting - Primer Coat", category: WorkerCategory.PAINTER, hours: 8 },
  { title: "Wall Painting - Final Coat", category: WorkerCategory.PAINTER, hours: 8 },
  { title: "Ceiling Painting", category: WorkerCategory.PAINTER, hours: 6 },
  { title: "Texture Work", category: WorkerCategory.PAINTER, hours: 10 },
  { title: "Wardrobe Installation", category: WorkerCategory.CARPENTER, hours: 8 },
  { title: "Kitchen Cabinet Work", category: WorkerCategory.CARPENTER, hours: 10 },
  { title: "Door Frame Installation", category: WorkerCategory.CARPENTER, hours: 4 },
  { title: "False Ceiling Framework", category: WorkerCategory.CARPENTER, hours: 8 },
  { title: "Plumbing Line Laying", category: WorkerCategory.PLUMBER, hours: 8 },
  { title: "Bathroom Fixture Installation", category: WorkerCategory.PLUMBER, hours: 6 },
  { title: "Kitchen Sink Installation", category: WorkerCategory.PLUMBER, hours: 4 },
  { title: "Water Tank Setup", category: WorkerCategory.PLUMBER, hours: 6 },
  { title: "Electrical Wiring", category: WorkerCategory.ELECTRICIAN, hours: 8 },
  { title: "Switch Board Installation", category: WorkerCategory.ELECTRICIAN, hours: 4 },
  { title: "Light Fixture Installation", category: WorkerCategory.ELECTRICIAN, hours: 6 },
  { title: "Panel Box Setup", category: WorkerCategory.ELECTRICIAN, hours: 4 },
  { title: "Floor Tile Laying", category: WorkerCategory.TILER, hours: 8 },
  { title: "Wall Tile Installation", category: WorkerCategory.TILER, hours: 8 },
  { title: "Bathroom Tiling", category: WorkerCategory.TILER, hours: 10 },
  { title: "Kitchen Backsplash", category: WorkerCategory.TILER, hours: 6 },
  { title: "Brick Work", category: WorkerCategory.MASON, hours: 8 },
  { title: "Plastering", category: WorkerCategory.MASON, hours: 8 },
  { title: "Concrete Work", category: WorkerCategory.MASON, hours: 10 },
];

interface AddTaskModalProps {
  stage: ProjectStageWithDays;
  workers: Worker[];
  onClose: () => void;
  onAddTask: (task: AssignTaskRequest) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  stage,
  workers,
  onClose,
  onAddTask,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState<WorkerCategory | null>(null);
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<WorkerCategory | "ALL">("ALL");

  // Filter workers based on search and category
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || worker.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate total cost
  const totalCost = selectedWorkers.reduce((sum, workerId) => {
    const worker = workers.find((w) => w.id === workerId);
    return sum + (worker?.dailyRate || 0);
  }, 0);

  const handleSelectTemplate = (template: typeof taskTemplates[0]) => {
    setTaskTitle(template.title);
    setTaskCategory(template.category);
    setEstimatedHours(template.hours);
    setFilterCategory(template.category);
  };

  const handleToggleWorker = (workerId: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleSubmit = () => {
    if (!taskTitle || !taskCategory || selectedWorkers.length === 0 || !selectedDate) {
      return;
    }

    // Find the day plan for the selected date, or create a new day plan ID
    const existingDayPlan = stage.dayPlans.find((dp) => dp.date === selectedDate);
    const dayPlanId = existingDayPlan?.id || `new-day-${selectedDate}`;

    onAddTask({
      dayPlanId,
      taskTitle,
      taskDescription: taskDescription || undefined,
      category: taskCategory,
      workerIds: selectedWorkers,
      estimatedHours,
      startTime: startTime || undefined,
    });
  };

  const canProceedStep1 = taskTitle && taskCategory;
  const canProceedStep2 = selectedWorkers.length > 0;
  const canSubmit = canProceedStep1 && canProceedStep2 && selectedDate;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add New Task</h2>
              <p className="text-sm text-gray-500 mt-1">
                {stage.phaseName} - Day Plan
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-4 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-2 ${s <= step ? "text-orange-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                    s < step
                      ? "bg-orange-500 border-orange-500 text-white"
                      : s === step
                      ? "border-orange-500 text-orange-600"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {s === 1 ? "Task Details" : s === 2 ? "Assign Workers" : "Schedule"}
                </span>
                {s < 3 && (
                  <div className={`w-12 h-0.5 ${s < step ? "bg-orange-500" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Task Details */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Quick Templates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Quick Templates
                </h3>
                <div className="flex flex-wrap gap-2">
                  {taskTemplates.slice(0, 12).map((template, index) => {
                    const categoryColors = getWorkerCategoryColor(template.category);
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectTemplate(template)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          taskTitle === template.title
                            ? "ring-2 ring-orange-500 ring-offset-1"
                            : ""
                        } ${categoryColors.bg} ${categoryColors.text}`}
                      >
                        {template.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Wall Painting - Living Room"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Add any specific instructions or notes..."
                />
              </div>

              {/* Task Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Category *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {Object.values(WorkerCategory).map((category) => {
                    const categoryColors = getWorkerCategoryColor(category);
                    const isSelected = taskCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setTaskCategory(category);
                          setFilterCategory(category);
                        }}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? `${categoryColors.border} ${categoryColors.bg} ring-2 ring-orange-500`
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className={`${isSelected ? categoryColors.text : "text-gray-500"}`}>
                          {getWorkerCategoryIcon(category)}
                        </div>
                        <span
                          className={`text-xs font-medium capitalize ${
                            isSelected ? categoryColors.text : "text-gray-600"
                          }`}
                        >
                          {category.toLowerCase().replace("_", " ")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-20 text-center px-3 py-2 bg-gray-100 rounded-lg font-semibold">
                    {estimatedHours}h
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Assign Workers */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Search workers..."
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) =>
                    setFilterCategory(e.target.value as WorkerCategory | "ALL")
                  }
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="ALL">All Categories</option>
                  {Object.values(WorkerCategory).map((category) => (
                    <option key={category} value={category}>
                      {category.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Workers */}
              {selectedWorkers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Selected Workers ({selectedWorkers.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkers.map((workerId) => {
                      const worker = workers.find((w) => w.id === workerId);
                      if (!worker) return null;
                      const categoryColors = getWorkerCategoryColor(worker.category);
                      return (
                        <div
                          key={workerId}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${categoryColors.bg} ${categoryColors.text}`}
                        >
                          <span className="text-sm font-medium">{worker.name}</span>
                          <button
                            onClick={() => handleToggleWorker(workerId)}
                            className="hover:bg-black/10 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Total Cost: <span className="font-semibold">{formatCurrency(totalCost)}</span> / day
                  </p>
                </div>
              )}

              {/* Workers List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Available Workers
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredWorkers.map((worker) => {
                    const isSelected = selectedWorkers.includes(worker.id);
                    const categoryColors = getWorkerCategoryColor(worker.category);
                    return (
                      <div
                        key={worker.id}
                        onClick={() => handleToggleWorker(worker.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? `${categoryColors.border} ${categoryColors.bg}`
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold ${
                              isSelected
                                ? "bg-white text-gray-800"
                                : "bg-gradient-to-br from-gray-600 to-gray-700 text-white"
                            }`}
                          >
                            {worker.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{worker.name}</h4>
                              {isSelected && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={`text-xs ${categoryColors.bg} ${categoryColors.text}`}
                              >
                                {getWorkerCategoryIcon(worker.category)}
                                <span className="ml-1 capitalize">
                                  {worker.category.toLowerCase().replace("_", " ")}
                                </span>
                              </Badge>
                              {worker.rating && (
                                <span className="text-xs text-gray-500">
                                  ⭐ {worker.rating}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(worker.dailyRate)}
                            </p>
                            <p className="text-xs text-gray-500">per day</p>
                          </div>
                        </div>
                        {worker.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {worker.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredWorkers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No workers found matching your criteria
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Task Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Task</p>
                    <p className="font-medium text-gray-900">{taskTitle}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {taskCategory?.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Workers</p>
                    <p className="font-medium text-gray-900">{selectedWorkers.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Est. Hours</p>
                    <p className="font-medium text-gray-900">{estimatedHours}h</p>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Select Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Cost Summary */}
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-3">Cost Estimate</h3>
                <div className="flex items-center justify-between">
                  <span className="text-orange-700">Daily Labor Cost</span>
                  <span className="text-xl font-bold text-orange-800">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                if (step > 1) {
                  setStep((step - 1) as 1 | 2 | 3);
                } else {
                  onClose();
                }
              }}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
