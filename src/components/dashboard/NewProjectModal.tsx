import React, { useState } from "react";
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
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    client: "",
    location: "",
    budget: "",
    startDate: "",
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
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProjectFormData, string>>
  >({});

  const handleChange = (
    field: keyof ProjectFormData,
    value: string | string[],
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
    if (!formData.startDate) newErrors.startDate = "Start date is required";
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
        startDate: "",
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
      });
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 max-h-[85vh] flex flex-col transform transition-all">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Create New Project
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the project details below
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form - Scrollable */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div
                className="overflow-y-scroll flex-1 p-6 space-y-6 force-scrollbar"
                style={{ maxHeight: "calc(85vh - 180px)" }}
              >
                {/* Project Name & Client */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Project Name *
                      </div>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="e.g., Modern 3BHK Interior"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Client Name *
                      </div>
                    </label>
                    <Input
                      value={formData.client}
                      onChange={(e) => handleChange("client", e.target.value)}
                      placeholder="e.g., Sharma Family"
                      className={errors.client ? "border-red-500" : ""}
                    />
                    {errors.client && (
                      <p className="text-red-500 text-xs mt-1">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Project Type
                      </div>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Residential", "Commercial", "Renovation"].map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleChange("projectType", type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              formData.projectType === type
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {type}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Low", "Medium", "High", "Urgent"].map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => handleChange("priority", priority)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.priority === priority
                              ? priority === "Urgent"
                                ? "bg-red-500 text-white"
                                : priority === "High"
                                  ? "bg-orange-500 text-white"
                                  : "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                      onChange={(e) => handleChange("location", e.target.value)}
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
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4" />
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
                        onChange={(e) => handleChange("floors", e.target.value)}
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
                        onChange={(e) => handleChange("rooms", e.target.value)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Due Date *
                      </div>
                    </label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleChange("dueDate", e.target.value)}
                      className={errors.dueDate ? "border-red-500" : ""}
                    />
                    {errors.dueDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.dueDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Stage
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {stages.map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => handleChange("stage", stage)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.stage === stage
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
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

              {/* Actions - Fixed at bottom */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-6 bg-orange-500 hover:bg-orange-600"
                >
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
