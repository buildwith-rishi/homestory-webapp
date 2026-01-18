import React from 'react';
import { FolderKanban, Users, IndianRupee, Calendar } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card, Button, Badge, Progress } from '../../components/ui';

export const DashboardOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-lg text-secondary">Dashboard</h1>
        <p className="font-body text-body text-ash mt-1">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={24}
          change={{ value: 12, isPositive: true }}
          iconColor="primary"
        />
        <StatCard
          icon={Users}
          label="Total Leads"
          value={68}
          change={{ value: 8, isPositive: true }}
          iconColor="teal"
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue This Month"
          value="₹45.2L"
          change={{ value: 15, isPositive: true }}
          iconColor="olive"
        />
        <StatCard
          icon={Calendar}
          label="Meetings Today"
          value={5}
          iconColor="rose"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 border-b border-ash/10 flex items-center justify-between">
              <h2 className="font-display text-display-sm text-secondary">Recent Projects</h2>
              <Button variant="ghost" size="sm">View All →</Button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { name: 'Modern 3BHK - Sharma Family', stage: 'Design', progress: 65 },
                { name: 'Luxury Villa - Kumar Residence', stage: 'Execution', progress: 40 },
                { name: 'Contemporary 2BHK - Patel Home', stage: 'Material', progress: 75 },
              ].map((project, i) => (
                <div key={i} className="p-4 border border-ash/10 rounded-lg hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-body font-medium text-secondary">{project.name}</h3>
                    <Badge>{project.stage}</Badge>
                  </div>
                  <Progress value={project.progress} />
                  <p className="font-body text-sm text-ash mt-2">{project.progress}% Complete</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-ash/10 flex items-center justify-between">
              <h2 className="font-display text-display-sm text-secondary">Today's Meetings</h2>
              <Button variant="ghost" size="sm">View Calendar →</Button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { time: '10:00 AM', client: 'Rajesh Kumar', type: 'Site Visit', status: 'Upcoming' },
                { time: '2:30 PM', client: 'Priya Sharma', type: 'Design Review', status: 'Upcoming' },
                { time: '4:00 PM', client: 'Amit Patel', type: 'Consultation', status: 'In Progress' },
              ].map((meeting, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-ash/10 rounded-lg">
                  <div>
                    <p className="font-body font-medium text-secondary">{meeting.time} - {meeting.client}</p>
                    <p className="font-body text-sm text-ash">{meeting.type}</p>
                  </div>
                  <Badge variant={meeting.status === 'In Progress' ? 'primary' : 'secondary'}>
                    {meeting.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-6 border-b border-ash/10">
              <h2 className="font-display text-display-sm text-secondary">Lead Pipeline</h2>
            </div>
            <div className="p-6 space-y-3">
              {[
                { stage: 'New', count: 32, color: 'ash' },
                { stage: 'Qualified', count: 18, color: 'teal' },
                { stage: 'Meeting', count: 8, color: 'olive' },
                { stage: 'Proposal', count: 5, color: 'primary' },
                { stage: 'Won', count: 3, color: 'teal' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-body text-sm text-secondary">{item.stage}</span>
                  <span className="font-body font-medium text-secondary">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-ash/10">
              <h2 className="font-display text-display-sm text-secondary">Quick Actions</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <Button variant="ghost" className="h-20 flex flex-col gap-2">
                <Calendar size={20} />
                <span className="text-xs">Schedule Meeting</span>
              </Button>
              <Button variant="ghost" className="h-20 flex flex-col gap-2">
                <Users size={20} />
                <span className="text-xs">Add Lead</span>
              </Button>
              <Button variant="ghost" className="h-20 flex flex-col gap-2">
                <FolderKanban size={20} />
                <span className="text-xs">New Project</span>
              </Button>
              <Button variant="ghost" className="h-20 flex flex-col gap-2">
                <IndianRupee size={20} />
                <span className="text-xs">Send Update</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
