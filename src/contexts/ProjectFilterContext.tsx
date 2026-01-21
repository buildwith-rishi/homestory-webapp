import React, { createContext, useContext, useState, ReactNode } from "react";

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
}

interface ProjectFilterContextType {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  projects: Project[];
  selectedProject: Project | null;
}

const ProjectFilterContext = createContext<
  ProjectFilterContextType | undefined
>(undefined);

// Mock projects data - in production, this would come from API
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Modern 3BHK - Sharma Family",
    client: "Sharma Family",
    status: "Design",
  },
  {
    id: "2",
    name: "Luxury Villa - Kumar Residence",
    client: "Kumar Residence",
    status: "Execution",
  },
  {
    id: "3",
    name: "Contemporary 2BHK - Patel Home",
    client: "Patel Home",
    status: "Material",
  },
  {
    id: "4",
    name: "Office Interior - TechStart Inc",
    client: "TechStart Inc",
    status: "Requirements",
  },
  {
    id: "5",
    name: "Penthouse Makeover - Gupta Family",
    client: "Gupta Family",
    status: "Handover",
  },
];

export const ProjectFilterProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const selectedProject = selectedProjectId
    ? mockProjects.find((p) => p.id === selectedProjectId) || null
    : null;

  return (
    <ProjectFilterContext.Provider
      value={{
        selectedProjectId,
        setSelectedProjectId,
        projects: mockProjects,
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
