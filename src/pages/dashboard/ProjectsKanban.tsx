import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  KanbanBoard,
  KanbanData,
  KanbanTask,
} from "../../components/kanban/KanbanBoard";
import { useProjectStore } from "../../stores/projectStore";
import { Project, ProjectStageCode } from "../../types";
import {
  Calendar,
  DollarSign,
  MapPin,
  User,
  TrendingUp,
  ArrowLeft,
  List,
} from "lucide-react";
import { Button } from "../../components/ui";

const ProjectsKanban: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading, fetchProjects } = useProjectStore();
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    columns: {
      "col-lead": {
        id: "col-lead",
        title: "Lead",
        taskIds: [],
        color: "#3B82F6",
      },
      "col-site-visit": {
        id: "col-site-visit",
        title: "Site Visit",
        taskIds: [],
        color: "#8B5CF6",
      },
      "col-proposal": {
        id: "col-proposal",
        title: "Proposal",
        taskIds: [],
        color: "#F59E0B",
      },
      "col-design": {
        id: "col-design",
        title: "Design",
        taskIds: [],
        color: "#10B981",
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
      "col-warranty": {
        id: "col-warranty",
        title: "Warranty",
        taskIds: [],
        color: "#6B7280",
      },
    },
    tasks: {},
    columnOrder: [
      "col-lead",
      "col-site-visit",
      "col-proposal",
      "col-design",
      "col-execution",
      "col-handover",
      "col-warranty",
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
        "col-lead": [],
        "col-site-visit": [],
        "col-proposal": [],
        "col-design": [],
        "col-execution": [],
        "col-handover": [],
        "col-warranty": [],
      };

      projects.forEach((project) => {
        const taskId = `project-${project.id}`;
        tasks[taskId] = {
          id: taskId,
          content: project.name || project.projectName || "Untitled Project",
          metadata: project as unknown as Record<string, unknown>,
        };

        // Map project stage to column
        const stageToColumn: Record<string, string> = {
          [ProjectStageCode.LEAD]: "col-lead",
          [ProjectStageCode.SITE_VISIT]: "col-site-visit",
          [ProjectStageCode.PROPOSAL]: "col-proposal",
          [ProjectStageCode.DESIGN]: "col-design",
          [ProjectStageCode.EXECUTION]: "col-execution",
          [ProjectStageCode.HANDOVER]: "col-handover",
          [ProjectStageCode.WARRANTY]: "col-warranty",
        };

        const currentStage = project.currentStage || ProjectStageCode.LEAD;
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

  const handleDataChange = (newData: KanbanData) => {
    setKanbanData(newData);
    // TODO: Update project stages in backend based on column changes
  };

  const renderProjectCard = (task: KanbanTask) => {
    const project = task.metadata as unknown as Project;
    if (!project) return <div className="text-xs">{task.content}</div>;

    const projectName =
      project.name || project.projectName || "Untitled Project";

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
                  ₹{project.totalValue.toLocaleString()}
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
          renderTaskCard={renderProjectCard}
          theme="light"
        />
      </div>
    </div>
  );
};

export default ProjectsKanban;
