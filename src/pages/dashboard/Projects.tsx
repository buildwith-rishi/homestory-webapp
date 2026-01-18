import React, { useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import { Card, Button, Badge, Progress } from '../../components/ui';

const stages = ['Requirements', 'Design', 'Material & Procurement', 'Execution', 'Handover'];

export const ProjectsPage: React.FC = () => {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const projects = [
    {
      id: 1,
      name: 'Modern 3BHK',
      client: 'Sharma Family',
      stage: 'Design',
      status: 'on_track',
      progress: 65,
      dueDate: 'Feb 15',
      owner: 'AR',
    },
    {
      id: 2,
      name: 'Luxury Villa',
      client: 'Kumar Residence',
      stage: 'Execution',
      status: 'at_risk',
      progress: 40,
      dueDate: 'Mar 1',
      owner: 'PK',
    },
    {
      id: 3,
      name: 'Contemporary 2BHK',
      client: 'Patel Home',
      stage: 'Material & Procurement',
      status: 'on_track',
      progress: 75,
      dueDate: 'Jan 30',
      owner: 'RS',
    },
    {
      id: 4,
      name: 'Minimalist Studio',
      client: 'Gupta Apartment',
      stage: 'Requirements',
      status: 'delayed',
      progress: 20,
      dueDate: 'Feb 5',
      owner: 'AR',
    },
  ];

  const getProjectsByStage = (stage: string) => {
    return projects.filter((p) => p.stage === stage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-lg text-secondary">Projects</h1>
          <p className="font-body text-body text-ash mt-1">Manage all interior design projects</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-white rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1 rounded font-body text-sm ${
                view === 'kanban' ? 'bg-primary text-white' : 'text-ash'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded font-body text-sm ${
                view === 'list' ? 'bg-primary text-white' : 'text-ash'
              }`}
            >
              List
            </button>
          </div>
          <Button leftIcon={<Plus />}>New Project</Button>
        </div>
      </div>

      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-80">
              <Card className="bg-ash/5">
                <div className="p-4 border-b border-ash/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-body font-medium text-secondary">{stage}</h3>
                    <Badge className="bg-primary/10 text-primary">
                      {getProjectsByStage(stage).length}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 space-y-3 min-h-[400px]">
                  {getProjectsByStage(stage).map((project) => (
                    <Card
                      key={project.id}
                      className={`p-4 cursor-pointer hover:shadow-md transition-all ${
                        project.status === 'delayed'
                          ? 'border-l-4 border-l-burgundy'
                          : project.status === 'at_risk'
                          ? 'border-l-4 border-l-rose'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            project.status === 'on_track'
                              ? 'bg-teal'
                              : project.status === 'at_risk'
                              ? 'bg-rose'
                              : 'bg-burgundy'
                          }`}
                        />
                        <button className="text-ash hover:text-secondary">
                          <MoreVertical size={16} />
                        </button>
                      </div>

                      <h4 className="font-body font-medium text-secondary mb-1">
                        {project.name}
                      </h4>
                      <p className="font-body text-sm text-ash mb-3">Client: {project.client}</p>

                      <Progress value={project.progress} className="mb-3" />

                      <div className="flex items-center justify-between text-xs text-ash">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium">
                          {project.owner}
                        </div>
                        <span>Due: {project.dueDate}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {view === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ash/5 border-b border-ash/10">
                <tr>
                  <th className="px-6 py-3 text-left font-body text-sm text-ash">Project</th>
                  <th className="px-6 py-3 text-left font-body text-sm text-ash">Client</th>
                  <th className="px-6 py-3 text-left font-body text-sm text-ash">Stage</th>
                  <th className="px-6 py-3 text-left font-body text-sm text-ash">Status</th>
                  <th className="px-6 py-3 text-left font-body text-sm text-ash">Progress</th>
                  <th className="px-6 py-3 text-left font-body text-sm text-ash">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-ash/10 hover:bg-ash/5 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-body text-secondary">{project.name}</td>
                    <td className="px-6 py-4 font-body text-ash">{project.client}</td>
                    <td className="px-6 py-4">
                      <Badge>{project.stage}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          project.status === 'on_track'
                            ? 'bg-teal/10 text-teal'
                            : project.status === 'at_risk'
                            ? 'bg-rose/10 text-rose'
                            : 'bg-burgundy/10 text-burgundy'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        {project.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="w-24" />
                        <span className="text-sm text-ash">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-ash">{project.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
