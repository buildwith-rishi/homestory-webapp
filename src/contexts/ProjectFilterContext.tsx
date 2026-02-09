import React, { createContext, useContext, useState, ReactNode } from "react";
import { useProjectStore } from "../stores/projectStore";

interface ProjectFilterProject {
  id: string;
  name: string;
  client: string;
  status: string;
}

interface ProjectFilterContextType {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  projects: ProjectFilterProject[];
  selectedProject: ProjectFilterProject | null;
}

const ProjectFilterContext = createContext<
  ProjectFilterContextType | undefined
>(undefined);

export const ProjectFilterProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const { projects: storeProjects } = useProjectStore();

  // Map store projects to the filter context format
  const projects: ProjectFilterProject[] = storeProjects.map((p) => ({
    id: p.id,
    name: p.projectName || p.name || "Untitled",
    client: p.lead?.name || "\u2014",
    status: p.currentStageCode || p.status || "",
  }));

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) || null
    : null;

  return (
    <ProjectFilterContext.Provider
      value={{
        selectedProjectId,
        setSelectedProjectId,
        projects,
        selectedProject,
      }}
    >
      {children}
    </ProjectFilterContext.Provider>
  );
};

export const useProjectFilter = () => {
  const context = useContext(ProjectFilterContext);
  if (context === undefined) {
    throw new Error(
      "useProjectFilter must be used within a ProjectFilterProvider",
    );
  }
  return context;
};
