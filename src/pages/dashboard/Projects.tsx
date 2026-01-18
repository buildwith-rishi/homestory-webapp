import React, { useState } from 'react';
import { Plus, MoreVertical, Calendar, Users, DollarSign, Clock, Search, Filter, Grid3X3, List } from 'lucide-react';
import { Card, Button, Badge, Progress } from '../../components/ui';

const stages = ['Requirements', 'Design', 'Material', 'Execution', 'Handover'];

interface Project {
  id: number;
  name: string;
  client: string;
  stage: string;
  status: 'on_track' | 'at_risk' | 'delayed';
  progress: number;
  dueDate: string;
  budget: string;
  team: string[];
}

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Modern 3BHK',
    client: 'Sharma Family',
    stage: 'Design',
    status: 'on_track',
    progress: 65,
    dueDate: 'Feb 15, 2026',
    budget: '₹28L',
    team: ['AR', 'PK'],
  },
  {
    id: 2,
    name: 'Luxury Villa',
    client: 'Kumar Residence',
    stage: 'Execution',
    status: 'at_risk',
    progress: 40,
    dueDate: 'Mar 1, 2026',
    budget: '₹55L',
    team: ['RS', 'MG'],
  },
  {
    id: 3,
    name: 'Contemporary 2BHK',
    client: 'Patel Home',
    stage: 'Material',
    status: 'on_track',
    progress: 75,
    dueDate: 'Jan 30, 2026',
    budget: '₹18L',
    team: ['AR'],
  },
];

const stageColors: Record<string, string> = {
  Requirements: 'bg-gray-100 text-gray-700',
  Design: 'bg-blue-100 text-blue-700',
  Material: 'bg-purple-100 text-purple-700',
  Execution: 'bg-orange-100 text-orange-700',
  Handover: 'bg-emerald-100 text-emerald-700',
};

const statusColors = {
  on_track: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  at_risk: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  delayed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const ProjectsPage: React.FC = () => {
  const [view, setView] = useState<'grid' | 'kanban'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = mockProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all interior design projects</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-white border border-gray-300 rounded-xl p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'kanban' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button className="rounded-xl">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{mockProjects.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {mockProjects.filter(p => p.stage !== 'Handover').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹1.01Cr</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const statusColor = statusColors[project.status];
            return (
              <Card key={project.id} className="p-5 rounded-xl hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{project.client}</p>
                  </div>
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`text-xs rounded-lg ${stageColors[project.stage]}`}>
                    {project.stage}
                  </Badge>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs ${statusColor.bg} ${statusColor.text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                    {project.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due Date
                    </span>
                    <span className="font-medium">{project.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Budget
                    </span>
                    <span className="font-medium text-emerald-600">{project.budget}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex -space-x-2">
                    {project.team.map((member, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                      >
                        {member}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stages.map((stage) => {
            const stageProjects = filteredProjects.filter(p => p.stage === stage);
            return (
              <div key={stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{stage}</h3>
                  <Badge className={`rounded-lg ${stageColors[stage]}`}>
                    {stageProjects.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {stageProjects.map((project) => (
                    <Card key={project.id} className="p-4 rounded-xl hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{project.client}</p>
                      <div className="mt-3">
                        <Progress value={project.progress} className="h-1.5" />
                        <p className="text-xs text-gray-600 mt-1">{project.progress}%</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
