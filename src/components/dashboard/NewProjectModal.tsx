import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
  X,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Phone,
  Mail,
  Building2,
  Layers,
  Home,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { Button, Input } from "../ui";

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
  projectType: string;
  squareFeet: string;
  floors: string;
  rooms: string;
  clientPhone: string;
  clientEmail: string;
  priority: string;
  status: string;
  pipelineType: "design-only" | "design-execution" | "";
  // Design Phase Fields
  designStyle: string;
  colorScheme: string;
  designBudget: string;
  designDeadline: string;
  moodboardRequired: boolean;
  threeDVisualsRequired: boolean;
  floorPlanRequired: boolean;
  // Execution Phase Fields (only for design-execution)
  executionBudget: string;
  executionDeadline: string;
  contractorAssigned: string;
  materialSourcingRequired: boolean;
  siteSupervisionRequired: boolean;
  qualityChecksRequired: boolean;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: ProjectFormData) => void;
}

const stages = ["Requirements", "Design", "Material", "Execution", "Handover"];
const teamMembers = [
  { id: "AR", name: "Arjun Reddy" },
  { id: "PK", name: "Priya Kumar" },
  { id: "RS", name: "Rahul Sharma" },
  { id: "MG", name: "Meena Gupta" },
  { id: "SK", name: "Suresh Kumar" },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    client: "",
    location: "",
    budget: "",
    startDate: getTodayDate(),
    dueDate: "",
    stage: "Requirements",
    description: "",
    team: [],
    projectType: "Residential",
    squareFeet: "",
    floors: "",
    rooms: "",
    clientPhone: "",
    clientEmail: "",
    priority: "Medium",
    status: "Lead",
    pipelineType: "",
    // Design Phase Fields
    designStyle: "",
    colorScheme: "",
    designBudget: "",
    designDeadline: "",
    moodboardRequired: false,
    threeDVisualsRequired: false,
    floorPlanRequired: false,
    // Execution Phase Fields
    executionBudget: "",
    executionDeadline: "",
    contractorAssigned: "",
    materialSourcingRequired: false,
    siteSupervisionRequired: false,
    qualityChecksRequired: false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProjectFormData, string>>
  >({});

  const handleChange = (
    field: keyof ProjectFormData,
    value: string | string[] | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleTeamMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      team: prev.team.includes(memberId)
        ? prev.team.filter((id) => id !== memberId)
        : [...prev.team, memberId],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Project name is required";
    if (!formData.client.trim()) newErrors.client = "Client name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.budget.trim()) newErrors.budget = "Budget is required";
    // Start date validation removed since it defaults to today
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";
    if (formData.team.length === 0)
      newErrors.team = "Select at least one team member";

    // Validate date order
    if (
      formData.startDate &&
      formData.dueDate &&
      new Date(formData.startDate) >= new Date(formData.dueDate)
    ) {
      newErrors.dueDate = "Due date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      // Reset form
      setFormData({
        name: "",
        client: "",
        location: "",
        budget: "",
        startDate: getTodayDate(),
        dueDate: "",
        stage: "Requirements",
        description: "",
        team: [],
        projectType: "Residential",
        squareFeet: "",
        floors: "",
        rooms: "",
        clientPhone: "",
        clientEmail: "",
        priority: "Medium",
        status: "Lead",
        pipelineType: "",
        // Design Phase Fields
        designStyle: "",
        colorScheme: "",
        designBudget: "",
        designDeadline: "",
        moodboardRequired: false,
        threeDVisualsRequired: false,
        floorPlanRequired: false,
        // Execution Phase Fields
        executionBudget: "",
        executionDeadline: "",
        contractorAssigned: "",
        materialSourcingRequired: false,
        siteSupervisionRequired: false,
        qualityChecksRequired: false,
      });
      setErrors({});
      setCurrentStep(1);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      // Step 1: Basic Info validation - only validate fields shown in step 1
      const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};

      if (!formData.name.trim()) newErrors.name = "Project name is required";
      if (!formData.client.trim()) newErrors.client = "Client name is required";
      if (!formData.location.trim())
        newErrors.location = "Location is required";
      if (!formData.budget.trim()) newErrors.budget = "Budget is required";
      if (formData.team.length === 0)
        newErrors.team = "Select at least one team member";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } else if (currentStep === 2) {
      if (!formData.pipelineType) {
        setErrors({ pipelineType: "Please select a pipeline type" });
        return false;
      }
      return true;
    } else if (currentStep === 3) {
      const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};
      if (!formData.designStyle)
        newErrors.designStyle = "Design style is required";
      if (!formData.designBudget)
        newErrors.designBudget = "Design budget is required";
      if (!formData.designDeadline)
        newErrors.designDeadline = "Design deadline is required";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } else if (
      currentStep === 4 &&
      formData.pipelineType === "design-execution"
    ) {
      const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};
      if (!formData.executionBudget)
        newErrors.executionBudget = "Execution budget is required";
      if (!formData.executionDeadline)
        newErrors.executionDeadline = "Execution deadline is required";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: "Basic Info", desc: "Project & Client Details" },
    { number: 2, title: "Pipeline", desc: "Choose Project Type" },
    { number: 3, title: "Design Details", desc: "Design Specifications" },
    { number: 4, title: "Review", desc: "Confirm Details" },
  ];

  const totalSteps =
    formData.pipelineType === "design-execution"
      ? 5
      : formData.pipelineType === "design-only"
        ? 4
        : 4;

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop - covers entire viewport */}
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
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          pointerEvents: "none",
          overflow: "auto",
        }}
      >
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-6 max-h-[92vh] flex flex-col transform transition-all border border-gray-100"
          style={{ pointerEvents: "auto" }}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 bg-gradient-to-br from-orange-50 via-white to-orange-50/30 rounded-t-3xl border-b border-orange-100">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Create New Project
              </h2>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">
                Step {currentStep} of {totalSteps} ·{" "}
                {currentStep <= steps.length
                  ? steps[currentStep - 1]?.desc
                  : "Execution Details"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-all p-2.5 hover:bg-white/80 rounded-xl hover:shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-8 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between max-w-full mx-auto">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        currentStep >= step.number
                          ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 scale-110"
                          : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                      }`}
                    >
                      {currentStep > step.number ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <p
                      className={`text-xs font-semibold mt-2.5 text-center transition-colors ${
                        currentStep >= step.number
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-1 bg-gray-100 mx-3 -mt-8 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full ${
                          currentStep > step.number ? "w-full" : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form - Scrollable */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div
              className="overflow-y-scroll flex-1 px-8 py-6 space-y-6 force-scrollbar"
              style={{ maxHeight: "calc(92vh - 240px)" }}
            >
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-5 max-w-full mx-auto">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-blue-800 font-semibold flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      Let's start with the basic project and client information
                    </p>
                  </div>

                  {/* Project Name & Client */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          Project Name *
                        </div>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="e.g., Modern 3BHK Interior"
                        className={`transition-all ${errors.name ? "border-red-500 ring-2 ring-red-100" : "focus:ring-2 focus:ring-orange-100"}`}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-500" />
                          Client Name *
                        </div>
                      </label>
                      <Input
                        value={formData.client}
                        onChange={(e) => handleChange("client", e.target.value)}
                        placeholder="e.g., Sharma Family"
                        className={`transition-all ${errors.client ? "border-red-500 ring-2 ring-red-100" : "focus:ring-2 focus:ring-orange-100"}`}
                      />
                      {errors.client && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium">
                          {errors.client}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Client Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Client Phone Number
                        </div>
                      </label>
                      <Input
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) =>
                          handleChange("clientPhone", e.target.value)
                        }
                        placeholder="e.g., +91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Client Email
                        </div>
                      </label>
                      <Input
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) =>
                          handleChange("clientEmail", e.target.value)
                        }
                        placeholder="e.g., client@example.com"
                      />
                    </div>
                  </div>

                  {/* Project Type & Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-orange-500" />
                          Project Type
                        </div>
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {["Residential", "Commercial", "Renovation"].map(
                          (type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleChange("projectType", type)}
                              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                                formData.projectType === type
                                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-200"
                                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                              }`}
                            >
                              {type}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        Priority Level
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {["Low", "Medium", "High", "Urgent"].map((priority) => (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => handleChange("priority", priority)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                              formData.priority === priority
                                ? priority === "Urgent"
                                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200"
                                  : priority === "High"
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-200"
                                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                            }`}
                          >
                            {priority}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Location & Budget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location *
                        </div>
                      </label>
                      <Input
                        value={formData.location}
                        onChange={(e) =>
                          handleChange("location", e.target.value)
                        }
                        placeholder="e.g., HSR Layout, Bangalore"
                        className={errors.location ? "border-red-500" : ""}
                      />
                      {errors.location && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.location}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Budget *
                        </div>
                      </label>
                      <Input
                        value={formData.budget}
                        onChange={(e) => handleChange("budget", e.target.value)}
                        placeholder="e.g., ₹28L"
                        className={errors.budget ? "border-red-500" : ""}
                      />
                      {errors.budget && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.budget}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Project Specifications */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-5 rounded-xl border border-gray-200/60 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Home className="w-4 h-4 text-orange-500" />
                      Project Specifications (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Square Feet
                        </label>
                        <Input
                          type="number"
                          value={formData.squareFeet}
                          onChange={(e) =>
                            handleChange("squareFeet", e.target.value)
                          }
                          placeholder="e.g., 1200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Floors
                          </div>
                        </label>
                        <Input
                          type="number"
                          value={formData.floors}
                          onChange={(e) =>
                            handleChange("floors", e.target.value)
                          }
                          placeholder="e.g., 2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rooms
                        </label>
                        <Input
                          type="number"
                          value={formData.rooms}
                          onChange={(e) =>
                            handleChange("rooms", e.target.value)
                          }
                          placeholder="e.g., 3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Start Date & Due Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Start Date *
                        </div>
                      </label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          handleChange("startDate", e.target.value)
                        }
                        className={errors.startDate ? "border-red-500" : ""}
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.startDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Assign Team Members *
                      </div>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {teamMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => toggleTeamMember(member.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                            formData.team.includes(member.id)
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              formData.team.includes(member.id)
                                ? "bg-orange-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {member.id}
                          </div>
                          <span className="text-sm font-medium">
                            {member.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    {errors.team && (
                      <p className="text-red-500 text-xs mt-1">{errors.team}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      placeholder="Add any additional details about the project..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Pipeline Selection */}
              {currentStep === 2 && (
                <div className="space-y-5 max-w-full mx-auto">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-blue-800 font-semibold flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      Choose your project pipeline
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pipeline A: Design Only */}
                    <button
                      type="button"
                      onClick={() =>
                        handleChange("pipelineType", "design-only")
                      }
                      className={`p-7 rounded-2xl border-2 text-left transition-all duration-300 ${
                        formData.pipelineType === "design-only"
                          ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50 shadow-xl shadow-orange-200/50 scale-[1.02]"
                          : "border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-md ${
                            formData.pipelineType === "design-only"
                              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-300"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <svg
                            className="w-7 h-7"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                            />
                          </svg>
                        </div>
                        {formData.pipelineType === "design-only" && (
                          <CheckCircle2 className="w-7 h-7 text-orange-500" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Pipeline A: Design Only
                      </h3>
                      <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                        Complete design services from concept to final drawings
                      </p>
                      <ul className="space-y-2.5 text-sm text-gray-600">
                        <li className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Initial Consultation & Site Visit
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Design Development & Drawings
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Final Design Delivery
                        </li>
                      </ul>
                    </button>

                    {/* Pipeline B: Design + Execution */}
                    <button
                      type="button"
                      onClick={() =>
                        handleChange("pipelineType", "design-execution")
                      }
                      className={`p-7 rounded-2xl border-2 text-left transition-all duration-300 ${
                        formData.pipelineType === "design-execution"
                          ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50 shadow-xl shadow-orange-200/50 scale-[1.02]"
                          : "border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-md ${
                            formData.pipelineType === "design-execution"
                              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-300"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <svg
                            className="w-7 h-7"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                        {formData.pipelineType === "design-execution" && (
                          <CheckCircle2 className="w-7 h-7 text-orange-500" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Pipeline B: Design + Execution
                      </h3>
                      <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                        End-to-end service from design to project completion
                      </p>
                      <ul className="space-y-2.5 text-sm text-gray-600">
                        <li className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Full Design Services (Pipeline A)
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Project Execution & Management
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Final Delivery & Handover
                        </li>
                      </ul>
                    </button>
                  </div>

                  {formData.pipelineType && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {formData.pipelineType === "design-only"
                          ? "Pipeline A"
                          : "Pipeline B"}{" "}
                        selected
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Design Details */}
              {currentStep === 3 && (
                <div className="space-y-5 max-w-full mx-auto">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-blue-800 font-semibold flex items-center gap-2">
                      <span className="text-lg">🎨</span>
                      {formData.pipelineType === "design-only"
                        ? "Configure your design requirements"
                        : "Configure comprehensive design & planning details"}
                    </p>
                  </div>

                  {/* Design Style */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      Design Style *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        "Modern",
                        "Contemporary",
                        "Traditional",
                        "Minimalist",
                        "Industrial",
                        "Scandinavian",
                      ].map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => handleChange("designStyle", style)}
                          className={`px-5 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-sm border-2 ${
                            formData.designStyle === style
                              ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-700 shadow-orange-200"
                              : "border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md bg-white"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                    {errors.designStyle && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">
                        {errors.designStyle}
                      </p>
                    )}
                  </div>

                  {/* Color Scheme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Color Scheme
                    </label>
                    <Input
                      value={formData.colorScheme}
                      onChange={(e) =>
                        handleChange("colorScheme", e.target.value)
                      }
                      placeholder="e.g., Neutral tones with blue accents"
                    />
                  </div>

                  {/* Design Budget & Deadline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Design Phase Budget *
                        </div>
                      </label>
                      <Input
                        value={formData.designBudget}
                        onChange={(e) =>
                          handleChange("designBudget", e.target.value)
                        }
                        placeholder="e.g., ₹5L"
                        className={errors.designBudget ? "border-red-500" : ""}
                      />
                      {errors.designBudget && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.designBudget}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Design Completion Deadline *
                        </div>
                      </label>
                      <Input
                        type="date"
                        value={formData.designDeadline}
                        onChange={(e) =>
                          handleChange("designDeadline", e.target.value)
                        }
                        className={
                          errors.designDeadline ? "border-red-500" : ""
                        }
                      />
                      {errors.designDeadline && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.designDeadline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Design Deliverables */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-5 rounded-xl border border-gray-200/60 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-500" />
                      Required Deliverables
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.moodboardRequired}
                          onChange={(e) =>
                            handleChange("moodboardRequired", e.target.checked)
                          }
                          className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            Moodboard
                          </p>
                          <p className="text-xs text-gray-500">
                            Visual inspiration and concept board
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.threeDVisualsRequired}
                          onChange={(e) =>
                            handleChange(
                              "threeDVisualsRequired",
                              e.target.checked,
                            )
                          }
                          className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            3D Visuals & Renders
                          </p>
                          <p className="text-xs text-gray-500">
                            Photorealistic 3D renderings
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.floorPlanRequired}
                          onChange={(e) =>
                            handleChange("floorPlanRequired", e.target.checked)
                          }
                          className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            Detailed Floor Plans
                          </p>
                          <p className="text-xs text-gray-500">
                            Technical drawings and measurements
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Additional Fields for Design + Execution Pipeline */}
                  {formData.pipelineType === "design-execution" && (
                    <>
                      {/* Space Planning & Layout */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 rounded-xl border border-purple-200/60 shadow-sm">
                        <h3 className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-600" />
                          Advanced Design Planning
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Space Planning Requirements
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) =>
                                handleChange("description", e.target.value)
                              }
                              placeholder="Describe special requirements like open kitchen, home office, entertainment area, etc."
                              rows={3}
                              className="w-full px-4 py-2.5 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expected Revisions
                              </label>
                              <select className="w-full px-4 py-2.5 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                                <option>1-2 Revisions</option>
                                <option>3-4 Revisions</option>
                                <option>5+ Revisions</option>
                                <option>Unlimited Revisions</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Client Involvement Level
                              </label>
                              <select className="w-full px-4 py-2.5 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                                <option>Minimal (Trust Designer)</option>
                                <option>Moderate (Regular Updates)</option>
                                <option>High (Frequent Collaboration)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Material & Finishes Preferences */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-xl border border-amber-200/60 shadow-sm">
                        <h3 className="text-sm font-bold text-amber-900 mb-4 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-600" />
                          Material & Finish Preferences
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preferred Material Quality
                            </label>
                            <div className="flex flex-wrap gap-2.5">
                              {[
                                "Premium",
                                "Mid-Range",
                                "Budget-Friendly",
                                "Mixed",
                              ].map((quality) => (
                                <button
                                  key={quality}
                                  type="button"
                                  className="px-4 py-2 rounded-lg text-sm font-medium border-2 border-amber-200 hover:border-amber-400 bg-white hover:bg-amber-50 text-gray-700 transition-all"
                                >
                                  {quality}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Flooring Preference
                              </label>
                              <Input
                                placeholder="e.g., Hardwood, Tiles, Marble"
                                className="border-amber-200 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Wall Finish Preference
                              </label>
                              <Input
                                placeholder="e.g., Paint, Wallpaper, Texture"
                                className="border-amber-200 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Furniture & Decor Requirements */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-5 rounded-xl border border-green-200/60 shadow-sm">
                        <h3 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                          <Home className="w-4 h-4 text-green-600" />
                          Furniture & Decor
                        </h3>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                Custom Furniture Design
                              </p>
                              <p className="text-xs text-gray-500">
                                Bespoke furniture pieces tailored to space
                              </p>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                Lighting Design Plan
                              </p>
                              <p className="text-xs text-gray-500">
                                Comprehensive lighting layout and fixtures
                              </p>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                Soft Furnishings & Decor
                              </p>
                              <p className="text-xs text-gray-500">
                                Curtains, cushions, rugs, and accessories
                              </p>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                Art & Decor Sourcing
                              </p>
                              <p className="text-xs text-gray-500">
                                Selection and procurement of art pieces
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 4: Execution Details (only for design-execution) */}
              {currentStep === 4 &&
                formData.pipelineType === "design-execution" && (
                  <div className="space-y-6 max-w-full mx-auto">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 font-medium">
                        🏗️ Configure execution and project management details
                      </p>
                    </div>

                    {/* Execution Budget & Deadline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Execution Phase Budget *
                          </div>
                        </label>
                        <Input
                          value={formData.executionBudget}
                          onChange={(e) =>
                            handleChange("executionBudget", e.target.value)
                          }
                          placeholder="e.g., ₹23L"
                          className={
                            errors.executionBudget ? "border-red-500" : ""
                          }
                        />
                        {errors.executionBudget && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.executionBudget}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Execution Completion Deadline *
                          </div>
                        </label>
                        <Input
                          type="date"
                          value={formData.executionDeadline}
                          onChange={(e) =>
                            handleChange("executionDeadline", e.target.value)
                          }
                          className={
                            errors.executionDeadline ? "border-red-500" : ""
                          }
                        />
                        {errors.executionDeadline && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.executionDeadline}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contractor Assignment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Assigned Contractor/Supervisor
                        </div>
                      </label>
                      <Input
                        value={formData.contractorAssigned}
                        onChange={(e) =>
                          handleChange("contractorAssigned", e.target.value)
                        }
                        placeholder="e.g., Rajesh Construction Team"
                      />
                    </div>

                    {/* Execution Services */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Execution Services Required
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.materialSourcingRequired}
                            onChange={(e) =>
                              handleChange(
                                "materialSourcingRequired",
                                e.target.checked,
                              )
                            }
                            className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Material Sourcing
                            </p>
                            <p className="text-xs text-gray-500">
                              Procurement of all materials and furnishings
                            </p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.siteSupervisionRequired}
                            onChange={(e) =>
                              handleChange(
                                "siteSupervisionRequired",
                                e.target.checked,
                              )
                            }
                            className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              On-Site Supervision
                            </p>
                            <p className="text-xs text-gray-500">
                              Daily site visits and progress monitoring
                            </p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.qualityChecksRequired}
                            onChange={(e) =>
                              handleChange(
                                "qualityChecksRequired",
                                e.target.checked,
                              )
                            }
                            className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Quality Checks & Inspections
                            </p>
                            <p className="text-xs text-gray-500">
                              Regular quality audits and final inspection
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

              {/* Step 5 (or 4): Review & Confirm */}
              {((currentStep === 4 &&
                formData.pipelineType === "design-only") ||
                (currentStep === 5 &&
                  formData.pipelineType === "design-execution")) && (
                <div className="space-y-6 max-w-full mx-auto">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium">
                      ✅ Review your project details before creating
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 ml-8">
                        <div>
                          <p className="text-xs text-gray-500">Project Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Client Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.client}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Priority</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.priority}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-sm font-medium text-gray-900">
                            ₹
                            {formData.budget
                              ? Number(formData.budget).toLocaleString()
                              : "0"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Due Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.dueDate || "Not set"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Stage</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.stage}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Team Members</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.team.length} member(s) assigned
                          </p>
                        </div>
                        {formData.description && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Description</p>
                            <p className="text-sm text-gray-700">
                              {formData.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pipeline Selection */}
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        Pipeline Type
                      </h3>
                      <div className="ml-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <span className="text-2xl">
                            {formData.pipelineType === "design-only"
                              ? "🎨"
                              : "🏗️"}
                          </span>
                          <span className="text-sm font-medium text-orange-900">
                            {formData.pipelineType === "design-only"
                              ? "Pipeline A: Design Only"
                              : "Pipeline B: Design + Execution"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Design Details */}
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                          3
                        </span>
                        Design Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 ml-8">
                        <div>
                          <p className="text-xs text-gray-500">Design Style</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.designStyle || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Color Scheme</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.colorScheme || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Design Budget</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.designBudget || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Design Deadline
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formData.designDeadline || "Not set"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Deliverables
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {formData.moodboardRequired && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                Moodboard
                              </span>
                            )}
                            {formData.threeDVisualsRequired && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                3D Visuals
                              </span>
                            )}
                            {formData.floorPlanRequired && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                Floor Plans
                              </span>
                            )}
                            {!formData.moodboardRequired &&
                              !formData.threeDVisualsRequired &&
                              !formData.floorPlanRequired && (
                                <span className="text-sm text-gray-500">
                                  None selected
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Execution Details (only for design-execution) */}
                    {formData.pipelineType === "design-execution" && (
                      <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                            4
                          </span>
                          Execution Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 ml-8">
                          <div>
                            <p className="text-xs text-gray-500">
                              Execution Budget
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {formData.executionBudget || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Execution Deadline
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {formData.executionDeadline || "Not set"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">
                              Assigned Contractor
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {formData.contractorAssigned || "Not assigned"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Services Required
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {formData.materialSourcingRequired && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                  Material Sourcing
                                </span>
                              )}
                              {formData.siteSupervisionRequired && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                  Site Supervision
                                </span>
                              )}
                              {formData.qualityChecksRequired && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                  Quality Checks
                                </span>
                              )}
                              {!formData.materialSourcingRequired &&
                                !formData.siteSupervisionRequired &&
                                !formData.qualityChecksRequired && (
                                  <span className="text-sm text-gray-500">
                                    None selected
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex items-center justify-between gap-4 px-8 py-5 border-t border-gray-200 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-3">
                {currentStep < totalSteps ? (
                  <>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="secondary"
                      className="px-7 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="px-7 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="secondary"
                      className="px-7 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="px-7 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
