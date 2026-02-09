import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  KanbanBoard,
  KanbanData,
  KanbanTask,
} from "../../components/kanban/KanbanBoard";
import { useProjectStore } from "../../stores/projectStore";
import ProjectAPI from "../../services/projectApi";
import { Project } from "../../types";
import {
  Calendar,
  DollarSign,
  MapPin,
  User,
  TrendingUp,
  ArrowLeft,
  List,
  FileText,
} from "lucide-react";
import { Button } from "../../components/ui";
import toast from "react-hot-toast";

const PROJECT_ASSIGNEES = [
  { id: "unassigned", name: "Unassigned" },
  { id: "design-lead", name: "Design Lead" },
  { id: "project-manager", name: "Project Manager" },
  { id: "site-supervisor", name: "Site Supervisor" },
  { id: "operations-team", name: "Operations Team" },
];

const ProjectsKanban: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading, fetchProjects } = useProjectStore();

  // Generate project selection options for the dropdown
  const projectSelectOptions = useMemo(() => {
    return projects.map((project) => ({
      value: `project-${project.id}`,
      label: project.projectName || project.name || `Project ${project.id}`,
      metadata: project as unknown as Record<string, unknown>,
    }));
  }, [projects]);

  const [kanbanData, setKanbanData] = useState<KanbanData>({
    columns: {
      "col-enquiry": {
        id: "col-enquiry",
        title: "Enquiry",
        taskIds: [],
        color: "#6B7280",
      },
      "col-design-signup": {
        id: "col-design-signup",
        title: "Design Signup",
        taskIds: [],
        color: "#3B82F6",
      },
      "col-design": {
        id: "col-design",
        title: "Design",
        taskIds: [],
        color: "#8B5CF6",
      },
      "col-first-presentation": {
        id: "col-first-presentation",
        title: "First Presentation",
        taskIds: [],
        color: "#F59E0B",
      },
      "col-final-design": {
        id: "col-final-design",
        title: "Final Design",
        taskIds: [],
        color: "#6366F1",
      },
      "col-costing": {
        id: "col-costing",
        title: "Costing",
        taskIds: [],
        color: "#EC4899",
      },
      "col-execution": {
        id: "col-execution",
        title: "Execution",
        taskIds: [],
        color: "#EF4444",
      },
      "col-handover": {
        id: "col-handover",
        title: "Handover",
        taskIds: [],
        color: "#059669",
      },
      "col-testimonial": {
        id: "col-testimonial",
        title: "Testimonial",
        taskIds: [],
        color: "#10B981",
      },
    },
    tasks: {},
    columnOrder: [
      "col-enquiry",
      "col-design-signup",
      "col-design",
      "col-first-presentation",
      "col-final-design",
      "col-costing",
      "col-execution",
      "col-handover",
      "col-testimonial",
    ],
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projects.length > 0) {
      // Convert projects to kanban tasks
      const tasks: Record<string, KanbanTask> = {};
      const columnTaskIds: Record<string, string[]> = {
        "col-enquiry": [],
        "col-design-signup": [],
        "col-design": [],
        "col-first-presentation": [],
        "col-final-design": [],
        "col-costing": [],
        "col-execution": [],
        "col-handover": [],
        "col-testimonial": [],
      };

      projects.forEach((project) => {
        const taskId = `project-${project.id}`;
        tasks[taskId] = {
          id: taskId,
          content: project.projectName || project.name || "Untitled Project",
          metadata: project as unknown as Record<string, unknown>,
        };

        // Map project stage to column
        const stageToColumn: Record<string, string> = {
          ENQUIRY: "col-enquiry",
          DESIGN_SIGNUP: "col-design-signup",
          DESIGN: "col-design",
          FIRST_PRESENTATION: "col-first-presentation",
          FINAL_DESIGN: "col-final-design",
          COSTING: "col-costing",
          EXECUTION: "col-execution",
          HANDOVER: "col-handover",
          TESTIMONIAL: "col-testimonial",
        };

        const currentStage = project.currentStageCode || "ENQUIRY";
        const columnId = stageToColumn[currentStage];
        if (columnId && columnTaskIds[columnId]) {
          columnTaskIds[columnId].push(taskId);
        }
      });

      setKanbanData((prev) => ({
        ...prev,
        tasks,
        columns: Object.keys(prev.columns).reduce(
          (acc, colId) => ({
            ...acc,
            [colId]: {
              ...prev.columns[colId],
              taskIds: columnTaskIds[colId] || [],
            },
          }),
          {},
        ),
      }));
    }
  }, [projects]);

  const handleTaskClick = (task: KanbanTask) => {
    const project = task.metadata as unknown as Project;
    if (project?.id) {
      navigate(`/dashboard/projects/${project.id}`);
    }
  };

  // Map column IDs back to stage codes
  const columnToStage: Record<string, string> = {
    "col-enquiry": "ENQUIRY",
    "col-design-signup": "DESIGN_SIGNUP",
    "col-design": "DESIGN",
    "col-first-presentation": "FIRST_PRESENTATION",
    "col-final-design": "FINAL_DESIGN",
    "col-costing": "COSTING",
    "col-execution": "EXECUTION",
    "col-handover": "HANDOVER",
    "col-testimonial": "TESTIMONIAL",
  };

  const handleDataChange = (newData: KanbanData) => {
    setKanbanData(newData);
  };

  const handleTaskColumnChange = useCallback(
    async (taskId: string, _fromCol: string, toCol: string) => {
      const newStageCode = columnToStage[toCol];
      if (!newStageCode) return;

      // Extract project ID from task ID (format: "project-{id}")
      const projectId = taskId.replace("project-", "");
      try {
        await ProjectAPI.updateProject(projectId, {
          currentStageCode: newStageCode,
        });
        toast.success("Project stage updated");
      } catch (error) {
        console.error("Failed to update project stage:", error);
        toast.error("Failed to update stage. Reverting...");
        // Refetch to revert local state
        fetchProjects();
      }
    },
    [fetchProjects],
  );

  const renderProjectCard = (task: KanbanTask) => {
    const project = task.metadata as unknown as Project;

    // Parse content to extract notes if present (format: "Project Name - Notes text")
    const contentParts = task.content.split(" - ");
    const hasNotes = contentParts.length > 1;
    const displayName = contentParts[0];
    const notes = hasNotes ? contentParts.slice(1).join(" - ") : null;

    if (!project) {
      // For newly added cards without project metadata
      return (
        <div className={`space-y-1.5 ${task.completed ? "opacity-60" : ""}`}>
          <h4
            className={`font-semibold text-[13px] leading-tight ${
              task.completed ? "line-through text-gray-500" : "text-gray-900"
            }`}
          >
            {displayName}
          </h4>

          {notes && (
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-start gap-1.5">
                <FileText
                  size={11}
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <p className="text-[11px] text-gray-700 leading-snug">
                  {notes}
                </p>
              </div>
            </div>
          )}

          {/* Assignment and Due Date badges */}
          {(task.assignedTo || task.dueDate) && (
            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
              {task.assignedTo && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  <User size={10} />
                  {task.assignedTo}
                </span>
              )}
              {task.dueDate && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                  <Calendar size={10} />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    const projectName =
      project.projectName || project.name || "Untitled Project";

    return (
      <div className={`space-y-1.5 ${task.completed ? "opacity-60" : ""}`}>
        <h4
          className={`font-semibold text-[13px] leading-tight truncate ${
            task.completed ? "line-through text-gray-500" : "text-gray-900"
          }`}
        >
          {projectName}
        </h4>

        <div className="space-y-0.5 text-[11px] text-gray-500">
          {(project.propertyAddress || project.propertyCity) && (
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {project.propertyAddress || project.propertyCity}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-0.5">
            {project.totalValue && (
              <div className="flex items-center gap-0.5">
                <DollarSign
                  size={10}
                  className="text-green-500 flex-shrink-0"
                />
                <span className="font-medium text-gray-700">
                  ₹{parseFloat(String(project.totalValue)).toLocaleString()}
                </span>
              </div>
            )}

            {project.propertySizeSqft && (
              <div className="flex items-center gap-0.5">
                <TrendingUp size={10} className="text-gray-400 flex-shrink-0" />
                <span>{project.propertySizeSqft} sqft</span>
              </div>
            )}
          </div>

          {(project.assignedDesigner?.name || project.assignedPM?.name) && (
            <div className="flex items-center gap-1 pt-0.5">
              <User size={10} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {project.assignedDesigner?.name || project.assignedPM?.name}
              </span>
            </div>
          )}

          {project.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar size={10} className="text-gray-400 flex-shrink-0" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {(project.pipelineType ||
          project.projectCategory ||
          project.scopeType) && (
          <div className="flex flex-wrap gap-1 pt-1">
            {project.pipelineType && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-blue-50 text-blue-600 border border-blue-200/50">
                {project.pipelineType}
              </span>
            )}

            {project.projectCategory && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-purple-50 text-purple-600 border border-purple-200/50">
                {project.projectCategory}
              </span>
            )}

            {project.scopeType && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-orange-50 text-orange-600 border border-orange-200/50">
                {project.scopeType}
              </span>
            )}
          </div>
        )}

        {/* Show notes if added via the form */}
        {notes && (
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-md">
            <div className="flex items-start gap-1.5">
              <FileText
                size={11}
                className="text-blue-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-gray-700 leading-snug">{notes}</p>
            </div>
          </div>
        )}

        {/* Assignment and Due Date badges */}
        {(task.assignedTo || task.dueDate) && (
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
            {task.assignedTo && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                <User size={10} />
                {task.assignedTo}
              </span>
            )}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                <Calendar size={10} />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-900 text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/projects")}
              className="rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Button>
            <div className="h-5 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Projects Pipeline
              </h1>
              <p className="text-gray-600 text-xs mt-0.5">
                Drag and drop projects to update their stage
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate("/dashboard/projects")}
            className="rounded-xl"
          >
            <List className="w-4 h-4" />
            List View
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          initialData={kanbanData}
          onDataChange={handleDataChange}
          onTaskClick={handleTaskClick}
          onTaskColumnChange={handleTaskColumnChange}
          renderTaskCard={renderProjectCard}
          theme="light"
          selectConfig={{
            label: "Select Project",
            placeholder: "Choose a project...",
            options: projectSelectOptions,
          }}
          assignees={PROJECT_ASSIGNEES}
        />
      </div>
    </div>
  );
};

export default ProjectsKanban;
