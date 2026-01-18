import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckSquare, AlertCircle, Phone, ChevronRight } from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { ProjectStage } from '../../types';

export function EngineerHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, tasks, fetchProjects, fetchTasks } = useProjectStore();
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const todayTasks = tasks.filter((t) => !t.completed && t.dueDate === new Date().toISOString().split('T')[0]);
  const todayPhotos = 12;
  const openIssues = 1;

  const getStageLabel = (stage: ProjectStage) => {
    const labels: Record<ProjectStage, string> = {
      [ProjectStage.PRE_CONSTRUCTION]: 'Pre-Construction',
      [ProjectStage.EXECUTION]: 'Execution',
      [ProjectStage.FINISHING]: 'Finishing',
      [ProjectStage.FINAL_FIXES]: 'Final Fixes',
      [ProjectStage.COMPLETE]: 'Complete',
    };
    return labels[stage];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader showNotifications />

      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Projects</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {activeProjects.map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id && !t.completed);
              return (
                <div
                  key={project.id}
                  className="flex-shrink-0 w-72 bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                >
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{project.location}</p>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-1">
                      Stage: {getStageLabel(project.stage)}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs font-medium text-gray-700">{project.progress}%</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'} today
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Today's Summary</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <p className="text-2xl font-bold text-gray-900">{todayTasks.length}</p>
              <p className="text-xs text-gray-600 mt-1">Tasks pending</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <p className="text-2xl font-bold text-gray-900">{todayPhotos}</p>
              <p className="text-xs text-gray-600 mt-1">Photos uploaded</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <p className="text-2xl font-bold text-gray-900">{openIssues}</p>
              <p className="text-xs text-gray-600 mt-1">Issues open</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/app/upload')}
              className="bg-orange-500 text-white rounded-lg p-4 flex flex-col items-center justify-center gap-2 active:bg-orange-600 transition-colors min-h-[100px]"
            >
              <Camera className="w-6 h-6" />
              <span className="text-sm font-medium">Upload Photos</span>
            </button>
            <button
              onClick={() => navigate('/app/tasks')}
              className="bg-white border border-gray-200 text-gray-700 rounded-lg p-4 flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors min-h-[100px]"
            >
              <CheckSquare className="w-6 h-6" />
              <span className="text-sm font-medium">View Tasks</span>
            </button>
            <button
              onClick={() => navigate('/app/issues')}
              className="bg-white border border-gray-200 text-gray-700 rounded-lg p-4 flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors min-h-[100px]"
            >
              <AlertCircle className="w-6 h-6" />
              <span className="text-sm font-medium">Report Issue</span>
            </button>
            <button
              className="bg-white border border-gray-200 text-gray-700 rounded-lg p-4 flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors min-h-[100px]"
            >
              <Phone className="w-6 h-6" />
              <span className="text-sm font-medium">Contact Office</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
