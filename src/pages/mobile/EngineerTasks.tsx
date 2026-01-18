import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { useProjectStore } from '../../stores/projectStore';
import { Project, Task } from '../../types';

export function EngineerTasks() {
  const { projects, tasks, fetchProjects, fetchTasks, updateTask } = useProjectStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const tasksForDate = tasks.filter((t) => t.dueDate === selectedDateStr);
  const pendingTasks = tasksForDate.filter((t) => !t.completed);
  const completedTasks = tasksForDate.filter((t) => t.completed);

  const groupedTasks: Record<string, Task[]> = {};
  pendingTasks.forEach((task) => {
    const project = projects.find((p) => p.id === task.projectId);
    const projectName = project?.name || 'Unknown Project';
    if (!groupedTasks[projectName]) {
      groupedTasks[projectName] = [];
    }
    groupedTasks[projectName].push(task);
  });

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Tasks" showNotifications />

      <div className="sticky top-14 bg-white border-b border-gray-200 z-20">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {weekDates.map((date) => {
            const isSelected =
              date.toISOString().split('T')[0] === selectedDateStr;
            const isToday =
              date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center min-w-[52px] h-16 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-orange-500 text-white'
                    : isToday
                    ? 'bg-orange-50 text-orange-600 border border-orange-200'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <span className="text-xs font-medium">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-lg font-bold mt-0.5">
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No tasks for today!
            </h3>
            <p className="text-sm text-gray-600">Enjoy your free day</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
              <div key={projectName}>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {projectName}
                </h3>
                <div className="space-y-2">
                  {projectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleTask(task.id, !task.completed)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              task.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-orange-500'
                            }`}
                          >
                            {task.completed && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </button>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              task.completed
                                ? 'text-gray-400 line-through'
                                : 'text-gray-900'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {task.description}
                            </p>
                          )}
                          {task.dueTime && (
                            <p
                              className={`text-xs mt-2 ${
                                task.completed ? 'text-gray-400' : 'text-orange-600'
                              }`}
                            >
                              Due: {formatTime(task.dueTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {completedTasks.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-2"
                >
                  <span>Completed ({completedTasks.length})</span>
                  {showCompleted ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showCompleted && (
                  <div className="space-y-2">
                    {completedTasks.map((task) => {
                      const project = projects.find((p) => p.id === task.projectId);
                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-lg border border-gray-200 p-4 opacity-60"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <div className="w-5 h-5 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-400 line-through">
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {project?.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
